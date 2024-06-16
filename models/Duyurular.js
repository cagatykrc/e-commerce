const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');
const Duyurular = sequelize.define('Duyurular', {
    duyuru_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    duyuru_baslik: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    duyuru_metin: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    duyuru_renk: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    // Modelin ayarlarını belirle
    tableName: 'duyurular', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
});

module.exports = Duyurular;