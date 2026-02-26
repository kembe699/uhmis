const express = require('express');
const router = express.Router();
const { DailyExpense, LedgerAccount } = require('../models');

// Get all daily expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await DailyExpense.findAll({
      order: [['expense_date', 'DESC']]
    });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Create new expense
router.post('/', async (req, res) => {
  try {
    const { account_id, amount, description, expense_date, category, notes, created_by } = req.body;
    
    // Find the account
    const account = await LedgerAccount.findByPk(account_id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Deduct from account balance
    await account.update({
      balance: parseFloat(account.balance) - parseFloat(amount)
    });
    
    // Create expense record
    const expense = await DailyExpense.create({
      expense_date: expense_date || new Date(),
      description,
      amount,
      account_id,
      account_name: account.account_name,
      category,
      notes,
      created_by
    });
    
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

module.exports = router;
