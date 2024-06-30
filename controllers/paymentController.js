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

dotenv.config();
function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}
const merchant_id = process.env.MERCHANT_ID || '469080';
const merchant_key = process.env.MERCHANT_KEY || 'r7KJBYCjuWk4tDq5';
const merchant_salt = process.env.MERCHANT_SALT || 'FF6sW88pwH4xU4J1';

function generateUniqueId() {
    return crypto.randomBytes(2).toString('hex');
}

router.post("/siparisonayla", async (req, res) => {
    const userS = req.session.user;
    if (!userS) {
        return res.redirect('/sepet');
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

        console.log(totalCartPrice);
        res.render('checkout', { userS, userDetails: userDetails[0], totalCartPrice });
    } catch (error) {
        console.error('Error fetching user details and shopping cart:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get("/siparis", function(req, res) {
    res.redirect('/');
});

router.post("/", async function(req, res) {
    const user = req.session.user;
    if (!user) {
        return res.redirect('/sepet');
    }

    const { email, address, phone, firstname, lastname } = req.body;
    const user_ip = req.ip;
    const merchant_oid = `${user.id}${Date.now()}`.replace(/[^a-zA-Z0-9]/g, ''); // Benzersiz ve alfanumerik bir sipariş ID'si oluşturun

    let basket = [];
    let totalCartPrice = 0;

    const userCart = await ShoppingCart.findAll({
        where: { user_id: user.id },
        include: [{
            model: Urunler,
            attributes: ['product_price', 'resim', 'urun_basligi']
        }]
    });
    try {
        
        
        
        userCart.forEach(cartItem => {
            basket.push([
                cartItem.Urunler.urun_basligi,
                parseFloat(cartItem.total_price).toFixed(2),
                cartItem.quantity
            ]);
            const productPrice = parseFloat(cartItem.total_price);
            const total = productPrice;
            console.log(productPrice, cartItem.total_price);
            cartItem.totalPrice = total;
            totalCartPrice += total;
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }

    const user_basket = nodeBase64.encode(JSON.stringify(basket));
    const payment_amount = totalCartPrice * 100;
    try {
        
    
        const orderItems = userCart.map(cartItem => ({
            order_id: null,
            urun_id: cartItem.product_id,
            quantity: cartItem.quantity,
            width: cartItem.width,
            price: parseFloat(cartItem.total_price).toFixed(2),
            order_date: formatDate(new Date()),  // Bu satırda virgül ekleyin
            height: cartItem.height,
        }));

        const order = await Orders.create({
            order_id: generateUniqueId(),
            user_id: user.id,
            total_price: totalCartPrice,
            payment_status: 0,
            status:'Onay Bekliyor',
            merchant_oid: merchant_oid,
            order_date: new Date(),
            OrderItems: orderItems
        }, {
            include: {
                model: OrderItem,
                as: 'OrderItems' // Takma adı belirtin
            }
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
        
    }

    const hashSTR = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${user_basket}0${0}TL0`;
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
            user_name: `${firstname} ${lastname}`,
            user_address: address,
            user_phone: phone,
            merchant_ok_url: 'http://184.72.145.255/odeme/odeme_basarili',
            merchant_fail_url: 'http://184.72.145.255/odeme/odeme_hata',
            user_basket: user_basket,
            user_ip: user_ip,
            timeout_limit: 15,
            debug_on: 1,
            test_mode: 0,
            lang: 'tr',
            no_installment: 0,
            max_installment: 0,
            currency: 'TL',
            paytr_token: token,
        }
    };
    console.log(options);

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

router.get("/odeme_basarili", async function (req,res) {
    const userS = req.session.user;
    if (!userS) {
        return res.redirect('/sepet');
    }
    res.render('order-success', {userS: req.session.user})
})

router.post("/odeme_basarili", async function (req, res) {
    const callback = req.body;

    const paytr_token = callback.merchant_oid + merchant_salt + callback.status + callback.total_amount;
    const token = crypto.createHmac('sha256', merchant_key).update(paytr_token).digest('base64');

    if (token !== callback.hash) {
        throw new Error("PAYTR notification failed: bad hash");
    }
    console.log('callback: ' + token)

    if (callback.status === 'success') {
        try {
            const order_success = await Orders.findAll({
                where: { merchant_oid: callback.merchant_oid }
            });

            if (order_success.length > 0) {
                await Promise.all(order_success.map(async (order) => {
                    await order.update({
                        payment_status: 1
                    });
                }));
            }

            res.send('OK');
        } catch (error) {
            console.error('Error updating order:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        res.redirect('/');
    }
});




// try {
//     const userId = req.session.user.id;
//     const userCart = await ShoppingCart.findAll({
//         where: { user_id: userId },
//         include: [{
//             model: Urunler,
//             attributes: ['urun_basligi', 'product_price']
//         }]
//     });

//     const orderItems = userCart.map(cartItem => ({
//         order_id: null,
//         product_id: cartItem.product_id,
//         quantity: cartItem.quantity,
//         unit_price: parseFloat(cartItem.total_price / cartItem.quantity).toFixed(2)
//     }));

//     const order = await Orders.create({
//         order_id: generateUniqueId(),
//         user_id: userId,
//         total_price: callback.total_amount,
//         payment_status: 1,
//         order_date: new Date(),
//         OrderItems: orderItems
//     }, {
//         include: OrderItem
//     });

//     await ShoppingCart.destroy({
//         where: { user_id: userId }
//     });

module.exports = router;
