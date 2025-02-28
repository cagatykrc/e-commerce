const Products = require('./Products');
const ProductVariant = require('./ProductVariant');
const Yorumlar = require('./Yorumlar');
const Users = require('./Users');
const Kategoriler = require('./Kategoriler');
const productDesc = require('./productDesc');
const OrderItem = require('./OrderItem');
const Orders = require('./Orders');
const Showcase = require('./Showcase');
const ShoppingCart = require('./ShoppingCart');
const Addresses = require('./Addresses');
const Kategorilertab = require('./Kategorilertab');

// Products İlişkileri
Products.hasMany(Showcase, { as: 'showcaseItems', foreignKey: 'product_id' });
Products.hasMany(OrderItem, { as: 'productOrderItems', foreignKey: 'urun_id' });
Products.hasMany(Yorumlar, { as: 'productYorumlar', foreignKey: 'urun_id', onDelete: 'CASCADE' });
Products.belongsTo(productDesc, { as: 'productDescription', foreignKey: 'productdesc_id' });
Products.belongsTo(Users, { as: 'creator', foreignKey: 'olusturan_user_id' });
Products.belongsTo(Kategoriler, { as: 'productCategory', foreignKey: 'category_low' });
Products.hasMany(ProductVariant, { as: 'productVariants', foreignKey: 'urun_id' });
Products.hasMany(ShoppingCart, { as: 'cartItems', foreignKey: 'urun_id' });

// OrderItem İlişkileri
OrderItem.belongsTo(Products, { as: 'orderedProduct', foreignKey: 'urun_id' });
OrderItem.belongsTo(Orders, { as: 'parentOrder', foreignKey: 'order_id' });

// Orders İlişkileri
Orders.hasMany(OrderItem, { as: 'orderItems', foreignKey: 'order_id' });
Orders.belongsTo(Users, { as: 'orderOwner', foreignKey: 'user_id' });

// Users İlişkileri
Users.hasMany(Orders, { as: 'userOrders', foreignKey: 'user_id' });
Users.hasMany(Addresses, { as: 'userAddresses', foreignKey: 'user_id' });
Users.hasMany(Yorumlar, { as: 'userYorumlar', foreignKey: 'kullanici_id' });
Users.hasMany(ShoppingCart, { as: 'userCart', foreignKey: 'user_id', sourceKey: 'user_id' });

// Addresses İlişkileri
Addresses.belongsTo(Users, { as: 'addressOwner', foreignKey: 'user_id' });

// Kategoriler İlişkileri
Kategoriler.hasMany(Products, { as: 'categoryProducts', foreignKey: 'category_low' });
Kategoriler.belongsTo(Kategorilertab, { as: 'parentTab', foreignKey: 'kategori_tab_id' });

// Kategorilertab İlişkileri
Kategorilertab.hasMany(Kategoriler, { as: 'subCategories', foreignKey: 'kategori_tab_id', onDelete: 'CASCADE' });

// ShoppingCart İlişkileri
ShoppingCart.belongsTo(Users, { as: 'cartOwner', foreignKey: 'user_id' });
ShoppingCart.belongsTo(Products, { as: 'product', foreignKey: 'urun_id' });

// ProductVariant İlişkileri
ProductVariant.belongsTo(Products, { as: 'parentProduct', foreignKey: 'urun_id' });

// Yorumlar İlişkileri
Yorumlar.belongsTo(Products, { as: 'commentedProduct', foreignKey: 'urun_id' });
Yorumlar.belongsTo(Users, { as: 'commentOwner', foreignKey: 'kullanici_id' });

module.exports = {
    Products,
    ProductVariant,
    Yorumlar,
    Users,
    Kategoriler,
    productDesc,
    OrderItem,
    Orders,
    Showcase,
    ShoppingCart,
    Addresses,
    Kategorilertab
}; 