const express = require('express');
const router = express.Router();
const { CashierShift, Receipt } = require('../models');
const { Op } = require('sequelize');

router.get('/current-shift', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const shift = await CashierShift.findOne({
      where: { cashier_id: userId, status: 'open' },
      order: [['start_time', 'DESC']]
    });
    if (!shift) return res.status(404).json({ message: 'No active shift' });
    res.json(shift);
  } catch (error) {
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
    res.json(shifts);
  } catch (error) {
    console.error('Fetch shifts error:', error);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
});

router.get('/shift/:shiftId/receipts', async (req, res) => {
  try {
    const shift = await CashierShift.findByPk(req.params.shiftId);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    
    // Security: Ensure user can only view receipts from their own shifts
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (shift.cashier_id !== userId) {
      return res.status(403).json({ error: 'Access denied: You can only view your own shift receipts' });
    }
    
    // Get receipts created AFTER shift start time (not entire day)
    const endTime = shift.end_time ? new Date(shift.end_time) : new Date();
    
    const receipts = await Receipt.findAll({
      where: {
        created_at: {
          [Op.gte]: new Date(shift.start_time),
          [Op.lte]: endTime
        }
      },
      order: [['created_at', 'DESC']]
    });
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
    const { shift_id, amount, to_account_id, notes } = req.body;
    const { LedgerAccount } = require('../models');
    
    // Find cash at hand sub-account (code 3, parent cash account 01)
    let cashAccount = await LedgerAccount.findOne({ where: { account_code: '01' } });
    let cashAtHandAccount = await LedgerAccount.findOne({
      where: { account_code: '3', parent_account_id: cashAccount?.id }
    });
    
    if (!cashAtHandAccount) {
      return res.status(404).json({ error: 'Cash at Hand account not found' });
    }
    
    // Find destination account
    const toAccount = await LedgerAccount.findByPk(to_account_id);
    if (!toAccount) {
      return res.status(404).json({ error: 'Destination account not found' });
    }
    
    // Deduct from Cash at Hand sub-account
    await cashAtHandAccount.update({
      balance: parseFloat(cashAtHandAccount.balance) - parseFloat(amount)
    });
    
    // Deduct from parent Cash account
    if (cashAccount) {
      await cashAccount.update({
        balance: parseFloat(cashAccount.balance) - parseFloat(amount)
      });
    }
    
    // Add to destination account
    await toAccount.update({
      balance: parseFloat(toAccount.balance) + parseFloat(amount)
    });
    
    res.json({ 
      message: 'Cash transferred successfully',
      from_account: cashAtHandAccount.account_name,
      to_account: toAccount.account_name,
      amount: amount
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Failed to transfer cash' });
  }
});

module.exports = router;
