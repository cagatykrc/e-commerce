const express = require('express');
const router = express.Router();
const db = require('../utility/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const Users = require('../models/Users');
const Yorumlar = require('../models/Yorumlar');
const Products = require('../models/Products');
const createLimiter= require('../utility/limiter');
const Kategoriler = require('../models/Kategoriler');
const verifyToken = require('../utility/verifyToken');
const Kategorilertab = require('../models/Kategorilertab');
const Duyurular = require('../models/Duyurular');
const logger = require('../utility/logger');
const Coupon = require('../models/Coupon');
const productDesc = require('../models/productDesc');
const Orders = require('../models/Orders');
const OrderItem = require('../models/OrderItem');
const Showcase = require('../models/Showcase');
const options = { timeZone: 'Europe/Istanbul' }; // Türkiye saat dilimi
const formattedDate = new Date();
const now = formattedDate.toLocaleString('tr-TR', options);
const { Op } = require('sequelize');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
// const limiterDefaultRequests = createLimiter(15)
// const limiterTwoRequests = createLimiter(1)
function slugify(text) {
    // Türkçe karakterleri İngilizce eşdeğerlerine dönüştürme haritası
    const turkishCharMap = {
      'ç': 'c',
      'ğ': 'g',
      'ı': 'i',
      'ö': 'o',
      'ş': 's',
      'ü': 'u',
      'Ç': 'C',
      'Ğ': 'G',
      'İ': 'I',
      'Ö': 'O',
      'Ş': 'S',
      'Ü': 'U'
    };
  
    // Türkçe karakterleri dönüştür
    text = text.replace(/[çğıöşüÇĞİÖŞÜ]/g, function(match) {
      return turkishCharMap[match];
    });
  
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Boşlukları tire ile değiştir
      .replace(/[^\w\-]+/g, '')       // Geçersiz karakterleri kaldır
      .replace(/\-\-+/g, '-')         // Birden fazla tireyi tek tireye indir
      .replace(/^-+/, '')             // Baştaki tireleri kaldır
      .replace(/-+$/, '');            // Sondaki tireleri kaldır
  }
router.get('/panel', verifyToken, (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }

    // Kullanıcı admin rolüne sahipse, sayfayı render et
    res.render('admin/controlPanel', { userS });
});

router.get('/logizleme', verifyToken,(req, res)=>{
    const userS = req.session.user;
    if (userS && userS.role === 'admin') {
        const dosyaYolu = path.join(__dirname, '../app.log');
        const dosyaIcerigi = fs.readFileSync(dosyaYolu, 'utf-8');
    // Kullanıcı admin rolüne sahipse, sayfayı render et
        res.render('admin/logs', { userS, dosyaIcerigi });
    }else{
        res.render('404', { userS });
    }
});
router.post('/logtemizle', verifyToken, (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }

    const dosyaYolu = path.join(__dirname, '../app.log');
    const temizIcerik = '';
    fs.writeFileSync(dosyaYolu, temizIcerik, 'utf-8');

    // Kullanıcı admin rolüne sahipse, sayfayı redirect et
    res.redirect('/admin/logizleme');
});

router.get('/duyuruolustur', verifyToken,async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }

    const duyurular = await Duyurular.findAll();

    // Kullanıcı admin rolüne sahipse, sayfayı render et
    res.render('admin/createAnnoucement', { userS, duyurular });
});

router.get('/urunaciklamatip',  verifyToken,async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }


    // Kullanıcı admin rolüne sahipse, sayfayı render et
    res.render('admin/addProdDesc', { userS });
});


const uploadFolder = path.join(__dirname, '..', 'public', 'uploads');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder); // Dosyaların yükleneceği klasör
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Dosya adını belirleme
    }
});

const upload = multer({ storage: storage });

router.get('/urunyonetim', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }

    try {
        const products = await Products.findAll({
            include: [{ model: Kategoriler ,as:'kategoriler'}],
        });
        console.log(products);
        res.render('admin/managementProduct', { products, userS });
    } catch (error) {
        console.error('Urun verilerini çekerken bir hata oluştu: ' + error);
        return res.status(500).send('Internal Server Error');
    }
});



