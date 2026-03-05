const express = require('express');
const { LabTest, LabTestComponent, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Get all lab tests
router.get('/', async (req, res) => {
  try {
    // First try to sync the table to make sure it exists
    await LabTest.sync();
    await LabTestComponent.sync();
    
    // Use Sequelize ORM to fetch lab tests with components
    const labTests = await LabTest.findAll({
      include: [{
        model: LabTestComponent,
        as: 'components',
        required: false,
        order: [['sort_order', 'ASC']],
      }],
      order: [['test_name', 'ASC']],
    });
    
    console.log(`Found ${labTests.length} lab tests with components`);
    res.json(labTests);
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // If ORM fails, try raw SQL as fallback
    try {
      const [results] = await LabTest.sequelize.query(`
        SELECT * FROM lab_tests 
        ORDER BY test_name ASC
      `);
      
      console.log(`Fallback: Found ${results.length} lab tests using raw SQL`);
      res.json(results);
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      res.status(500).json({ 
        error: 'Failed to fetch lab tests', 
        details: error.message,
        fallbackError: fallbackError.message 
      });
    }
  }
});

// Search lab tests (must come before /:id route)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // First ensure tables exist
    await LabTest.sync();
    await LabTestComponent.sync();
    
    const { Op } = require('sequelize');
    
    const labTests = await LabTest.findAll({
      where: {
        test_name: {
          [Op.like]: `%${q}%`
        },
        is_active: true
      },
      include: [{
        model: LabTestComponent,
        as: 'components',
        required: false,
        order: [['sort_order', 'ASC']],
      }],
      order: [['test_name', 'ASC']],
    });
    
    console.log(`Search for "${q}" found ${labTests.length} lab tests`);
    res.json(labTests);
  } catch (error) {
    console.error('Error searching lab tests:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Fallback to raw SQL
    try {
      const [results] = await sequelize.query(`
        SELECT * FROM lab_tests 
        WHERE test_name LIKE ? 
        ORDER BY test_name ASC
      `, {
        replacements: [`%${query}%`]
      });
      
      console.log(`Fallback search found ${results.length} lab tests`);
      res.json(results);
    } catch (fallbackError) {
      console.error('Fallback search also failed:', fallbackError);
      res.status(500).json({ 
        error: 'Failed to search lab tests', 
        details: error.message,
        fallbackError: fallbackError.message 
      });
    }
  }
});

// Get lab tests by clinic
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    const labTests = await LabTest.findAll({
      where: { 
        clinic_id: req.params.clinicId
      },
      include: [{
        model: LabTestComponent,
        as: 'components',
        order: [['sort_order', 'ASC']],
      }],
      order: [['test_name', 'ASC']],
    });
    res.json(labTests);
  } catch (error) {
    console.error('Error fetching lab tests by clinic:', error);
    res.status(500).json({ error: 'Failed to fetch lab tests' });
  }
});

// Get lab test by ID (must come after specific routes)
router.get('/:id', async (req, res) => {
  try {
    const labTest = await LabTest.findByPk(req.params.id, {
      include: [{
        model: LabTestComponent,
        as: 'components',
        order: [['sort_order', 'ASC']],
      }],
    });
    if (!labTest) {
      return res.status(404).json({ error: 'Lab test not found' });
    }
    res.json(labTest);
  } catch (error) {
    console.error('Error fetching lab test:', error);
    res.status(500).json({ error: 'Failed to fetch lab test' });
  }
});

// Get lab tests by category
router.get('/category/:category', async (req, res) => {
  try {
    const labTests = await LabTest.findAll({
      where: { 
        category: req.params.category,
        is_active: true 
      },
      include: [{
        model: LabTestComponent,
        as: 'components',
        order: [['sort_order', 'ASC']],
      }],
      order: [['test_name', 'ASC']],
    });
    res.json(labTests);
  } catch (error) {
    console.error('Error fetching lab tests by category:', error);
    res.status(500).json({ error: 'Failed to fetch lab tests' });
  }
});

