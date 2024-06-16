const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const secretKey = crypto.randomBytes(32).toString('hex');
// const dotenv = require('dotenv');
// const cookieParser = require('cookie-parser');
// require('dotenv').config();
const verifyToken = (req, res, next) => {
    // const token = req.body.token || req.query.token || req.headers['x-acces-token'];



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