const express = require('express');
const router = express.Router();
const { PurchaseOrder, Supplier } = require('../models');

// Get all purchase orders
router.get('/', async (req, res) => {
  try {
    const orders = await PurchaseOrder.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// Create new purchase order
router.post('/', async (req, res) => {
  try {
    // Generate PO number
    const count = await PurchaseOrder.count();
    const poNumber = `PO-${String(count + 1).padStart(6, '0')}`;
    
    const order = await PurchaseOrder.create({
      ...req.body,
      po_number: poNumber
    });
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// Update purchase order
router.put('/:id', async (req, res) => {
  try {
    const order = await PurchaseOrder.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    await order.update(req.body);
    res.json(order);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
});

module.exports = router;
