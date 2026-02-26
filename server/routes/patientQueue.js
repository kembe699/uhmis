const express = require('express');
const { PatientQueue, Patient, Visit } = require('../models');
const router = express.Router();

// Get all queue entries for a clinic
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    const queueEntries = await PatientQueue.findAll({
      order: [['created_at', 'DESC']],
    });
    res.json(queueEntries);
  } catch (error) {
    console.error('Error fetching queue entries:', error);
    res.status(500).json({ error: 'Failed to fetch queue entries' });
  }
});

// Get queue entries by status
router.get('/clinic/:clinicId/status/:status', async (req, res) => {
  try {
    const queueEntries = await PatientQueue.findAll({
      where: { status: req.params.status },
      order: [['created_at', 'DESC']],
    });
    res.json(queueEntries);
  } catch (error) {
    console.error('Error fetching queue entries by status:', error);
    res.status(500).json({ error: 'Failed to fetch queue entries' });
  }
});

// Add patient to queue
router.post('/', async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.body.patient_id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Don't create visit here - visit will be created when doctor saves in clinical page
    const queueData = {
      ...req.body,
      visit_id: null,
      queue_type: req.body.queue_type || 'consultation'
    };
    const queueEntry = await PatientQueue.create(queueData);
    res.status(201).json(queueEntry);
  } catch (error) {
    console.error('Error adding patient to queue:', error);
    res.status(500).json({ error: 'Failed to add patient to queue' });
  }
});

// Update queue entry status
router.put('/:id', async (req, res) => {
  try {
    const [updatedRows] = await PatientQueue.update(req.body, {
      where: { id: req.params.id },
    });
    
    if (updatedRows === 0) {
      return res.status(404).json({ error: 'Queue entry not found' });
    }
    
    const updatedEntry = await PatientQueue.findByPk(req.params.id);
    res.json(updatedEntry);
  } catch (error) {
    console.error('Error updating queue entry:', error);
    res.status(500).json({ error: 'Failed to update queue entry' });
  }
});

// Remove patient from queue
router.delete('/:id', async (req, res) => {
  try {
    const deletedRows = await PatientQueue.destroy({
      where: { id: req.params.id },
    });
    
    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Queue entry not found' });
    }
    
    res.json({ message: 'Patient removed from queue successfully' });
  } catch (error) {
    console.error('Error removing patient from queue:', error);
    res.status(500).json({ error: 'Failed to remove patient from queue' });
  }
});

module.exports = router;
