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

// Get saved component values for a lab request
router.get('/:id/component-values', async (req, res) => {
  try {
    const { id } = req.params;
    const [components] = await sequelize.query(
      `SELECT cv.* FROM lab_result_component_values cv
       JOIN lab_results lr ON cv.result_id = lr.id
       WHERE lr.lab_request_id = ?
       ORDER BY cv.created_at ASC`,
      { replacements: [id] }
    );
    res.json(components);
  } catch (error) {
    console.error('Error fetching component values:', error.message);
    res.status(500).json({ error: 'Failed to fetch component values', details: error.message });
  }
});

// Auto-save component value
router.post('/:id/auto-save', async (req, res) => {
  const crypto = require('crypto');
  try {
    const { id } = req.params;
    const { componentName, componentValue, remark, unit, normalRange } = req.body;

    console.log('Auto-save request:', { id, componentName, componentValue, remark });

    // Check if lab request exists
    const [[labRequest]] = await sequelize.query(
      `SELECT * FROM lab_requests WHERE id = ?`,
      { replacements: [id] }
    );

    if (!labRequest) {
      return res.status(404).json({ error: 'Lab request not found' });
    }

    // Find or create a lab_results entry for this lab_request
    let [[labResult]] = await sequelize.query(
      `SELECT * FROM lab_results WHERE lab_request_id = ? LIMIT 1`,
      { replacements: [id] }
    );

    if (!labResult) {
      // Resolve actual patient UUID (lab_requests.patient_id may be readable ID like 'UH-989887')
      const [[patientRow]] = await sequelize.query(
        `SELECT id FROM patients WHERE id = ? OR patient_id = ? LIMIT 1`,
        { replacements: [labRequest.patient_id, labRequest.patient_id] }
      );
      const patientUUID = patientRow?.id || labRequest.patient_id;

      const resultId = crypto.randomUUID();
      await sequelize.query(
        `INSERT INTO lab_results (id, lab_request_id, patient_id, test_code, test_name, status, result_date, clinic_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'partial', NOW(), ?, NOW(), NOW())`,
        {
          replacements: [
            resultId,
            id,
            patientUUID,
            labRequest.test_code || '',
            labRequest.test_name || '',
            labRequest.clinic_id || null
          ]
        }
      );
      [[labResult]] = await sequelize.query(
        `SELECT * FROM lab_results WHERE id = ?`, { replacements: [resultId] }
      );
    }

    // Determine if value is abnormal based on normal_range
    let isAbnormal = 0;
    if (normalRange && componentValue && !isNaN(Number(componentValue))) {
      const rangeMatch = normalRange.match(/^([\d.]+)-([\d.]+)$/);
      if (rangeMatch) {
        const val = parseFloat(componentValue);
        isAbnormal = (val < parseFloat(rangeMatch[1]) || val > parseFloat(rangeMatch[2])) ? 1 : 0;
      }
    }

    // Upsert component value — update if exists, insert if not
    const [[existing]] = await sequelize.query(
      `SELECT id FROM lab_result_component_values WHERE result_id = ? AND component_name = ?`,
      { replacements: [labResult.id, componentName] }
    );

    if (existing) {
      await sequelize.query(
        `UPDATE lab_result_component_values SET value = ?, unit = ?, normal_range = ?, is_abnormal = ?, remark = ?, updated_at = NOW() WHERE id = ?`,
        { replacements: [componentValue, unit || '', normalRange || '', isAbnormal, remark || '', existing.id] }
      );
    } else {
      await sequelize.query(
        `INSERT INTO lab_result_component_values (id, result_id, component_name, value, unit, normal_range, is_abnormal, remark, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [
            crypto.randomUUID(),
            labResult.id,
            componentName,
            componentValue,
            unit || '',
            normalRange || '',
            isAbnormal,
            remark || ''
          ]
        }
      );
    }

    // Mark lab_request as partial if still pending
    if (labRequest.status === 'pending') {
      await sequelize.query(
        `UPDATE lab_requests SET status = 'partial', updated_at = NOW() WHERE id = ?`,
        { replacements: [id] }
      );
    }

    console.log('Auto-saved component:', componentName, '=', componentValue);
    res.json({ success: true, message: `${componentName} saved`, componentName, componentValue, remark });
  } catch (error) {
    console.error('Error auto-saving component:', error.message);
    res.status(500).json({ error: 'Failed to auto-save component', details: error.message });
  }
});

// Submit lab results and lock the request
router.post('/:id/results', async (req, res) => {
  const crypto = require('crypto');
  try {
    const { id } = req.params;
    const { components, resultText, performedBy, status = 'completed' } = req.body;

    // Verify the lab request exists
    const [[labRequest]] = await sequelize.query(
      `SELECT * FROM lab_requests WHERE id = ?`, { replacements: [id] }
    );
    if (!labRequest) return res.status(404).json({ error: 'Lab request not found' });

    // Find or create a lab_results entry for this request (same as auto-save)
    let [[labResult]] = await sequelize.query(
      `SELECT * FROM lab_results WHERE lab_request_id = ? LIMIT 1`, { replacements: [id] }
    );
    if (!labResult) {
      const [[patientRow]] = await sequelize.query(
        `SELECT id FROM patients WHERE id = ? OR patient_id = ? LIMIT 1`,
        { replacements: [labRequest.patient_id, labRequest.patient_id] }
      );
      const patientUUID = patientRow?.id || labRequest.patient_id;
      const resultId = crypto.randomUUID();
      await sequelize.query(
        `INSERT INTO lab_results (id, lab_request_id, patient_id, test_code, test_name, status, result_date, clinic_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), NOW())`,
        { replacements: [resultId, id, patientUUID, labRequest.test_code || '', labRequest.test_name || '', status, labRequest.clinic_id || null] }
      );
      [[labResult]] = await sequelize.query(`SELECT * FROM lab_results WHERE id = ?`, { replacements: [resultId] });
    } else {
      // Update existing result status
      await sequelize.query(
        `UPDATE lab_results SET status = ?, updated_at = NOW() WHERE id = ?`,
        { replacements: [status, labResult.id] }
      );
    }

    // Upsert each component value via result_id
    if (Array.isArray(components)) {
      for (const comp of components) {
        if (!comp.name || comp.value === undefined || comp.value === null || !comp.value.toString().trim()) continue;
        let isAbnormal = 0;
        const refRange = comp.normalRangeText || (comp.normalRangeMin != null && comp.normalRangeMax != null ? `${comp.normalRangeMin}-${comp.normalRangeMax}` : '');
        if (refRange && !isNaN(Number(comp.value))) {
          const m = refRange.match(/^([\d.]+)-([\d.]+)$/);
          if (m) {
            const val = parseFloat(comp.value);
            isAbnormal = (val < parseFloat(m[1]) || val > parseFloat(m[2])) ? 1 : 0;
          }
        }
        const [[existing]] = await sequelize.query(
          `SELECT id FROM lab_result_component_values WHERE result_id = ? AND component_name = ?`,
          { replacements: [labResult.id, comp.name] }
        );
        if (existing) {
          await sequelize.query(
            `UPDATE lab_result_component_values SET value = ?, unit = ?, normal_range = ?, is_abnormal = ?, remark = ?, updated_at = NOW() WHERE id = ?`,
            { replacements: [comp.value, comp.unit || '', refRange, isAbnormal, comp.remark || '', existing.id] }
          );
        } else {
          await sequelize.query(
            `INSERT INTO lab_result_component_values (id, result_id, component_name, value, unit, normal_range, is_abnormal, remark, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            { replacements: [crypto.randomUUID(), labResult.id, comp.name, comp.value, comp.unit || '', refRange, isAbnormal, comp.remark || ''] }
          );
        }
      }
    }

    // Lock the lab_request (completed_by has FK to users.id — only update status/timestamp)
    await sequelize.query(
      `UPDATE lab_requests SET status = ?, completed_at = NOW(), updated_at = NOW() WHERE id = ?`,
      { replacements: [status, id] }
    );

    const [[updated]] = await sequelize.query(`SELECT * FROM lab_requests WHERE id = ?`, { replacements: [id] });
    res.json(updated);
  } catch (error) {
    console.error('Error saving lab results:', error.message);
    res.status(500).json({ error: 'Failed to save lab results', details: error.message });
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
