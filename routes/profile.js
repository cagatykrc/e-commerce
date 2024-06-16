const express = require('express');
const router = express.Router();
const Users = require('../models/Users');
const Orders = require('../models/Orders');

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
          }
        ]
      });
  
      res.render('profileOrders', { userS, orders: userOrders.orders });
    } catch (error) {
      console.error('Siparişler alınırken bir hata oluştu:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.get('/adreslerim',(req,res)=>{
    const userS = req.session.user;
    if (!req.session.user) {
      return res.redirect('/auth/giris'); // Kullanıcı oturumu yoksa giriş sayfasına yönlendirin
    }
    res.render('profileAdresses',{userS});

    
  })

  




module.exports = router;
