const express = require('express');
const router = express.Router();
const { Receipt } = require('../models');
const { Op } = require('sequelize');

// Get all receipts for a clinic
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { bill_id } = req.query;
    
    let whereClause = { 
      clinic_id: parseInt(clinicId),
      status: { [Op.ne]: 'deleted' } // Exclude deleted receipts
    };
    
    // If bill_id is provided, filter by it
    if (bill_id) {
      whereClause.bill_id = bill_id;
    }
    
    const receipts = await Receipt.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    res.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

// Get a specific receipt by ID
router.get('/:receiptId', async (req, res) => {
  try {
    const { receiptId } = req.params;
    
    const receipt = await Receipt.findByPk(receiptId);
    
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    
    res.json(receipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// Get receipts by patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { clinicId } = req.query;
    
    const whereClause = { patient_id: patientId };
    if (clinicId) {
      whereClause.clinic_id = parseInt(clinicId);
    }
    
    const receipts = await Receipt.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    res.json(receipts);
  } catch (error) {
    console.error('Error fetching patient receipts:', error);
    res.status(500).json({ error: 'Failed to fetch patient receipts' });
  }
});

// Get receipts by date range
router.get('/clinic/:clinicId/date-range', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const receipts = await Receipt.findAll({
      where: {
        clinic_id: parseInt(clinicId),
        payment_date: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      order: [['created_at', 'DESC']]
    });

    res.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts by date range:', error);
    res.status(500).json({ error: 'Failed to fetch receipts by date range' });
  }
});

// Update receipt status (void/refund)
router.put('/:receiptId/status', async (req, res) => {
  try {
    const { receiptId } = req.params;
    const { status, reason } = req.body;
    
    if (!['active', 'voided', 'refunded'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const [updatedRows] = await Receipt.update(
      { 
        status,
        notes: reason ? `${status.charAt(0).toUpperCase() + status.slice(1)}: ${reason}` : undefined,
        updated_at: new Date()
      },
      { where: { id: receiptId } }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const updatedReceipt = await Receipt.findByPk(receiptId);
    res.json({
      message: `Receipt ${status} successfully`,
      receipt: updatedReceipt
    });
  } catch (error) {
    console.error('Error updating receipt status:', error);
    res.status(500).json({ error: 'Failed to update receipt status' });
  }
});

// Search receipts
router.get('/clinic/:clinicId/search', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { q, status, paymentMethod, startDate, endDate } = req.query;
    
    const whereClause = { clinic_id: parseInt(clinicId) };
    
    // Add search query
    if (q) {
      whereClause[Op.or] = [
        { receipt_number: { [Op.like]: `%${q}%` } },
        { patient_name: { [Op.like]: `%${q}%` } },
        { patient_id: { [Op.like]: `%${q}%` } },
        { cashier_name: { [Op.like]: `%${q}%` } }
      ];
    }
    
    // Add status filter
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    // Add payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      whereClause.payment_method = paymentMethod;
    }
    
    // Add date range filter
    if (startDate && endDate) {
      whereClause.payment_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const receipts = await Receipt.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    res.json(receipts);
  } catch (error) {
    console.error('Error searching receipts:', error);
    res.status(500).json({ error: 'Failed to search receipts' });
  }
});

// Get receipt statistics
router.get('/clinic/:clinicId/stats', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { period = 'today' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'today':
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        dateFilter = { payment_date: { [Op.between]: [startOfDay, endOfDay] } };
        break;
      case 'week':
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { payment_date: { [Op.gte]: startOfWeek } };
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { payment_date: { [Op.gte]: startOfMonth } };
        break;
    }
    
    const receipts = await Receipt.findAll({
      where: {
        clinic_id: parseInt(clinicId),
        ...dateFilter
      }
    });
    
    const stats = {
      totalReceipts: receipts.length,
      totalAmount: receipts.reduce((sum, r) => sum + parseFloat(r.payment_amount), 0),
      activeReceipts: receipts.filter(r => r.status === 'active').length,
      voidedReceipts: receipts.filter(r => r.status === 'voided').length,
      refundedReceipts: receipts.filter(r => r.status === 'refunded').length,
      paymentMethods: {
        cash: receipts.filter(r => r.payment_method === 'cash').length,
        card: receipts.filter(r => r.payment_method === 'card').length,
        check: receipts.filter(r => r.payment_method === 'check').length,
        lease: receipts.filter(r => r.payment_method === 'lease').length,
        insurance: receipts.filter(r => r.payment_method === 'insurance').length
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching receipt statistics:', error);
    res.status(500).json({ error: 'Failed to fetch receipt statistics' });
  }
});

module.exports = router;
