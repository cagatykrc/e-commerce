// priceCalc.js
const express = require('express');
const router = express.Router();
function calculateTotalPrice(productPrice, width, height, quantity, productType) {
    let totalPrice = 0;

    if (productType === 1) {
        // Ürün türü 1 ise metre cinsinden hesapla
        totalPrice = productPrice * quantity; // toplam fiyat
    } else if (productType === 0) {
        // Ürün türü 0 ise metrekare cinsinden hesapla
        const squareMeters = (height * width) / 10000;
        totalPrice = squareMeters * productPrice * quantity; // toplam fiyat
        console.log('hesaplama:' +totalPrice);
    }
    return totalPrice;
}

// Export the function
module.exports = calculateTotalPrice;
