const { DataTypes } = require('sequelize');
const sequelize = require('../utility/database');
const Addresses = require('../models/Addresses')
const Users = sequelize.define('Users', {
    user_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone:{
        type:DataTypes.STRING(11),
        allowNull:true
    },
    address:{
        type:DataTypes.STRING(400),
        allowNull:true
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    // Modelin ayarlarını belirle
    tableName: 'users', // Veritabanında kullanılacak tablo adı
    timestamps: true, // Oluşturma ve güncelleme tarih alanları ekler
});
Addresses.belongsTo(Users,{as:'users', foreignKey:'user_id'});
Users.hasMany(Addresses,{as:'addresses', foreignKey:'user_id'});


module.exports = Users;
