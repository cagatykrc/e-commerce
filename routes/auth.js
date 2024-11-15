const express = require('express');
const router = express.Router();
const postlimiter = require('../utility/limiter');
const bcrypt = require('bcryptjs');
const Users = require('../models/Users');
const jwt= require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require('crypto')
const { Sequelize, Op } = require('sequelize');
const logger = require('../utility/logger');
const options = { timeZone: 'Europe/Istanbul' }; // Türkiye saat dilimi
const formattedDate = new Date();
const now = formattedDate.toLocaleString('tr-TR', options);
const validator = require('../utility/validator');
require('dotenv').config();
// const limiterTwoRequests = createLimiter(2);
// const limiterDefaultRequests = createLimiter(15);
router.get('/giris', (req, res) => {
  const userS = req.session.user;

  if (userS) {
    return res.redirect('/');
  }

  // Bildirimi kontrol et, varsa göster ve sil

  // Eğer bir bildirim varsa, mesajı göster ve hemen sil

    // Bildirim yoksa normal render yap
    return res.render('giris', { userS, pagemessage: null });
});




router.get('/kayit', (req, res) => {
  const userS = req.session.user;

  if (userS) {
    return res.redirect('/');
  }

    res.render('kayit', { userS, pagemessage: null }); // Normal render


});


router.post('/kayit',validator.validateSignUp, postlimiter, async (req, res) => {
  const { username, firstName, lastName, email, password, verifypassword } = req.body;
  const userS = req.session.user;

  const existingUser = await Users.findOne({
    where: {
      [Op.or]: [
        { email: email }
      ]
    }
  });

  if (verifypassword !== password) {
    let pagemessage = {title:'Şifre doğrulaması yanlış.',type:'danger'};
    return res.render('kayit', { userS, pagemessage: pagemessage});
  }

  if (existingUser) {
    let pagemessage = {title:'Bu kullanıcı adı veya e-posta zaten kullanımda',type:'danger'};
    return res.render('kayit', { userS, pagemessage: pagemessage });
  }

  try {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);

    if (!salt) {
      throw new Error('Salt oluşturulamadı.');
    }

    const hashedPassword = await bcrypt.hash(password, salt);

const newUser = await Users.create({
  user_id: crypto.randomUUID(), // Doğru şekilde fonksiyon çağrısını yapmalısınız
  username,
  email,
  password: hashedPassword,
  first_name: firstName,
  last_name: lastName,
  role: 'user'
});



    const ipAddress = req.socket.remoteAddress;
    logger.info(username + " Adında " + 'Kayıt Oluşturuldu: ' + ipAddress + '  //' + now);
    let pagemessage = {title:'Başarıyla Kayıt Olundu.',type:'success'};
    return res.redirect('/auth/giris', pagemessage);
  } catch (error) {
    console.error(error);
    req.session.notification = {title:'Bir Hata Oluştu',type:'danger'};
    return res.redirect('/auth/kayit')
  }
});



const secretKey='123456';




router.post('/giris',validator.validateSignIn, postlimiter, async (req, res) => {
  const userS = req.session.user;
  const { email, password } = req.body;

  try {
    const user = await Users.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { username: email }
        ]
      }
    });

    if (!user) {
      let pagemessage = { title: 'Kullandığınız e-posta bulunamadı.', type: 'danger' };
      return res.render('giris', { userS, pagemessage: pagemessage });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      let pagemessage = { title: 'Kullandığınız şifre hatalı.', type: 'danger' };
      return res.render('giris', { userS, pagemessage: pagemessage });
    }

    req.session.user = {
      id: user.user_id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    };

    // JWT token oluşturma
    const token = jwt.sign({
      id: user.user_id,
      username: user.username,
      firstName: user.first_name,
      role: user.role
    }, secretKey, { expiresIn: '1h' });

    const ipAddress = req.socket.remoteAddress;
    logger.info(req.session.user.id + " ID'si ile Giriş Yaptı: " + ipAddress + '  //' + new Date());

    // Başarılı girişten sonra yönlendirme yap
    return res.redirect('/');
  } catch (error) {
    console.error(error);
    req.session.pagemessage = { title: 'Bir hata oluştu, lütfen tekrar deneyin.', type: 'danger' };
    return res.render('giris', { userS, pagemessage: req.session.pagemessage });
  }
});


  
  
router.post('/cikis', (req, res) => {
  const userS = req.session.user;

  if (!userS) {
    req.session.notification = {title:'Çıkış yapıldı',type:'success'};
    return res.redirect('/')
  }

  req.session.destroy();
  // res.clearCookie('token'); // Token cookie'sini temizle
  const ipAddress = req.socket.remoteAddress;
  logger.info(userS.id + ' ' + 'Çıkış Yaptı' + " " + ipAddress + '  //' + now);
  return res.redirect('/');
});



module.exports = router;
