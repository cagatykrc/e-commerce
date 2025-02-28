const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');

const Coupon = sequelize.define('Coupon', {
    coupon_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    coupon_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Kupon kodları benzersiz olmalı
    },
    discount_type: {
        type: DataTypes.ENUM('percentage', 'fixed_amount'),
        allowNull: false,
    },
    discount_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    expiry_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    usage_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    max_usage: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
}, {
    // Modelin ayarlarını belirle
    tableName: 'coupons', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
});

module.exports = Coupon;