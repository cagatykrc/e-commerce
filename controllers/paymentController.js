const express = require('express');
const microtime = require('microtime');
const crypto = require('crypto');
const nodeBase64 = require('nodejs-base64-converter');
const router = express.Router();
const dotenv = require('dotenv');
const request = require('request');
const ShoppingCart = require('../models/ShoppingCart');
const Users = require('../models/Users');
const Products = require('../models/Products');
const Orders = require('../models/Orders');
const Kategoriler = require('../models/Kategoriler');
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
    return crypto.randomBytes(4).toString('hex');
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
        

        const userCart = await ShoppingCart.findAll({
            where: { user_id: userS.id },
            include: [{
              model: Products,
              attributes: ['product_price', 'discount_price', 'resim', 'urun_basligi','urun_turu'], // Ya da istediğiniz diğer alanlar
              include: [{
                      model: Kategoriler,
                      attributes: ['kategori_ad'],
                      as: 'kategoriler',
                    }]
            }]
          });

        if (userCart.length === 0) {
            return res.redirect('/sepet');
        }

        let totalCartPrice = 0;
        userCart.forEach(cartItem => {
            const product = cartItem.product;
            const productPrice = parseFloat(product.dataValues.product_price) || 0;
            const width = parseFloat(cartItem.width) || 0;
            const height = parseFloat(cartItem.height) || 0;
            const quantity = parseFloat(cartItem.quantity) || 0;
            const productType = parseInt(product.dataValues.urun_turu);

            console.log(`Product Price: ${productPrice}, Width: ${width}, Height: ${height}, Quantity: ${quantity}`);
            
            if (product) {
                if (productType === 0) {
                    if (productPrice > 0 && width > 0 && height > 0 && quantity > 0) {
                        const squareMeters = (height * width) / 10000;
                        const totalPrice = squareMeters * productPrice * quantity;
                        cartItem.total_price = totalPrice;
                        totalCartPrice += totalPrice;
                    } else {
                        console.log(`Geçersiz değerler bulundu: ${productPrice}, ${width}, ${height}, ${quantity}`);
                        return res.status(500).json({ message: 'Sistemsel bir hata meydana geldi' });
                    }
                } else {
                    if (productPrice > 0 && width > 0 && height < 300 && quantity > 0) {
                        const Meters = (width * 3) / 100;
                        const totalPrice = Meters * productPrice * quantity;
                        cartItem.total_price = totalPrice;
                        totalCartPrice += totalPrice;
                    } else {
                        console.log(`Geçersiz değerler bulundu: ${productPrice}, ${width}, ${height}, ${quantity}`);
                        return res.status(500).json({ message: 'Sistemsel bir hata meydana geldi' });
                    }
                }
            } else {
                console.log(`Sepet öğesi ID'si: ${cartItem.cart_id} için ürün bulunamadı`);
            }
        });

        console.log(`Total Cart Price before discount: ${totalCartPrice}`);
        let totalprice = totalCartPrice;
        let discount = 0;
        let kdvprice = 0;
        let withoutkdv = 0;

        console.log(req.session.coupon);
        if (req.session.coupon) {
            const coupon = req.session.coupon;
            const discountRate = parseFloat(coupon.discount_rate);
            const discountPrice = parseFloat(coupon.discount_price);
            console.log(discountRate, discountPrice);

            if (discountRate > 0) {
                discount = totalCartPrice * (discountRate / 100);
                console.log(`Discount Rate applied: ${discountRate / 100}`);
            } else if (discountPrice > 0) {
                discount = discountPrice;
                console.log(`Discount Price applied: ${discountPrice}`);
            }

            totalCartPrice -= discount;
            console.log(`Discount applied: ${discount}`);
            console.log(`Total Cart Price after discount: ${totalCartPrice}`);
        }

        const rawtotal = totalCartPrice;
        kdvprice = totalprice * (1 + 8 / 100); // KDV hesaplama
        withoutkdv = kdvprice - totalprice;
        totalCartPrice = rawtotal + withoutkdv;
        totalCartPrice = isNaN(totalCartPrice) ? 0 : totalCartPrice;
        discount = isNaN(discount) ? 0 : discount;

        // Değerleri toFixed(2) ile formatlama
        const totalCartPriceFormatted = totalCartPrice.toFixed(2);
        const discountFormatted = discount.toFixed(2);

        res.render('checkout', { 
            userS, 
            userDetails: userDetails[0],
            totalprice, 
            totalCartPrice: totalCartPriceFormatted, 
            discount: discountFormatted, 
            kdvprice, 
            withoutkdv, 
            coupon: req.session.coupon 
        });

    } catch (error) {
        console.error('Error fetching user details and shopping cart:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get("/siparis", function(req, res) {
    res.redirect('/');
});

