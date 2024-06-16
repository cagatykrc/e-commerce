const express = require('express');
const microtime = require('microtime');
const crypto = require('crypto');
const nodeBase64 = require('nodejs-base64-converter');
const router = express.Router();
const dotenv = require('dotenv');
const request = require('request');
const ShoppingCart = require('../models/ShoppingCart');
const Users = require('../models/Users');
const Urunler = require('../models/Urunler');
const Orders = require('../models/Orders');
const OrderItem = require('../models/OrderItem');
function generateUniqueId() {
    return crypto.randomBytes(2).toString('hex');
  }
dotenv.config();


console.log()
router.post("/siparisonayla", async (req, res) => {
    const userS = req.session.user;
    if (!userS) {
        return res.redirect('/sepet')
    }
    
    try {
        const userDetails = await Users.findAll({
            where: {
                user_id: userS.id
            },
            include: [{
                model: ShoppingCart,
                where: {
                    user_id: userS.id
                }
            }]
        });
        let totalCartPrice = 0;
        if (userDetails.length > 0 && userDetails[0].ShoppingCarts) {
            userDetails[0].ShoppingCarts.forEach(cartItem => {
                totalCartPrice += parseFloat(cartItem.total_price);
            });
        }
        console.log(totalCartPrice)

        res.render('checkout', { userS, userDetails:userDetails[0],totalCartPrice });
    } catch (error) {
        console.error('Error fetching user details and shopping cart:', error);
        res.status(500).send('Internal Server Error');
    }
})

router.get("/siparis", function  (req, res) {
    res.redirect('/');
    });
const merchant_oid = "IN" + microtime.now(); // Sipariş numarası: Her işlemde benzersiz olmalıdır!! Bu bilgi bildirim sayfanıza yapılacak bildirimde geri gönderilir.

router.post("/", async function(req, res) {
    const user = req.session.user;
    if (!user) {
        return res.redirect('/sepet')
    }

    const { email, address, phone, firstname, lastname } = req.body;
    const merchant_id = '469080';
    const merchant_key = 'r7KJBYCjuWk4tDq5';
    const merchant_salt = 'FF6sW88pwH4xU4J1';
    const user_ip = req.ip;
    const merchant_oid = `${user.id}${Date.now()}`; // Benzersiz bir sipariş ID'si oluşturun

    let basket = [];
    let totalCartPrice = 0;

    try {
        // Kullanıcının alışveriş sepeti ve ilgili ürün bilgilerini çek
        const userCart = await ShoppingCart.findAll({
            where: { user_id: user.id }, // Kullanıcının tüm sepetleri
            include: [{
                model: Urunler, // Ürün modeli
                attributes: ['product_price', 'resim', 'urun_basligi'] // Gerekli ürün bilgilerini seç
            }]
        });

        userCart.forEach(cartItem => {
            basket.push([
                cartItem.Urunler.urun_basligi, // Ürün adı
                parseFloat(cartItem.total_price).toFixed(2), // Ürün fiyatı
                cartItem.quantity // Ürün miktarı
            ]);
            const productPrice = parseFloat(cartItem.total_price);
            const total = productPrice;
            console.log(productPrice, cartItem.total_price);
            cartItem.totalPrice = total; // Her bir shopping cart için totalPrice alanı oluştur
            totalCartPrice += total;
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }

    const user_basket = nodeBase64.encode(JSON.stringify(basket));
    const payment_amount = totalCartPrice * 100; // Toplam tutarı hesaplayın ve çarpanı düzeltin

    const max_installment = '0';
    const no_installment = '0';
    const currency = 'TL';
    const test_mode = '0';
    const user_name = `${firstname} ${lastname}`;
    const user_address = address;
    const user_phone = phone;
    const merchant_ok_url = 'http://www.fatosperde.com/odeme_basarili';
    const merchant_fail_url = 'http://www.fatosperde.com/odeme_hata';
    const timeout_limit = 30;
    const debug_on = 1;
    const lang = 'tr';

    const hashSTR = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`;
    const paytr_token = hashSTR + merchant_salt;
    const token = crypto.createHmac('sha256', merchant_key).update(paytr_token).digest('base64');

    const options = {
        method: 'POST',
        url: 'https://www.paytr.com/odeme/api/get-token',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        formData: {
            merchant_id: merchant_id,
            merchant_key: merchant_key,
            merchant_salt: merchant_salt,
            email: email,
            payment_amount: payment_amount,
            merchant_oid: merchant_oid,
            user_name: user_name,
            user_address: user_address,
            user_phone: user_phone,
            merchant_ok_url: merchant_ok_url,
            merchant_fail_url: merchant_fail_url,
            user_basket: user_basket,
            user_ip: user_ip,
            timeout_limit: timeout_limit,
            debug_on: debug_on,
            test_mode: test_mode,
            lang: lang,
            no_installment: no_installment,
            max_installment: max_installment,
            currency: currency,
            paytr_token: token,
        }
    };
    console.log(options)

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        const res_data = JSON.parse(body);

        if (res_data.status === 'success') {
            res.render('paytrFrame', { iframetoken: res_data.token, userS: user });
        } else {
            res.end(body);
        }
    });
});

router.post("/callback", async function (req, res) {
    const callback = req.body;

    // POST değerleri ile hash oluştur.
    const paytr_token = callback.merchant_oid + merchant_salt + callback.status + callback.total_amount;
    const token = crypto.createHmac('sha256', merchant_key).update(paytr_token).digest('base64');

    // Oluşturulan hash'i, paytr'dan gelen post içindeki hash ile karşılaştır (isteğin paytr'dan geldiğine ve değişmediğine emin olmak için)
    if (token != callback.hash) {
        throw new Error("PAYTR notification failed: bad hash");
    }

    if (callback.status == 'success') {
        try {
            // Başarılı ödeme durumunda sipariş kaydı yap
            const userId = req.user.id; // Kullanıcı ID'sini burada alabilirsiniz (örneğin, req.user.id)
            const userCart = await ShoppingCart.findAll({
                where: { user_id: userId }, // Kullanıcının tüm sepetleri
                include: [{
                    model: Urunler, // Ürün modeli
                    attributes: ['urun_basligi', 'product_price'] // Gerekli ürün bilgilerini seç
                }]
            });

            // Sipariş kaydı oluştur
            const orderItems = userCart.map(cartItem => ({
                order_id: null, // Sipariş oluşturulduğunda bu alan doldurulacak
                product_id: cartItem.product_id,
                quantity: cartItem.quantity,
                unit_price: parseFloat(cartItem.total_price / cartItem.quantity).toFixed(2)
            }));

            const order = await Orders.create({
                order_id: generateUniqueId(),
                user_id: userId,
                total_price: callback.total_amount,
                status: 'Hazırlanıyor',
                order_date: new Date(),
                OrderItems: orderItems // Orders ve OrderItem modelleri arasındaki ilişkiyi kullanarak kayıt yap
            }, {
                include: OrderItem
            });

            // Başarılı sipariş kaydı oluşturulduğunda, kullanıcının sepetini boşalt
            await ShoppingCart.destroy({
                where: { user_id: userId }
            });

            res.send('OK'); // Başarılı yanıt
        } catch (error) {
            console.error('Error creating order:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        // Ödeme başarısız ise farklı bir işlem yapabilirsiniz
        res.redirect('/');
    }
});


module.exports=router;