/* ================================================================
   login.js — Game Zone ERP v5.0
   Giriş & Kayıt — tam hata yönetimi
   ================================================================ */

/* ---- EKRAN YÖNETİMİ ---- */
function showScreen(id) {
  ['welcome','login','register','forgot'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = (s === id) ? 'flex' : 'none';
  });
}
function openLogin()    { showScreen('login');    }
function openRegister() { showScreen('register'); }
function openForgot()   { showScreen('forgot');   }

/* ================================================================
   GİRİŞ YAP
   ================================================================ */
async function doLogin(e) {
  e.preventDefault();

  /* Firebase hazır mı? */
  if (!fbAuth) {
    toast('🔄 Firebase hazırlanıyor, 2 saniye bekle...', 'error');
    setTimeout(() => {}, 2000);
    return;
  }

  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;

  if (!u) { toast('Kullanıcı adı / e-posta girin', 'error'); return; }
  if (!p) { toast('Şifre girin', 'error'); return; }

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = '⏳ Giriş yapılıyor...';

  /* Kullanıcı adı girilmişse e-posta formatına çevir */
  const email = u.includes('@') ? u : u.toLowerCase() + '@gamezone.tr';

  console.log('Login attempt:', email);

  try {
    const cred = await fbAuth.signInWithEmailAndPassword(email, p);
    console.log('Login OK:', cred.user.uid);
    fbUser = cred.user;
    showLS('Veriler yükleniyor...');
    /* onAuthStateChanged → loadFsState → showMain zinciri devralır */

  } catch (err) {
    console.error('Login error:', err.code, err.message);

    const MAP = {
      'auth/user-not-found':        '❌ Hesap bulunamadı. Kayıt ol!',
      'auth/wrong-password':        '❌ Şifre yanlış',
      'auth/invalid-credential':    '❌ Kullanıcı adı veya şifre hatalı',
      'auth/invalid-email':         '❌ Geçersiz e-posta formatı',
      'auth/user-disabled':         '🚫 Hesabın devre dışı bırakıldı',
      'auth/too-many-requests':     '⏳ Çok fazla deneme. Biraz bekle.',
      'auth/network-request-failed':'📡 İnternet bağlantısı yok',
      'auth/operation-not-allowed': '⚠️ E-posta girişi aktif değil (Firebase Console)',
    };

    const msg = MAP[err.code] || ('Hata: ' + (err.message || err.code));
    toast(msg, 'error');
    btn.disabled = false;
    btn.textContent = 'Giriş Yap';
  }
}

/* ================================================================
   KAYIT OL
   ================================================================ */
async function doRegister(e) {
  e.preventDefault();

  if (!fbAuth) {
    toast('🔄 Firebase hazırlanıyor, 2 saniye bekle...', 'error');
    return;
  }

  const u  = document.getElementById('reg-user').value.trim();
  const em = document.getElementById('reg-email').value.trim();
  const pw = document.getElementById('reg-pass').value;

  /* Validasyon */
  if (!u)          { toast('Kullanıcı adı girin', 'error'); return; }
  if (u.length < 3){ toast('Kullanıcı adı en az 3 karakter', 'error'); return; }
  if (u.length >16){ toast('Kullanıcı adı max 16 karakter', 'error'); return; }
  if (!/^[a-zA-Z0-9_]+$/.test(u)) { toast('Sadece harf, rakam ve _ kullan', 'error'); return; }
  if (!em)         { toast('E-posta girin', 'error'); return; }
  if (!em.includes('@')) { toast('Geçerli e-posta girin', 'error'); return; }
  if (!pw)         { toast('Şifre girin', 'error'); return; }
  if (pw.length < 6){ toast('Şifre en az 6 karakter olmalı', 'error'); return; }

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = '⏳ Kayıt olunuyor...';

  console.log('Register attempt:', em, u);

  try {
    /* Firebase Auth'ta hesap oluştur */
    const cred = await fbAuth.createUserWithEmailAndPassword(em, pw);
    console.log('Register OK:', cred.user.uid);

    fbUser = cred.user;

    /* State'e kullanıcı bilgisini yaz */
    state.user = {
      name:     u,
      email:    em,
      isNew:    true,
      uid:      cred.user.uid,
      joinDate: Date.now()
    };

    /* Başlangıç parası zaten state'te 20000 */
    showLS('Hesap oluşturuluyor...');

    /* Firestore'a kaydet */
    try {
      await saveFsState();
      console.log('Firestore kayıt OK');
    } catch (fsErr) {
      console.warn('Firestore kayıt hatası (offline devam):', fsErr);
      saveState(); /* Lokal kaydet */
    }

    hideLS();
    showMain(true);

  } catch (err) {
    console.error('Register error:', err.code, err.message);

    const MAP = {
      'auth/email-already-in-use':  '❌ Bu e-posta zaten kayıtlı. Giriş yap!',
      'auth/invalid-email':         '❌ Geçersiz e-posta adresi',
      'auth/weak-password':         '❌ Şifre çok zayıf (en az 6 karakter)',
      'auth/operation-not-allowed': '⚠️ E-posta kaydı aktif değil (Firebase Console\'da aç)',
      'auth/network-request-failed':'📡 İnternet bağlantısı yok',
      'auth/too-many-requests':     '⏳ Çok fazla istek. Bekle.',
    };

    const msg = MAP[err.code] || ('Kayıt hatası: ' + (err.message || err.code));
    toast(msg, 'error');
    btn.disabled = false;
    btn.textContent = 'Hesap Oluştur';
  }
}

