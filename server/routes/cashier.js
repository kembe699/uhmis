const express = require('express');
const router = express.Router();
const { CashierShift, Receipt } = require('../models');
const { Op } = require('sequelize');

router.get('/current-shift', async (req, res) => {
  try {
    console.log('=== CURRENT SHIFT REQUEST ===');
    const userId = req.user?.id;
    console.log('User ID:', userId);
    
    if (!userId) {
      console.log('No user ID, returning 401');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    console.log('Looking for active shift for user:', userId);
    const shift = await CashierShift.findOne({
      where: { cashier_id: userId, status: 'open' },
      order: [['start_time', 'DESC']]
    });
    
    console.log('Active shift found:', shift ? { id: shift.id, status: shift.status } : 'NOT FOUND');
    
    if (!shift) {
      console.log('No active shift found, returning 404');
      return res.status(404).json({ message: 'No active shift' });
    }
    
    console.log('Returning active shift');
    res.json(shift);
  } catch (error) {
    console.error('Error fetching current shift:', error);
    res.status(500).json({ error: 'Failed to fetch shift' });
  }
});

router.get('/shifts', async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Build where clause based on role and filters
    const whereClause = {};
    
    // Non-admins can only see their own shifts
    if (userRole !== 'admin') {
      whereClause.cashier_id = userId;
    }
    
    // Apply status filter if provided
    if (req.query.status) {
      whereClause.status = req.query.status;
    }
    
    // Apply date range filters if provided
    if (req.query.startDate || req.query.endDate) {
      whereClause.start_time = {};
      if (req.query.startDate) {
        whereClause.start_time[Op.gte] = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        whereClause.start_time[Op.lte] = endDate;
      }
    }
    
    const shifts = await CashierShift.findAll({
      where: whereClause,
      order: [['start_time', 'DESC']],
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    });

    // Calculate real-time totals for each shift
    const shiftsWithTotals = await Promise.all(shifts.map(async (shift) => {
      // Get receipts for this shift period
      const endTime = shift.end_time || new Date();
      const receipts = await Receipt.findAll({
        where: {
          created_at: {
            [Op.gte]: new Date(shift.start_time),
            [Op.lte]: endTime
          }
        }
      });

      const actualTotalAmount = receipts.reduce((sum, r) => sum + parseFloat(r.payment_amount || 0), 0);
      const actualTotalReceipts = receipts.length;

      // Update the shift data with calculated totals
      return {
        ...shift.toJSON(),
        total_amount: actualTotalAmount,
        total_receipts: actualTotalReceipts
      };
    }));

    res.json(shiftsWithTotals);
  } catch (error) {
    console.error('Fetch shifts error:', error);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

router.get('/shift/:shiftId/receipts', async (req, res) => {
  try {
    const shift = await CashierShift.findByPk(req.params.shiftId);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    
    // Security: Allow admins to view all shifts, others only their own
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Allow admins to view any shift, others only their own
    if (userRole !== 'admin' && shift.cashier_id !== userId) {
      return res.status(403).json({ error: 'Access denied: You can only view your own shift receipts' });
    }
    
    // Get receipts created during this specific shift period
    const startTime = new Date(shift.start_time);
    const endTime = shift.end_time ? new Date(shift.end_time) : new Date();
    
    console.log(`Fetching receipts for shift ${shift.id}:`);
    console.log(`- Shift start: ${startTime.toISOString()}`);
    console.log(`- Shift end: ${endTime.toISOString()}`);
    
    const receipts = await Receipt.findAll({
      where: {
        created_at: {
          [Op.gte]: startTime,
          [Op.lte]: endTime
        }
      },
      order: [['created_at', 'DESC']]
    });
    
    console.log(`Found ${receipts.length} receipts for shift ${shift.id}`);
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

router.post('/start-shift', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const existing = await CashierShift.findOne({
      where: { cashier_id: userId, status: 'open' }
    });
    if (existing) return res.status(400).json({ error: 'Shift already open' });

    const shift = await CashierShift.create({
      cashier_id: userId,
      cashier_name: req.user?.email || 'Cashier',
      opening_balance: req.body.opening_balance || 0,
      status: 'open'
    });
    res.status(201).json(shift);
  } catch (error) {
    console.error('Start shift error:', error);
    res.status(500).json({ error: 'Failed to start shift', details: error.message });
  }
});

router.post('/close-shift/:shiftId', async (req, res) => {
  try {
    const shift = await CashierShift.findByPk(req.params.shiftId);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    if (shift.status === 'closed') return res.status(400).json({ error: 'Already closed' });
    
    // Security: Ensure user can only close their own shifts
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (shift.cashier_id !== userId) {
      return res.status(403).json({ error: 'Access denied: You can only close your own shifts' });
    }

    // Get receipts created AFTER shift start time
    const receipts = await Receipt.findAll({
      where: {
        created_at: {
          [Op.gte]: new Date(shift.start_time),
          [Op.lte]: new Date()
        }
      }
    });

    const totalAmount = receipts.reduce((sum, r) => sum + parseFloat(r.payment_amount || 0), 0);

    await shift.update({
      end_time: new Date(),
      closing_balance: req.body.closing_balance,
      total_receipts: receipts.length,
      total_amount: totalAmount,
      status: 'closed',
      notes: req.body.notes
    });
    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: 'Failed to close shift' });
  }
});

router.post('/transfer-cash', async (req, res) => {
  try {
    console.log('=== CASH TRANSFER REQUEST ===');
    console.log('Request body:', req.body);
    
    const { shift_id, amount, to_account_id, notes } = req.body;
    const { LedgerAccount } = require('../models');
    
    console.log('Looking for cash account with code 01...');
    // Find cash at hand sub-account (code 3, parent cash account 01)
    let cashAccount = await LedgerAccount.findOne({ where: { account_code: '01' } });
    console.log('Cash account found:', cashAccount ? { id: cashAccount.id, name: cashAccount.account_name } : 'NOT FOUND');
    
    console.log('Looking for cash at hand sub-account...');
    let cashAtHandAccount = await LedgerAccount.findOne({
      where: { account_code: '3', parent_account_id: cashAccount?.id }
    });
    console.log('Cash at hand account found:', cashAtHandAccount ? { id: cashAtHandAccount.id, name: cashAtHandAccount.account_name, balance: cashAtHandAccount.balance } : 'NOT FOUND');
    
    if (!cashAtHandAccount) {
      console.log('Cash at Hand account not found, returning 404');
      return res.status(404).json({ error: 'Cash at Hand account not found' });
    }
    
    console.log('Looking for destination account:', to_account_id);
    // Find destination account
    const toAccount = await LedgerAccount.findByPk(to_account_id);
    console.log('Destination account found:', toAccount ? { id: toAccount.id, name: toAccount.account_name, balance: toAccount.balance } : 'NOT FOUND');
    
    if (!toAccount) {
      console.log('Destination account not found, returning 404');
      return res.status(404).json({ error: 'Destination account not found' });
    }
    
    console.log('Updating cash at hand account balance...');
    // Deduct from Cash at Hand sub-account
    await cashAtHandAccount.update({
      balance: parseFloat(cashAtHandAccount.balance) - parseFloat(amount)
    });
    console.log('Cash at hand account updated');
    
    // Deduct from parent Cash account
    if (cashAccount) {
      console.log('Updating parent cash account balance...');
      await cashAccount.update({
        balance: parseFloat(cashAccount.balance) - parseFloat(amount)
      });
      console.log('Parent cash account updated');
    }
    
    console.log('Updating destination account balance...');
    // Add to destination account
    await toAccount.update({
      balance: parseFloat(toAccount.balance) + parseFloat(amount)
    });
    console.log('Destination account updated');
    
    console.log('Transfer completed successfully');
    res.json({ 
      message: 'Cash transferred successfully',
      from_account: cashAtHandAccount.account_name,
      to_account: toAccount.account_name,
      amount: amount
    });
  } catch (error) {
    console.error('=== CASH TRANSFER ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to transfer cash', details: error.message });
  }
});

module.exports = router;
