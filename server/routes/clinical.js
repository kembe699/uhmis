const express = require('express');
const router = express.Router();
const { Patient, PatientQueue, Visit, DrugInventory, Prescription, PatientBill, LabTest, sequelize } = require('../models');
const { Op } = require('sequelize');

// Services model - define inline to match actual database table structure
const Service = sequelize.define('Service', {
  id: {
    type: sequelize.Sequelize.STRING(36),
    primaryKey: true,
    defaultValue: sequelize.Sequelize.UUIDV4
  },
  service_name: {
    type: sequelize.Sequelize.STRING(255),
    allowNull: false
  },
  category: {
    type: sequelize.Sequelize.STRING(100),
    allowNull: false
  },
  price: {
    type: sequelize.Sequelize.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  description: {
    type: sequelize.Sequelize.TEXT,
    allowNull: true
  },
  is_active: {
    type: sequelize.Sequelize.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: sequelize.Sequelize.STRING(255),
    allowNull: true
  },
  updated_by: {
    type: sequelize.Sequelize.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'services',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Get patients for clinical (same as patients API but for clinical context)
router.get('/patients/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    const patients = await Patient.findAll({
      where: { clinic_id: parseInt(clinicId) },
      order: [['createdAt', 'DESC']]
    });

    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients for clinical:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get patient queue for clinical
router.get('/queue/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    // Get all queue entries with status waiting or in_progress, joined with patient data
    const queueEntries = await sequelize.query(`
      SELECT 
        pq.*,
        p.first_name,
        p.last_name,
        p.patient_id as patient_doc_id,
        p.date_of_birth,
        TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) as age
      FROM patient_queue pq
      LEFT JOIN patients p ON pq.patient_id = p.id
      WHERE pq.status = 'waiting'
      ORDER BY pq.created_at DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    // Transform to include patient name
    const transformedQueue = queueEntries.map(entry => ({
      ...entry,
      patient_name: entry.first_name && entry.last_name 
        ? `${entry.first_name} ${entry.last_name}`.trim()
        : entry.first_name || entry.last_name || 'Unknown'
    }));

    res.json(transformedQueue);
  } catch (error) {
    console.error('Error fetching patient queue for clinical:', error);
    res.status(500).json({ error: 'Failed to fetch patient queue', details: error.message });
  }
});

// Get visits for clinical
router.get('/visits/:clinicId/:doctorId', async (req, res) => {
  try {
    const { clinicId, doctorId } = req.params;
    
    // Get all visits (no date filter for testing)
    const visits = await sequelize.query(`
      SELECT 
        v.*,
        p.first_name,
        p.last_name,
        p.patient_id as patient_doc_id
      FROM visits v
      LEFT JOIN patients p ON v.patient_id = p.id
      ORDER BY v.visit_date DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    // Transform to include patient name and map fields correctly
    const transformedVisits = visits.map(visit => ({
      ...visit,
      patient_name: visit.first_name && visit.last_name 
        ? `${visit.first_name} ${visit.last_name}`.trim()
        : visit.first_name || visit.last_name || 'Unknown',
      date: visit.visit_date,
      chief_complaints: visit.chief_complaint
    }));

    res.json(transformedVisits);
  } catch (error) {
    console.error('Error fetching visits for clinical:', error);
    res.status(500).json({ error: 'Failed to fetch visits', details: error.message });
  }
});

// Create visit
router.post('/visits', async (req, res) => {
  try {
    const visitData = req.body;
    console.log('Creating visit with data:', visitData);
    console.log('Vitals data received:', visitData.vitals);
    
    const visit = await Visit.create(visitData);
    console.log('Visit created successfully:', visit.id);
    console.log('Visit vitals saved:', visit.vitals);
    
    // Update patient queue status to 'in_progress' if patient came from queue
    // This moves them from Patient Queue to Today's Visits section
    if (visitData.queue_id) {
      try {
        await PatientQueue.update(
          { status: 'in_progress' },
          { where: { id: visitData.queue_id } }
        );
        console.log('Updated queue status to in_progress for queue ID:', visitData.queue_id);
      } catch (queueError) {
        console.error('Error updating queue status:', queueError);
        // Don't fail the visit creation if queue update fails
      }
    }
    
    // Add lab tests to existing patient bill if lab requests exist
    if (visitData.lab_requests && visitData.lab_requests.length > 0) {
      try {
        await addLabTestsToExistingBill(visitData);
      } catch (billError) {
        console.error('Error adding lab tests to bill:', billError);
        // Don't fail visit creation if bill update fails
      }
    }
    
    res.json(visit);
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({ error: 'Failed to create visit' });
  }
});

// Function to add lab tests to existing patient bill
async function addLabTestsToExistingBill(visitData) {
  try {
    const patientId = visitData.patient_id;
    const clinicId = visitData.clinic_id;
    
    console.log('Looking for existing bill for patient:', patientId, 'clinic:', clinicId);
    
    // Find the most recent active bill for this patient
    const existingBill = await PatientBill.findOne({
      where: { 
        patient_id: patientId,
        clinic_id: parseInt(clinicId),
        status: {
          [Op.in]: ['pending', 'partial', 'active']
        }
      },
      order: [['created_at', 'DESC']]
    });
    
    if (existingBill) {
      console.log('Found existing bill:', existingBill.bill_number);
      
      // Fetch lab test prices from the database
      const labTestsWithPrices = await Promise.all(
        visitData.lab_requests.map(async (testName) => {
          try {
            const labTest = await LabTest.findOne({
              where: { test_name: testName }
            });
            
            return {
              serviceName: testName,
              name: testName,
              quantity: 1,
              unitPrice: parseFloat(labTest?.price) || 0,
              totalPrice: parseFloat(labTest?.price) || 0,
              department: 'Laboratory',
              type: 'Lab Test',
              date: new Date().toISOString()
            };
          } catch (error) {
            console.error(`Error fetching price for ${testName}:`, error);
            return {
              serviceName: testName,
              name: testName,
              quantity: 1,
              unitPrice: 0,
              totalPrice: 0,
              department: 'Laboratory',
              type: 'Lab Test',
              date: new Date().toISOString()
            };
          }
        })
      );
      
      // Parse existing services
      let existingServices = [];
      if (existingBill.services) {
        try {
          existingServices = typeof existingBill.services === 'string' 
            ? JSON.parse(existingBill.services) 
            : existingBill.services;
        } catch (error) {
          console.warn('Failed to parse existing services:', error);
          existingServices = [];
        }
      }
      
      // Add new lab tests to existing services
      const updatedServices = [...existingServices, ...labTestsWithPrices];
      
      // Calculate new total amount
      const newLabTestsTotal = labTestsWithPrices.reduce((sum, test) => sum + (test.totalPrice || 0), 0);
      const newTotalAmount = parseFloat(existingBill.total_amount) + newLabTestsTotal;
      const newBalanceAmount = newTotalAmount - parseFloat(existingBill.paid_amount);
      
      // Update the existing bill
      await PatientBill.update({
        services: JSON.stringify(updatedServices),
        total_amount: newTotalAmount,
        balance_amount: newBalanceAmount,
        updated_at: new Date()
      }, {
        where: { id: existingBill.id }
      });
      
      console.log('Successfully added lab tests to existing bill:', existingBill.bill_number);
      console.log('New total amount:', newTotalAmount);
      
    } else {
      console.log('No existing active bill found, would need to create new bill');
      // Optionally create a new bill here if no existing bill is found
    }
    
  } catch (error) {
    console.error('Error in addLabTestsToExistingBill:', error);
    throw error;
  }
}

// Test endpoint to verify routing
router.get('/test', (req, res) => {
  console.log('Test endpoint hit!');
  res.json({ message: 'Clinical API is working' });
});

// Get visit details by ID
router.get('/visit-details/:visitId', async (req, res) => {
  try {
    const { visitId } = req.params;
    console.log('=== VISIT DETAILS API CALLED ===');
    console.log('Fetching visit details for ID:', visitId);
    console.log('Visit model available:', !!Visit);
    
    const visit = await Visit.findByPk(visitId);
    console.log('Raw visit data from database:', JSON.stringify(visit, null, 2));
    
    if (!visit) {
      console.log('Visit not found for ID:', visitId);
      return res.status(404).json({ error: 'Visit not found' });
    }
    
    // Log specific fields we're interested in
    console.log('Visit clinical_notes:', visit.clinical_notes);
    console.log('Visit vitals (raw):', visit.vitals);
    console.log('Visit lab_requests (raw):', visit.lab_requests);
    console.log('Visit diagnosis:', visit.diagnosis);
    console.log('Visit diagnosis_code:', visit.diagnosis_code);
    
    res.json(visit);
  } catch (error) {
    console.error('Error fetching visit details:', error);
    console.error('Full error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch visit details' });
  }
});

// Get lab tests from lab_tests table
router.get('/lab-tests', async (req, res) => {
  try {
    const { LabTest } = require('../models');
    
    const labTests = await LabTest.findAll({
      attributes: ['test_name'],
      order: [['test_name', 'ASC']]
    });
    
    // Extract just the test names for the dropdown
    const testNames = labTests.map(test => test.test_name);
    
    res.json(testNames);
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({ error: 'Failed to fetch lab tests' });
  }
});

// Get pharmacy inventory for clinical prescribing
router.get('/medicines/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    const medicines = await DrugInventory.findAll({
      where: { 
        clinic_id: parseInt(clinicId),
        current_stock: { [Op.gt]: 0 } // Only return medicines with stock > 0
      },
      order: [['drug_name', 'ASC']]
    });

    res.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ error: 'Failed to fetch medicines' });
  }
});

