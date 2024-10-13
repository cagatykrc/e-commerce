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
require('dotenv').config();
// const limiterTwoRequests = createLimiter(2);
// const limiterDefaultRequests = createLimiter(15);
router.get('/giris', (req, res) => {

  const userS = req.session.user;
  if (userS) {
    return res.redirect('/');
  }

  const notification = req.session.notification;
  if (req.session.notification) {
    // Burada bildirimi HTML'de göster
    res.render('giris', { notification:notification,userS });
    delete req.session.notification; // Bildirimi gösterdikten sonra sil
} else {
    res.render('giris', {userS ,notification:notification}); // Normal render
}
});



router.get('/kayit', (req, res) => {
  const userS = req.session.user;

  if (userS) {
    return res.redirect('/');
  }
  const notification = req.session.notification;
  if (req.session.notification) {
    // Burada bildirimi HTML'de göster
    res.render('kayit', { notification:notification,userS });
    delete req.session.notification; // Bildirimi gösterdikten sonra sil
} else {
    res.render('kayit', {userS ,notification:notification}); // Normal render
}
});


router.post('/kayit', postlimiter, async (req, res) => {
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
    req.session.notification = {title:'Şifreler Uyuşmuyor.',type:'danger'};
    return res.redirect('/auth/kayit')
  }

  if (existingUser) {
    req.session.notification = {title:'Bu kullanıcı adı veya e-posta zaten kullanımda',type:'danger'};
    return res.redirect('/auth/kayit')
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
    req.session.notification = {title:'Başarıyla Kayıt Olundu.',type:'danger'};
    return res.redirect('/auth/giris');
  } catch (error) {
    console.error(error);
    req.session.notification = {title:'Bir Hata Oluştu',type:'danger'};
    return res.redirect('/auth/kayit')
  }
});



const secretKey='123456';




router.post('/giris', postlimiter, async (req, res) => {
  const userS = req.session.user;
  const { emailanduser, password } = req.body; // Token'ı req.body üzerinden al

  try {
    const user = await Users.findOne({
      where: {
        [Op.or]: [
          { email: emailanduser },
          { username: emailanduser }
        ]
      }
    });

    if (!user) {
      req.session.notification = {title:'Eposta bulunamadı',type:'danger'};
      return res.redirect('/auth/giris')
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      req.session.notification = {title:'Hatalı Şifre!',type:'danger'};
      res.redirect('/auth/giris')
      return
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
    }, secretKey, { expiresIn: '1h' }); // Token 1 saat geçerli olacak şekilde ayarlanıyor
    const ipAddress = req.socket.remoteAddress;
    logger.info(user.username + " Adında Giriş Yaptı: " + ipAddress + '  //' + new Date());

    // Token'ı yanıt olarak gönderme
    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return res.redirect('/auth/giris');
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
  logger.info(userS.username + ' ' + 'Çıkış Yaptı' + " " + ipAddress + '  //' + now);
  return res.redirect('/');
});



module.exports = router;
