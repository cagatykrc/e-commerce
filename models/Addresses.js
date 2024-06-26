const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');
const Users = require('./Users');
const Addresses = sequelize.define('Addresses', {
    address_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    address_baslik: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    user_id:{
        type: DataTypes.STRING,
        allowNull:false,
    },
    address_first: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address_last: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address_email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address_phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address_country: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address_city: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address_district: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address_content: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    address_tc: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    // Modelin ayarlarını belirle
    tableName: 'addresses', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
});

module.exports = Addresses;