router.get('/urunolustur', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }

    try {
        const productdesc= await productDesc.findAll()
        const kategoriler = await Kategoriler.findAll();
        res.render('admin/createProduct', { userS, kategoriler, productdesc });
    } catch (error) {
        console.error('Kategorileri çekerken bir hata oluştu: ' + error);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        return res.status(500).send('Internal Server Error');
    }
});
router.get('/siparisler', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }

    try {
        // Siparişler ve her siparişe ait OrderItems'ı getirmek
        const orders = await Orders.findAll({
            include: [
                {
                    model: OrderItem, 
                    as: 'OrderItems' // OrderItems ilişkisinin doğru şekilde getirildiğinden emin olalım
                },
                {
                    model: Users,   // User modelini dahil ediyoruz
                    as: 'user',    // İlişkiyi "user" olarak adlandırdık
                    attributes: ['user_id', 'first_name', 'last_name', 'email'] // İstediğiniz User bilgilerini buradan seçebilirsiniz
                },
            ]
        });

        if (!orders || orders.length === 0) {
            return res.render('admin/adminorder', { userS, Order: [] }); // Sipariş yoksa boş array gönderiyoruz
        }

        res.render('admin/adminorder', { userS, Order: orders });
    } catch (error) {
        console.error('Kategorileri çekerken bir hata oluştu: ' + error);
        return res.status(500).send('Internal Server Error');
    }
});

router.get('/siparisler/:orderId', verifyToken, async (req, res) => {
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
  
      res.render('admin/adminOrderMan', { order, userS });
    } catch (error) {
      console.error('Sipariş detayları alınırken bir hata oluştu:', error);
      return res.status(500).send('Internal Server Error');
    }
});
router.post('/urunaciklamatipekle', verifyToken, async(req, res) => {
    const userS = req.session.user;
    const {
        desc_type,
        // Temel Ürün Bilgileri
        brand,
        model,
        color,
        material,
        dimensions,
        weight,
        // Garanti ve Teslimat
        warranty,
        delivery_time,
        shipping_info,
        // Ödeme ve İade
        payment_options,
        return_policy,
        // Ürün Özellikleri
        features,
        usage_area,
        care_instructions,
        // Öne Çıkan Özellikler
        highlight1,
        highlight2,
        highlight3,
        highlight4,
        // Ek Bilgiler
        origin_country,
        certification,
        stock_status
    } = req.body;
    
    if (userS && userS.role === 'admin') {
        try {
            const productdescadd = await productDesc.create({
                desc_type,
                // Temel Ürün Bilgileri
                brand,
                model,
                color,
                material,
                dimensions,
                weight,
                // Garanti ve Teslimat
                warranty,
                delivery_time,
                shipping_info,
                // Ödeme ve İade
                payment_options,
                return_policy,
                // Ürün Özellikleri
                features,
                usage_area,
                care_instructions,
                // Öne Çıkan Özellikler
                highlight1,
                highlight2,
                highlight3,
                highlight4,
                // Ek Bilgiler
                origin_country,
                certification,
                stock_status
            });

            const ipAddress = req.socket.remoteAddress;
            logger.info(userS.username + ' ' + 'Ürün Açıklaması Oluşturdu: ' + ipAddress + '  //' + now);
            res.redirect('/admin/urunaciklamatip');
        } catch (error) {
            console.error('Ürün açıklaması oluşturulurken hata:', error);
            res.status(500).send('Ürün açıklaması oluşturulurken bir hata oluştu');
        }
    } else {
        res.redirect('/');
    }
});

