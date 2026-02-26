const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Receipt = sequelize.define('Receipt', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    receipt_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    bill_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    patient_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    patient_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    payment_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'card', 'check', 'lease', 'insurance'),
      allowNull: false,
      defaultValue: 'cash'
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    paid_services: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of service indexes that were paid for in this receipt'
    },
    service_details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Detailed information about the services paid for'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    from_lease: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    lease_details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cashier_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    cashier_id: {
      type: DataTypes.STRING(36),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'voided', 'refunded'),
      allowNull: false,
      defaultValue: 'active'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'receipts',
    timestamps: false,
    indexes: [
      {
        fields: ['bill_id']
      },
      {
        fields: ['patient_id']
      },
      {
        fields: ['clinic_id']
      },
      {
        fields: ['receipt_number']
      },
      {
        fields: ['payment_date']
      }
    ]
  });

  return Receipt;
};
