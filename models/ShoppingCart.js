const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');

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

module.exports = ShoppingCart;
