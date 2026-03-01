const express = require('express');
const router = express.Router();
const { PatientBill, Patient, Receipt } = require('../models');
const { Op } = require('sequelize');

// Get all patient bills for a clinic
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    const bills = await PatientBill.findAll({
      where: { clinic_id: parseInt(clinicId) },
      order: [['created_at', 'DESC']]
    });

    res.json(bills);
  } catch (error) {
    console.error('Error fetching patient bills:', error);
    res.status(500).json({ error: 'Failed to fetch patient bills' });
  }
});

// Get a specific patient bill by ID
router.get('/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    
    const bill = await PatientBill.findByPk(billId);
    
    if (!bill) {
      return res.status(404).json({ error: 'Patient bill not found' });
    }
    
    res.json(bill);
  } catch (error) {
    console.error('Error fetching patient bill:', error);
    res.status(500).json({ error: 'Failed to fetch patient bill' });
  }
});

// Create a new patient bill
router.post('/', async (req, res) => {
  try {
    const billData = req.body;
    console.log('Creating patient bill with data:', JSON.stringify(billData, null, 2));
    
    // Validate required fields
    if (!billData.patient_id) {
      console.log('Validation failed: patient_id is missing');
      return res.status(400).json({ error: 'patient_id is required' });
    }
    if (!billData.patient_name) {
      console.log('Validation failed: patient_name is missing');
      return res.status(400).json({ error: 'patient_name is required' });
    }
    if (!billData.clinic_id) {
      console.log('Validation failed: clinic_id is missing');
      return res.status(400).json({ error: 'clinic_id is required' });
    }
    if (!billData.created_by) {
      console.log('Validation failed: created_by is missing');
      return res.status(400).json({ error: 'created_by is required' });
    }
    
    // Generate bill number if not provided
    if (!billData.bill_number) {
      const timestamp = Date.now().toString().slice(-6);
      billData.bill_number = `BILL-${new Date().getFullYear()}-${timestamp}`;
    }
    
    // Calculate balance amount
    billData.balance_amount = (billData.total_amount || 0) - (billData.paid_amount || 0);
    
    // Ensure services is properly formatted
    if (billData.services && typeof billData.services !== 'string') {
      billData.services = JSON.stringify(billData.services);
    }
    
    console.log('Final bill data before creation:', JSON.stringify(billData, null, 2));
    
    const bill = await PatientBill.create(billData);
    console.log('Patient bill created successfully:', bill.id);
    
    res.json(bill);
  } catch (error) {
    console.error('Error creating patient bill:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error original:', error.original);
    
    // More detailed error response
    res.status(500).json({ 
      error: 'Failed to create patient bill',
      details: error.message,
      name: error.name,
      code: error.original?.code || 'UNKNOWN_ERROR',
      sqlMessage: error.original?.sqlMessage || null,
      validationErrors: error.errors ? error.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      })) : null
    });
  }
});

// Find active patient bill for a patient in a clinic
router.get('/active/:patientId/:clinicId', async (req, res) => {
  try {
    const { patientId, clinicId } = req.params;
    console.log(`Looking for active bill for patient: ${patientId}, clinic: ${clinicId}`);
    
    // First, let's see all bills for this patient to debug
    const allBills = await PatientBill.findAll({
      where: { 
        patient_id: patientId,
        clinic_id: parseInt(clinicId)
      },
      order: [['created_at', 'DESC']]
    });
    
    console.log(`Found ${allBills.length} total bills for patient ${patientId}:`);
    allBills.forEach(bill => {
      console.log(`- Bill ${bill.bill_number}: status=${bill.status}, created=${bill.created_at}`);
    });
    
    // Find the most recent bill that is not finalized
    // Consider 'pending', 'partial', 'paid', 'active' as active bills
    const activeBill = await PatientBill.findOne({
      where: { 
        patient_id: patientId,
        clinic_id: parseInt(clinicId),
        status: {
          [Op.in]: ['pending', 'partial', 'paid', 'active']
        }
      },
      order: [['created_at', 'DESC']]
    });
    
    if (!activeBill) {
      console.log(`No active bill found for patient ${patientId} in clinic ${clinicId}`);
      return res.status(404).json({ error: 'No active bill found for this patient' });
    }
    
    console.log(`Found active bill: ${activeBill.bill_number} with status: ${activeBill.status}`);
    res.json(activeBill);
  } catch (error) {
    console.error('Error finding active patient bill:', error);
    res.status(500).json({ error: 'Failed to find active patient bill' });
  }
});

