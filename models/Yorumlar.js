const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');
const Users = require('./Users');
const Yorumlar = sequelize.define('Yorumlar', {
    yorum_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    dergi_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    kullanici_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    yorum_metni: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    // Modelin ayarlarını belirle
    tableName: 'yorumlar', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
});

Yorumlar.belongsTo(Users, { foreignKey: 'kullanici_id' });
Users.hasMany(Yorumlar, { foreignKey: 'kullanici_id' });
module.exports = Yorumlar;