// Get prescriptions by visit ID
router.get('/prescriptions/visit/:visitId', async (req, res) => {
  try {
    const { visitId } = req.params;
    
    const prescriptions = await Prescription.findAll({
      where: { visit_id: visitId },
      order: [['prescribed_at', 'DESC']]
    });
    
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions for visit:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Create prescription
router.post('/prescriptions', async (req, res) => {
  try {
    const prescriptionData = req.body;
    console.log('Creating prescription with data:', prescriptionData);
    
    // Generate UUID for the prescription
    const { v4: uuidv4 } = require('uuid');
    prescriptionData.id = uuidv4();
    
    // Create prescription record in database
    const prescription = await Prescription.create(prescriptionData);
    console.log('Prescription created successfully:', prescription.id);
    
    res.json(prescription);
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// Update patient queue status (e.g., remove from queue when visit is created)
router.put('/queue/:queueId', async (req, res) => {
  try {
    const { queueId } = req.params;
    const { status } = req.body;
    
    const [updatedRows] = await PatientQueue.update(
      { status, updated_at: new Date() },
      { where: { id: queueId } }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ error: 'Queue entry not found' });
    }

    res.json({ message: 'Queue status updated successfully' });
  } catch (error) {
    console.error('Error updating queue status:', error);
    res.status(500).json({ error: 'Failed to update queue status' });
  }
});

// Close visit and update queue status to completed
router.put('/visits/:visitId/close', async (req, res) => {
  try {
    const { visitId } = req.params;
    const { closedBy } = req.body;
    
    // Update visit status to inactive (keeps visit visible in Today's Visits)
    const [updatedRows] = await Visit.update(
      { 
        status: 'inactive',
        closed_at: new Date(),
        closed_by: closedBy
      },
      { where: { id: visitId } }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Get the visit to find associated queue entry
    const visit = await Visit.findByPk(visitId);
    console.log('Found visit for closing:', visit ? visit.id : 'not found');
    console.log('Visit patient_id:', visit ? visit.patient_id : 'no patient_id');
    console.log('Visit queue_id:', visit ? visit.queue_id : 'no queue_id');
    
    if (visit) {
      // Find and update the queue entry for this patient to completed
      try {
        let updatedRows = 0;
        
        // First try using the queue_id if it exists (most reliable)
        if (visit.queue_id) {
          console.log('Updating queue entry by queue_id:', visit.queue_id);
          [updatedRows] = await PatientQueue.update(
            { status: 'completed' },
            { where: { id: visit.queue_id } }
          );
          console.log('Queue update by queue_id result - rows affected:', updatedRows);
        }
        
        // If queue_id update didn't work, try by patient_id
        if (updatedRows === 0 && visit.patient_id) {
          console.log('Trying to update by patient_id:', visit.patient_id);
          
          // First, let's see what queue entries exist for this patient
          const existingQueueEntries = await PatientQueue.findAll({
            where: { patient_id: visit.patient_id }
          });
          console.log('All queue entries for patient:', existingQueueEntries.map(q => ({ id: q.id, status: q.status, patient_id: q.patient_id })));
          
          [updatedRows] = await PatientQueue.update(
            { status: 'completed' },
            { 
              where: { 
                patient_id: visit.patient_id,
                status: { [Op.in]: ['waiting', 'in_progress'] }
              } 
            }
          );
          console.log('Queue update by patient_id result - rows affected:', updatedRows);
        }
        
        // Verify the update by checking the current status
        if (visit.queue_id) {
          const updatedQueueEntry = await PatientQueue.findByPk(visit.queue_id);
          console.log('Queue entry after update:', updatedQueueEntry ? { id: updatedQueueEntry.id, status: updatedQueueEntry.status } : 'not found');
        }
        
      } catch (queueError) {
        console.error('Error updating queue status to completed:', queueError);
      }
    } else {
      console.log('No visit found');
    }

    res.json({ message: 'Visit closed successfully' });
  } catch (error) {
    console.error('Error closing visit:', error);
    res.status(500).json({ error: 'Failed to close visit' });
  }
});

// Delete patient from queue
router.delete('/queue/:queueId', async (req, res) => {
  try {
    const { queueId } = req.params;
    
    const deletedRows = await PatientQueue.destroy({
      where: { id: queueId }
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

// Services CRUD endpoints
// Get services by clinic
router.get('/services/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    // Ensure services table exists
    await Service.sync();
    
    // Since the services table doesn't have clinic_id, return all active services
    const services = await Service.findAll({
      where: { is_active: true },
      order: [['created_at', 'DESC']]
    });

    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Create new service
router.post('/services', async (req, res) => {
  try {
    // Ensure services table exists
    await Service.sync();
    
    const { service_name, category, price, description, created_by } = req.body;
    
    const service = await Service.create({
      service_name,
      category,
      price: parseFloat(price || 0),
      description,
      is_active: true,
      created_by
    });

    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update service
router.put('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { service_name, category, price, description, updated_by } = req.body;
    
    const [updatedRows] = await Service.update({
      service_name,
      category,
      price: parseFloat(price || 0),
      description,
      updated_by
    }, {
      where: { id: id }
    });

    if (updatedRows === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const updatedService = await Service.findByPk(id);
    res.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete service
router.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRows = await Service.destroy({
      where: { id: id }
    });

    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

module.exports = router;
