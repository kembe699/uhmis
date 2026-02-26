const express = require('express');
const { sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Get lab results by clinic
router.get('/', async (req, res) => {
  try {
    const { clinic } = req.query;
    
    if (!clinic) {
      return res.status(400).json({ error: 'Clinic parameter is required' });
    }

    const [results] = await sequelize.query(`
      SELECT * FROM lab_results 
      WHERE clinic_id = ? 
      ORDER BY performed_at DESC
    `, {
      replacements: [clinic]
    });

    res.json(results);
  } catch (error) {
    console.error('Error fetching lab results:', error);
    res.status(500).json({ error: 'Failed to fetch lab results' });
  }
});

// Create new lab result
router.post('/', async (req, res) => {
  try {
    const {
      request_id,
      patient_id,
      patient_name,
      clinic_id,
      test_id,
      test_name,
      test_code,
      results,
      reference_ranges,
      abnormal_flags,
      performed_by,
      status = 'preliminary',
      notes
    } = req.body;

    const resultId = uuidv4();
    
    await sequelize.query(`
      INSERT INTO lab_results (
        id, request_id, patient_id, patient_name, clinic_id, test_id, 
        test_name, test_code, results, reference_ranges, abnormal_flags,
        performed_by, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        resultId, request_id, patient_id, patient_name, clinic_id, test_id,
        test_name, test_code, JSON.stringify(results), JSON.stringify(reference_ranges),
        JSON.stringify(abnormal_flags), performed_by, status, notes
      ]
    });

    const [created] = await sequelize.query(`
      SELECT * FROM lab_results WHERE id = ?
    `, {
      replacements: [resultId]
    });

    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Error creating lab result:', error);
    res.status(500).json({ error: 'Failed to create lab result' });
  }
});

// Get lab result by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await sequelize.query(`
      SELECT * FROM lab_results WHERE id = ?
    `, {
      replacements: [id]
    });

    if (results.length === 0) {
      return res.status(404).json({ error: 'Lab result not found' });
    }

    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching lab result:', error);
    res.status(500).json({ error: 'Failed to fetch lab result' });
  }
});

// Update lab result
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      results,
      reference_ranges,
      abnormal_flags,
      status,
      verified_by,
      notes
    } = req.body;

    await sequelize.query(`
      UPDATE lab_results 
      SET results = ?, reference_ranges = ?, abnormal_flags = ?, 
          status = ?, verified_by = ?, verified_at = NOW(), 
          notes = ?, updated_at = NOW()
      WHERE id = ?
    `, {
      replacements: [
        JSON.stringify(results), JSON.stringify(reference_ranges),
        JSON.stringify(abnormal_flags), status, verified_by, notes, id
      ]
    });

    const [updated] = await sequelize.query(`
      SELECT * FROM lab_results WHERE id = ?
    `, {
      replacements: [id]
    });

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Lab result not found' });
    }

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating lab result:', error);
    res.status(500).json({ error: 'Failed to update lab result' });
  }
});

module.exports = router;
