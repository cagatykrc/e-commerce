const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');
const Users = require('./Users');
const Urunler = require('./Urunler')
const Orders = require('./Orders')
const OrderItem = sequelize.define('OrderItem', {
    order_item_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    order_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },  
    order_date: {
        type: DataTypes.INTEGER,  // Veya uygun veri tipini seçebilirsiniz
        allowNull: false,
    },
    product_id:{
        type:DataTypes.INTEGER,
        allowNull:true
    },
    quantity:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
    extra_options:{
        type:DataTypes.STRING(20),
        allowNull:true
    },
    height:{
        type: DataTypes.INTEGER(3),
        allowNull: false
    },
    width:{
        type: DataTypes.INTEGER(3),
        allowNull: false
    },

}, {
    // Modelin ayarlarını belirle
    tableName: 'orderItem', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
});

module.exports = OrderItem;