const express = require('express');
const router = express.Router();
const { Facility } = require('../models');

// Get all facilities
router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(facilities);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
});

// Get facility by ID
router.get('/:id', async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    res.json(facility);
  } catch (error) {
    console.error('Error fetching facility:', error);
    res.status(500).json({ error: 'Failed to fetch facility' });
  }
});

// Create new facility
router.post('/', async (req, res) => {
  try {
    const facility = await Facility.create(req.body);
    res.status(201).json(facility);
  } catch (error) {
    console.error('Error creating facility:', error);
    res.status(500).json({ error: 'Failed to create facility' });
  }
});

// Update facility
router.put('/:id', async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    await facility.update(req.body);
    res.json(facility);
  } catch (error) {
    console.error('Error updating facility:', error);
    res.status(500).json({ error: 'Failed to update facility' });
  }
});

// Delete facility
router.delete('/:id', async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    await facility.destroy();
    res.json({ message: 'Facility deleted successfully' });
  } catch (error) {
    console.error('Error deleting facility:', error);
    res.status(500).json({ error: 'Failed to delete facility' });
  }
});

module.exports = router;