// Get lab test by code (also tries test_name as fallback)
router.get('/code/:code', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const code = req.params.code;
    const labTest = await LabTest.findOne({
      where: {
        [Op.or]: [
          { test_code: code },
          { test_name: code }
        ]
      },
      include: [{
        model: LabTestComponent,
        as: 'components',
        order: [['sort_order', 'ASC']],
      }],
    });
    if (!labTest) {
      return res.status(404).json({ error: 'Lab test not found' });
    }
    res.json(labTest);
  } catch (error) {
    console.error('Error fetching lab test by code:', error);
    res.status(500).json({ error: 'Failed to fetch lab test' });
  }
});

// Create new lab test
router.post('/', async (req, res) => {
  try {
    // Ensure table exists
    await LabTest.sync();
    
    // Use raw SQL to insert directly into lab_tests table
    const { test_name, test_code, category, price, clinic_id } = req.body;
    
    const [results] = await LabTest.sequelize.query(`
      INSERT INTO lab_tests (id, test_name, test_code, category, price, clinic_id, is_active, createdAt, updatedAt)
      VALUES (UUID(), ?, ?, ?, ?, ?, true, NOW(), NOW())
    `, {
      replacements: [test_name, test_code, category, price || 0, clinic_id]
    });
    
    // Fetch the created record
    const [created] = await LabTest.sequelize.query(`
      SELECT * FROM lab_tests 
      WHERE test_code = ? AND clinic_id = ?
      ORDER BY createdAt DESC 
      LIMIT 1
    `, {
      replacements: [test_code, clinic_id]
    });
    
    console.log('Lab test created successfully:', created[0]);
    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Error creating lab test:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to create lab test', details: error.message });
  }
});

// Create lab test with components
router.post('/with-components', async (req, res) => {
  const transaction = await LabTest.sequelize.transaction();
  const crypto = require('crypto');
  
  try {
    const { test, components } = req.body;
    
    console.log('Creating lab test with data:', JSON.stringify({ test, components }, null, 2));
    
    // Validate required fields
    if (!test.test_name || !test.test_code || !test.category || !test.clinic_id) {
      await transaction.rollback();
      return res.status(400).json({ error: 'test_name, test_code, category and clinic_id are required' });
    }
    
    const testCode = test.test_code.toUpperCase();
    const clinicId = parseInt(test.clinic_id);
    const price = parseFloat(test.price) || 0;
    const serviceId = test.service_id || null;

    // Check if test_code already exists
    const [[existingTest]] = await LabTest.sequelize.query(
      `SELECT id FROM lab_tests WHERE test_code = ?`,
      { replacements: [testCode], transaction }
    );

    let testId;

    if (existingTest) {
      // Update the existing test
      testId = existingTest.id;
      console.log('Test code exists, updating existing test:', testId);
      await LabTest.sequelize.query(
        `UPDATE lab_tests SET test_name = ?, category = ?, price = ?, service_id = ?, updated_at = NOW() WHERE id = ?`,
        { replacements: [test.test_name, test.category, price, serviceId, testId], transaction }
      );
    } else {
      // Create new lab test
      testId = crypto.randomUUID();
      console.log('Creating new lab test with id:', testId);
      await LabTest.sequelize.query(
        `INSERT INTO lab_tests (id, test_name, test_code, category, clinic_id, price, service_id, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        { replacements: [testId, test.test_name, testCode, test.category, clinicId, price, serviceId], transaction }
      );
    }

    // Only delete+replace components if we actually have valid ones to insert
    const validComponents = Array.isArray(components)
      ? components.filter(c => c.component_name && c.component_name.trim() !== '')
      : [];

    if (validComponents.length > 0) {
      await LabTest.sequelize.query(
        `DELETE FROM lab_test_components WHERE lab_test_id = ?`,
        { replacements: [testId], transaction }
      );
      console.log('Inserting', validComponents.length, 'components for test:', testId);
      for (let i = 0; i < validComponents.length; i++) {
        const comp = validComponents[i];
        const compId = crypto.randomUUID();
        await LabTest.sequelize.query(
          `INSERT INTO lab_test_components (id, lab_test_id, component_name, unit, reference_range, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          {
            replacements: [
              compId,
              testId,
              comp.component_name.trim(),
              comp.unit || '',
              comp.reference_range || '',
              comp.sort_order !== undefined ? comp.sort_order : i
            ],
            transaction
          }
        );
      }
    } else {
      console.log('No valid components provided - preserving existing components for test:', testId);
    }

    await transaction.commit();

    // Fetch the complete result
    const [[savedTest]] = await LabTest.sequelize.query(
      `SELECT * FROM lab_tests WHERE id = ?`, { replacements: [testId] }
    );
    const [savedComponents] = await LabTest.sequelize.query(
      `SELECT * FROM lab_test_components WHERE lab_test_id = ? ORDER BY sort_order ASC`,
      { replacements: [testId] }
    );

    console.log('Lab test saved successfully with', savedComponents.length, 'components');
    res.status(existingTest ? 200 : 201).json({ ...savedTest, components: savedComponents });

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating lab test with components:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to save lab test with components', details: error.message });
  }
});

