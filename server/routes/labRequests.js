const express = require('express');
const { sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Get lab requests by clinic
router.get('/', async (req, res) => {
  try {
    const { clinic } = req.query;
    
    if (!clinic) {
      return res.status(400).json({ error: 'Clinic parameter is required' });
    }

    const [results] = await sequelize.query(`
      SELECT * FROM lab_requests 
      WHERE clinic_id = ? 
      ORDER BY requested_at DESC
    `, {
      replacements: [clinic]
    });

    res.json(results);
  } catch (error) {
    console.error('Error fetching lab requests:', error);
    res.status(500).json({ error: 'Failed to fetch lab requests' });
  }
});

// Create new lab request
router.post('/', async (req, res) => {
  try {
    const {
      patient_id,
      patient_name,
      clinic_id,
      test_id,
      test_name,
      test_code,
      requested_by,
      priority = 'normal',
      notes,
      visit_id
    } = req.body;

    const requestId = uuidv4();
    
    await sequelize.query(`
      INSERT INTO lab_requests (
        id, patient_id, patient_name, clinic_id, test_id, test_name, 
        test_code, requested_by, priority, notes, visit_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, {
      replacements: [
        requestId, patient_id, patient_name, clinic_id, test_id, 
        test_name, test_code, requested_by, priority, notes, visit_id
      ]
    });

    const [created] = await sequelize.query(`
      SELECT * FROM lab_requests WHERE id = ?
    `, {
      replacements: [requestId]
    });

    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Error creating lab request:', error);
    res.status(500).json({ error: 'Failed to create lab request' });
  }
});

// Update lab request status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await sequelize.query(`
      UPDATE lab_requests 
      SET status = ?, updated_at = NOW() 
      WHERE id = ?
    `, {
      replacements: [status, id]
    });

    const [updated] = await sequelize.query(`
      SELECT * FROM lab_requests WHERE id = ?
    `, {
      replacements: [id]
    });

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Lab request not found' });
    }

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating lab request status:', error);
    res.status(500).json({ error: 'Failed to update lab request status' });
  }
});

module.exports = router;
