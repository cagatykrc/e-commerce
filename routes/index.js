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
router.get('/sss', (req, res) => {
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
  const userS = req.session.user;
  const notification = req.session.notification;


  try {
    // Veritabanından verileri çek
    const productType = await Kategorilertab.findByPk(1, {
      include: [{ model: Kategoriler, as: 'kategoriler' }]
    });
    
    const urunler = await Urunler.findAll({
      include: [{ model: Kategoriler, as: 'kategoriler' }],
      order: [['createdAt', 'DESC']],
      limit: 12,
    });
    
    const newProducts = await Urunler.findAll({
      include: [{ model: Kategoriler, as: 'kategoriler' }],
      order: [['createdAt', 'DESC']],
      limit: 8
    });

    const duyurular = await Duyurular.findAll();
    
    const kategoriTabs = await Kategorilertab.findAll({
      include: [{ model: Kategoriler, as: 'kategoriler' }],
      order: [[{ model: Kategoriler, as: 'kategoriler' }, 'kategori_ad', 'ASC']]
    });

    const kanatperdeProducts = await Urunler.findAll({
      include: [{ model: Kategoriler, as: 'kategoriler' }],
      where: { '$kategoriler.category_low$': 'kanatperde' },
      order: [['createdAt', 'DESC']],
      limit: 8
    });

    // İndirim yüzdesini basit bir şekilde hesapla
    const calculateDiscountPercentage = (product_price, discountPrice) => {
      // Fiyat geçerli değilse 0 döner
      if (discountPrice <= product_price) return 0; // İndirim yoksa 0 döner
      return Math.floor(((discountPrice - product_price) / discountPrice) * 100); // Yüzde tam sayı olarak
    };

    const productsWithDiscounts = urunler.map(product => ({
      ...product.toJSON(), // Sequelize nesnesini düzleştir
      discountPercentage: calculateDiscountPercentage(product.product_price, product.discount_price)
    }));
    console.log(productsWithDiscounts);
    const newProductsWithDiscounts = newProducts.map(product => ({
      ...product.toJSON(),
      discountPercentage: calculateDiscountPercentage(product.product_price, product.discount_price)
    }));

    const kanatperdeProductsWithDiscounts = kanatperdeProducts.map(product => ({
      ...product.toJSON(),
      discountPercentage: calculateDiscountPercentage(product.product_price, product.discount_price)
    }));
    if (req.session.notification) {
      // Burada bildirimi HTML'de göster
      res.render('index', {
        duyurular,
        productType,
        fonproduct: kanatperdeProductsWithDiscounts,
        newproducts: newProductsWithDiscounts,
        products: productsWithDiscounts,
        userS,
        notification:notification
      });
      delete req.session.notification; // Bildirimi gösterdikten sonra sil
  } else {
    res.render('index', {
      duyurular,
      productType,
      fonproduct: kanatperdeProductsWithDiscounts,
      newproducts: newProductsWithDiscounts,
      products: productsWithDiscounts,
      userS,
      notification:notification
    }); // Normal render
    delete req.session.notification;
  }

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
  const notification = req.session.notification;
  req.session.notification = null;
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
    let withoutkdv = 0;
    let kdvprice = 0;
    if (req.session.coupon) {
      const coupon = req.session.coupon;
      const discountRate = parseFloat(coupon.discount_rate);
      const discountPrice = parseFloat(coupon.discount_price);
      console.log(discountRate, discountPrice);
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
    kdvprice = totalCartPrice*(1+8/100).toFixed(2)
    withoutkdv = kdvprice -totalCartPrice
    totalCartPrice = kdvprice
    totalCartPrice = isNaN(totalCartPrice) ? 0 : totalCartPrice;
    discount = isNaN(discount) ? 0 : discount;
    
    console.log(`kdvprice: ${kdvprice}`);
    console.log(discount);

    // Değerleri toFixed(2) ile formatlama

    res.render('cart', { userS: req.session.user, userCart,totalprice, totalCartPrice, discount,kdvprice,withoutkdv,notification:notification, coupon: req.session.coupon });
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
        console.log('zatenvarmk');
        req.session.notification = {title:'Kupon zaten kullanımda.',type:'danger'};
        return res.redirect('/sepet');
      }
      const coupon = await Coupon.findOne({ where: { coupon_code } });

      if (!coupon) {
        req.session.notification = {title:'Geçersiz kupon kodu.',type:'danger'};
        return res.redirect('/sepet');
      }

      // Kuponu session'a kaydet
      req.session.coupon = {
          coupon_code: coupon.coupon_code,
          discount_rate: coupon.discount_rate,
          discount_price: coupon.discount_price
      };

      req.session.notification = {title:'Kupon başarıyla uygulandı.',type:'success'};
      return res.redirect('/sepet');
  } catch (error) {
      console.error(error);
      req.session.notification = {title:'Bir hata oluştu.',type:'danger'};

  }
});

// Sipariş Detayları
router.get('/siparisler/:orderId', async (req, res) => {
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
