const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');
const Yorumlar = require('./Yorumlar');
const Users = require('./Users');
const Kategoriler = require('./Kategoriler')
const Orders = require('./Orders');
const OrderItem = require('./OrderItem');
const Urunler = sequelize.define('Urunler', {
    urun_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
    urun_basligi: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    category_low:{
        type: DataTypes.INTEGER,
        allowNull:true,
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
Yorumlar.belongsTo(Urunler, { as: 'urunler', foreignKey: 'urun_id' });
Urunler.belongsTo(Users, { foreignKey: 'olusturan_user_id', as: 'olusturanUser' });
Urunler.belongsTo(Kategoriler, {
    foreignKey:'category_low', as:'kategoriler'
});

// Product belongs to Category
Kategoriler.hasMany(Urunler, {
    foreignKey:'category_low', as:'urunler'
});
const getUrunById = async (dergiId) => {
    try {
        const dergi = await Urunler.findByPk(dergiId);
        return dergi;
    } catch (error) {
        console.error('Ürüm bilgisi alınırken bir hata oluştu: ' + error);
        throw error;
    }
};

module.exports = Urunler;
