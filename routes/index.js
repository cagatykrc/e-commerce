const express = require('express');
const router = express.Router();
const Urunler = require('../models/Urunler');
const Users = require('../models/Users')
const ShoppingCart = require('../models/ShoppingCart')
const Kategoriler = require('../models/Kategoriler');
const Kategorilertab = require('../models/Kategorilertab');
const verifyToken = require('../utility/verifyToken');
const nodemailer = require('nodemailer');
const Duyurular = require('../models/Duyurular');
const { Sequelize, Op } = require('sequelize');
const Orders = require('../models/Orders');
const OrderItem = require('../models/OrderItem');
// Ana sayfa

router.get('/hakkimizda', (req, res) =>{
    const notif = ''
    res.render('hakkimizda', { userS: req.session.user });
});




router.get('/urunler', async (req, res) => {
  const message = req.session.message;
  delete req.session.message;
  const userS = req.session.user;
  let kategoriAd = req.query.kategoriID; // Kategori adı sorgu parametresi olarak gelecek

  try {
    let whereClause = {}; // whereClause'u burada tanımlayın

    // To handle single or multiple category filters
    let selectedCategories = [];
    if (kategoriAd) {
      if (typeof kategoriAd === 'string') {
        kategoriAd = [kategoriAd];
      }
      console.log("Kategori Adları:", kategoriAd);

      const categories = await Kategoriler.findAll({ where: { category_low: kategoriAd } });
      console.log("Bulunan Kategoriler:", categories);

      if (categories.length > 0) {
        const kategoriIDs = categories.map(category => category.dataValues.category_id);
        console.log("Kategori ID'leri:", kategoriIDs);
        whereClause = { category_id: { [Sequelize.Op.in]: kategoriIDs } };
        selectedCategories = kategoriAd; // Assign selected categories
      }
    }

    const products = await Urunler.findAll({
      include: [{
        model: Kategoriler,
        as: 'kategoriler',
        where: whereClause // whereClause'u include içinde kullanın
      }]
    });

    const announcements = await Duyurular.findAll();

    const categoryTabs = await Kategorilertab.findAll({
      include: [{
        model: Kategoriler,
        as: 'kategoriler'
      }],
      order: [
        [{ model: Kategoriler, as: 'kategoriler' }, 'kategori_ad', 'ASC']
      ]
    });
    console.log(categoryTabs)

    res.render('products', {
      products,
      userS,
      message,
      categoryTabs,
      selectedCategories // Pass selected categories to template
    });
  } catch (error) {
    console.error('Ürün verilerini çekerken bir hata oluştu: ' + error);
    return res.status(500).send('Internal Server Error');
  }
});





const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'nazimkogce@gmail.com', // E-posta adresinizi buraya girin
      pass: 'your-password' // E-posta şifrenizi buraya girin
    }
  });


router.get('/iletisim', (req, res) =>{
    const notif = ''
    res.render('iletisim', { userS: req.session.user });
});

router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  // E-posta gönderilecek ayarlar
  const mailOptions = {
    from: 'your-email@gmail.com', // Gönderen e-posta adresi
    to: 'recipient-email@example.com', // Alıcı e-posta adresi
    subject: 'İletişim Formu Mesajı',
    text: `Ad: ${name}\nE-posta: ${email}\nMesaj: ${message}`
  };

  // E-posta gönderme işlemi
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log('E-posta gönderilemedi:', error);
    }
  
    res.send('Mesajınız başarıyla gönderildi.');
  });
});




router.get('/', async (req, res) => {
    const message = req.session.message;
    delete req.session.message;
    const userS = req.session.user;
    const kategoritabID = req.body;
    try {
        const urunler = await Urunler.findAll({
          include:[{
            model:Kategoriler,
            as:'kategoriler'
          }]
        });
        const duyurular = await Duyurular.findAll();
        const kategoriTabs = await Kategorilertab.findAll({
            include: [{
                model: Kategoriler,
                as: 'kategoriler'
            }],
            order: [

                [{ model: Kategoriler, as: 'kategoriler' }, 'kategori_ad', 'ASC']
        
              ]
        });
        // const kategorilers = await Kategoriler.findAll({
        //     where: {
        //         kategori_tab_id: kategoritabID,
        //     },
        //     include: [{
        //         model: Kategorilertab,
        //     }]
        // });
        res.render('index', { duyurular, products:urunler, userS,message, categoryTabs: kategoriTabs});
    } catch (error) {
        console.error('Ürün verilerini çekerken bir hata oluştu: ' + error);
        return res.status(500).send('Internal Server Error');
    }
});

router.get('/sepet', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/giris'); // Kullanıcı oturumu yoksa giriş sayfasına yönlendirin
  }
  try {
    const user = req.session.user;

    // Kullanıcının alışveriş sepeti ve ilgili ürün bilgilerini çek
    const userCart = await ShoppingCart.findAll({
      where: { user_id: user.id }, // Kullanıcının tüm sepetleri
      include: [{
        model: Urunler, // Ürün modeli
        attributes: ['product_price', 'resim', 'urun_basligi'] // Gerekli ürün bilgilerini seç
      }]
    });

    let totalCartPrice = 0;
    userCart.forEach(cartItem => {
      const productPrice = parseFloat(cartItem.total_price);
      const total = productPrice;
      console.log(productPrice, cartItem.total_price);
      cartItem.totalPrice = total; // Her bir shopping cart için totalPrice alanı oluştur
      totalCartPrice += total;
    });
    res.render('cart', { userS: req.session.user, userCart, totalCartPrice: totalCartPrice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:urunId/sepetekle', async(req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/giris'); // Kullanıcı oturumu yoksa giriş sayfasına yönlendirin
  }
  const userS = req.session.user;
  const urunId = req.params.urunId;
  const { width, height } = req.body; // total_price input formdan alınmıyor, yeniden hesaplanıyor
  const quantity = 1;

  try {
    const product = await Urunler.findByPk(urunId, {
      attributes: ['product_price']
    });

    if (!product) {
      return res.status(404).send('Urun bulunamadi');
    }

    const productPrice = parseFloat(product.product_price);
    const squareMeters = (height * width) / 10000; // Metrekare hesaplaması: cm^2'den m^2'ye çevirme
    const total_price = squareMeters * productPrice;

    await ShoppingCart.create({
      user_id: userS.id,
      quantity: quantity,
      urun_id: urunId,
      width: width,
      height: height,
      total_price: total_price,
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
      await cartItem.destroy(); // Sepet öğesini sil
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

router.get('/orders/:orderId', async (req, res) => {
  const orderId = req.params.orderId;
  const userS = req.session.user
  try {
    // Sipariş bilgilerini ve ilgili kullanıcı adını getir
    const order = await Orders.findByPk(orderId, {
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['first_name', 'last_name'],
        },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Urunler,
              as: 'urunler',
              attributes: ['urun_id','resim','urun_basligi','category_low', 'aciklama', 'product_price'],
              include:[{
                model: Kategoriler,
                as:'kategoriler',
                attributes:['kategori_ad']
              }]
            },
          ],
        },
      ],
    });
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    res.render('ordersDetail', { order, userS });
  } catch (error) {
    console.error('Sipariş detayları alınırken bir hata oluştu:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;