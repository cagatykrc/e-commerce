const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');

const productDesc = sequelize.define('productDesc', {
    productdesc_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    desc_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Temel Ürün Bilgileri
    brand: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    model: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    color: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    material: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dimensions: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    weight: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // Garanti ve Teslimat
    warranty: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    delivery_time: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    shipping_info: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // Ödeme ve İade
    payment_options: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    return_policy: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // Ürün Özellikleri
    features: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    usage_area: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    care_instructions: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    // Öne Çıkan Özellikler (Bullet Points)
    highlight1: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    highlight2: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    highlight3: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    highlight4: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    // Ek Bilgiler
    origin_country: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    certification: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    stock_status: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: 'productdesc',
    timestamps: true,
});

module.exports = productDesc;
