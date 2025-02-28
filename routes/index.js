const express = require('express');
const router = express.Router();
const { Sequelize, Op } = require('sequelize');
const nodemailer = require('nodemailer');
const Users = require('../models/Users');
const Coupon = require('../models/Coupon')
const ShoppingCart = require('../models/ShoppingCart');
const Kategoriler = require('../models/Kategoriler');
const Kategorilertab = require('../models/Kategorilertab');
const Duyurular = require('../models/Duyurular');
const Orders = require('../models/Orders');
const OrderItem = require('../models/OrderItem');
const Showcase = require('../models/Showcase');
const redis = require('redis');
const calculateTotalPrice = require('../utility/priceCalc'); 
const Products = require('../models/Products');
const verifyToken = require('../utility/verifyToken');
const ProductVariant = require('../models/ProductVariant');

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
    
    const products = await Products.findAll({
      include: [{ model: Kategoriler, as: 'kategoriler' }],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });
    
    const newProducts = await Products.findAll({
      include: [{ model: Kategoriler, as: 'kategoriler' }],
      order: [['createdAt', 'DESC']],
      limit: 8
    });

    const duyurular = await Duyurular.findAll();
    
    const kategoriTabs = await Kategorilertab.findAll({
      include: [{ model: Kategoriler, as: 'kategoriler' }],
      order: [[{ model: Kategoriler, as: 'kategoriler' }, 'kategori_ad', 'ASC']]
    });
    const highlightprod = await Products.findAll({
      include: [{
        model: Showcase,
        required: true,
        where: { showcase_name: 'onecikanlar' } // Showcase modelinin alanı burada kullanılır
      }]
    });
    
  
    
    

    const kanatperdeProducts = await Products.findAll({
      include: [{ model: Kategoriler, as: 'kategoriler' }],
      where: { '$kategoriler.category_low$': 'fonperde' },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // İndirim yüzdesini basit bir şekilde hesapla
    const calculateDiscountPercentage = (product_price, discountPrice) => {
      // Fiyat geçerli değilse 0 döner
      if (discountPrice <= product_price) return 0; // İndirim yoksa 0 döner
      return Math.floor(((discountPrice - product_price) / discountPrice) * 100); // Yüzde tam sayı olarak
    };
    const highlightprodWithDiscounts = highlightprod.map(product=>({
      ...product.toJSON(), // Sequelize nesnesini düzleştir
      discountPercentage: calculateDiscountPercentage(product.product_price, product.discount_price)
    }));
    const productsWithDiscounts = products.map(product => ({
      ...product.toJSON(), // Sequelize nesnesini düzleştir
      discountPercentage: calculateDiscountPercentage(product.product_price, product.discount_price)
    }));
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
        highlightprod: highlightprodWithDiscounts,
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
      highlightprod: highlightprodWithDiscounts,
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

    // Sıralama işlemi
    const sort = req.query.sort || 'newest'; // Varsayılan sıralama
    const orderOptions = [];
    if (sort === 'price_asc') {
      orderOptions.push(['product_price', 'ASC']);
    } else if (sort === 'price_desc') {
      orderOptions.push(['product_price', 'DESC']);
    } else if (sort === 'discount') {
      orderOptions.push([Sequelize.literal('discount_price IS NOT NULL'), 'DESC']); // İndirimli ürünleri öne al
    } else {
      orderOptions.push(['createdAt', 'DESC']); // Varsayılan olarak en yeni
    }

    const products = await Products.findAll({
      include: [{
        model: Kategoriler,
        as: 'kategoriler',
        where: whereClause
      }],
      order: orderOptions
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
router.get('/sepet', verifyToken, async (req, res) => {
  const userS = req.session.user;
  try {
    if (!userS) {
      return res.redirect('/giris');
    }

    const cartItems = await ShoppingCart.findAll({
      where: { user_id: req.session.user.id },
      include: [{
        model: Products,
        as: 'product',
        include: [{
          model: Kategoriler,
          as: 'productCategory',
          attributes: ['kategori_ad']
        }]
      }]
    });

    // Toplam fiyat hesaplama
    let rawprice = cartItems.reduce((total, item) => {
      const itemPrice = item.product.discount_price || item.product.product_price;
      return total + (itemPrice * item.quantity);
    }, 0);

    let withoutkdv = rawprice * 0.08;
    let totalCartPrice = rawprice + withoutkdv;
    let discount = 0;

    if (req.session.appliedCoupon) {
      const coupon = req.session.appliedCoupon;
      if (coupon.type === 'percentage') {
        discount = (totalCartPrice * coupon.value) / 100;
      } else {
        discount = parseFloat(coupon.value);
      }
      totalCartPrice -= discount;
    }

    const notification = req.session.notification;
    delete req.session.notification;

    res.render('cart', {
      userS,
      cartItems,
      rawprice: parseFloat(rawprice).toFixed(2),
      withoutkdv: parseFloat(withoutkdv).toFixed(2),
      totalCartPrice: parseFloat(totalCartPrice).toFixed(2),
      discount: parseFloat(discount).toFixed(2),
      appliedCoupon: req.session.appliedCoupon,
      notification
    });

  } catch (error) {
    console.error('Sepet görüntüleme hatası:', error);
    req.session.notification = {
      type: 'error',
      message: 'Sepet görüntülenirken bir hata oluştu'
    };
    res.redirect('/');
  }
});





router.post('/:urunId/sepetekle', verifyToken, async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/giris');
    }

    const userS = req.session.user;
    const urunId = req.params.urunId;
    const quantity = parseInt(req.body.quantity) || 1;
    const selectedColor = req.body.selected_color;
    const selectedMaterial = req.body.selected_material;

    try {
        const product = await Products.findByPk(urunId, {
            include: [{
                model: ProductVariant,
                as: 'variants',
                where: {
                    variant_id: {
                        [Op.in]: [selectedColor, selectedMaterial].filter(Boolean)
                    }
                },
                required: false
            }]
        });

        if (!product) {
            return res.status(404).send('Ürün bulunamadı');
        }

        // Varyant fiyatlarını hesapla
        let additionalPrice = 0;
        if (product.variants) {
            additionalPrice = product.variants.reduce((sum, variant) => 
                sum + (parseFloat(variant.additional_price) || 0), 0);
        }

        // Toplam fiyat hesaplama
        const basePrice = product.discount_price || product.product_price;
        const total_price = (basePrice + additionalPrice) * quantity;

        // Sepete ekle
        await ShoppingCart.create({
            user_id: userS.id,
            quantity,
            urun_id: urunId,
            total_price: parseFloat(total_price),
            selected_variants: JSON.stringify({
                color: selectedColor,
                material: selectedMaterial
            })
        });

        req.session.notification = {
            type: 'success',
            message: 'Ürün sepete eklendi'
        };

        res.redirect('/sepet');
    } catch (error) {
        console.error('Ürün Sepete eklenirken bir hata oluştu:', error);
        req.session.notification = {
            type: 'error',
            message: 'Ürün sepete eklenirken bir hata oluştu'
        };
        return res.redirect('/urun/' + urunId);
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

router.post('/kuponUygula', verifyToken, async (req, res) => {
    try {
        const userS = req.session.user;
        const { coupon_code } = req.body;

        if (!userS) {
            return res.status(401).json({
                success: false,
                message: 'Lütfen önce giriş yapın'
            });
        }

        // Kupon kodunu büyük harfe çevir ve boşlukları temizle
        const upperCouponCode = coupon_code.trim().toUpperCase().replace(/\s+/g, '');

        // Boş kupon kodu kontrolü
        if (!upperCouponCode) {
            return res.status(400).json({
                success: false,
                message: 'Kupon kodu boş olamaz'
            });
        }

        // Aktif ve süresi dolmamış kuponu bul
        const coupon = await Coupon.findOne({
            where: {
                coupon_code: upperCouponCode,
                active: true,
                expiry_date: {
                    [Op.gt]: new Date() // Şu anki tarihten büyük olanları seç
                }
            }
        });

        if (!coupon) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz veya süresi dolmuş kupon kodu'
            });
        }

        // Sepetteki toplam tutarı hesapla
        const cart = await ShoppingCart.findAll({
            where: { user_id: userS.id },
            include: [{
                model: Products,
                as: 'product'
            }]
        });

        const cartTotal = cart.reduce((total, item) => {
            const itemPrice = item.product.discount_price || item.product.product_price;
            return total + (itemPrice * item.quantity);
        }, 0);

        // İndirim hesapla
        let discountAmount = 0;
        if (coupon.discount_type === 'percentage') {
            discountAmount = (cartTotal * coupon.discount_value) / 100;
        } else {
            discountAmount = parseFloat(coupon.discount_value);
        }

        // Session'a kuponu kaydet
        req.session.appliedCoupon = {
            code: coupon.coupon_code,
            type: coupon.discount_type,
            value: coupon.discount_value,
            discountAmount
        };

        // Kullanım sayısını artır
        await coupon.increment('usage_count');

        return res.json({
            success: true,
            message: 'Kupon başarıyla uygulandı',
            discountAmount
        });

    } catch (error) {
        console.error('Kupon uygulama hatası:', error);
        return res.status(500).json({
            success: false,
            message: 'Kupon uygulanırken bir hata oluştu'
        });
    }
});

// Kupon kaldırma route'u ekleyelim
router.post('/kuponKaldir', verifyToken, async (req, res) => {
    if (req.session.appliedCoupon) {
        delete req.session.appliedCoupon;
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: 'Uygulanmış kupon bulunamadı' });
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
              model: Products,
              as: 'products',
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