router.post('/urunaciklamatipduzenle/:id', verifyToken, async(req, res) => {
    const userS = req.session.user;
    const descId = req.params.id;
    const {
        desc_type,
        // Temel Ürün Bilgileri
        brand,
        model,
        color,
        material,
        dimensions,
        weight,
        // Garanti ve Teslimat
        warranty,
        delivery_time,
        shipping_info,
        // Ödeme ve İade
        payment_options,
        return_policy,
        // Ürün Özellikleri
        features,
        usage_area,
        care_instructions,
        // Öne Çıkan Özellikler
        highlight1,
        highlight2,
        highlight3,
        highlight4,
        // Ek Bilgiler
        origin_country,
        certification,
        stock_status
    } = req.body;
    
    if (userS && userS.role === 'admin') {
        try {
            const productdesc = await productDesc.findByPk(descId);
            
            if (!productdesc) {
                return res.status(404).send('Ürün açıklaması bulunamadı');
            }

            await productdesc.update({
                desc_type,
                // Temel Ürün Bilgileri
                brand,
                model,
                color,
                material,
                dimensions,
                weight,
                // Garanti ve Teslimat
                warranty,
                delivery_time,
                shipping_info,
                // Ödeme ve İade
                payment_options,
                return_policy,
                // Ürün Özellikleri
                features,
                usage_area,
                care_instructions,
                // Öne Çıkan Özellikler
                highlight1,
                highlight2,
                highlight3,
                highlight4,
                // Ek Bilgiler
                origin_country,
                certification,
                stock_status
            });

            const ipAddress = req.socket.remoteAddress;
            logger.info(userS.username + ' ' + 'Ürün Açıklaması Düzenledi: ' + ipAddress + '  //' + now);
            res.redirect('/admin/urunaciklamatip');
        } catch (error) {
            console.error('Ürün açıklaması düzenlenirken hata:', error);
            res.status(500).send('Ürün açıklaması düzenlenirken bir hata oluştu');
        }
    } else {
        res.redirect('/');
    }
});

router.post('/urunaciklamatipsil/:id', verifyToken, async(req, res) => {
    const userS = req.session.user;
    const descId = req.params.id;
    
    if (userS && userS.role === 'admin') {
        try {
            const productdesc = await productDesc.findByPk(descId);
            
            if (!productdesc) {
                return res.status(404).send('Ürün açıklaması bulunamadı');
            }

            await productdesc.destroy();

            const ipAddress = req.socket.remoteAddress;
            logger.info(userS.username + ' ' + 'Ürün Açıklaması Sildi: ' + ipAddress + '  //' + now);
            res.redirect('/admin/urunaciklamatip');
        } catch (error) {
            console.error('Ürün açıklaması silinirken hata:', error);
            res.status(500).send('Ürün açıklaması silinirken bir hata oluştu');
        }
    } else {
        res.redirect('/');
    }
});

router.post('/duyuruolustur', verifyToken,async(req,res) => {
    const userS = req.session.user;
    const {duyuru_baslik, duyuru_metin, duyuru_renk} = req.body;
    
    if (userS && userS.role === 'admin') {
        const duyurutemizle = await Duyurular.destroy({
            truncate:true
        });
        const duyuruOlustur = await Duyurular.create({
            duyuru_baslik: duyuru_baslik,
            duyuru_metin: duyuru_metin,
            duyuru_renk: duyuru_renk,
        });
        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username+' '+'Duyuru Oluşturdu: '+ipAddress +'  //'+now);
        res.redirect('/admin/duyuruolustur');
    } else {
        res.redirect('/');
    }
});

router.post('/duyurusil', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    try {
        await Duyurular.destroy({
            truncate: true
        });

        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Duyuru Sildi: ' + ipAddress + '  //' + now);
        res.redirect('/admin/duyuruolustur');
    } catch (error) {
        console.error('Duyuru silinirken bir hata oluştu: ' + error);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        return res.status(500).send('Internal Server Error');
    }
});

router.get('/kuponlar', verifyToken, async (req, res) => {
    const userS = req.session.user;
    
    if (userS && userS.role === 'admin') {
        try {
            const coupons = await Coupon.findAll({
                order: [['createdAt', 'DESC']]
            });
            
            res.render('admin/couponCreate', { 
                coupons,
                userS,
                error: null,
                success: null
            });
        } catch (error) {
            console.error('Kuponlar listelenirken hata:', error);
            res.status(500).send('Kuponlar listelenirken bir hata oluştu');
        }
    } else {
        res.redirect('/');
    }
});

