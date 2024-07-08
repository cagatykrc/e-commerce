const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');

const productDesc = sequelize.define('productDesc', {
    productdesc_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    desc_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    pile_frequency: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    stitching: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    cleaning: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    color: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    dimensions: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    curtain: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    pendant_accessory: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    home_environment: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    office_environment: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    warranty: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    payment_options: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    moisture_resistance: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    product_composition: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    installation_areas: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    delivery_time: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    brand: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    // Modelin ayarlarını belirle
    tableName: 'productdesc', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
}); // Her bir sipariş öğesi bir siparişe bağlıdır


module.exports = productDesc;
