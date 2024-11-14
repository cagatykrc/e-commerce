const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');
const Urunler = require('./Products');

const Showcase = sequelize.define('Showcase', {
    showcase_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, // Otomatik artış ekleyin
    },
    showcase_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'showcase', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
});

// İlişkileri tanımlayın
module.exports = Showcase;
