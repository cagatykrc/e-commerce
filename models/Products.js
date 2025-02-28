const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');
const Yorumlar = require('./Yorumlar');
const Users = require('./Users');
const Kategoriler = require('./Kategoriler')
const productDesc = require('./productDesc');
const OrderItem = require('./OrderItem');
const Showcase = require('./Showcase');
const ProductVariant = require('./ProductVariant');

const Products = sequelize.define('products', {
    urun_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    slug: {
        type: DataTypes.STRING,
        allowNull:false,
        unique:true,
    },
    aciklama: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    resim: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    resim2: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    resim3: {
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
    product_color:{
        type: DataTypes.STRING(11),
        allowNull:true,
    },
    urun_basligi: {
        type: DataTypes.STRING,
        allowNull: false,
        unique:true,
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
        type: DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    // Modelin ayarlarını belirle
    tableName: 'products', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
});

Products.hasMany(Showcase, { foreignKey: 'product_id' });
Products.hasMany(OrderItem, { as: 'orderItems', foreignKey: 'urun_id' });
Products.hasMany(Yorumlar, { as: 'yorumlar', foreignKey: 'urun_id', onDelete: 'CASCADE' });
Products.belongsTo(productDesc,{as:'productdesc', foreignKey:'productdesc_id'})
Yorumlar.belongsTo(Products, { as: 'products', foreignKey: 'urun_id' });
Products.belongsTo(Users, { foreignKey: 'olusturan_user_id', as: 'olusturanUser' });
Products.belongsTo(Kategoriler, {
    foreignKey:'category_low', as:'kategoriler'
});

// Product belongs to Category
Kategoriler.hasMany(Products, {
    foreignKey:'category_low', as:'products'
});

Products.hasMany(ProductVariant, { 
    foreignKey: 'urun_id',
    as: 'variants' 
});

module.exports = Products;
