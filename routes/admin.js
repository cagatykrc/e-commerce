const express = require('express');
const router = express.Router();
const db = require('../utility/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const Users = require('../models/Users');
const Yorumlar = require('../models/Yorumlar');
const Urunler = require('../models/Urunler');
const createLimiter= require('../utility/limiter');
const Kategoriler = require('../models/Kategoriler');
const verifyToken = require('../utility/verifyToken');
const Kategorilertab = require('../models/Kategorilertab');
const Duyurular = require('../models/Duyurular');
const logger = require('../utility/logger');
const options = { timeZone: 'Europe/Istanbul' }; // Türkiye saat dilimi
const formattedDate = new Date();
const now = formattedDate.toLocaleString('tr-TR', options);

// const limiterDefaultRequests = createLimiter(15)
// const limiterTwoRequests = createLimiter(1)
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

router.get('/duyuruolustur', async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.render('404', { userS });
    }

    const duyurular = await Duyurular.findAll();

    // Kullanıcı admin rolüne sahipse, sayfayı render et
    res.render('admin/createAnnoucement', { userS, duyurular });
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
        const urunler = await Urunler.findAll();
        res.render('admin/managementProduct', { urunler, userS });
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
        const kategoriler = await Kategoriler.findAll();
        res.render('admin/createProduct', { userS, kategoriler });
    } catch (error) {
        console.error('Kategorileri çekerken bir hata oluştu: ' + error);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        return res.status(500).send('Internal Server Error');
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


router.post('/urunolustur', verifyToken, upload.fields([
    { name: 'resim', maxCount: 1 }
]), async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    const userID = req.session.user.id;

    const { baslik, yazar, konu, aciklama, kategorisi, resim, turu } = req.body;

    if (!req.files || !req.files['resim']) {
        console.error('Dosya yüklemesi başarısız oldu.');
        return res.status(400).send('Bad Request');
    }

    const resimDosya = req.files['resim'][0];

    try {
        const result = await Urunler.create({
            konu,
            aciklama,
            resim: resimDosya.filename,
            olusturan_user_id: userID,
            urun_basligi: baslik,
            yazar,
            category_low,
            urun_turu: turu,
        });

        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Urun Oluşturdu: ' + ipAddress + '  //' + now);
      
        res.redirect('/admin/panel');
    } catch (error) {
        console.error('Urun oluşturulurken bir hata oluştu: ' + error);
        // Hata durumunu uygun şekilde ele alabilirsiniz, örneğin 500 durum kodu ile hata sayfası render edebilirsiniz.
        return res.status(500).send('Internal Server Error');
    }
});


router.post('/:urunId/duzenle', verifyToken, async (req, res) => {
    const userS = req.session.user;

    if (!(userS && userS.role === 'admin')) {
        return res.redirect('/');
    }

    const urunId = req.params.urunId;
    const { konu, aciklama, resim, baslik, kategorisi, turu } = req.body;

    try {
        const urun = await Urunler.findByPk(urunId);

        if (!urun) {
            return res.status(404).send('Urun bulunamadı');
        }

        // Sequelize'nin update metodunu kullanarak urunyi güncelle
        await urun.update({
            urun_basligi: baslik,
            konu: konu,
            aciklama: aciklama,
            resim: resim,
            category_low: kategorisi,
            urun_turu: turu,
        });

        const ipAddress = req.socket.remoteAddress;
        logger.info(userS.username + ' ' + 'Urun Düzenledi: ' + ipAddress + '  //' + now);
   
        res.redirect('/admin/urunyonetim');
    } catch (error) {
        console.error('Urun güncellenirken bir hata oluştu: ' + error);
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
            const kategoriler = await Kategoriler.findAll();

            // Urunyi çek
            const urun = await Urunler.findByPk(urunId);

            if (!urun) {
                return res.status(404).send('Urun bulunamadı');
            }



            // UrunDuzenle view'ine urun ve kategorileri gönder
            res.render('admin/editProduct', { urun, userS, kategoriler });

        } catch (error) {
            console.error('Urun bilgisi alınırken bir hata oluştu: ' + error);
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
            const urun = await Urunler.findByPk(urunId);
            
            if (!urun) {
                return res.status(404).send('Urun bulunamadı');
            }
            
            // Sequelize ile urunyi sil
            await urun.destroy();
            
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
                kategori_id: kategoriId,
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


module.exports=router;
