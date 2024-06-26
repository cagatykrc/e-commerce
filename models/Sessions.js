const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');


const Sessions = sequelize.define('Sessions', {
    expires:{
        type:DataTypes.DATE,
        allowNull:false
    }
}, {
    // Modelin ayarlarını belirle
    tableName: 'Sessions', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
}); // Her bir sipariş öğesi bir siparişe bağlıdır

module.exports = Sessions;