router.post('/kupon-olustur', verifyToken, csrfProtection, async (req, res) => {
    const userS = req.session.user;
    
    if (userS && userS.role === 'admin') {
        try {
            const {
                coupon_code,
                discount_type,
                discount_value,
                expiry_date,
                description,
                _csrf
            } = req.body;

            // Kupon kodunu büyük harfe çevir ve boşlukları temizle
            const upperCouponCode = coupon_code.trim().toUpperCase().replace(/\s+/g, '');

            // Boş kupon kodu kontrolü
            if (!upperCouponCode) {
                req.session.notification = {
                    type: 'error',
                    message: 'Kupon kodu boş olamaz'
                };
                return res.redirect('/admin/kuponlar');
            }

            // Kupon kodu benzersizliğini kontrol et
            const existingCoupon = await Coupon.findOne({
                where: {
                    coupon_code: upperCouponCode
                }
            });

            if (existingCoupon) {
                req.session.notification = {
                    type: 'error',
                    message: 'Bu kupon kodu zaten kullanımda'
                };
                return res.redirect('/admin/kuponlar');
            }

            // Yeni kupon oluştur
            const newCoupon = await Coupon.create({
                coupon_code: upperCouponCode,
                discount_type,
                discount_value: parseFloat(discount_value),
                expiry_date: new Date(expiry_date + 'T23:59:59'), // Günün sonuna kadar geçerli
                description,
                active: true,
                usage_count: 0,
                max_usage: null // Sınırsız kullanım için null
            });

            const ipAddress = req.socket.remoteAddress;
            logger.info(`${userS.username} yeni kupon oluşturdu: ${upperCouponCode} - ${ipAddress} - ${new Date()}`);
            
            req.session.notification = {
                type: 'success',
                message: 'Kupon başarıyla oluşturuldu'
            };
            
            res.redirect('/admin/kuponlar');
        } catch (error) {
            console.error('Kupon oluşturulurken hata:', error);
            req.session.notification = {
                type: 'error',
                message: 'Kupon oluşturulurken bir hata oluştu'
            };
            res.redirect('/admin/kuponlar');
        }
    } else {
        res.redirect('/');
    }
});

router.post('/:couponId/sil', verifyToken, async (req, res) => {
    const userS = req.session.user;
    const { couponId } = req.params;
    
    if (userS && userS.role === 'admin') {
        try {
            const coupon = await Coupon.findByPk(couponId);
            
            if (!coupon) {
                return res.status(404).json({
                    error: 'Kupon bulunamadı'
                });
            }

            await coupon.destroy();

            const ipAddress = req.socket.remoteAddress;
            logger.info(`${userS.username} kupon sildi: ${coupon.coupon_code} - ${ipAddress} - ${new Date()}`);
            
            res.json({ success: true });
        } catch (error) {
            console.error('Kupon silinirken hata:', error);
            res.status(500).json({
                error: 'Kupon silinirken bir hata oluştu'
            });
        }
    } else {
        res.status(403).json({
            error: 'Yetkisiz erişim'
        });
    }
});

router.post('/:couponId/durum', verifyToken, async (req, res) => {
    const userS = req.session.user;
    const { couponId } = req.params;
    const { active } = req.body;
    
    if (userS && userS.role === 'admin') {
        try {
            const coupon = await Coupon.findByPk(couponId);
            
            if (!coupon) {
                return res.status(404).json({
                    error: 'Kupon bulunamadı'
                });
            }

            await coupon.update({ active });

            const ipAddress = req.socket.remoteAddress;
            logger.info(`${userS.username} kupon durumunu güncelledi: ${coupon.coupon_code} - ${active ? 'aktif' : 'pasif'} - ${ipAddress} - ${new Date()}`);
            
            res.json({ success: true });
        } catch (error) {
            console.error('Kupon durumu güncellenirken hata:', error);
            res.status(500).json({
                error: 'Kupon durumu güncellenirken bir hata oluştu'
            });
        }
    } else {
        res.status(403).json({
            error: 'Yetkisiz erişim'
        });
    }
});