/* ================================================================
   ŞİFRE SIFIRLA
   ================================================================ */
async function doForgot(e) {
  e.preventDefault();

  if (!fbAuth) { toast('İnternet bağlantısı yok', 'error'); return; }

  const em = document.getElementById('forgot-email').value.trim();
  if (!em) { toast('E-posta adresinizi girin', 'error'); return; }

  try {
    await fbAuth.sendPasswordResetEmail(em);
    toast('📧 Sıfırlama e-postası gönderildi!', 'success');
    showScreen('login');
  } catch (err) {
    const MAP = {
      'auth/user-not-found':     '❌ Bu e-posta kayıtlı değil',
      'auth/invalid-email':      '❌ Geçersiz e-posta',
      'auth/network-request-failed': '📡 İnternet yok',
    };
    toast(MAP[err.code] || 'Gönderilemedi', 'error');
  }
}

/* ================================================================
   ANA UYGULAMAYI AÇ
   ================================================================ */
function showMain(isNew = false) {
  hideLS();
  hideNoNet();

  ['welcome','login','register','forgot'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  document.getElementById('main').classList.add('active');

  /* Eksik state alanlarını garantiye al */
  if (!state.bank)      state.bank      = { balance: 0, investment: 0, credit: 0, profit: 0 };
  if (!state.tesisler)  state.tesisler  = { bahce: [], ciftlik: [], fabrika: [], maden: [] };
  ['bahce','ciftlik','fabrika','maden'].forEach(k => {
    if (!state.tesisler[k]) state.tesisler[k] = [];
  });
  if (!state.depolar)       state.depolar       = [];
  if (!state.kripto)        state.kripto        = {};
  if (!state.kriptoHistory) state.kriptoHistory = [];
  if (!state.notifications) state.notifications = [];
  if (!state.pazarListings) state.pazarListings  = [];
  if (!state.exportOrders || !state.exportOrders.length) generateExportOrders();

  generateIhaleler();
  renderAll();
  checkBanned();

  /* Chat avatar */
  const av = document.getElementById('chat-av-display');
  if (av) av.textContent = state.user?.name ? state.user.name[0].toUpperCase() : '🙂';

  /* Chat bağlantısı */
  setTimeout(initRealtimeChat, 1000);

  /* Yeni kullanıcı modalı */
  if (isNew || state.user?.isNew) {
    setTimeout(() => openModal('welcome-modal'), 500);
  }
}

function closeWelcomeModal() {
  closeModal('welcome-modal');
  if (state.user) state.user.isNew = false;
  saveState();
  if (fbDb && fbUser) saveFsState().catch(() => {});
  confetti();
}

/* ================================================================
   ÇIKIŞ YAP
   ================================================================ */
async function logoutGame() {
  if (!confirm('Çıkış yapmak istediğine emin misin?')) return;

  if (fbAuth) {
    try { await fbAuth.signOut(); } catch (e) { console.warn('signOut:', e); }
  }

  if (fbChatUnsub) { try { fbChatUnsub(); } catch (_) {} fbChatUnsub = null; }
  if (fbUnsub)     { try { fbUnsub();     } catch (_) {} fbUnsub     = null; }

  state.user = null;
  saveState();

  document.getElementById('main').classList.remove('active');
  showScreen('welcome');
}

/* ================================================================
   HESABI SIFIRLA
   ================================================================ */
function resetGame() {
  if (!confirm('TÜM VERİLERİN SİLİNECEK! Emin misin?')) return;
  if (!confirm('Son kez: Gerçekten silinsin mi?')) return;

  localStorage.removeItem(LS_KEY);

  if (fbDb && fbUser) {
    fbDb.collection('players').doc(fbUser.uid).delete().catch(() => {});
  }

  location.reload();
}

/* ================================================================
   UYGULAMA BAŞLAT
   ================================================================ */
initFirebase();
