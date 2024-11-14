const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');
const Users = require('./Users');
const Products = require('./Products')
const OrderItem = require('./OrderItem');

const Orders = sequelize.define('Orders', {
    order_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    order_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    payment_status:{
        type:DataTypes.BOOLEAN,
        allowNull:false
    },
    merchant_oid:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    total_price:{
        type:DataTypes.DECIMAL(10,2),
        allowNull:true
    },
}, {
    // Modelin ayarlarını belirle
    tableName: 'orders', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
}); // Her bir sipariş öğesi bir siparişe bağlıdır
OrderItem.belongsTo(Orders, { as: 'Order', foreignKey: 'order_id' });

Orders.hasMany(OrderItem, { as: 'OrderItems', foreignKey: 'order_id' });
Orders.belongsTo(Users, { as: 'user', foreignKey: 'user_id' });
Users.hasMany(Orders,{as:'orders',foreignKey:'user_id'})

module.exports = Orders;
