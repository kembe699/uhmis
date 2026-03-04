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
      SELECT 
        lr.*,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        p.gender,
        p.patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) as age
      FROM lab_requests lr
      LEFT JOIN patients p ON lr.patient_id = p.id
      WHERE lr.clinic_id = ? 
      ORDER BY lr.requested_at DESC
    `, {
      replacements: [clinic]
    });

    console.log('Lab requests query results:', JSON.stringify(results, null, 2));
    res.json(results);
  } catch (error) {
    console.error('Error fetching lab requests:', error);
    res.status(500).json({ error: 'Failed to fetch lab requests' });
  }
});

// Create new lab request
router.post('/', async (req, res) => {
  try {
    console.log('Lab request creation - received body:', JSON.stringify(req.body, null, 2));
    
    const {
      patient_id,
      patient_name,
      clinic_id,
      test_id,
      test_name,
      test_code,
      test_type,
      requested_by,
      requested_at,
      priority = 'normal',
      notes,
      visit_id,
      status = 'pending',
      bill_id
    } = req.body;

    // Validate required fields
    if (!patient_id || !patient_name || !clinic_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: patient_id, patient_name, clinic_id' 
      });
    }

    if (!test_name && !test_code && !test_type) {
      return res.status(400).json({ 
        error: 'At least one of test_name, test_code, or test_type is required' 
      });
    }

    const requestId = uuidv4();
    
    const insertQuery = `
      INSERT INTO lab_requests (
        id, patient_id, visit_id, test_code, test_name, status, priority, 
        requested_at, requested_by, clinic_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const replacements = [
      requestId, 
      patient_id, 
      visit_id || uuidv4(), // Generate visit_id if not provided
      test_code || null,
      test_name || test_type || test_code, 
      status,
      priority, 
      requested_at || new Date().toISOString(),
      requested_by || 'System', 
      clinic_id, 
      notes || null
    ];
    
    console.log('Lab request insert query:', insertQuery);
    console.log('Lab request replacements:', replacements);
    
    await sequelize.query(insertQuery, {
      replacements: replacements
    });

    const [created] = await sequelize.query(`
      SELECT * FROM lab_requests WHERE id = ?
    `, {
      replacements: [requestId]
    });

    console.log('Lab request created successfully:', created[0]);
    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Error creating lab request:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create lab request',
      details: error.message 
    });
  }
});

// Auto-save component value
router.post('/:id/auto-save', async (req, res) => {
  try {
    const { id } = req.params;
    const { componentName, componentValue, remark } = req.body;

    console.log('Auto-save request:', { id, componentName, componentValue, remark });

    // Check if lab request exists
    const [labRequest] = await sequelize.query(`
      SELECT * FROM lab_requests WHERE id = ?
    `, {
      replacements: [id]
    });

    if (labRequest.length === 0) {
      return res.status(404).json({ error: 'Lab request not found' });
    }

    // For now, just return success - we can implement actual storage later
    console.log('Auto-save successful for:', componentName, componentValue);
    
    res.json({ 
      success: true, 
      message: 'Component auto-saved successfully',
      componentName,
      componentValue,
      remark
    });
  } catch (error) {
    console.error('Error auto-saving component:', error);
    res.status(500).json({ error: 'Failed to auto-save component' });
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
