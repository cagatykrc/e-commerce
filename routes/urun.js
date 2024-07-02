const express = require('express');
const router = express.Router();
const Urunler = require('../models/Urunler');
const Yorumlar = require('../models/Yorumlar');
const Users = require('../models/Users');
const verifyToken= require('../utility/verifyToken');
const postlimiter= require('../utility/limiter');
const logger = require('../utility/logger');
const Kategoriler = require('../models/Kategoriler');
const options = { timeZone: 'Europe/Istanbul' }; // Türkiye saat dilimi
const formattedDate = new Date();
const now = formattedDate.toLocaleString('tr-TR', options);


// const limiterTwoRequests = createLimiter(2);
// const limiterDefaultRequests = createLimiter(15);



router.get('/:urunid', async (req, res) => {
    const urunId = req.params.urunid;
    const userS = req.session.user;
  
    try {
      // Sequelize ile urun bilgilerini çek
      const urun = await Urunler.findByPk(urunId, {
        include: [
          {
          model: Users,
          as: 'olusturanUser',
          attributes: ['first_name', 'last_name'],
          },
          {
            model: Kategoriler,
            as: 'kategoriler',
          }
      ],
      });
  
      // Eğer urun bulunursa, indirim oranını hesapla
    const discountRate = (( urun.discount_price-urun.product_price ) / urun.discount_price) * 100;

      const olusturanUser = urun ? urun.olusturanUser : null;
  
      // Urun sayfasını render et
      switch (urun.kategoriler.category_low) {
        case 'tulperde':
          res.render('tulcproductpage',{ urun, userS, olusturanUser,discountRate })
          break;
        case 'storperde':
          res.render('storcproductpage',{ urun, userS, olusturanUser,discountRate })
          break;
        case 'fonperde':
          res.render('foncproductpage',{ urun, userS, olusturanUser,discountRate })
          break;
        default:
          res.render('productpage',{ urun, userS, olusturanUser,discountRate })
          break;
      }

    } catch (error) {
      // Hata durumunda
      console.error('Urun ve yorum verilerini çekerken bir hata oluştu: ' + error);
      res.status(500).send('Internal Server Error');
    }
  });

router.post('/:urunId/yorumsil', verifyToken, async (req, res) => {
    const userS = req.session.user;
    const yorumId = req.body.yorumId;
    const urunId = req.params.urunId;

    if (!userS || userS.role !== 'admin') {
        return res.status(403).json({ error: 'Yetkisiz erişim' });
    }

    try {
        // Sequelize ile yorumu bul ve sil
        const yorum = await Yorumlar.findByPk(yorumId);
        if (!yorum) {
            return res.status(404).json({ error: 'Yorum bulunamadı' });
        }

        await yorum.destroy();
        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Yorum Sildi: ' + ipAddress);
        return res.json({ message: yorumId + ' Yorum başarıyla silindi' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Yorum silinirken bir hata oluştu' });
    }
});


// Örnek endpoint
router.post('/:urunId/yorumEkle', postlimiter, async (req, res) => {
    const urunId = req.params.urunId;

    // Kullanıcının oturum açmış olup olmadığını kontrol et
    if (!req.session.user) {
        return res.redirect('/auth/giris');
    }

    const kullaniciId = req.session.user.id;
    const yorumMetni = req.body.yorumMetni;

    try {
        // Sequelize ile yorumu oluştur
        const yorum = await Yorumlar.create({
            urun_id: urunId,
            kullanici_id: kullaniciId,
            yorum_metni: yorumMetni
        });

        const userN = req.session.user.username;
        const ipAddress = req.socket.remoteAddress;
        logger.info(userN + ' ' + 'Yorum Ekledi: ' + ipAddress + '  //' + now);

        return res.redirect(`/urunler/${urunId}`);
    } catch (error) {
        console.error('Yorum eklenirken bir hata oluştu: ' + error);
        return res.status(500).send('Internal Server Error');
    }
});

// router.post('/:urunId/indir',(req, res) => {
//     try {
//         const pdfDosya = req.body.pdf_dosya;
//         res.download("./public/uploads/"+pdfDosya);
        
//     } catch (error) {
//         console.log(error);
//     }
// });


module.exports = router;
