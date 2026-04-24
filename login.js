/* ================================================================
   login.js — Game Zone ERP v5.0
   Giriş, Kayıt, Şifre Sıfırlama — Firebase Compat SDK uyumlu
   Her şey Firebase Firestore'a kaydolur (bulut kalıcı kayıt)
   ================================================================ */

/* ---- EKRAN YÖNETİMİ ---- */
function showScreen(id) {
  ['welcome', 'login', 'register', 'forgot'].forEach(s => {
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

  if (!fbAuth) { toast('Firebase henüz hazır değil, bekle...', 'error'); return; }

  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;

  if (!u || !p) { toast('Tüm alanları doldurun', 'error'); return; }

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Giriş yapılıyor...';

  /* @ yoksa kullanıcı adı girilmiştir, e-posta formatına çevir */
  const email = u.includes('@') ? u : u + '@gamezone.tr';

  try {
    await fbAuth.signInWithEmailAndPassword(email, p);
    showLS('Veriler yükleniyor...');
    /* onAuthStateChanged devralır, showMain oradan çağrılır */
  } catch (err) {
    let msg = 'Giriş başarısız';
    if (['auth/user-not-found',
         'auth/wrong-password',
         'auth/invalid-credential',
         'auth/invalid-email'].includes(err.code)) {
      msg = 'Kullanıcı adı veya şifre hatalı';
    }
    if (err.code === 'auth/too-many-requests') msg = 'Çok fazla deneme. Lütfen bekle.';
    if (err.code === 'auth/network-request-failed') { showNoNet(); return; }

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

  if (!fbAuth) { toast('Firebase henüz hazır değil, bekle...', 'error'); return; }

  const u  = document.getElementById('reg-user').value.trim();
  const em = document.getElementById('reg-email').value.trim();
  const pw = document.getElementById('reg-pass').value;

  if (!u || !em || !pw)  { toast('Tüm alanları doldurun', 'error'); return; }
  if (u.length < 3)      { toast('Kullanıcı adı en az 3 karakter', 'error'); return; }
  if (pw.length < 6)     { toast('Şifre en az 6 karakter', 'error'); return; }

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Kayıt olunuyor...';

  try {
    const cred = await fbAuth.createUserWithEmailAndPassword(em, pw);
    fbUser = cred.user;

    /* State'e kullanıcı bilgisini yaz */
    state.user = {
      name:  u,
      email: em,
      isNew: true,
      uid:   cred.user.uid
    };

    showLS('Hesap oluşturuluyor...');

    /* Firebase'e ilk kaydı yap */
    await saveFsState();

    hideLS();
    showMain(true);

  } catch (err) {
    let msg = 'Kayıt başarısız';
    if (err.code === 'auth/email-already-in-use') msg = 'Bu e-posta zaten kullanımda';
    if (err.code === 'auth/invalid-email')        msg = 'Geçersiz e-posta adresi';
    if (err.code === 'auth/weak-password')        msg = 'Şifre çok zayıf';
    if (err.code === 'auth/network-request-failed') { showNoNet(); return; }

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
    toast('Sıfırlama e-postası gönderildi 📧', 'success');
    showScreen('login');
  } catch (err) {
    toast('Gönderilemedi. E-postayı kontrol edin.', 'error');
  }
}

/* ================================================================
   ANA UYGULAMAYI AÇ
   ================================================================ */
function showMain(isNew = false) {
  hideLS();
  hideNoNet();

  /* Auth ekranlarını gizle */
  ['welcome', 'login', 'register', 'forgot'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  /* Ana shell'i göster */
  document.getElementById('main').classList.add('active');

  /* Eksik state alanlarını doldur */
  if (!state.tesisler) state.tesisler = { bahce: [], ciftlik: [], fabrika: [], maden: [] };
  ['bahce', 'ciftlik', 'fabrika', 'maden'].forEach(k => {
    if (!state.tesisler[k]) state.tesisler[k] = [];
  });
  if (!state.depolar)       state.depolar       = [];
  if (!state.kripto)        state.kripto        = {};
  if (!state.kriptoHistory) state.kriptoHistory = [];
  if (!state.exportOrders || state.exportOrders.length === 0) generateExportOrders();
  if (!state.pazarListings) state.pazarListings  = [];

  /* Oyun verilerini hazırla */
  generateIhaleler();
  renderAll();
  checkBanned();

  /* Chat avatar */
  const av = document.getElementById('chat-av-display');
  if (av) av.textContent = state.user?.name ? state.user.name[0].toUpperCase() : '🙂';

  /* Realtime chat bağlantısını 800ms sonra kur */
  setTimeout(initRealtimeChat, 800);

  /* Yeni kullanıcı → hoş geldin modalı */
  if (isNew || (state.user && state.user.isNew)) {
    setTimeout(() => openModal('welcome-modal'), 400);
  }
}

function closeWelcomeModal() {
  closeModal('welcome-modal');
  if (state.user) state.user.isNew = false;
  saveState();
  /* Firebase'e de kaydet */
  if (fbDb && fbUser) saveFsState();
  confetti();
}

/* ================================================================
   ÇIKIŞ YAP
   ================================================================ */
async function logoutGame() {
  if (!confirm('Çıkış yapmak istediğine emin misin?')) return;

  /* Firebase oturumu kapat */
  if (fbAuth) {
    try { await fbAuth.signOut(); } catch (e) { console.warn('signOut:', e); }
  }

  /* Realtime chat dinleyicisini temizle */
  if (fbChatUnsub) { try { fbChatUnsub(); } catch (_) {} fbChatUnsub = null; }
  if (fbUnsub)     { try { fbUnsub(); }     catch (_) {} fbUnsub     = null; }

  /* Lokal state temizle */
  state.user = null;
  saveState();

  /* Ana uygulamayı gizle */
  document.getElementById('main').classList.remove('active');
  showScreen('welcome');
}

/* ================================================================
   HESABI SIFIRLA (tüm veri silinir)
   ================================================================ */
function resetGame() {
  if (!confirm('TÜM VERİLERİN SİLİNECEK! Emin misin?')) return;
  if (!confirm('Son kez soruyorum — gerçekten silsinmi?')) return;

  localStorage.removeItem(LS_KEY);

  /* Firebase'deki veriyi de sil */
  if (fbDb && fbUser) {
    fbDb.collection('players').doc(fbUser.uid).delete().catch(() => {});
  }

  location.reload();
}

/* ================================================================
   UYGULAMA BAŞLATICI
   ================================================================ */
initFirebase();
