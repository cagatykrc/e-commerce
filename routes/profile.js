const express = require('express');
const router = express.Router();
const Users = require('../models/Users');
const Orders = require('../models/Orders');
const Addresses = require('../models/Addresses');
const axios = require('axios')

router.get('/',async(req,res)=>{
  const userS = req.session.user;
  if (!req.session.user) {
    return res.redirect('/auth/giris'); // Kullanıcı oturumu yoksa giriş sayfasına yönlendirin
  }
  try {
      const usersDetail = await Users.findAll({
          where:{
              user_id:userS.id,
          },
          raw:true
      })
      console.log(usersDetail)
      res.render('profileDetails',{userS, user:usersDetail[0]});
  } catch (error) {
      console.log(error)
  }

  })


  router.get('/siparislerim', async (req, res) => {
    const userS = req.session.user;
    
    if (!userS) {
      return res.redirect('/auth/giris'); // Kullanıcı oturumu yoksa giriş sayfasına yönlendirin
    }
    
    try {
      const userOrders = await Users.findByPk(userS.id, {
        include: [
          {
            model: Orders,
            as: 'orders',
            order: [['createdAt', 'DESC']]
          }
        ]
      });
  
      res.render('profileOrders', { userS, orders: userOrders.orders });
    } catch (error) {
      console.error('Siparişler alınırken bir hata oluştu:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  router.get('/adreslerim',async(req,res)=>{
    const userS = req.session.user;
    if (!req.session.user) {
      return res.redirect('/auth/giris'); // Kullanıcı oturumu yoksa giriş sayfasına yönlendirin
    }
    const addresses = await Addresses.findAll({
      where:{
        user_id: userS.id
      }
    })
    res.render('profileAddresses',{userS, addresses});
    try {
      const response = await axios.get('https://restcountries.com/v3.1/all');
      const countries = response.data.map(country => ({
          name: country.name.common,
          code: country.cca2
      }));
      console.log(countries);
  } catch (error) {
      console.error(error);
      res.status(500).send('Ülke bilgileri alınamadı.');
  }

    
  })

  




module.exports = router;
