const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');

const ProductVariant = sequelize.define('ProductVariant', {
    variant_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    urun_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    variant_type: {
        type: DataTypes.ENUM('color', 'material', 'style'),
        allowNull: false
    },
    variant_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    variant_value: {
        type: DataTypes.STRING,
        allowNull: false
    },
    additional_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    }
}, {
    tableName: 'product_variants',
    timestamps: true
});

module.exports = ProductVariant; 