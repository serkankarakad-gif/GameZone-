/* ================================================================
   GAME ZONE ERP — login.js  v5.1
   Firebase hazır olmadan login denemesini bekletir.
   ================================================================ */

function showScreen(id){ ['welcome','login','register','forgot'].forEach(function(s){var el=document.getElementById(s);if(el)el.style.display=(s===id)?'flex':'none';}); }
function openLogin(){showScreen('login');}
function openRegister(){showScreen('register');}
function openForgot(){showScreen('forgot');}
window.showScreen=showScreen; window.openLogin=openLogin; window.openRegister=openRegister; window.openForgot=openForgot;

/* Firebase hazır değilse butonu "Bağlanıyor..." yap ve bekle */
async function waitForFirebase(){
  if(window._fbReady) return true;
  if(window._fbReadyPromise) return window._fbReadyPromise;
  /* timeout fallback — 10 saniye sonra hata ver */
  return new Promise(function(res){setTimeout(function(){res(!!window._fbReady);},10000);});
}

async function doLogin(e){
  e.preventDefault();
  var btn=e.target.querySelector('button[type=submit]');
  var origText=btn.textContent;
  btn.disabled=true; btn.textContent='Bağlanıyor...';

  /* Firebase hazır olana kadar bekle */
  var ready=await waitForFirebase();
  var auth=window.fbAuth||window.auth;

  if(!ready||!window._fbAuthLib||!auth){
    if(typeof toast==='function')toast('Sunucu bağlantısı kurulamadı. İnterneti kontrol et.','error');
    btn.disabled=false; btn.textContent=origText; return;
  }

  btn.textContent='Giriş yapılıyor...';
  var u=document.getElementById('login-user').value.trim();
  var p=document.getElementById('login-pass').value;
  if(!u||!p){toast('Tüm alanları doldurun','error');btn.disabled=false;btn.textContent=origText;return;}

  var email=u.includes('@')?u:(u+'@gamezone.tr');
  try{
    await window._fbAuthLib.signInWithEmailAndPassword(auth,email,p);
    if(typeof showLS==='function')showLS('Veriler yükleniyor...');
  }catch(err){
    console.error('Login hata:',err.code);
    var msg='Giriş başarısız';
    if(['auth/user-not-found','auth/wrong-password','auth/invalid-credential','auth/invalid-email'].includes(err.code)) msg='Kullanıcı adı veya şifre hatalı';
    if(err.code==='auth/too-many-requests') msg='Çok fazla deneme. Birkaç dakika bekle.';
    if(err.code==='auth/network-request-failed'){if(typeof showNoNet==='function')showNoNet();return;}
    if(err.code==='auth/user-disabled') msg='Bu hesap engellendi.';
    if(typeof toast==='function')toast(msg,'error');
    btn.disabled=false; btn.textContent=origText;
  }
}
window.doLogin=doLogin;

async function doRegister(e){
  e.preventDefault();
  var btn=e.target.querySelector('button[type=submit]');
  var origText=btn.textContent;
  btn.disabled=true; btn.textContent='Bağlanıyor...';

  var ready=await waitForFirebase();
  var auth=window.fbAuth||window.auth;
  if(!ready||!window._fbAuthLib||!auth){toast('Sunucu bağlantısı yok','error');btn.disabled=false;btn.textContent=origText;return;}

  btn.textContent='Kayıt olunuyor...';
  var u=document.getElementById('reg-user').value.trim();
  var em=document.getElementById('reg-email').value.trim();
  var pw=document.getElementById('reg-pass').value;
  if(!u||!em||!pw){toast('Tüm alanları doldurun','error');btn.disabled=false;btn.textContent=origText;return;}
  if(u.length<3){toast('Kullanıcı adı en az 3 karakter','error');btn.disabled=false;btn.textContent=origText;return;}
  if(pw.length<6){toast('Şifre en az 6 karakter','error');btn.disabled=false;btn.textContent=origText;return;}

  try{
    var cred=await window._fbAuthLib.createUserWithEmailAndPassword(auth,em,pw);
    window.fbUser=cred.user; state.user={name:u,email:em,isNew:true,uid:cred.user.uid};
    if(typeof showLS==='function')showLS('Hesap oluşturuluyor...');
    if(typeof saveFsState==='function')await saveFsState();
    if(typeof hideLS==='function')hideLS();
    if(typeof showMain==='function')showMain(true);
  }catch(err){
    console.error('Register hata:',err.code);
    var msg='Kayıt başarısız';
    if(err.code==='auth/email-already-in-use') msg='Bu e-posta zaten kullanımda';
    if(err.code==='auth/invalid-email') msg='Geçersiz e-posta adresi';
    if(err.code==='auth/weak-password') msg='Şifre çok zayıf (min 6 karakter)';
    if(err.code==='auth/network-request-failed'){if(typeof showNoNet==='function')showNoNet();return;}
    toast(msg,'error'); btn.disabled=false; btn.textContent=origText;
  }
}
window.doRegister=doRegister;

async function doForgot(e){
  e.preventDefault();
  var ready=await waitForFirebase();
  var auth=window.fbAuth||window.auth;
  if(!ready||!window._fbAuthLib||!auth){toast('Sunucu bağlantısı yok','error');return;}
  var em=document.getElementById('forgot-email').value.trim();
  if(!em){toast('E-posta adresinizi girin','error');return;}
  try{
    await window._fbAuthLib.sendPasswordResetEmail(auth,em);
    toast('Sıfırlama e-postası gönderildi! 📧 Gelen kutunu kontrol et.','success');
    showScreen('login');
  }catch(err){
    console.error('Forgot:',err.code);
    toast('Gönderilemedi — adresi kontrol et','error');
  }
}
window.doForgot=doForgot;

function playDestan(){
  var lines=['"İki kardeş, bir hayaldi bu oyun...','Serkan ile Resul, geceyi gündüze kattı.','Her satır kod bir umuttu, her bug bir ders.','81 ile açılan kapı, sizin için örüldü."'];
  var box=document.querySelector('.destan-text'); if(!box)return;
  var orig=box.innerHTML; box.textContent=''; var i=0;
  var iv=setInterval(function(){if(i<lines.length){box.textContent+=(i?'\n':'')+lines[i++];}else{clearInterval(iv);setTimeout(function(){box.innerHTML=orig;},4000);}},900);
}
window.playDestan=playDestan;