function generateProductId(category, uniqueId) {
    const categoryInitial = category.charAt(0).toUpperCase(); // Kategorinin ilk harfini al
    return `${categoryInitial}${uniqueId}`;
}

router.post('/urunolustur', verifyToken, upload.fields([
    { name: 'resim', maxCount: 1 },
    { name: 'resim2', maxCount: 1 },
    { name: 'resim3', maxCount: 1 }
]), async (req, res) => {
    try {
        // Yetki kontrolü
        if (!req.session.user || req.session.user.role !== 'admin') {
            throw new Error('Yetkisiz erişim');
        }

        // Form verilerini al
        const { baslik, price, kategorisi, aciklama } = req.body;
        
        // Resimleri kontrol et
        if (!req.files || !req.files.resim || !req.files.resim2 || !req.files.resim3) {
            throw new Error('Tüm resimler gereklidir');
        }

        // Yeni ürün oluştur
        const yeniUrun = await Products.create({
            urun_basligi: baslik,
            slug: slugify(baslik, { lower: true, strict: true, locale: 'tr' }),
            product_price: parseFloat(price),
            category_low: kategorisi,
            aciklama: aciklama,
            resim: req.files.resim[0].filename,
            resim2: req.files.resim2[0].filename,
            resim3: req.files.resim3[0].filename,
            olusturan_user_id: req.session.user.id,
            urun_turu: 1
        });

        req.session.notification = {
            type: 'success',
            message: 'Ürün başarıyla oluşturuldu'
        };

        res.redirect('/admin/urunler');
    } catch (error) {
        console.error('Ürün oluşturma hatası:', error);
        req.session.notification = {
            type: 'error',
            message: error.message
        };
        return res.redirect('/admin/urunolustur');
    }
});

module.exports = router;



router.post('/:urunId/duzenle', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    const urunId = req.params.urunId;
    const { aciklama, resim, baslik, kategorisi, turu,productdesc_id, price } = req.body;
    const urunAdi = baslik;  // Bu ürün adını dinamik olarak alın
    const slug = slugify(urunAdi);
    try {
        const product = await Products.findByPk(urunId);

        if (!product) {
            return res.status(404).send('Ürün bulunamadı');
        }

        // Sequelize'nin update metodunu kullanarak ürünü güncelle
        await product.update({
            urun_basligi: baslik,
            aciklama: aciklama,
            resim: resim,
            category_low: kategorisi,
            urun_turu: turu,
            productdesc_id,
            slug,
            product_price: parseFloat(price).toFixed(2), // Price alanını formatlayarak ekle
        });

        const ipAddress = req.socket.remoteAddress;
        const now = new Date().toISOString(); // Şu anki zamanı al
        logger.info(`${userS.username} Ürün Düzenledi: ${ipAddress} // ${now}`);

   
        res.redirect('/admin/urunyonetim');
    } catch (error) {
        console.error('Ürün güncellenirken bir hata oluştu: ' + error);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        return res.status(500).send('Internal Server Error');
    }
});



