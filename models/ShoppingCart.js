const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');
const Users = require('./Users');
const Products = require('./Products')
const ShoppingCart = sequelize.define('ShoppingCart', {
    cart_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },  
    quantity: {
        type: DataTypes.INTEGER,  // Veya uygun veri tipini seçebilirsiniz
        allowNull: false,
    },
    urun_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    width: {
        type: DataTypes.INTEGER(3),  // Veya uygun veri tipini seçebilirsiniz
        allowNull: false,
    },
    height:{
        type: DataTypes.INTEGER(3),  // Veya uygun veri tipini seçebilirsiniz
        allowNull: false,
    },
}, {
    // Modelin ayarlarını belirle
    tableName: 'shoppingcart', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
});
ShoppingCart.belongsTo(Users,{foreignKey:'user_id', sourceKey:'user_id'})
Users.hasMany(ShoppingCart,{foreignKey: 'user_id',sourceKey:'user_id'})

ShoppingCart.belongsTo(Products, { foreignKey: 'urun_id' });

Products.hasMany(ShoppingCart, { foreignKey: 'urun_id' });

module.exports = ShoppingCart;
