/* ================================================================
   GAME ZONE ERP v5.0 — login.js
   Auth: giriş, kayıt, şifre sıfırlama
   ================================================================ */

/* ---------- EKRAN GEÇİŞLERİ ---------- */
function showScreen(id) {
  ['welcome','login','register','forgot'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? 'flex' : 'none';
  });
}
window.showScreen = showScreen;

function openLogin()    { showScreen('login'); }
function openRegister() { showScreen('register'); }
function openForgot()   { showScreen('forgot'); }
window.openLogin    = openLogin;
window.openRegister = openRegister;
window.openForgot   = openForgot;

/* ---------- GİRİŞ YAP ---------- */
async function doLogin(e) {
  e.preventDefault();
  if (!window._fbAuthLib || !window.fbAuth) {
    window.toast('Sunucuya bağlanılamıyor', 'error');
    return;
  }
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  if (!u || !p) { window.toast('Tüm alanları doldurun', 'error'); return; }

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Giriş yapılıyor...';

  const email = u.includes('@') ? u : u + '@gamezone.tr';

  try {
    await window._fbAuthLib.signInWithEmailAndPassword(window.fbAuth, email, p);
    window.showLS('Veriler yükleniyor...');
  } catch (err) {
    let msg = 'Giriş başarısız';
    if (['auth/user-not-found','auth/wrong-password','auth/invalid-credential'].includes(err.code))
      msg = 'Kullanıcı adı veya şifre hatalı';
    if (err.code === 'auth/too-many-requests')
      msg = 'Çok fazla deneme. Biraz bekle.';
    if (err.code === 'auth/network-request-failed') { window.showNoNet(); return; }
    window.toast(msg, 'error');
    btn.disabled = false;
    btn.textContent = 'Giriş Yap';
  }
}
window.doLogin = doLogin;

/* ---------- KAYIT OL ---------- */
async function doRegister(e) {
  e.preventDefault();
  if (!window._fbAuthLib || !window.fbAuth) {
    window.toast('Sunucuya bağlanılamıyor', 'error');
    return;
  }
  const u  = document.getElementById('reg-user').value.trim();
  const em = document.getElementById('reg-email').value.trim();
  const pw = document.getElementById('reg-pass').value;

  if (!u || !em || !pw) { window.toast('Tüm alanları doldurun', 'error'); return; }
  if (pw.length < 6)    { window.toast('Şifre en az 6 karakter olmalı', 'error'); return; }
  if (u.length < 3)     { window.toast('Kullanıcı adı en az 3 karakter', 'error'); return; }

  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Kayıt olunuyor...';

  try {
    const cred = await window._fbAuthLib.createUserWithEmailAndPassword(window.fbAuth, em, pw);
    window.fbUser = cred.user;
    window.state.user = { name: u, email: em, isNew: true, uid: cred.user.uid };
    window.showLS('Hesap oluşturuluyor...');
    await window.saveFsState();
    window.hideLS();
    window.showMain(true);
  } catch (err) {
    let msg = 'Kayıt başarısız';
    if (err.code === 'auth/email-already-in-use') msg = 'Bu e-posta zaten kullanımda';
    if (err.code === 'auth/invalid-email')        msg = 'Geçersiz e-posta adresi';
    if (err.code === 'auth/weak-password')        msg = 'Şifre çok zayıf';
    if (err.code === 'auth/network-request-failed') { window.showNoNet(); return; }
    window.toast(msg, 'error');
    btn.disabled = false;
    btn.textContent = 'Hesap Oluştur';
  }
}
window.doRegister = doRegister;

/* ---------- ŞİFRE SIFIRLA ---------- */
async function doForgot(e) {
  e.preventDefault();
  if (!window._fbAuthLib) { window.toast('İnternet bağlantısı yok', 'error'); return; }
  const em = document.getElementById('forgot-email').value.trim();
  if (!em) { window.toast('E-posta adresinizi girin', 'error'); return; }

  try {
    await window._fbAuthLib.sendPasswordResetEmail(window.fbAuth, em);
    window.toast('Sıfırlama e-postası gönderildi 📧', 'success');
    showScreen('login');
  } catch (err) {
    window.toast('E-posta gönderilemedi', 'error');
  }
}
window.doForgot = doForgot;

/* ---------- DESTAN ---------- */
function playDestan() {
  const lines = [
    'İki kardeş, bir hayaldi bu oyun...',
    'Serkan ile Resul, geceyi gündüze kattı.',
    'Her satır kod bir umuttu, her bug bir ders.',
    '81 ile açılan kapı, sizin için örüldü.'
  ];
  let i = 0;
  const box = document.querySelector('.destan-text');
  if (!box) return;
  const orig = box.innerHTML;
  box.textContent = '';
  const iv = setInterval(() => {
    if (i < lines.length) { box.textContent += (i ? '\n' : '') + lines[i++]; }
    else { clearInterval(iv); setTimeout(() => { box.innerHTML = orig; }, 4000); }
  }, 900);
}
window.playDestan = playDestan;
