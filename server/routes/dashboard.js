const express = require('express');
const router = express.Router();
const { Patient, PatientQueue, sequelize } = require('../models');

// Get dashboard statistics for a clinic
router.get('/stats/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total Patients
    const totalPatients = await Patient.count({
      where: { clinic_id: parseInt(clinicId) }
    });

    // Today's Registrations
    const todayRegistrations = await Patient.count({
      where: {
        clinic_id: parseInt(clinicId),
        created_at: {
          [sequelize.Sequelize.Op.gte]: today,
          [sequelize.Sequelize.Op.lt]: tomorrow
        }
      }
    });

    // Queue Patients (waiting or in_progress)
    const queuePatients = await PatientQueue.count({
      where: {
        status: {
          [sequelize.Sequelize.Op.in]: ['waiting', 'in_progress']
        }
      }
    });

    // For now, set these to 0 since we don't have the tables yet
    // TODO: Implement when visits, lab_tests, and inventory tables are created
    const todayVisits = 0;
    const pendingLabTests = 0;
    const completedLabTests = 0;
    const lowStockAlerts = 0;

    const stats = {
      totalPatients,
      todayPatients: todayRegistrations,
      todayVisits,
      pendingLabTests,
      completedLabTests,
      lowStockItems: lowStockAlerts,
      queuePatients
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;
