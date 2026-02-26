const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'universal_hmis',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

// Define User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  display_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'doctor', 'lab', 'pharmacy', 'reception', 'reports'),
    allowNull: false,
  },
  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'inactive'),
    defaultValue: 'pending',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

// Define Patient model
const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patient_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: false,
  },
  phone_number: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.TEXT,
  },
  next_of_kin_name: {
    type: DataTypes.STRING,
  },
  next_of_kin_phone: {
    type: DataTypes.STRING,
  },
  insurance_type: {
    type: DataTypes.STRING,
  },
  insurance_number: {
    type: DataTypes.STRING,
  },
  registration_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  registered_by: {
    type: DataTypes.UUID,
  },
}, {
  tableName: 'patients',
  timestamps: true,
  underscored: true,
});

// Define LabTest model
const LabTest = sequelize.define('LabTest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  test_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  test_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  service_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'lab_tests',
  timestamps: true,
  underscored: true,
});

// Define LabTestComponent model
const LabTestComponent = sequelize.define('LabTestComponent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  lab_test_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  component_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  unit: {
    type: DataTypes.STRING,
  },
  reference_range: {
    type: DataTypes.STRING,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'lab_test_components',
  timestamps: true,
  underscored: true,
});

// Import Visit model
const VisitModel = require('./Visit');
const Visit = VisitModel(sequelize);

// Import Receipt model
const ReceiptModel = require('./Receipt');
const Receipt = ReceiptModel(sequelize);

// Define PatientQueue model
const PatientQueue = sequelize.define('PatientQueue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patient_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  visit_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  queue_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'waiting',
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'normal',
  },
  assigned_to: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'patient_queue',
  timestamps: true,
  underscored: true,
});

// Import model definitions that exist
const DrClinicModel = require('./drClinics');
const ServiceModel = require('./Service');
const DrugInventoryModel = require('./DrugInventory');
const PharmacyDispensingModel = require('./PharmacyDispensing');
const PrescriptionModel = require('./Prescription');
const LedgerAccountModel = require('./LedgerAccount');
const CashierShiftModel = require('./CashierShift');
const CashTransferModel = require('./CashTransfer');
const SupplierModel = require('./Supplier');
const PurchaseOrderModel = require('./PurchaseOrder');
const DailyExpenseModel = require('./DailyExpense');

// Initialize DrClinic model
const DrClinic = DrClinicModel(sequelize);

// Initialize Service model
const Service = ServiceModel(sequelize);

// Initialize Pharmacy models
const DrugInventory = DrugInventoryModel(sequelize);
const PharmacyDispensing = PharmacyDispensingModel(sequelize);
const Prescription = PrescriptionModel(sequelize);

// Initialize Accounting models
const LedgerAccount = LedgerAccountModel(sequelize);
const CashierShift = CashierShiftModel(sequelize);
const CashTransfer = CashTransferModel(sequelize);

// Initialize Procurement models
const Supplier = SupplierModel(sequelize);
const PurchaseOrder = PurchaseOrderModel(sequelize);
const DailyExpense = DailyExpenseModel(sequelize);

// Define associations
LabTest.hasMany(LabTestComponent, { foreignKey: 'lab_test_id', as: 'components' });
LabTestComponent.belongsTo(LabTest, { foreignKey: 'lab_test_id', as: 'labTest' });

