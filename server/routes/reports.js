const express = require('express');
const router = express.Router();
const { Patient, Visit, LabTest, DrugInventory, PharmacyDispensing, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get comprehensive report data
router.get('/', async (req, res) => {
  try {
    const { dateFrom, dateTo, clinic } = req.query;
    
    console.log('Fetching report data:', { dateFrom, dateTo, clinic });
    
    // Build where clause for date filtering
    const dateFilter = {};
    if (dateFrom && dateTo) {
      dateFilter.created_at = {
        [Op.between]: [new Date(dateFrom), new Date(dateTo + 'T23:59:59')]
      };
    }
    
    // Get patient statistics
    const patients = await Patient.findAll({
      where: dateFilter,
      attributes: ['id', 'date_of_birth', 'gender']
    });
    
    // Calculate age-based statistics
    const today = new Date();
    let under5 = 0, over5 = 0;
    let under5Male = 0, under5Female = 0;
    let over5Male = 0, over5Female = 0;
    let totalMale = 0, totalFemale = 0;
    
    patients.forEach(patient => {
      const birthDate = new Date(patient.date_of_birth);
      const age = today.getFullYear() - birthDate.getFullYear();
      const isMale = patient.gender === 'male';
      const isFemale = patient.gender === 'female';
      
      if (age < 5) {
        under5++;
        if (isMale) under5Male++;
        if (isFemale) under5Female++;
      } else {
        over5++;
        if (isMale) over5Male++;
        if (isFemale) over5Female++;
      }
      
      if (isMale) totalMale++;
      if (isFemale) totalFemale++;
    });
    
    // Get visit statistics
    const visits = await Visit.findAll({
      where: dateFilter,
      attributes: ['id', 'chief_complaint']
    });
    
    // Get lab test statistics
    const labTests = await LabTest.count({
      where: dateFilter
    });
    
    // Get pharmacy dispensing statistics
    const dispensedDrugs = await PharmacyDispensing.count({
      where: dateFilter
    });
    
    // Aggregate chief complaints as diagnoses
    const diagnosisMap = new Map();
    visits.forEach(visit => {
      if (visit.chief_complaint) {
        const count = diagnosisMap.get(visit.chief_complaint) || 0;
        diagnosisMap.set(visit.chief_complaint, count + 1);
      }
    });
    
    const diagnoses = Array.from(diagnosisMap.entries())
      .map(([diagnosis, count]) => ({ diagnosis, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Medication statistics
    const medications = await PharmacyDispensing.findAll({
      where: dateFilter,
      attributes: [
        'drug_name',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['drug_name'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 10
    });
    
    const totalDispensed = await PharmacyDispensing.count({ where: dateFilter });
    
    const mostPrescribed = medications.map(med => ({
      medication: med.drug_name,
      count: parseInt(med.get('count')),
      percentage: totalDispensed > 0 ? (parseInt(med.get('count')) / totalDispensed) * 100 : 0
    }));
    
    // Calculate date range for movement analysis
    const daysInPeriod = dateFrom && dateTo 
      ? Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24)) 
      : 30;
    
    const fastMoving = mostPrescribed
      .filter(med => (med.count / daysInPeriod) >= 1)
      .map(med => ({
        medication: med.medication,
        dispensed: med.count,
        daysInPeriod,
        avgPerDay: med.count / daysInPeriod
      }))
      .slice(0, 5);
    
    const leastMoving = mostPrescribed
      .filter(med => (med.count / daysInPeriod) < 1)
      .map(med => ({
        medication: med.medication,
        dispensed: med.count,
        daysInPeriod,
        avgPerDay: med.count / daysInPeriod
      }))
      .slice(0, 5);
    
    const reportData = {
      totalPatients: patients.length,
      under5,
      over5,
      under5Male,
      under5Female,
      over5Male,
      over5Female,
      totalMale,
      totalFemale,
      totalVisits: visits.length,
      labTests,
      dispensedDrugs,
      diagnoses,
      tropicalDiseases: [],
      affectedSystems: [],
      ageGenderBreakdown: [],
      medicationStats: {
        mostPrescribed,
        fastMoving,
        leastMoving,
        totalDispensed
      }
    };
    
    console.log('Report data generated successfully');
    res.json(reportData);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      error: 'Failed to generate report',
      details: error.message 
    });
  }
});

module.exports = router;
