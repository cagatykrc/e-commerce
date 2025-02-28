const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const https = require('https');
const helmet = require('helmet');
const sessionsdb = require('./models/Sessions');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const sequelize = require('./utility/database');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// Session store'u oluştur
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions', // sessions tablosu adı
  expiration: 24 * 60 * 60 * 1000, // 24 saat
  checkExpirationInterval: 15 * 60 * 1000 // Her 15 dakikada bir kontrol et
});

const profileRoutes = require('./routes/profile');
const authRoutes = require('./routes/auth');
const indexRoute = require('./routes/index');
const urunRoute = require('./routes/urun');
const adminRoutes = require('./routes/admin');
const categoryRoute = require('./routes/category');
const paymentController = require('./controllers/paymentController');
require('./models/associations');  // İlişkileri yükle

// config.env dosyasını yükle
dotenv.config({ path: './config.env' });

const app = express();
const secretKey = crypto.randomBytes(32).toString('hex');

// 1. Cookie parser'ı en başta tanımla
app.use(cookieParser(secretKey));

// 2. Session yapılandırması
app.use(session({
  key: 'user_sid',
  secret: secretKey,
  store: sessionStore,
  resave: false,
  saveUninitialized: true, // CSRF için true olmalı
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// 3. Body parser middleware'leri
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));

// 5. View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 6. Helmet güvenlik başlıkları
app.use(helmet({
  contentSecurityPolicy: false
}));

// CSRF'den muaf tutulacak path'leri tanımla
const excludedPaths = [
  '/admin/urunolustur',
  '/urun/yorum-ekle',
  '/sepet/ekle',
  '/sepet/sil',
  '/odeme/tamamla'
];

// 7. CSRF koruması - özel durumlar için
const csrfProtection = csrf({
  cookie: true
});

// CSRF middleware - sadece gerekli route'larda kullan
app.use((req, res, next) => {
  // Her durumda locals'a csrfToken'ı ekle, excluded paths için null olarak
  res.locals.csrfToken = null;
  
  if (excludedPaths.includes(req.path)) {
    next();
  } else {
    csrfProtection(req, res, next);
  }
});

// CSRF token'ı ve user bilgisini locals'a ekle
app.use((req, res, next) => {
  // CSRF token'ı sadece gerekli route'lar için oluştur
  if (!excludedPaths.includes(req.path)) {
    res.locals.csrfToken = req.csrfToken();
  }
  res.locals.userS = req.session.user;
  next();
});

// 9. Routes
app.use('/profil', profileRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/', indexRoute);
app.use('/urun', urunRoute);
app.use('/ctgry', categoryRoute);
app.use('/odeme', paymentController);

// 10. Tek bir hata yakalayıcı
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.error('CSRF token hatası:', err);
    
    // AJAX istekleri için
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(403).json({ 
        error: true,
        message: 'Güvenlik doğrulaması başarısız'
      });
    }
    
    // Normal form gönderimi için
    req.session.notification = {
      type: 'error',
      message: 'Form doğrulama hatası, lütfen sayfayı yenileyip tekrar deneyin.'
    };
    
    // Güvenli yönlendirme
    const referer = req.get('Referrer');
    const safeReferer = referer && referer.startsWith(req.protocol + '://' + req.get('host')) 
      ? referer 
      : '/';
    
    return res.redirect(303, safeReferer);
  }

  // Diğer hatalar için
  console.error(err.stack);
  res.status(500).render('error', { 
    message: process.env.NODE_ENV === 'production' 
      ? 'Bir şeyler yanlış gitti. Lütfen daha sonra tekrar deneyin.'
      : err.message,
    error: process.env.NODE_ENV === 'production' ? {} : err,
    userS: req.session.user
  });
});

// 11. 404 Sayfası
app.get('*', (req, res) => {
  res.status(404).render('404', { userS: req.session.user });
});

// Sequelize modellerini senkronize et ve sunucuyu başlat
(async () => {
  try {
    await sequelize.sync();

    const PORT = process.env.PORT || 80;

    if (process.env.NODE_ENV === 'production') {
      https.createServer({
        key: fs.readFileSync('path/to/private-key.key'),
        cert: fs.readFileSync('path/to/certificate.crt')
      }, app).listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running securely on port ${PORT}`);
      });
    } else {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error('Veritabanı modelleri senkronize edilirken bir hata oluştu:', error);
  }
})();
