const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Prescription = sequelize.define('Prescription', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    visit_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    patient_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    patient_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    medication_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    take_instructions: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    frequency: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    duration: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    quantity: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    prescribed_by: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    prescribed_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      defaultValue: 'active',
      allowNull: false
    }
  }, {
    tableName: 'prescriptions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['visit_id']
      },
      {
        fields: ['patient_id']
      },
      {
        fields: ['clinic_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['prescribed_at']
      }
    ]
  });

  return Prescription;
};
