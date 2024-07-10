const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');
const Yorumlar = require('./Yorumlar');
const Users = require('./Users');
const Kategoriler = require('./Kategoriler')
const productDesc = require('./productDesc');
const OrderItem = require('./OrderItem');
const Urunler = sequelize.define('Urunler', {
    urun_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    slug: {
        type: DataTypes.STRING,
        allowNull:false
    },
    aciklama: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    resim: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    olusturan_user_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    product_price:{
        type: DataTypes.DECIMAL(7,2),
        allowNull: true,
    },
    discount_price:{
        type:DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    product_type:{
        type: DataTypes.STRING,
        allowNull:true,
    },
    urun_basligi: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    category_low:{
        type: DataTypes.INTEGER,
        allowNull:true,
    },
    productdesc_id:{
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    urun_turu: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    // Modelin ayarlarını belirle
    tableName: 'urunler', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
});

OrderItem.belongsTo(Urunler, { as: 'urunler', foreignKey: 'product_id' });
Urunler.hasMany(OrderItem, { as: 'orderItems', foreignKey: 'product_id' });
Urunler.hasMany(Yorumlar, { as: 'yorumlar', foreignKey: 'urun_id', onDelete: 'CASCADE' });
Urunler.belongsTo(productDesc,{as:'productdesc', foreignKey:'productdesc_id'})
Yorumlar.belongsTo(Urunler, { as: 'urunler', foreignKey: 'urun_id' });
Urunler.belongsTo(Users, { foreignKey: 'olusturan_user_id', as: 'olusturanUser' });
Urunler.belongsTo(Kategoriler, {
    foreignKey:'category_low', as:'kategoriler'
});

// Product belongs to Category
Kategoriler.hasMany(Urunler, {
    foreignKey:'category_low', as:'urunler'
});

module.exports = Urunler;
