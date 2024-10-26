const jwt = require('jsonwebtoken');
const express = require('express');
const Users = require('../models/Users');
const router = express.Router();
// const crypto = require('crypto');
// const secretKey = crypto.randomBytes(32).toString('hex');
// const dotenv = require('dotenv');
// const cookieParser = require('cookie-parser');
// require('dotenv').config();
const verifyToken = async(req, res, next) => {
    // const token = req.body.token || req.query.token || req.headers['x-acces-token'];

    const userS = req.session.user;

    if (!userS) {
        return res.render('404', {userS});
    }

    const UserRole = await Users.findOne({
        where:{user_id: userS.id},
        attributes:['role']
    });
    if (UserRole.dataValues.role != 'admin'){
        return res.render('404',{userS})
    }

    // if (!token) {
    //     return res.status(403).json({ error: 'Forbidden - Token not present' });
    // }
    // try {
    //     const decoded  = jwt.verify(token, '22b15b3b483df486d3fe2f2f01f5de51c6ac0e527d34d12b571e1c205ae41fb0');
    //     req.user = user
    // } catch (error) {
    //     console.log(error)
    // }  


return next();
};


module.exports = verifyToken;