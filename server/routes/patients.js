const express = require('express');
const { Patient } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Get all patients
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.findAll({
      order: [['last_name', 'ASC'], ['first_name', 'ASC']],
    });
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Get patients by clinic
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    // Optimize: Limit to recent patients and select only necessary fields
    const patients = await Patient.findAll({
      where: { clinic_id: req.params.clinicId },
      attributes: ['id', 'patient_id', 'first_name', 'last_name', 'date_of_birth', 'phone_number', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 500 // Limit to recent 500 patients for performance
    });
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients by clinic:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Search patients by name
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const patients = await Patient.findAll({
      where: {
        [Op.or]: [
          { first_name: { [Op.like]: `%${q}%` } },
          { last_name: { [Op.like]: `%${q}%` } },
          { patient_id: { [Op.like]: `%${q}%` } },
        ],
      },
      order: [['last_name', 'ASC'], ['first_name', 'ASC']],
      limit: 50,
    });
    res.json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
});

// Create new patient
router.post('/', async (req, res) => {
  try {
    const patientData = {
      ...req.body,
      registration_date: req.body.registration_date || new Date(),
      // Use default clinic_id if not provided or invalid
      clinic_id: req.body.clinic_id || 6, // Default to General Medicine
      // Make registered_by optional to avoid foreign key issues
      registered_by: req.body.registered_by || null
    };
    
    console.log('Creating patient with data:', JSON.stringify(patientData, null, 2));
    const patient = await Patient.create(patientData);
    console.log('Patient created successfully:', patient.id);
    res.status(201).json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    console.error('Error details:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors.map(e => ({ field: e.path, message: e.message })));
    }
    res.status(500).json({ error: 'Failed to create patient', details: error.message });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const [updatedRows] = await Patient.update(req.body, {
      where: { id: req.params.id },
    });
    
    if (updatedRows === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const updatedPatient = await Patient.findByPk(req.params.id);
    res.json(updatedPatient);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const deletedRows = await Patient.destroy({
      where: { id: req.params.id },
    });
    
    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

module.exports = router;
