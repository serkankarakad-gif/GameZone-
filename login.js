/* ================================================================
   GAME ZONE ERP — login.js
   firebase-init.js sonra yuklenir; fbAuth zaten window'da hazir.
   ================================================================ */

function showScreen(id) {
  ['welcome','login','register','forgot'].forEach(function(s) {
    var el = document.getElementById(s);
    if (el) el.style.display = (s === id) ? 'flex' : 'none';
  });
}
function openLogin()    { showScreen('login');    }
function openRegister() { showScreen('register'); }
function openForgot()   { showScreen('forgot');   }
window.showScreen   = showScreen;
window.openLogin    = openLogin;
window.openRegister = openRegister;
window.openForgot   = openForgot;

async function doLogin(e) {
  e.preventDefault();
  var auth = window.fbAuth || window.auth;
  if (!window._fbAuthLib || !auth) {
    if (typeof toast === 'function') toast('Sunucuya baglanamıyor — internet kontrol et', 'error');
    return;
  }
  var u = document.getElementById('login-user').value.trim();
  var p = document.getElementById('login-pass').value;
  if (!u || !p) { toast('Tum alanlari doldurun', 'error'); return; }
  var btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Giris yapiliyor...';
  var email = u.includes('@') ? u : (u + '@gamezone.tr');
  try {
    await window._fbAuthLib.signInWithEmailAndPassword(auth, email, p);
    if (typeof showLS === 'function') showLS('Veriler yukleniyor...');
  } catch (err) {
    console.error('Login:', err.code);
    var msg = 'Giris basarisiz';
    if (['auth/user-not-found','auth/wrong-password','auth/invalid-credential','auth/invalid-email'].includes(err.code))
      msg = 'Kullanici adi veya sifre hatali';
    if (err.code === 'auth/too-many-requests')       msg = 'Cok fazla deneme. Bekle.';
    if (err.code === 'auth/network-request-failed')  { if(typeof showNoNet==='function')showNoNet(); return; }
    if (err.code === 'auth/user-disabled')            msg = 'Bu hesap engellendi.';
    if (typeof toast === 'function') toast(msg, 'error');
    btn.disabled = false; btn.textContent = 'Giris Yap';
  }
}
window.doLogin = doLogin;

async function doRegister(e) {
  e.preventDefault();
  var auth = window.fbAuth || window.auth;
  if (!window._fbAuthLib || !auth) { toast('Sunucuya baglanamıyor', 'error'); return; }
  var u  = document.getElementById('reg-user').value.trim();
  var em = document.getElementById('reg-email').value.trim();
  var pw = document.getElementById('reg-pass').value;
  if (!u || !em || !pw) { toast('Tum alanlari doldurun', 'error'); return; }
  if (u.length < 3)     { toast('Kullanici adi en az 3 karakter', 'error'); return; }
  if (pw.length < 6)    { toast('Sifre en az 6 karakter', 'error'); return; }
  var btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Kayit olunuyor...';
  try {
    var cred = await window._fbAuthLib.createUserWithEmailAndPassword(auth, em, pw);
    window.fbUser = cred.user;
    state.user = { name: u, email: em, isNew: true, uid: cred.user.uid };
    if (typeof showLS === 'function') showLS('Hesap olusturuluyor...');
    if (typeof saveFsState === 'function') await saveFsState();
    if (typeof hideLS === 'function') hideLS();
    if (typeof showMain === 'function') showMain(true);
  } catch (err) {
    console.error('Register:', err.code);
    var msg = 'Kayit basarisiz';
    if (err.code === 'auth/email-already-in-use') msg = 'Bu e-posta kullanımda';
    if (err.code === 'auth/invalid-email')         msg = 'Gecersiz e-posta';
    if (err.code === 'auth/weak-password')         msg = 'Sifre cok zayif';
    if (err.code === 'auth/network-request-failed') { if(typeof showNoNet==='function')showNoNet(); return; }
    toast(msg, 'error');
    btn.disabled = false; btn.textContent = 'Hesap Olustur';
  }
}
window.doRegister = doRegister;

async function doForgot(e) {
  e.preventDefault();
  var auth = window.fbAuth || window.auth;
  if (!window._fbAuthLib || !auth) { toast('Internet yok', 'error'); return; }
  var em = document.getElementById('forgot-email').value.trim();
  if (!em) { toast('E-posta girin', 'error'); return; }
  try {
    await window._fbAuthLib.sendPasswordResetEmail(auth, em);
    toast('Sifirlama e-postasi gonderildi! inbox kontrol et', 'success');
    showScreen('login');
  } catch (err) {
    toast('Gonderilemedi — adresi kontrol et', 'error');
  }
}
window.doForgot = doForgot;

function playDestan() {
  var lines = ['"Iki kardes, bir hayaldi bu oyun...','Serkan ile Resul, geceyi gundüze kattı.','Her satir kod bir umuttu, her bug bir ders.','81 ile acilan kapi, sizin icin örüldü."'];
  var box = document.querySelector('.destan-text');
  if (!box) return;
  var orig = box.innerHTML; box.textContent = ''; var i = 0;
  var iv = setInterval(function() {
    if (i < lines.length) { box.textContent += (i ? '\n' : '') + lines[i++]; }
    else { clearInterval(iv); setTimeout(function() { box.innerHTML = orig; }, 4000); }
  }, 900);
}
window.playDestan = playDestan;
