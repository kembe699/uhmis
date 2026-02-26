const express = require('express');
const router = express.Router();
const { LedgerAccount } = require('../models');

// Get all cash transfers
router.get('/', async (req, res) => {
  try {
    const { CashTransfer } = require('../models');
    const transfers = await CashTransfer.findAll({
      order: [['created_at', 'DESC']],
      limit: 100
    });
    res.json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.json([]);
  }
});

// Create new cash transfer
router.post('/', async (req, res) => {
  try {
    const { from_account_id, to_account_id, amount, notes } = req.body;
    
    // Find source account
    const fromAccount = await LedgerAccount.findByPk(from_account_id);
    if (!fromAccount) {
      return res.status(404).json({ error: 'Source account not found' });
    }
    
    // Find destination account
    const toAccount = await LedgerAccount.findByPk(to_account_id);
    if (!toAccount) {
      return res.status(404).json({ error: 'Destination account not found' });
    }
    
    // Check sufficient balance
    if (parseFloat(fromAccount.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Deduct from source account
    await fromAccount.update({
      balance: parseFloat(fromAccount.balance) - parseFloat(amount)
    });
    
    // Add to destination account
    await toAccount.update({
      balance: parseFloat(toAccount.balance) + parseFloat(amount)
    });
    
    // Record transfer
    const { CashTransfer } = require('../models');
    const transfer = await CashTransfer.create({
      from_account_id,
      from_account_name: fromAccount.account_name,
      to_account_id,
      to_account_name: toAccount.account_name,
      amount,
      notes: notes || 'Cash transfer',
      created_by: 'admin'
    });
    
    res.json({
      message: 'Transfer completed successfully',
      transfer
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Failed to complete transfer' });
  }
});

module.exports = router;
