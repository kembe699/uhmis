const express = require('express');
const { User } = require('../models');
const router = express.Router();

// Get all users (with optional clinic filter)
router.get('/', async (req, res) => {
  try {
    const { clinic } = req.query;
    const whereClause = { is_active: true };
    
    // If clinic query param is provided, filter by clinic_id
    if (clinic) {
      // Map clinic name to clinic_id
      const clinicMap = {
        'Paloch OBC': 1,
        'Moleeta': 2,
        'Adar': 3,
        'Gumry': 4,
        'Friendship': 5
      };
      whereClause.clinic_id = clinicMap[clinic] || parseInt(clinic);
    }
    
    const users = await User.findAll({
      where: whereClause,
      order: [['display_name', 'ASC']],
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user by email
router.get('/email/:email', async (req, res) => {
  try {
    const user = await User.findOne({
      where: { email: req.params.email },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user by email:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get users by clinic
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    const users = await User.findAll({
      where: { 
        clinic_id: req.params.clinicId,
        is_active: true 
      },
      order: [['display_name', 'ASC']],
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users by clinic:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const bcrypt = require('bcrypt');
    
    // Map clinic name to clinic_id
    const clinicMap = {
      'Paloch OBC': 1,
      'Moleeta': 2,
      'Adar': 3,
      'Gumry': 4,
      'Friendship': 5
    };
    
    const userData = {
      id: uuidv4(),
      email: req.body.email,
      display_name: req.body.displayName,
      role: req.body.role,
      clinic_id: clinicMap[req.body.clinic] || parseInt(req.body.clinic) || 1,
      is_active: req.body.isActive !== undefined ? req.body.isActive : true,
      status: req.body.status || 'active',
      created_by: req.body.createdBy || 'system',
      password_hash: await bcrypt.hash('password123', 10) // Default password
    };
    
    console.log('Creating user with data:', userData);
    
    const user = await User.create(userData);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    // Map clinic name to clinic_id
    const clinicMap = {
      'Paloch OBC': 1,
      'Moleeta': 2,
      'Adar': 3,
      'Gumry': 4,
      'Friendship': 5
    };
    
    // Transform frontend camelCase to database snake_case
    const updateData = {};
    if (req.body.displayName !== undefined) {
      updateData.display_name = req.body.displayName;
    }
    if (req.body.role !== undefined) {
      updateData.role = req.body.role;
    }
    if (req.body.clinic !== undefined) {
      updateData.clinic_id = clinicMap[req.body.clinic] || parseInt(req.body.clinic) || 1;
    }
    if (req.body.isActive !== undefined) {
      updateData.is_active = req.body.isActive;
    }
    if (req.body.status !== undefined) {
      updateData.status = req.body.status;
    }
    if (req.body.updatedBy !== undefined) {
      updateData.updated_by = req.body.updatedBy;
    }
    
    updateData.updated_at = new Date();
    
    console.log('Updating user:', req.params.id, 'with data:', updateData);
    
    const [updatedRows] = await User.update(updateData, {
      where: { id: req.params.id },
    });
    
    if (updatedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updatedUser = await User.findByPk(req.params.id);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

// Delete user (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const [updatedRows] = await User.update(
      { is_active: false },
      { where: { id: req.params.id } }
    );
    
    if (updatedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
