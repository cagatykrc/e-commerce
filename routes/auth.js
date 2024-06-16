const express = require('express');
const router = express.Router();
const postlimiter = require('../utility/limiter');
const bcrypt = require('bcryptjs');
const Users = require('../models/Users');
const jwt= require('jsonwebtoken');
const dotenv = require('dotenv');
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

  res.render('giris', { userS });
});



router.get('/kayit', (req, res) => {
  const userS = req.session.user;

  if (userS) {
    return res.redirect('/');
  }

  res.render('kayit', { userS });
});


router.post('/kayit', postlimiter, async (req, res) => {
  const { username, firstName, lastName, email, password, verifypassword } = req.body;
  const userS = req.session.user;

  const existingUser = await Users.findOne({
    where: {
      [Op.or]: [
        { username: username },
        { email: email }
      ]
    }
  });

  if (verifypassword !== password) {
    return res.render('kayit',  {userS, message: 'Şifreler Uyuşmuyor.', messagecolor: '#FF0000'});
  }

  if (existingUser) {
    return res.render('kayit',  {userS, message: 'Bu kullanıcı adı veya e-posta zaten kullanımda', messagecolor: '#FF0000'});
  }

  try {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);

    if (!salt) {
      throw new Error('Salt oluşturulamadı.');
    }

    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await Users.create({
      user_id: crypto.randomUUID,
      username,
      email,
      password: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      role: 'user'
    });


    const ipAddress = req.socket.remoteAddress;
    logger.info(username + " Adında " + 'Kayıt Oluşturuldu: ' + ipAddress + '  //' + now);
    res.redirect('/auth/giris');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Bir hata oluştu.' });
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
      return res.render('giris', { userS, message: 'Eposta bulunamadı', messagecolor: '#FF0000' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.render('giris', { userS, message: 'Hatalı Şifre!', messagecolor: '#FF0000' });
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
      return res.redirect('/');
  }

  req.session.destroy();
  // res.clearCookie('token'); // Token cookie'sini temizle
  const ipAddress = req.socket.remoteAddress;
  logger.info(userS.username + ' ' + 'Çıkış Yaptı' + " " + ipAddress + '  //' + now);
  return res.redirect('/');
});



module.exports = router;