// Update lab test
router.put('/:id', async (req, res) => {
  try {
    const { test_name, test_code, category, price } = req.body;
    
    // Use raw SQL to update directly in lab_tests table
    const [results] = await LabTest.sequelize.query(`
      UPDATE lab_tests 
      SET test_name = ?, test_code = ?, category = ?, price = ?, updatedAt = NOW()
      WHERE id = ?
    `, {
      replacements: [test_name, test_code, category, price || 0, req.params.id]
    });
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Lab test not found' });
    }
    
    // Fetch the updated record
    const [updated] = await LabTest.sequelize.query(`
      SELECT * FROM lab_tests WHERE id = ?
    `, {
      replacements: [req.params.id]
    });
    
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating lab test:', error);
    res.status(500).json({ error: 'Failed to update lab test', details: error.message });
  }
});

// Update lab test with components
router.put('/:id/with-components', async (req, res) => {
  const transaction = await LabTest.sequelize.transaction();
  
  try {
    const { test, components } = req.body;
    
    console.log('Updating lab test id:', req.params.id, 'with data:', JSON.stringify({ test, components }, null, 2));
    
    if (!test) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Test data is required' });
    }
    
    // Use raw SQL to avoid Sequelize model validation issues
    const [updateResult] = await LabTest.sequelize.query(
      `UPDATE lab_tests SET test_name = ?, test_code = ?, category = ?, price = ?, service_id = ?, updated_at = NOW() WHERE id = ?`,
      {
        replacements: [
          test.test_name,
          test.test_code ? test.test_code.toUpperCase() : test.test_code,
          test.category,
          parseFloat(test.price) || 0,
          test.service_id || null,
          req.params.id
        ],
        transaction
      }
    );
    
    if (updateResult.affectedRows === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Lab test not found' });
    }
    
    // Only delete+replace components if we actually have valid ones to insert
    const validPutComponents = Array.isArray(components)
      ? components.filter(c => c.component_name && c.component_name.trim() !== '')
      : [];

    if (validPutComponents.length > 0) {
      await LabTest.sequelize.query(
        `DELETE FROM lab_test_components WHERE lab_test_id = ?`,
        { replacements: [req.params.id], transaction }
      );
      for (let i = 0; i < validPutComponents.length; i++) {
        const component = validPutComponents[i];
        const componentId = require('crypto').randomUUID();
        await LabTest.sequelize.query(
          `INSERT INTO lab_test_components (id, lab_test_id, component_name, unit, reference_range, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          {
            replacements: [
              componentId,
              req.params.id,
              component.component_name.trim(),
              component.unit || '',
              component.reference_range || '',
              component.sort_order !== undefined ? component.sort_order : i
            ],
            transaction
          }
        );
      }
    } else {
      console.log('No valid components provided - preserving existing components for test:', req.params.id);
    }
    
    await transaction.commit();
    
    // Fetch the complete updated lab test with components
    const [updatedTests] = await LabTest.sequelize.query(
      `SELECT * FROM lab_tests WHERE id = ?`,
      { replacements: [req.params.id] }
    );
    const [updatedComponents] = await LabTest.sequelize.query(
      `SELECT * FROM lab_test_components WHERE lab_test_id = ? ORDER BY sort_order ASC`,
      { replacements: [req.params.id] }
    );
    
    const result = updatedTests[0] ? { ...updatedTests[0], components: updatedComponents } : null;
    
    console.log('Lab test updated successfully:', req.params.id);
    res.json(result);
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating lab test with components:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to update lab test with components', details: error.message });
  }
});

// Delete lab test (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    // Use raw SQL to soft delete directly in lab_tests table
    const [results] = await LabTest.sequelize.query(`
      UPDATE lab_tests 
      SET is_active = false, updatedAt = NOW()
      WHERE id = ?
    `, {
      replacements: [req.params.id]
    });
    
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Lab test not found' });
    }
    
    res.json({ message: 'Lab test deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab test:', error);
    res.status(500).json({ error: 'Failed to delete lab test', details: error.message });
  }
});

// Delete lab test with components
router.delete('/:id/with-components', async (req, res) => {
  const transaction = await LabTest.sequelize.transaction();
  
  try {
    // Delete components first
    await LabTestComponent.destroy({
      where: { lab_test_id: req.params.id },
      transaction,
    });
    
    // Soft delete the lab test
    const [updatedRows] = await LabTest.update(
      { is_active: false },
      { where: { id: req.params.id }, transaction }
    );
    
    if (updatedRows === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Lab test not found' });
    }
    
    await transaction.commit();
    res.json({ message: 'Lab test and components deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting lab test with components:', error);
    res.status(500).json({ error: 'Failed to delete lab test with components' });
  }
});

// Add sample lab test data for testing
router.post('/seed', async (req, res) => {
  try {
    // Ensure table exists
    await LabTest.sync();
    
    const sampleTests = [
      {
        test_name: 'Complete Blood Count',
        test_code: 'CBC',
        category: 'Hematology',
        price: 25.00,
        clinic_id: 1
      },
      {
        test_name: 'Lipid Profile',
        test_code: 'LP',
        category: 'Chemistry',
        price: 35.00,
        clinic_id: 1
      },
      {
        test_name: 'Blood Film for Malaria',
        test_code: 'BFFM',
        category: 'Parasitology',
        price: 15.00,
        clinic_id: 1
      }
    ];
    
    for (const test of sampleTests) {
      try {
        await LabTest.sequelize.query(`
          INSERT INTO lab_tests (id, test_name, test_code, category, price, clinic_id, is_active, createdAt, updatedAt)
          VALUES (UUID(), ?, ?, ?, ?, ?, true, NOW(), NOW())
        `, {
          replacements: [test.test_name, test.test_code, test.category, test.price, test.clinic_id]
        });
      } catch (insertError) {
        // Skip if test already exists (duplicate test_code)
        if (!insertError.message.includes('Duplicate entry')) {
          throw insertError;
        }
      }
    }
    
    // Fetch all tests to return
    const [results] = await LabTest.sequelize.query(`
      SELECT * FROM lab_tests WHERE is_active = true ORDER BY test_name ASC
    `);
    
    res.json({ 
      message: 'Sample lab tests seeded successfully', 
      count: results.length,
      tests: results 
    });
  } catch (error) {
    console.error('Error seeding lab tests:', error);
    res.status(500).json({ error: 'Failed to seed lab tests', details: error.message });
  }
});


module.exports = router;