// Patient Queue associations
PatientQueue.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// Initialize database
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models with database - disable alter to avoid foreign key issues
    await sequelize.sync({ force: false, alter: false });
    
    // Manually add password_hash column if it doesn't exist
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT ''
      `);
      console.log('Added password_hash column to users table');
    } catch (error) {
      if (error.original?.code === 'ER_DUP_FIELDNAME') {
        console.log('password_hash column already exists');
      } else {
        console.log('Note: Could not add password_hash column (may already exist)');
      }
    }

    // Ensure lab_tests table has the correct structure
    try {
      // Check if lab_tests table exists and get its structure
      const [tables] = await sequelize.query("SHOW TABLES LIKE 'lab_tests'");
      
      if (tables.length === 0) {
        console.log('Creating lab_tests table...');
        await sequelize.query(`
          CREATE TABLE lab_tests (
            id VARCHAR(36) PRIMARY KEY,
            test_name VARCHAR(255) NOT NULL,
            test_code VARCHAR(50) NOT NULL UNIQUE,
            category VARCHAR(100) NOT NULL,
            price DECIMAL(10, 2) NULL,
            service_id INT NULL,
            clinic_id INT NOT NULL,
            created_by VARCHAR(255) NULL,
            is_active BOOLEAN DEFAULT TRUE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        console.log('Created lab_tests table with all required columns');
      } else {
        // Check if price and service_id columns exist
        const [columns] = await sequelize.query("SHOW COLUMNS FROM lab_tests");
        const columnNames = columns.map(col => col.Field);
        
        if (!columnNames.includes('price')) {
          await sequelize.query("ALTER TABLE lab_tests ADD COLUMN price DECIMAL(10, 2) NULL");
          console.log('Added price column to lab_tests table');
        }
        
        if (!columnNames.includes('service_id')) {
          await sequelize.query("ALTER TABLE lab_tests ADD COLUMN service_id INT NULL");
          console.log('Added service_id column to lab_tests table');
        }
        
        if (!columnNames.includes('created_by')) {
          await sequelize.query("ALTER TABLE lab_tests ADD COLUMN created_by VARCHAR(255) NULL");
          console.log('Added created_by column to lab_tests table');
        }
        
        if (columnNames.includes('price') && columnNames.includes('service_id') && columnNames.includes('created_by')) {
          console.log('lab_tests table already has all required columns');
        }
      }
    } catch (error) {
      console.log('Note: Could not ensure lab_tests table structure:', error.message);
    }

    // Clean up and recreate lab_test_components table with proper structure
    try {
      console.log('Cleaning up lab_test_components table...');
      
      // Drop the table if it exists to clean up duplicate columns
      await sequelize.query("DROP TABLE IF EXISTS lab_test_components");
      console.log('Dropped existing lab_test_components table');
      
      // Create the table with the correct structure
      await sequelize.query(`
        CREATE TABLE lab_test_components (
          id VARCHAR(36) PRIMARY KEY,
          lab_test_id VARCHAR(36) NOT NULL,
          component_name VARCHAR(255) NOT NULL,
          unit VARCHAR(50),
          reference_range VARCHAR(255),
          sort_order INT DEFAULT 0,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_lab_test_id (lab_test_id)
        )
      `);
      console.log('Created clean lab_test_components table with correct structure');
    } catch (error) {
      console.log('Note: Could not recreate lab_test_components table:', error.message);
    }
    // Ensure patient_bills table exists and remove foreign key constraints
    try {
      const [tables] = await sequelize.query("SHOW TABLES LIKE 'patient_bills'");
      
      if (tables.length === 0) {
        console.log('Creating patient_bills table...');
        await sequelize.query(`
          CREATE TABLE patient_bills (
            id VARCHAR(36) PRIMARY KEY,
            bill_number VARCHAR(255) NOT NULL UNIQUE,
            patient_id VARCHAR(255) NOT NULL,
            patient_name VARCHAR(255) NOT NULL,
            clinic_id INT NOT NULL,
            total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            balance_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            status ENUM('pending', 'partial', 'paid', 'overdue') DEFAULT 'pending',
            bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            due_date TIMESTAMP NULL,
            services JSON NULL,
            notes TEXT NULL,
            created_by VARCHAR(255) NOT NULL,
            updated_by VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        console.log('Created patient_bills table successfully');
      } else {
        console.log('patient_bills table already exists');
        
        // Remove foreign key constraint if it exists
        try {
          console.log('Checking for foreign key constraints on patient_bills table...');
          const [constraints] = await sequelize.query(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'patient_bills' 
            AND REFERENCED_TABLE_NAME IS NOT NULL
          `);
          
          for (const constraint of constraints) {
            console.log(`Dropping foreign key constraint: ${constraint.CONSTRAINT_NAME}`);
            await sequelize.query(`ALTER TABLE patient_bills DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`);
            console.log(`Successfully dropped foreign key constraint: ${constraint.CONSTRAINT_NAME}`);
          }
          
          if (constraints.length === 0) {
            console.log('No foreign key constraints found on patient_bills table');
          }
        } catch (error) {
          console.log('Note: Could not remove foreign key constraints:', error.message);
        }
      }
    } catch (error) {
      console.log('Note: Could not ensure patient_bills table:', error.message);
    }

    // Ensure services table exists with correct structure
    try {
      console.log('Checking services table structure...');
      
      // Create services table if it doesn't exist (preserves existing data)
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS services (
          id VARCHAR(36) PRIMARY KEY,
          service_name VARCHAR(255) NOT NULL UNIQUE,
          category VARCHAR(100) NOT NULL,
          price DECIMAL(10, 2) DEFAULT 0.00,
          description TEXT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_by VARCHAR(255) NULL,
          updated_by VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_category (category),
          INDEX idx_is_active (is_active)
        )
      `);
      console.log('Services table verified/created');
      
    } catch (error) {
      console.log('Note: Could not ensure services table:', error.message);
    }

    // Ensure dr_clinics table exists
    try {
      const [tables] = await sequelize.query("SHOW TABLES LIKE 'dr_clinics'");
      
      if (tables.length === 0) {
        console.log('Creating dr_clinics table...');
        await sequelize.query(`
          CREATE TABLE dr_clinics (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT NULL,
            department VARCHAR(100) NOT NULL,
            services JSON NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_by VARCHAR(255) NULL,
            updated_by VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_department (department),
            INDEX idx_is_active (is_active)
          )
        `);
        console.log('Created dr_clinics table successfully');
      } else {
        console.log('dr_clinics table already exists');
        
        // Migrate services column to service column
        try {
          // Check if services column exists
          const [columns] = await sequelize.query("SHOW COLUMNS FROM dr_clinics LIKE 'services'");
          if (columns.length > 0) {
            console.log('Migrating services column to service...');
            // Add new service column
            await sequelize.query("ALTER TABLE dr_clinics ADD COLUMN service VARCHAR(255) NULL");
            // Copy data from services to service (take first element if array)
            await sequelize.query(`
              UPDATE dr_clinics 
              SET service = CASE 
                WHEN JSON_LENGTH(services) > 0 THEN JSON_UNQUOTE(JSON_EXTRACT(services, '$[0]'))
                ELSE NULL 
              END
              WHERE services IS NOT NULL
            `);
            // Drop old services column
            await sequelize.query("ALTER TABLE dr_clinics DROP COLUMN services");
            console.log('Successfully migrated services to service column');
          }
        } catch (migrationError) {
          console.log('Note: Migration already completed or error:', migrationError.message);
        }
      }
    } catch (error) {
      console.log('Note: Could not ensure dr_clinics table:', error.message);
    }

    // Ensure pharmacy tables exist
    try {
      console.log('Checking pharmacy tables...');
      
      // Create drug_inventory table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS drug_inventory (
          id VARCHAR(36) PRIMARY KEY,
          drug_name VARCHAR(255) NOT NULL,
          unit_of_measure VARCHAR(100),
          quantity_received INT NOT NULL DEFAULT 0,
          current_stock INT NOT NULL DEFAULT 0,
          expiry_date DATE NOT NULL,
          batch_number VARCHAR(50),
          reorder_level INT NOT NULL DEFAULT 10,
          clinic_id INT NOT NULL,
          date_received DATE NOT NULL,
          received_by VARCHAR(36) NOT NULL,
          unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00
        )
      `);
      console.log('Created/verified drug_inventory table');
      
      // Create pharmacy_dispensing table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS pharmacy_dispensing (
          id VARCHAR(36) PRIMARY KEY,
          drug_id VARCHAR(36) NOT NULL,
          drug_name VARCHAR(255) NOT NULL,
          patient_id VARCHAR(255),
          patient_name VARCHAR(255) NOT NULL,
          visit_id VARCHAR(36),
          quantity INT NOT NULL,
          unit_of_measure VARCHAR(50),
          prescribed_by VARCHAR(255),
          dispensed_by VARCHAR(255) NOT NULL,
          clinic_id INT NOT NULL,
          dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('Created/verified pharmacy_dispensing table');
      
      // Create prescriptions table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS prescriptions (
          id VARCHAR(36) PRIMARY KEY,
          patient_id VARCHAR(255) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          visit_id VARCHAR(36),
          prescribed_by VARCHAR(255) NOT NULL,
          clinic_id INT NOT NULL,
          medications JSON NOT NULL,
          status ENUM('active', 'dispensed', 'cancelled') DEFAULT 'active',
          prescribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('Created/verified prescriptions table');
      
    } catch (error) {
      console.log('Note: Could not ensure pharmacy tables:', error.message);
    }

    // Ensure visits table exists
    try {
      console.log('Checking visits table...');
      
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS visits (
          id VARCHAR(36) PRIMARY KEY,
          patient_id VARCHAR(255) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          doctor_id VARCHAR(36) NOT NULL,
          doctor_name VARCHAR(255) NOT NULL,
          clinic_id INT NOT NULL,
          date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          chief_complaint TEXT,
          clinical_notes TEXT,
          vitals JSON,
          lab_requests JSON,
          diagnosis TEXT,
          diagnosis_code VARCHAR(50),
          prescription JSON,
          status ENUM('active', 'inactive') DEFAULT 'active',
          queue_id VARCHAR(36),
          closed_at TIMESTAMP NULL,
          closed_by VARCHAR(255),
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('Created/verified visits table');
      
    } catch (error) {
      console.log('Note: Could not ensure visits table:', error.message);
    }

    // Ensure receipts table exists
    try {
      console.log('Checking receipts table...');
      
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS receipts (
          id VARCHAR(36) PRIMARY KEY,
          receipt_number VARCHAR(50) NOT NULL UNIQUE,
          bill_id VARCHAR(36) NOT NULL,
          patient_id VARCHAR(255) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          clinic_id INT NOT NULL,
          payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          payment_method ENUM('cash', 'card', 'check', 'lease', 'insurance') NOT NULL DEFAULT 'cash',
          payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          paid_services JSON,
          service_details JSON,
          notes TEXT,
          from_lease BOOLEAN NOT NULL DEFAULT FALSE,
          lease_details TEXT,
          cashier_name VARCHAR(255),
          cashier_id VARCHAR(36),
          status ENUM('active', 'voided', 'refunded') NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('Created/verified receipts table');
      
    } catch (error) {
      console.log('Note: Could not ensure receipts table:', error.message);
    }

    // Create lab_requests table
    try {
      console.log('Creating lab_requests table...');
      
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS lab_requests (
          id VARCHAR(36) PRIMARY KEY,
          patient_id VARCHAR(255) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          clinic_id INT NOT NULL,
          test_id VARCHAR(36) NOT NULL,
          test_name VARCHAR(255) NOT NULL,
          test_code VARCHAR(50) NOT NULL,
          requested_by VARCHAR(255) NOT NULL,
          requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          priority ENUM('normal', 'urgent', 'stat') DEFAULT 'normal',
          status ENUM('pending', 'collected', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
          notes TEXT,
          visit_id VARCHAR(36),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_patient_id (patient_id),
          INDEX idx_clinic_id (clinic_id),
          INDEX idx_status (status),
          INDEX idx_requested_at (requested_at)
        )
      `);
      console.log('Created/verified lab_requests table');
      
    } catch (error) {
      console.log('Note: Could not ensure lab_requests table:', error.message);
    }

    // Create lab_results table
    try {
      console.log('Creating lab_results table...');
      
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS lab_results (
          id VARCHAR(36) PRIMARY KEY,
          request_id VARCHAR(36) NOT NULL,
          patient_id VARCHAR(255) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          clinic_id INT NOT NULL,
          test_id VARCHAR(36) NOT NULL,
          test_name VARCHAR(255) NOT NULL,
          test_code VARCHAR(50) NOT NULL,
          results JSON NOT NULL,
          reference_ranges JSON,
          abnormal_flags JSON,
          status ENUM('preliminary', 'final', 'corrected', 'cancelled') DEFAULT 'preliminary',
          performed_by VARCHAR(255) NOT NULL,
          performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          verified_by VARCHAR(255),
          verified_at TIMESTAMP NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_request_id (request_id),
          INDEX idx_patient_id (patient_id),
          INDEX idx_clinic_id (clinic_id),
          INDEX idx_status (status),
          INDEX idx_performed_at (performed_at)
        )
      `);
      console.log('Created/verified lab_results table');
      
    } catch (error) {
      console.log('Note: Could not ensure lab_results table:', error.message);
    }

    console.log('Database models synchronized.');
    
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

// Define PatientBill model
const PatientBill = sequelize.define('PatientBill', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  bill_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  patient_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  patient_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  paid_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  balance_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.ENUM('pending', 'partial', 'paid', 'overdue', 'active'),
    defaultValue: 'pending',
  },
  bill_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  services: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  updated_by: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'patient_bills',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// PatientBill associations - Removed foreign key constraint to prevent 500 errors
// PatientBill.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

module.exports = {
  sequelize,
  User,
  Patient,
  LabTest,
  LabTestComponent,
  Visit,
  Receipt,
  PatientQueue,
  PatientBill,
  DrClinic,
  Service,
  DrugInventory,
  PharmacyDispensing,
  Prescription,
  LedgerAccount,
  CashierShift,
  CashTransfer,
  Supplier,
  PurchaseOrder,
  DailyExpense,
  initializeDatabase
};
