router.get('/giris', (req, res, next) => {
    const userS = req.session.user;
  
    if (userS) {
      return res.redirect('/');
    }
  
    // Öncelikle bildirimi kontrol et
    const notification = req.session.notification || null;
  
    // Eğer bir bildirim varsa
    if (notification) {
      // Bildirimi göster ve sil
      res.render('giris', { notification: notification, userS });
      return delete req.session.notification; // Bildirimi gösterdikten sonra sil
    } else {
      // Bildirim yoksa normal render yap
      return res.render('giris', { userS, notification: null });
    }
    next()
  });