router.post("/", async function(req, res) {
    // Check if user is logged in
    const user = req.session.user;
    if (!user) {
        // If not logged in, redirect to the login or cart page
        return res.redirect('/sepet'); // Or you can send an error response here
    }

    const { email, address, country, district, city, address_title, phone, firstname, lastname } = req.body;
    const user_ip = req.ip;
    const merchant_oid = `${user.id}${Date.now()}`.replace(/[^a-zA-Z0-9]/g, ''); // Unique alphanumeric order ID

    // Validate that all necessary fields are provided
    if (!email || !address || !country || !district || !city || !address_title || !phone || !firstname || !lastname) {
        return res.status(400).json({ message: 'Boş Alanları Doldurun' }); // Return an error if any field is missing
    }

    // Initialize the basket and total price
    let basket = [];
    let totalCartPrice = 0;

    // Fetch user's shopping cart
    const userCart = await ShoppingCart.findAll({
        where: { user_id: user.id },
        include: [{
            model: Products,
            attributes: ['product_price', 'resim', 'urun_basligi', 'urun_turu']
        }]
    });

    try {
        // Calculate the total cart price
        userCart.forEach(cartItem => {
            const product = cartItem.product;
            const productPrice = parseFloat(product.dataValues.product_price) || 0;
            const width = parseFloat(cartItem.width) || 0;
            const height = parseFloat(cartItem.height) || 0;
            const quantity = parseFloat(cartItem.quantity) || 0;
            const productType = parseInt(product.dataValues.urun_turu);

            if (productType === 0) {
                // Product type 0: calculation based on area
                if (productPrice > 0 && width > 0 && height > 0 && quantity > 0) {
                    const squareMeters = (height * width) / 10000;
                    const totalPrice = squareMeters * productPrice * quantity;
                    cartItem.total_price = totalPrice;
                    totalCartPrice += totalPrice;

                    basket.push([
                        product.dataValues.urun_basligi,
                        totalPrice.toFixed(2),
                        cartItem.quantity
                    ]);
                } else {
                    console.log(`Invalid values found: ${productPrice}, ${width}, ${height}, ${quantity}`);
                    return res.status(500).json({ message: 'Sistemsel bir hata meydana geldi' });
                }
            } else {
                // Product type 1: different calculation
                if (productPrice > 0 && width > 0 && height < 300 && quantity > 0) {
                    const Meters = (width * 3) / 100;
                    const totalPrice = Meters * productPrice * quantity;
                    cartItem.total_price = totalPrice;
                    totalCartPrice += totalPrice;

                    basket.push([
                        product.dataValues.urun_basligi,
                        totalPrice.toFixed(2),
                        cartItem.quantity
                    ]);
                } else {
                    console.log(`Invalid values found: ${productPrice}, ${width}, ${height}, ${quantity}`);
                    return res.status(500).json({ message: 'Sistemsel bir hata meydana geldi' });
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }

    // Apply any discount logic
    console.log(`Total Cart Price before discount: ${totalCartPrice}`);
    let totalprice = totalCartPrice;
    let discount = 0;
    let withoutkdv = 0;
    let kdvprice = 0;

    if (req.session.coupon) {
        const coupon = req.session.coupon;
        const discountRate = parseFloat(coupon.discount_rate) || 0;
        const discountPrice = parseFloat(coupon.discount_price) || 0;

        if (discountRate > 0) {
            discount = totalCartPrice * (discountRate / 100);
        } else if (discountPrice > 0) {
            discount = discountPrice;
        }

        totalCartPrice -= discount;
    }

    // Final price calculation with VAT
    const rawtotal = totalCartPrice;
    kdvprice = (totalprice * (1 + 8 / 100)).toFixed(2);
    withoutkdv = kdvprice - totalprice;
    totalCartPrice = withoutkdv + rawtotal;
    totalCartPrice = isNaN(totalCartPrice) ? 0 : totalCartPrice;
    discount = isNaN(discount) ? 0 : discount;

    const user_basket = nodeBase64.encode(JSON.stringify(basket));
    const payment_amount = Math.round(totalCartPrice * 100);

    // Prepare order items
    try {
        const orderItems = userCart.map(cartItem => ({
            order_id: null,
            product_id: cartItem.urun_id,
            quantity: cartItem.quantity,
            width: cartItem.width,
            price: totalCartPrice,
            order_date: formatDate(new Date()),
            height: cartItem.height,
        }));

        // Create order
        const order = await Orders.create({
            order_id: generateUniqueId(),
            user_id: user.id,
            total_price: totalCartPrice,
            payment_status: 0,
            status: 'Onay Bekliyor',
            merchant_oid: merchant_oid,
            order_date: new Date(),
            OrderItems: orderItems
        }, {
            include: {
                model: OrderItem,
                as: 'OrderItems'
            }
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }

    // Proceed with payment
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
            user_address: `${country}, ${city}, ${district}, ${address}, ${address_title}`,
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

    request(options, function(error, response, body) {
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
    if (userS) {
        await ShoppingCart.destroy({
            where: { user_id: userS.id }
           });
        return res.redirect('/sepet');
    }
    res.render('order-success', {userS: req.session.user})
})

router.post("/odeme_basarili", async function (req, res) {
    const callback = req.body;

    // Callback'ten gelen hash doğrulaması
    const paytr_token = callback.merchant_oid + merchant_salt + callback.status + callback.total_amount;
    const token = crypto.createHmac('sha256', merchant_key).update(paytr_token).digest('base64');

    // Eğer hash doğrulama başarısızsa, hata döndürüyoruz
    if (token !== callback.hash) {
        throw new Error("PAYTR notification failed: bad hash");
    }
    console.log('callback: ' + token)

    // Ödeme başarılıysa, siparişin ödeme durumunu güncelliyoruz
    if (callback.status === 'success') {
        try {
            // Siparişi 'merchant_oid' ile buluyoruz
            const order_success = await Orders.findOne({
                where: { merchant_oid: callback.merchant_oid }
            });

            // Eğer sipariş bulunursa
            if (order_success) {
                // Siparişi güncelliyoruz ve ödeme durumunu 1 (başarılı) yapıyoruz
                await order_success.update({
                    payment_status: 1, // Ödeme başarılı
                    status: 'Ödeme Tamamlandı' // Sipariş durumu 'Ödeme Tamamlandı' olarak güncelleniyor
                });

                // Siparişin ID'sine göre sipariş detay sayfasına yönlendiriyoruz
                res.redirect(`/siparisler/${order_success.order_id}`);
            } else {
                // Sipariş bulunamadığında hata mesajı
                res.status(404).send('Order not found');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        // Ödeme başarısızsa ana sayfaya yönlendiriyoruz
        res.redirect('/');
    }
});




// try {
//     const userId = req.session.user.id;
//     const userCart = await ShoppingCart.findAll({
//         where: { user_id: userId },
//         include: [{
//             model: Products,
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



module.exports = router;