router.get('/:urunId/duzenle', async (req, res) => {
    const urunId = req.params.urunId;
    const userS = req.session.user;

    if (userS && userS.role === 'admin') {
        try {
            // Kategorileri çek
            console.log('çekti');
            const productdesc= await productDesc.findAll()
            const kategoriler = await Kategoriler.findAll();
            
            // Urunyi çek
            const product = await Products.findByPk(urunId);

            if (!product) {
                return res.status(404).send('Urun bulunamadı');
            }



            // UrunDuzenle view'ine product ve kategorileri gönder
            res.render('admin/editProduct', { product, userS, kategoriler, productdesc });

        } catch (error) {
            console.error('Duzenleme bilgisi alınırken bir hata oluştu: ' + error);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        res.render('404', { userS });
    }
});


router.post('/:urunId/sil', verifyToken, async (req, res) => {
    const userS = req.session.user;
    
    if (userS && userS.role === 'admin') {
        const urunId = req.params.urunId;
        
        try {
            // Sequelize ile urunyi bul ve sil
            const product = await Products.findByPk(urunId);
            
            if (!product) {
                return res.status(404).send('Urun bulunamadı');
            }
            
            // Sequelize ile urunyi sil
            await product.destroy();
            
            // Sequelize ile ilgili urunye ait yorumları sil
            await Yorumlar.destroy({
                where: {
                    urun_id: urunId
                }
            });
            
            const ipAddress = req.socket.remoteAddress;
            logger.info(userS.username+' '+'Urun Sildi: '+ipAddress +'  //'+now);

            res.redirect('/admin/managementProduct');
        } catch (error) {
            console.error('Urun silinirken bir hata oluştu: ' + error);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect('/');
    }
});

router.post('/:urunId/indirim', verifyToken, async (req, res) => {
    const userS = req.session.user;
    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }
    const urunId = req.params.urunId;
    const { discount_price, discount_percentage } = req.body;

    try {
        const product = await Products.findByPk(urunId);
        if (!product) {
            return res.status(404).send('Ürün bulunamadı');
        }

        // İndirimli fiyatı güncelleme
        if (discount_price) {
            await product.update({
                discount_price: parseFloat(product.product_price).toFixed(2),
                product_price:parseFloat(discount_price).toFixed(2),
            });
        }

        // İndirim yüzdesini güncelleme
        if (discount_percentage) {
            const discountFactor = 1 - parseFloat(discount_percentage) / 100;
            const discountedPrice = (product.product_price * discountFactor).toFixed(2);
            await product.update({
                discount_price: discountedPrice,
            });
        }

        logger.info(`${userS.username} Ürüne İndirim Uyguladı: ${req.socket.remoteAddress} // ${now}`);
        res.redirect('/admin/urunyonetim');
    } catch (error) {
        console.error('Ürüne indirim uygulanırken bir hata oluştu: ' + error);
        res.status(500).send('Internal Server Error');
    }
});



router.get('/kullaniciyonetim', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }

    try {
        const users = await Users.findAll();

        res.render('admin/managementUser', { userS, users });
    } catch (error) {
        console.error('Veri tabanından kullanıcıları çekerken hata oluştu: ' + error.message);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        res.status(500).json({ error: 'Veri tabanından kullanıcıları çekerken hata oluştu' });
    }
});


router.get('/kullanici/:userId', verifyToken, async (req, res) => {
    const userId = req.params.userId;
    const userS = req.session.user;

    if (userS && userS.role === 'admin') {
        try {
            const user = await Users.findByPk(userId); // Sequelize ile kullanıcıyı çekiyoruz
            if (user) {

                res.render('admin/userDetail', { userS, user });
            } else {
                res.status(404).json({ error: 'Kullanıcı bulunamadı' });
            }
        } catch (error) {
            console.log('Kullanıcı detayları alınırken hata oluştu: ' + error.message);
        }
    } else {
        res.render('404', { userS });
    }
});


router.post('/kullanici/:userId/update', verifyToken, async (req, res) => {
    const userId = req.params.userId;
    const userS = req.session.user;
    const { newUsername, newEmail, newFirstName, newLastName, newRole } = req.body;

    if (userS && userS.role === 'admin') {
        try {
            const userToUpdate = await Users.findByPk(userId);
            
            if (userToUpdate) {
                userToUpdate.username = newUsername;
                userToUpdate.email = newEmail;
                userToUpdate.first_name = newFirstName;
                userToUpdate.last_name = newLastName;
                userToUpdate.role = newRole;

                await userToUpdate.save();
                const ipAddress = req.socket.remoteAddress;
                logger.info(userS.username+' '+'Kullanıcı Güncelledi: '+ipAddress +'  //'+now);

                res.redirect('/admin/kullanici/' + userId);
            } else {
                res.status(404).json({ error: 'Kullanıcı bulunamadı' });
            }
        } catch (error) {
            console.error('Kullanıcı güncellenirken hata oluştu: ' + error.message);
            res.status(500).json({ error: 'Kullanıcı güncellenirken hata oluştu' });
        }
    } else {
        res.render('404', { userS });
    }
});

