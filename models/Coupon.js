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
    },
    discount_rate: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true,
    },
    discount_price: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: true,
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    discount_type:{
        type: DataTypes.STRING,
        allowNull: false, 
        defaultValue: true,
    }
}, {
    // Modelin ayarlarını belirle
    tableName: 'coupon', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
});

module.exports = Coupon;