// Add services to an existing bill
router.put('/:billId/add-services', async (req, res) => {
  try {
    const { billId } = req.params;
    const { services } = req.body;
    
    if (!services || !Array.isArray(services)) {
      return res.status(400).json({ error: 'Services array is required' });
    }
    
    const bill = await PatientBill.findByPk(billId);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    // Parse existing services
    let existingServices = [];
    if (bill.services) {
      try {
        existingServices = typeof bill.services === 'string' ? JSON.parse(bill.services) : bill.services;
      } catch (error) {
        console.warn('Failed to parse existing services:', error);
        existingServices = [];
      }
    }
    
    // Add new services
    const updatedServices = [...existingServices, ...services];
    
    // Calculate new total amount
    const newServicesTotal = services.reduce((sum, service) => sum + (service.totalPrice || 0), 0);
    const newTotalAmount = parseFloat(bill.total_amount) + newServicesTotal;
    const newBalanceAmount = newTotalAmount - parseFloat(bill.paid_amount);
    
    // Update the bill
    await bill.update({
      services: JSON.stringify(updatedServices),
      total_amount: newTotalAmount,
      balance_amount: newBalanceAmount,
      updated_at: new Date()
    });
    
    res.json(bill);
  } catch (error) {
    console.error('Error adding services to bill:', error);
    res.status(500).json({ error: 'Failed to add services to bill' });
  }
});

// Update a patient bill
router.put('/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    const updateData = req.body;
    
    // Calculate balance amount if amounts are being updated
    if (updateData.total_amount !== undefined || updateData.paid_amount !== undefined) {
      const currentBill = await PatientBill.findByPk(billId);
      if (currentBill) {
        const totalAmount = updateData.total_amount !== undefined ? updateData.total_amount : currentBill.total_amount;
        const paidAmount = updateData.paid_amount !== undefined ? updateData.paid_amount : currentBill.paid_amount;
        updateData.balance_amount = totalAmount - paidAmount;
        
        // Update status based on payment
        if (updateData.balance_amount <= 0) {
          updateData.status = 'paid';
        } else if (paidAmount > 0) {
          updateData.status = 'partial';
        }
      }
    }
    
    const [updatedRows] = await PatientBill.update(updateData, {
      where: { id: billId }
    });
    
    if (updatedRows === 0) {
      return res.status(404).json({ error: 'Patient bill not found' });
    }
    
    const updatedBill = await PatientBill.findByPk(billId);
    res.json(updatedBill);
  } catch (error) {
    console.error('Error updating patient bill:', error);
    res.status(500).json({ error: 'Failed to update patient bill' });
  }
});

// Delete a patient bill
router.delete('/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    
    const deletedRows = await PatientBill.destroy({
      where: { id: billId }
    });
    
    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Patient bill not found' });
    }
    
    res.json({ message: 'Patient bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient bill:', error);
    res.status(500).json({ error: 'Failed to delete patient bill' });
  }
});

