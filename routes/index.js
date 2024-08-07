const express = require('express');
const router = express.Router();
const { Sequelize, Op } = require('sequelize');
const nodemailer = require('nodemailer');
const Urunler = require('../models/Urunler');
const Users = require('../models/Users');
const Coupon = require('../models/Coupon')
const ShoppingCart = require('../models/ShoppingCart');
const Kategoriler = require('../models/Kategoriler');
const Kategorilertab = require('../models/Kategorilertab');
const Duyurular = require('../models/Duyurular');
const Orders = require('../models/Orders');
const OrderItem = require('../models/OrderItem');
const redis = require('redis');

// Redis client oluşturma
const redisClient = redis.createClient({
  host: '127.0.0.1', // veya uygun IP adresi
  port: 6379, // veya uygun port numarası
  retry_strategy: () => 1000, // Bağlantı kesildiğinde 1 saniye sonra yeniden bağlanmaya çalış
});

// Redis client error handling
redisClient.on('error', (err) => {
  console.error('Redis error: ', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('end', () => {
  console.log('Disconnected from Redis');
});

// Redis bağlantısını kontrol etme ve bağlama
const connectRedis = async () => {
  if (!redisClient.connected) {
    try {
      await redisClient.connect();
      console.log('Redis client connected');
    } catch (err) {
      console.error('Redis reconnect error: ', err);
    }
  }
};


// Initial connection to Redis

// Nodemailer transporter


// Routes
router.get('/hakkimizda', (req, res) => {
  res.render('about', { userS: req.session.user });
});
router.get('/cok-sorulan-sorular', (req, res) => {
  res.render('maq', { userS: req.session.user });
});

router.get('/kullanici-sozlesmesi', (req, res) => {
  res.redirect('/sartlar-kosullar');
});
router.get('/sartlar-kosullar', (req, res) => {
  res.render('termsandcondition', { userS: req.session.user });
});
router.get('/gizlilik-politikasi', (req, res) => {
  res.render('privacypolicy', { userS: req.session.user });
});

router.get('/iletisim', (req, res) => {
  res.render('contact', { userS: req.session.user });
});

router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: 'recipient-email@example.com',
    subject: 'İletişim Formu Mesajı',
    text: `Ad: ${name}\nE-posta: ${email}\nMesaj: ${message}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log('E-posta gönderilemedi:', error);
    }
    res.send('Mesajınız başarıyla gönderildi.');
  });
});




// Routes
router.get('/', async (req, res) => {
  const message = req.session.message;
  delete req.session.message;
  const userS = req.session.user;

  try {
    // Redis istemcisinin bağlı olup olmadığını kontrol edin ve bağlayın
    await connectRedis();

    // Cache'ten veri kontrolü
    let productType = await redisClient.get('productType');
    let urunler = await redisClient.get('urunler');
    let newProducts = await redisClient.get('newProducts');
    let duyurular = await redisClient.get('duyurular');
    let kategoriTabs = await redisClient.get('kategoriTabs');
    let kanatperdeProducts = await redisClient.get('kanatperdeProducts');

    // Cache'deki veriler JSON string olarak saklanır, bu yüzden parse işlemi yapılmalı
    if (productType) productType = JSON.parse(productType);
    if (urunler) urunler = JSON.parse(urunler);
    if (newProducts) newProducts = JSON.parse(newProducts);
    if (duyurular) duyurular = JSON.parse(duyurular);
    if (kategoriTabs) kategoriTabs = JSON.parse(kategoriTabs);
    if (kanatperdeProducts) kanatperdeProducts = JSON.parse(kanatperdeProducts);

    // Cache'de veri yoksa veritabanından çek ve cache'e kaydet
    if (!productType) {
      productType = await Kategorilertab.findByPk(1, {
        include: [{ model: Kategoriler, as: 'kategoriler' }]
      });
      await redisClient.set('productType', JSON.stringify(productType), {EX:60*5}); // 1 saat
    }
    
    if (!urunler) {
      urunler = await Urunler.findAll({
        include: [{ model: Kategoriler, as: 'kategoriler' }],
        order:[['createdAt','DESC']],
        limit:12,
      });
      await redisClient.set('urunler', JSON.stringify(urunler), {EX:60*5}); // 1 saat
    }
    
    if (!newProducts) {
      newProducts = await Urunler.findAll({
        include: [{ model: Kategoriler, as: 'kategoriler' }],
        order: [['createdAt', 'DESC']],
        limit: 8
      });
      await redisClient.set('newProducts', JSON.stringify(newProducts), {EX:60*5}); // 1 saat
    }
    
    if (!duyurular) {
      duyurular = await Duyurular.findAll();
      await redisClient.set('duyurular', JSON.stringify(duyurular), {EX:60*5}); // 1 saat
    }
    
    if (!kategoriTabs) {
      kategoriTabs = await Kategorilertab.findAll({
        include: [{ model: Kategoriler, as: 'kategoriler' }],
        order: [[{ model: Kategoriler, as: 'kategoriler' }, 'kategori_ad', 'ASC']]
      });
      await redisClient.set('kategoriTabs', JSON.stringify(kategoriTabs), {EX:60*5}); // 1 saat
    }
    
    if (!kanatperdeProducts) {
      kanatperdeProducts = await Urunler.findAll({
        include: [{ model: Kategoriler, as: 'kategoriler' }],
        where: { '$kategoriler.category_low$': 'kanatperde' },
        order:[['createdAt', 'DESC']],
        limit:8
      });
      await redisClient.set('kanatperdeProducts', JSON.stringify(kanatperdeProducts), {EX:60*5}); // 1 saat
    }
    
    res.render('index', {
      duyurular,
      productType,
      fonproduct: kanatperdeProducts,
      newproducts: newProducts,
      products: urunler,
      userS,
      message
    });
  } catch (error) {
    console.error('Ürün verilerini çekerken bir hata oluştu: ' + error);
    return res.status(500).send('Internal Server Error');
  }
});

// Handle Redis client disconnection on app shutdown
process.on('SIGINT', () => {
  redisClient.quit();
  console.log('Redis client disconnected and app is shutting down');
  process.exit(0);
});



// Ürünler
router.get('/urunler', async (req, res) => {
  const message = req.session.message;
  delete req.session.message;
  const userS = req.session.user;
  let kategoriAd = req.query.kategoriID;

  try {
    let whereClause = {};
    let selectedCategories = [];
    if (kategoriAd) {
      if (typeof kategoriAd === 'string') {
        kategoriAd = [kategoriAd];
      }

      const categories = await Kategoriler.findAll({ where: { category_low: kategoriAd } });
      if (categories.length > 0) {
        const kategoriIDs = categories.map(category => category.dataValues.category_id);
        whereClause = { category_id: { [Sequelize.Op.in]: kategoriIDs } };
        selectedCategories = kategoriAd;
      }
    }

    const productType = await Kategorilertab.findByPk(1, {
      include: [{ model: Kategoriler, as: 'kategoriler' }]
    });
    const products = await Urunler.findAll({
      include: [{
        model: Kategoriler,
        as: 'kategoriler',
        where: whereClause
      }]
    });

    const announcements = await Duyurular.findAll();
    const categoryTabs = await Kategorilertab.findAll({
      include: [{ model: Kategoriler, as: 'kategoriler' }],
      order: [[{ model: Kategoriler, as: 'kategoriler' }, 'kategori_ad', 'ASC']]
    });

    res.render('products', {
      products,
      userS,
      message,
      categoryTabs,
      selectedCategories,
      productType
    });
  } catch (error) {
    console.error('Ürün verilerini çekerken bir hata oluştu: ' + error);
    return res.status(500).send('Internal Server Error');
  }
});

// Sepet
router.get('/sepet', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/giris');
  }
  try {
    const user = req.session.user;
    const userCart = await ShoppingCart.findAll({
      where: { user_id: user.id },
      include: [{
        model: Urunler,
        attributes: ['product_price', 'discount_price', 'resim', 'urun_basligi'],
        include:[{
          model:Kategoriler,
          attributes:['kategori_ad'],
          as:'kategoriler',
        }]
      }]
    });

    let totalCartPrice = 0;
    userCart.forEach(cartItem => {
      const productPrice = parseFloat(cartItem.Urunler.product_price) || 0;
      const width = parseFloat(cartItem.width) || 0;
      const height = parseFloat(cartItem.height) || 0;
      const quantity = parseFloat(cartItem.quantity) || 0;

      // Değerlerin kontrolü için konsol çıktıları
      console.log(`Product Price: ${productPrice}, Width: ${width}, Height: ${height}, Quantity: ${quantity}`);

      if (productPrice > 0 && width > 0 && height > 0 && quantity > 0) {
        const squareMeters = (height * width) / 10000;
        const totalPrice = squareMeters * productPrice * quantity;
        cartItem.total_price = totalPrice;
        totalCartPrice += totalPrice;
      } else {
        console.log(`Invalid values found: ${productPrice}, ${width}, ${height}, ${quantity}`);
      }
    });

    console.log(`Total Cart Price before discount: ${totalCartPrice}`);
    let totalprice = totalCartPrice;
    let discount = 0;
    if (req.session.coupon) {
      const coupon = req.session.coupon;
      const discountRate = parseFloat(coupon.discount_rate) || 0;
      const discountPrice = parseFloat(coupon.discount_price) || 0;

      if (discountRate > 0) {
        // İndirim oranı (discountRate'in yüzde olarak olduğunu varsayıyoruz)
        discount = totalCartPrice * (discountRate / 100);
        console.log(`Discount Rate applied: ${discountRate / 100}`);
      } else if (discountPrice > 0) {
        // Sabit indirim miktarı
        discount = discountPrice;
        console.log(`Discount Price applied: ${discountPrice}`);
      }

      totalCartPrice -= discount;
      console.log(`Discount applied: ${discount}`);
      console.log(`Total Cart Price after discount: ${totalCartPrice}`);
    }

    // Son kontroller
    totalCartPrice = isNaN(totalCartPrice) ? 0 : totalCartPrice;
    discount = isNaN(discount) ? 0 : discount;

    // Değerleri toFixed(2) ile formatlama

    res.render('cart', { userS: req.session.user, userCart,totalprice, totalCartPrice, discount, coupon: req.session.coupon });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});


router.post('/:urunId/sepetekle', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/giris');
  }
  const userS = req.session.user;
  const urunId = req.params.urunId;
  const { width, height } = req.body;
  const quantity = 1;

  try {
    const product = await Urunler.findByPk(urunId, {
      attributes: ['product_price']
    });

    if (!product) {
      return res.status(404).send('Urun bulunamadi');
    }



    await ShoppingCart.create({
      user_id: userS.id,
      quantity,
      urun_id: urunId,
      width,
      height,
    });

    res.redirect('/sepet');
  } catch (error) {
    console.error('Ürun Sepete eklenirken bir hata oluştu: ' + error);
    return res.status(500).send('Internal Server Error');
  }
});

router.post('/:cartid/sepetsil', async (req, res) => {
  const userS = req.session.user;
  const cartId = req.params.cartid;

  try {
    const cartItem = await ShoppingCart.findByPk(cartId);

    if (!cartItem) {
      console.error(`Sepet öğesi ${cartId} bulunamadı.`);
      return res.status(404).json({ success: false, message: 'Sepet öğesi bulunamadı.' });
    }

    if (userS && userS.id === cartItem.user_id) {
      await cartItem.destroy();
      console.log(`Sepet öğesi ${cartId} başarıyla silindi.`);
      return res.json({ success: true, message: 'Sepet öğesi başarıyla silindi.' });
    } else {
      console.error(`Kullanıcı ${userS.id} bu sepet öğesini silme yetkisine sahip değil.`);
      return res.status(403).json({ success: false, message: 'Bu sepet öğesini silme yetkiniz yok.' });
    }
  } catch (error) {
    console.error('Hata:', error);
    return res.status(500).json({ success: false, message: 'Bir hata oluştu.', error: error.message });
  }
});

router.post('/kuponUygula', async (req, res) => {
  const { coupon_code } = req.body;

  try {
      if (req.session.coupon == coupon_code) {
        return res.status(404).json({success:false, message:'Kupon zaten kullanımda'});
      }
      const coupon = await Coupon.findOne({ where: { coupon_code } });

      if (!coupon) {
          return res.status(404).json({ success: false, message: 'Geçersiz kupon kodu.' });
      }

      // Kuponu session'a kaydet
      req.session.coupon = {
          coupon_code: coupon.coupon_code,
          discount_rate: coupon.discount_rate,
          discount_price: coupon.discount_price
      };

      res.json({ success: true, message: 'Kupon başarıyla uygulandı.' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Bir hata oluştu.' });
  }
});

// Sipariş Detayları
router.get('/orders/:orderId', async (req, res) => {
  const orderId = req.params.orderId;
  const userS = req.session.user;
  try {
    const order = await Orders.findByPk(orderId, {
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['first_name', 'last_name'],
        },
        {
          model: OrderItem,
          as: 'OrderItems',
          include: [
            {
              model: Urunler,
              as: 'urunler',
              attributes: ['urun_id','aciklama', 'resim', 'urun_basligi', 'category_low', 'aciklama', 'product_price'],
              include: [{
                model: Kategoriler,
                as: 'kategoriler',
                attributes: ['kategori_ad']
              }]
            }
          ]
        }
      ]
    });
    if (!order) {
      console.log('Sipariş bulunamadı.');
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }

    res.render('ordersDetail', { order, userS });
  } catch (error) {
    console.error('Sipariş detayları alınırken bir hata oluştu:', error);
    return res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
