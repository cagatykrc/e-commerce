const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');
const Kategorilertab = require('./Kategorilertab');
const Urunler = require('./Urunler');
const Kategoriler = sequelize.define('Kategoriler', {
    category_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    kategori_ad: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    category_low: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    kategori_tab_id: {
        type: DataTypes.INTEGER,  // Veya uygun veri tipini seçebilirsiniz
        allowNull: false,
    },
}, {
    // Modelin ayarlarını belirle
    tableName: 'kategoriler', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
});

Kategoriler.belongsTo(Kategorilertab, { foreignKey: 'kategori_tab_id', as: 'kategoriler_tab'});
Kategorilertab.hasMany(Kategoriler, { foreignKey: 'kategori_tab_id', as: 'kategoriler' , onDelete: 'CASCADE' });
// Category has many Products

module.exports = Kategoriler;