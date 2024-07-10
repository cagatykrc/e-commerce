const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const https = require('https');

const sequelize = require('./utility/database');
const profileRoutes = require('./routes/profile');
const authRoutes = require('./routes/auth');
const indexRoute = require('./routes/index');
const urunRoute = require('./routes/urun');
const adminRoutes = require('./routes/admin');
const categoryRoute = require('./routes/category');
const paymentController = require('./controllers/paymentController');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
dotenv.config();

const app = express();
const secretKey = crypto.randomBytes(32).toString('hex');


const isProduction = process.env.NODE_ENV === 'production';

// SSL ayarları
const sslOptions = isProduction ? {
  key: fs.readFileSync('path/to/private-key.key'),
  cert: fs.readFileSync('path/to/certificate.crt')
} : null;

const sessionStore = new SequelizeStore({
    db: sequelize,
  });

app.use(session({
  store: sessionStore,
  secret: secretKey,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 48 * 60 * 60 * 1000 // 2 gün
  }
}));

sessionStore.sync();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/profil', profileRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/', indexRoute);
app.use('/urun', urunRoute);
app.use('/ctgry', categoryRoute);
app.use('/odeme', paymentController);

// 404 Sayfası
app.get('*', (req, res) => {
  res.status(404).render('404', { userS: req.session.user });
});

// Sequelize modellerini senkronize et ve sunucuyu başlat
(async () => {
  try {
    await sequelize.sync({alter:true});

    const PORT = process.env.PORT || 80;

    if (isProduction && sslOptions) {
      https.createServer(sslOptions, app).listen(PORT, "0.0.0.0", () => {
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
