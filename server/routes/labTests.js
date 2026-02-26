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
    
    const labTests = await LabTest.findAll({
      where: {
        test_name: {
          [require('sequelize').Op.like]: `%${q}%`
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
    
    res.json(labTests);
  } catch (error) {
    console.error('Error searching lab tests:', error);
    res.status(500).json({ error: 'Failed to search lab tests' });
  }
});

// Get lab tests by clinic
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    const labTests = await LabTest.findAll({
      where: { 
        clinic_id: req.params.clinicId,
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

// Get lab test by code
router.get('/code/:code', async (req, res) => {
  try {
    const labTest = await LabTest.findOne({
      where: { test_code: req.params.code },
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
  
  try {
    const { test, components } = req.body;
    
    console.log('Creating lab test with data:', JSON.stringify({ test, components }, null, 2));
    
    // Validate required fields
    if (!test.test_name) {
      return res.status(400).json({ error: 'test_name is required' });
    }
    if (!test.test_code) {
      return res.status(400).json({ error: 'test_code is required' });
    }
    if (!test.category) {
      return res.status(400).json({ error: 'category is required' });
    }
    if (!test.clinic_id) {
      return res.status(400).json({ error: 'clinic_id is required' });
    }
    
    // Ensure price is properly formatted for database
    if (test.price) {
      test.price = parseFloat(test.price);
    }
    
    // Ensure service_id is properly formatted for database
    if (test.service_id) {
      test.service_id = parseInt(test.service_id);
    }
    
    // Ensure clinic_id is properly formatted
    if (test.clinic_id) {
      test.clinic_id = parseInt(test.clinic_id);
    }
    
    // Add default values for required fields
    const testData = {
      ...test,
      is_active: true,
      created_by: test.created_by || 'System'
    };
    
    // Check if test_code already exists
    const existingTest = await LabTest.findOne({
      where: { test_code: test.test_code }
    });
    
    if (existingTest) {
      // If test exists, update it instead of creating new one
      console.log('Test code exists, updating existing test:', existingTest.id);
      
      // Update the existing test
      await LabTest.update(testData, {
        where: { id: existingTest.id },
        transaction
      });
      
      // Delete existing components
      await LabTestComponent.destroy({
        where: { lab_test_id: existingTest.id },
        transaction
      });
      
      // Create new components if provided
      if (components && components.length > 0) {
        const componentsWithTestId = components.map((component, index) => ({
          ...component,
          lab_test_id: existingTest.id,
          sort_order: component.sort_order !== undefined ? component.sort_order : index
        }));
        
        await LabTestComponent.bulkCreate(componentsWithTestId, { transaction });
      }
      
      await transaction.commit();
      
      // Fetch the updated lab test with components
      const updatedLabTest = await LabTest.findByPk(existingTest.id, {
        include: [{
          model: LabTestComponent,
          as: 'components',
          order: [['sort_order', 'ASC']],
        }],
      });
      
      console.log('Lab test updated successfully:', updatedLabTest.id);
      return res.status(200).json(updatedLabTest);
    }
    
    console.log('Processed test data:', JSON.stringify(testData, null, 2));
    
    // Create the lab test
    const labTest = await LabTest.create(testData, { transaction });
    
    // Create components if provided
    if (components && components.length > 0) {
      const componentsWithTestId = components.map((component, index) => ({
        ...component,
        lab_test_id: labTest.id,
        sort_order: component.sort_order !== undefined ? component.sort_order : index
      }));
      
      console.log('Creating components:', JSON.stringify(componentsWithTestId, null, 2));
      
      await LabTestComponent.bulkCreate(componentsWithTestId, { transaction });
    }
    
    await transaction.commit();
    
    // Fetch the complete lab test with components
    const completeLabTest = await LabTest.findByPk(labTest.id, {
      include: [{
        model: LabTestComponent,
        as: 'components',
        order: [['sort_order', 'ASC']],
      }],
    });
    
    console.log('Lab test created successfully:', completeLabTest.id);
    res.status(201).json(completeLabTest);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating lab test with components:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create lab test with components';
    if (error.name === 'SequelizeValidationError') {
      errorMessage = 'Validation error: ' + error.errors.map(e => e.message).join(', ');
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = 'Test code already exists. Please use a unique test code.';
    }
    
    res.status(500).json({ error: errorMessage, details: error.message });
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
    
    // Update the lab test
    const [updatedRows] = await LabTest.update(test, {
      where: { id: req.params.id },
      transaction,
    });
    
    if (updatedRows === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Lab test not found' });
    }
    
    // Delete existing components
    await LabTestComponent.destroy({
      where: { lab_test_id: req.params.id },
      transaction,
    });
    
    // Create new components if provided
    if (components && components.length > 0) {
      const componentsWithTestId = components.map(component => ({
        ...component,
        lab_test_id: req.params.id,
      }));
      
      await LabTestComponent.bulkCreate(componentsWithTestId, { transaction });
    }
    
    await transaction.commit();
    
    // Fetch the complete updated lab test
    const updatedLabTest = await LabTest.findByPk(req.params.id, {
      include: [{
        model: LabTestComponent,
        as: 'components',
        order: [['sort_order', 'ASC']],
      }],
    });
    
    res.json(updatedLabTest);
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating lab test with components:', error);
    res.status(500).json({ error: 'Failed to update lab test with components' });
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
