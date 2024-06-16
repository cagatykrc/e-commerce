const rateLimit = require('express-rate-limit');
const express = require('express');
const router = express.Router();

// const createLimiter = (maxRequests) => {
//     return rateLimit({
//       windowMs:   15 * 1000,
//       max: maxRequests,
//       message: 'Too many requests from this IP, please try again later.'
//     });
//   };
// Bildirimi oluştur
const message = 'İstek Sayısını aştınız lütfen biraz bekleyiniz.';

// Session'a bildirimi ekleyin
const postlimiter = rateLimit({
  
  windowMs: 1 * 60 * 1000,
  max: 3,
  handler: (req, res)=>{
    req.session.message = message;
    res.redirect('/');
  }
});
  module.exports = postlimiter;
