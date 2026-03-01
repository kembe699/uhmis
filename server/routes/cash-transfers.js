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
    console.log('=== CASH TRANSFER POST REQUEST ===');
    console.log('Request body:', req.body);
    
    const { from_account_id, to_account_id, amount, notes } = req.body;
    
    // Validate required fields
    if (!from_account_id || !to_account_id || !amount) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: from_account_id, to_account_id, amount' });
    }
    
    console.log('Looking for source account:', from_account_id);
    // Find source account
    const fromAccount = await LedgerAccount.findByPk(from_account_id);
    console.log('Source account found:', fromAccount ? { id: fromAccount.id, name: fromAccount.account_name, balance: fromAccount.balance } : 'NOT FOUND');
    
    if (!fromAccount) {
      console.log('Source account not found, returning 404');
      return res.status(404).json({ error: 'Source account not found' });
    }
    
    console.log('Looking for destination account:', to_account_id);
    // Find destination account
    const toAccount = await LedgerAccount.findByPk(to_account_id);
    console.log('Destination account found:', toAccount ? { id: toAccount.id, name: toAccount.account_name, balance: toAccount.balance } : 'NOT FOUND');
    
    if (!toAccount) {
      console.log('Destination account not found, returning 404');
      return res.status(404).json({ error: 'Destination account not found' });
    }
    
    console.log('Checking balance: source has', fromAccount.balance, 'transfer amount', amount);
    // Check sufficient balance
    if (parseFloat(fromAccount.balance) < parseFloat(amount)) {
      console.log('Insufficient balance, returning 400');
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    console.log('Updating source account balance...');
    // Deduct from source account
    await fromAccount.update({
      balance: parseFloat(fromAccount.balance) - parseFloat(amount)
    });
    console.log('Source account updated');
    
    console.log('Updating destination account balance...');
    // Add to destination account
    await toAccount.update({
      balance: parseFloat(toAccount.balance) + parseFloat(amount)
    });
    console.log('Destination account updated');
    
    console.log('Recording transfer...');
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
    console.log('Transfer recorded successfully');
    
    res.json({
      message: 'Transfer completed successfully',
      transfer
    });
  } catch (error) {
    console.error('=== CASH TRANSFER ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to complete transfer', details: error.message });
  }
});

module.exports = router;