router.get('/kategoriyonetim', verifyToken, async (req, res) => {
    const userS = req.session.user;

    try {
        if (!(userS && userS.role === 'admin')) {
            return res.render('404', { userS });
        }

        const kategoriler = await Kategoriler.findAll({
            include: { model: Kategorilertab, as: 'kategoriler_tab' },
        });
        const kategoriTabs = await Kategorilertab.findAll();
        res.render('admin/createCategory', { userS, kategoriler, kategoriTabs });
    } catch (error) {
        console.error('Kategoriler alınırken bir hata oluştu: ' + error.message);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        res.status(500).send('Internal Server Error');
    }
});


router.post('/kategoriekle', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    const { kategori_ad, category_low, kategori_tab_id } = req.body;

    try {
        const yeniKategori = await Kategoriler.create({
            kategori_ad,
            category_low,
            kategori_tab_id,
        });
        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Kategori Ekledi: ' + ipAddress + '  //' + now);

        res.redirect('/admin/kategoriyonetim');
    } catch (error) {
        console.error('Kategori oluşturulurken bir hata oluştu: ' + error.message);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        res.status(500).send('Internal Server Error');
    }
});


router.post('/kategoritabekle', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    const { kategori_tab_ad } = req.body;

    try {
        const yeniKategoriTab = await Kategorilertab.create({
            kategori_tab_ad,
        });
        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Kategori Tab Ekledi: ' + ipAddress + '  //' + now);

        res.redirect('/admin/kategoriyonetim');
    } catch (error) {
        console.error('KategoriTab oluşturulurken bir hata oluştu: ' + error.message);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        res.status(500).send('Internal Server Error');
    }
});

router.post('/:kategoriId/kategorisil', verifyToken, async (req, res) => {
    const userS = req.session.user;
    const kategoriId = req.params.kategoriId;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    try {
        // Kategori silme işlemi
        await Kategoriler.destroy({
            where: {
                category_id: kategoriId,
            },
        });
        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Kategori Sildi: ' + ipAddress + '  //' + now);

        res.redirect('/admin/kategoriyonetim');
    } catch (error) {
        console.error('Kategori silinirken bir hata oluştu: ' + error.message);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        res.status(500).send('Internal Server Error');
    }
});
router.post('/:kategoritabId/kategoritabsil', verifyToken, async (req, res) => {
    const userS = req.session.user;
    const kategoritabId = req.params.kategoritabId;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    try {
        // Kategori silme işlemi
        await Kategoriler.destroy({
            where: {
                kategori_tab_id: kategoritabId,
            },
        });
        await Kategorilertab.destroy({
            where: {
                kategori_tab_id: kategoritabId,
            },
        });
        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Kategori Tab Sildi: ' + ipAddress + '  //' + now);

        res.redirect('/admin/kategoriyonetim');
    } catch (error) {
        console.error('Kategori Tab silinirken bir hata oluştu: ' + error.message);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        res.status(500).send('Internal Server Error');
    }
});

router.post('/:urunId/onecikar', verifyToken, async (req, res) => {
    const userS = req.session.user;
    
    if (userS && userS.role === 'admin') {
        const urunId = req.params.urunId;
        
        try {
            // Sequelize ile urunyi bul ve sil
            const product = await Products.findByPk(urunId);
            
            if (!product) {
                return res.status(404).send('Urun bulunamadı');
            }
            
            // Sequelize ile urunyi sil
            const addshowcase = await Showcase.create({
                showcase_name: 'onecikanlar',
                product_id:urunId,
            });
            
            // Sequelize ile ilgili urunye ait yorumları sil
           
            const ipAddress = req.socket.remoteAddress;
            logger.info(userS.id+' '+'Ürünü bir vitrine ekledi '+ipAddress +'  //'+now);

            res.redirect('/admin/panel');
        } catch (error) {
            console.error('Urun vitrine eklenirken bir hata oluştu: ' + error);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect('/');
    }
});





module.exports=router;