// Add payment to a patient bill
router.post('/:billId/payments', async (req, res) => {
  try {
    const { billId } = req.params;
    const paymentData = req.body;
    
    console.log('Adding payment to bill:', billId, paymentData);
    console.log('paidServiceIndexes received:', paymentData.paidServiceIndexes);
    console.log('All payment data keys:', Object.keys(paymentData));
    
    // Check for active cashier shift for the current user
    const { CashierShift } = require('../models');
    const userId = req.user?.id;
    
    if (!userId) {
      console.log('Validation failed: No authenticated user');
      return res.status(401).json({ 
        error: 'Authentication required',
        requiresAuth: true
      });
    }
    
    const activeShift = await CashierShift.findOne({
      where: { 
        cashier_id: userId,
        status: 'open' 
      },
      order: [['start_time', 'DESC']]
    });
    
    if (!activeShift) {
      console.log('Validation failed: No active cashier shift for user:', userId);
      return res.status(403).json({ 
        error: 'No active cashier shift found. Please start a cashier shift before making payments.',
        requiresShift: true,
        userId: userId
      });
    }
    
    // Validate required fields
    if (!paymentData.amount || paymentData.amount <= 0) {
      console.log('Validation failed: Invalid payment amount:', paymentData.amount);
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }
    if (!paymentData.payment_method) {
      console.log('Validation failed: Missing payment method');
      return res.status(400).json({ error: 'Payment method is required' });
    }
    if (!paymentData.payment_date) {
      console.log('Validation failed: Missing payment date');
      return res.status(400).json({ error: 'Payment date is required' });
    }
    
    // Validate lease details if payment is from lease
    if (paymentData.from_lease && !paymentData.lease_details) {
      console.log('Validation failed: Missing lease details');
      return res.status(400).json({ error: 'Lease details are required when payment is from lease' });
    }
    
    // Get current bill
    const currentBill = await PatientBill.findByPk(billId);
    if (!currentBill) {
      console.log('Validation failed: Bill not found:', billId);
      return res.status(404).json({ error: 'Patient bill not found' });
    }
    
    console.log('Current bill balance:', currentBill.balance_amount, 'Payment amount:', paymentData.amount);
    
    // Validate payment amount doesn't exceed balance
    if (paymentData.amount > currentBill.balance_amount) {
      console.log('Validation failed: Payment exceeds balance. Balance:', currentBill.balance_amount, 'Payment:', paymentData.amount);
      return res.status(400).json({ 
        error: 'Payment amount cannot exceed balance due',
        details: {
          paymentAmount: paymentData.amount,
          balanceAmount: currentBill.balance_amount,
          totalAmount: currentBill.total_amount,
          paidAmount: currentBill.paid_amount
        }
      });
    }
    
    // Calculate new amounts
    const newPaidAmount = parseFloat(currentBill.paid_amount) + parseFloat(paymentData.amount);
    const newBalanceAmount = parseFloat(currentBill.total_amount) - newPaidAmount;
    
    // Determine new status
    let newStatus = currentBill.status;
    if (newBalanceAmount <= 0) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partial';
    }
    
    // Handle service-specific payment tracking
    let updatedServices = currentBill.services;
    if (paymentData.paidServiceIndexes && paymentData.paidServiceIndexes.length > 0) {
      try {
        // Parse existing services
        const services = typeof currentBill.services === 'string' 
          ? JSON.parse(currentBill.services) 
          : currentBill.services || [];
        
        // Mark selected services as paid
        paymentData.paidServiceIndexes.forEach(indexStr => {
          const index = parseInt(indexStr);
          if (services[index]) {
            services[index].status = 'paid';
            services[index].paid = true;
            services[index].paidAt = new Date().toISOString();
          }
        });
        
        updatedServices = JSON.stringify(services);
      } catch (error) {
        console.error('Error updating service payment status:', error);
        // Continue with original services if parsing fails
      }
    }

    // Update the bill with new payment amounts and service statuses
    await PatientBill.update({
      paid_amount: newPaidAmount,
      balance_amount: newBalanceAmount,
      status: newStatus,
      services: updatedServices,
      updated_at: new Date()
    }, {
      where: { id: billId }
    });
    
    // Create receipt record for this payment
    const receiptNumber = `RCP-${Date.now().toString().slice(-8)}`;
    const receiptId = `receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Get service details for the paid services
    let serviceDetails = [];
    if (paymentData.paidServiceIndexes && paymentData.paidServiceIndexes.length > 0) {
      try {
        const services = typeof currentBill.services === 'string' 
          ? JSON.parse(currentBill.services) 
          : currentBill.services || [];
        
        serviceDetails = paymentData.paidServiceIndexes.map(indexStr => {
          const index = parseInt(indexStr);
          const service = services[index];
          return service ? {
            index: index,
            serviceName: service.serviceName || service.name || service.service_name || 'Unknown Service',
            quantity: service.quantity || 1,
            unitPrice: service.unitPrice || service.unit_price || service.price || 0,
            totalPrice: service.totalPrice || service.total_price || service.price || 0,
            department: service.department || 'General'
          } : null;
        }).filter(Boolean);
      } catch (error) {
        console.error('Error parsing service details for receipt:', error);
      }
    }
    
    const receiptData = {
      id: receiptId,
      receipt_number: receiptNumber,
      bill_id: billId,
      patient_id: currentBill.patient_id,
      patient_name: currentBill.patient_name,
      clinic_id: currentBill.clinic_id,
      payment_amount: paymentData.amount,
      payment_method: paymentData.payment_method,
      payment_date: new Date(paymentData.payment_date),
      paid_services: paymentData.paidServiceIndexes || [],
      service_details: serviceDetails,
      notes: paymentData.notes,
      from_lease: paymentData.from_lease || false,
      lease_details: paymentData.lease_details,
      cashier_name: req.body.cashierName || req.body.cashier_name || 'System',
      cashier_id: req.body.cashierId || req.body.cashier_id || null,
      status: 'active'
    };
    
    await Receipt.create(receiptData);
    
    // If payment method is cash, update Cash at Hand sub-account
    if (paymentData.payment_method === 'cash') {
      const { LedgerAccount } = require('../models');
      
      // Find the main cash account
      let cashAccount = await LedgerAccount.findOne({
        where: { account_code: '01' }
      });
      
      // Find or create cash at hand sub-account
      let cashAtHandAccount = await LedgerAccount.findOne({
        where: { 
          account_code: '3',
          parent_account_id: cashAccount ? cashAccount.id : null
        }
      });
      
      if (!cashAtHandAccount && cashAccount) {
        cashAtHandAccount = await LedgerAccount.create({
          account_name: 'cash at hand',
          account_code: '3',
          account_type: 'asset',
          parent_account_id: cashAccount.id,
          description: 'Cash held by cashiers',
          balance: 0,
          is_active: true
        });
      }
      
      if (cashAtHandAccount) {
        // Add cash payment to Cash at Hand sub-account balance
        await cashAtHandAccount.update({
          balance: parseFloat(cashAtHandAccount.balance) + parseFloat(paymentData.amount)
        });
        
        // Update parent cash account balance
        if (cashAccount) {
          await cashAccount.update({
            balance: parseFloat(cashAccount.balance) + parseFloat(paymentData.amount)
          });
        }
      }
    }
    
    const updatedBill = await PatientBill.findByPk(billId);
    
    console.log('Payment added successfully to bill:', billId);
    console.log('Receipt created:', receiptNumber);
    
    res.json({
      message: 'Payment added successfully',
      bill: updatedBill,
      receipt: {
        id: receiptId,
        receipt_number: receiptNumber,
        amount: paymentData.amount,
        method: paymentData.payment_method,
        date: paymentData.payment_date,
        notes: paymentData.notes,
        from_lease: paymentData.from_lease,
        lease_details: paymentData.lease_details,
        cashier_name: paymentData.cashier_name,
        cashier_id: paymentData.cashier_id,
        paid_services: paymentData.paidServiceIndexes || [],
        service_details: serviceDetails
      }
    });
  } catch (error) {
    console.error('Error adding payment:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Failed to add payment',
      details: error.message 
    });
  }
});

// Get receipts for a specific bill
router.get('/:billId/receipts', async (req, res) => {
  try {
    const { billId } = req.params;
    
    const receipts = await Receipt.findAll({
      where: { 
        bill_id: billId,
        status: 'active' // Only active receipts, not voided or refunded
      },
      order: [['created_at', 'DESC']]
    });
    
    res.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

// Search patient bills
router.get('/search/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { q } = req.query; // search query
    
    const whereClause = {
      clinic_id: parseInt(clinicId)
    };
    
    if (q) {
      whereClause[Op.or] = [
        { bill_number: { [Op.like]: `%${q}%` } },
        { patient_name: { [Op.like]: `%${q}%` } },
        { patient_id: { [Op.like]: `%${q}%` } }
      ];
    }
    
    const bills = await PatientBill.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
    
    res.json(bills);
  } catch (error) {
    console.error('Error searching patient bills:', error);
    res.status(500).json({ error: 'Failed to search patient bills' });
  }
});

module.exports = router;
