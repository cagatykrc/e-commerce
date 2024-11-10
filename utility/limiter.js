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
const message = 'İstek Sayısını aştınız lütfen daha sonra tekrar deneyiniz.';

// Session'a bildirimi ekleyin
const postlimiter = rateLimit({
  
  windowMs: 15 * 60 * 1000, // 15 Dakika
  max: 5, // 5 tane istek
  legacyHeaders: false, // `X-RateLimit-*` Bölümünü kaldırır.
  handler: (req, res)=>{
    req.session.message = message;
    res.redirect('/');
  }
  
});
  module.exports = postlimiter;
