const express = require('express');
const router = express.Router();
const Products = require('../models/Products');
const Yorumlar = require('../models/Yorumlar');
const Users = require('../models/Users');
const verifyToken= require('../utility/verifyToken');
const postlimiter= require('../utility/limiter');
const logger = require('../utility/logger');
const Kategoriler = require('../models/Kategoriler');
const Kategorilertab = require('../models/Kategorilertab');
const options = { timeZone: 'Europe/Istanbul' }; // Türkiye saat dilimi
const formattedDate = new Date();
const now = formattedDate.toLocaleString('tr-TR', options);
router.get('/urunler', async (req, res) => {
    const message = req.session.message;
    delete req.session.message;
    const userS = req.session.user;
    const kategoriIDs = req.query.kategoriID; // Kategori ID'leri sorgu parametresi olarak gelecek (dizi olabilir)

    try {
        // Filtreleme için whereClause oluşturun
        const whereClause = {};
        if (kategoriIDs) {
            whereClause.category_low = Array.isArray(kategoriIDs) ? kategoriIDs : [kategoriIDs];
        }

        // Ürünleri filtreli olarak alın
        const products = await Products.findAll({
            where: whereClause,
            include: [{
                model: Kategoriler,
                as: 'kategoriler'
            }]
        });

        // Duyuruları alın

        // Kategori sekmelerini alın ve kategorileri sıralı şekilde dahil edin
        const categoryTabs = await Kategorilertab.findAll({
            include: [{
                model: Kategoriler,
                as: 'kategoriler'
            }],
            order: [
                [{ model: Kategoriler, as: 'kategoriler' }, 'kategori_ad', 'ASC']
            ]
        });

        res.render('products', {
            products,
            userS,
            message,
            categoryTabs
        });
        console.log(products)
    } catch (error) {
        console.error('Ürün verilerini çekerken bir hata oluştu: ' + error);
        return res.status(500).send('Internal Server Error');
    }
});


module.exports=router;