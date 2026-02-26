const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./models');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware - CORS configured for production (allow all origins)
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware - extract user from JWT token
const { authenticateToken } = require('./middleware/auth');
app.use(authenticateToken);

// Import route handlers
const usersRouter = require('./routes/users');
const patientsRouter = require('./routes/patients');
const labTestsRouter = require('./routes/labTests');
const authRouter = require('./routes/auth');
const patientQueueRouter = require('./routes/patientQueue');
const dashboardRouter = require('./routes/dashboard');
const clinicalRouter = require('./routes/clinical');
const pharmacyRouter = require('./routes/pharmacy');
const patientBillsRouter = require('./routes/patientBills');
const clinicsRouter = require('./routes/clinics');
const servicesRouter = require('./routes/services');
const receiptsRouter = require('./routes/receipts');
const visitsRouter = require('./routes/visits');
const reportsRouter = require('./routes/reports');
const ledgerAccountsRouter = require('./routes/ledger-accounts');
const cashierRouter = require('./routes/cashier');
const cashTransfersRouter = require('./routes/cash-transfers');
const suppliersRouter = require('./routes/suppliers');
const purchaseOrdersRouter = require('./routes/purchase-orders');
const dailyExpensesRouter = require('./routes/daily-expenses');

// API routes
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount route handlers
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/lab-tests', labTestsRouter);
// Create separate routers for lab requests and results
const labRequestsRouter = require('./routes/labRequests');
const labResultsRouter = require('./routes/labResults');
app.use('/api/lab-requests', labRequestsRouter);
app.use('/api/lab-results', labResultsRouter);
app.use('/api/patient-queue', patientQueueRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/clinical', clinicalRouter);
app.use('/api/pharmacy', pharmacyRouter);
app.use('/api/patient-bills', patientBillsRouter);
app.use('/api/clinics', clinicsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/visits', visitsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/ledger-accounts', ledgerAccountsRouter);
app.use('/api/cashier', cashierRouter);
app.use('/api/cash-transfers', cashTransfersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/purchase-orders', purchaseOrdersRouter);
app.use('/api/daily-expenses', dailyExpensesRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start the server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 API status: http://localhost:${PORT}/api/status`);
  
  // Initialize database
  const dbInitialized = await initializeDatabase();
  if (dbInitialized) {
    console.log('✅ Database initialized successfully');
  } else {
    console.error('❌ Failed to initialize database');
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
