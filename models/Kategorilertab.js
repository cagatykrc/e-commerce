const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');
const Kategoriler = require('./Kategoriler');
const Kategorilertab = sequelize.define('Kategorilertab', {
    kategori_tab_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    kategori_tab_ad: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    // Modelin ayarlarını belirle
    tableName: 'kategoriler_tab', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
});

module.exports = Kategorilertab;