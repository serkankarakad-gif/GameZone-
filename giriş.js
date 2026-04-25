/* ==========================================================================
   giriş.js — Kayıt / Giriş / E-posta Doğrulama / Ban Kontrolü
   ========================================================================== */

(function(){

  const splash = document.getElementById('splash');
  const authScreen = document.getElementById('authScreen');
  const gameScreen = document.getElementById('gameScreen');
  const banScreen  = document.getElementById('banScreen');

  /* ---- TAB değişimi ---- */
  $$('.auth-tab').forEach(b => b.addEventListener('click', () => {
    showAuthPanel(b.dataset.tab);
    $$('.auth-tab').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
  }));

  function showAuthPanel(name){
    $$('.auth-panel').forEach(p=>p.classList.remove('active'));
    const map = { login:'loginPanel', register:'registerPanel', verify:'verifyPanel', forgot:'forgotPanel' };
    const id = map[name];
    if (id){
      const el = document.getElementById(id);
      if (el) el.classList.add('active');
    }
  }

  /* =================== KAYIT =================== */
  $('#btnRegister').addEventListener('click', async () => {
    const username = $('#regUsername').value.trim();
    const email    = $('#regEmail').value.trim().toLowerCase();
    const pass     = $('#regPass').value;
    const pass2    = $('#regPass2').value;
    const agree    = $('#regAgree').checked;

    if (username.length < 3 || username.length > 16) return toast('Kullanıcı adı 3-16 karakter olmalı', 'error');
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return toast('Kullanıcı adı sadece harf, rakam, alt çizgi içerebilir', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Geçersiz e-posta', 'error');
    if (pass.length < 6) return toast('Şifre en az 6 karakter olmalı', 'error');
    if (pass !== pass2) return toast('Şifreler aynı değil', 'error');
    if (!agree) return toast('Kuralları kabul etmelisin', 'error');

    // Kullanıcı adı benzersiz mi?
    const existing = await dbGet(`usernames/${username.toLowerCase()}`);
    if (existing) return toast('Bu kullanıcı adı alınmış', 'error');

    const btn = $('#btnRegister');
    btn.disabled = true;
    btn.textContent = 'Kaydediliyor...';

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      const uid = cred.user.uid;

      // Kullanıcı verisi
      const userObj = {
        username,
        usernameLower: username.toLowerCase(),
        email,
        level: 1,
        xp: 0,
        money: 6000,
        diamonds: 10,
        location: 'İstanbul',
        online: true,
        lastSeen: firebase.database.ServerValue.TIMESTAMP,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        banned: false,
        verified: false,
        bio: '',
        netWorth: 6000
      };
      await dbSet(`users/${uid}`, userObj);
      await dbSet(`usernames/${username.toLowerCase()}`, uid);

      // Banka açılışı
      await dbSet(`bank/${uid}`, {
        balance: 0,
        investment: 0,
        investmentDate: now(),
        loan: 0,
        nextBusinessExpense: now() + 7*24*3600*1000,
        nextSalary: now() + 7*24*3600*1000
      });

      // Doğrulama e-postası gönder
      await cred.user.sendEmailVerification();

      $('#verifyEmailText').textContent = `${email} adresine doğrulama bağlantısı gönderdik. E-postanı kontrol et, bağlantıya tıkla, sonra "Doğruladım" butonuna bas.`;
      showAuthPanel('verify');
      toast('Kayıt başarılı, e-postanı doğrula', 'success');
    } catch(e){
      console.error(e);
      let msg = 'Bir hata oluştu';
      if (e.code === 'auth/email-already-in-use') msg = 'Bu e-posta zaten kayıtlı';
      else if (e.code === 'auth/invalid-email') msg = 'Geçersiz e-posta';
      else if (e.code === 'auth/weak-password') msg = 'Şifre çok zayıf';
      toast(msg, 'error');
    }
    btn.disabled = false;
    btn.textContent = 'Kayıt Ol';
  });

  /* =================== GİRİŞ =================== */
  $('#btnLogin').addEventListener('click', async () => {
    const email = $('#loginEmail').value.trim().toLowerCase();
    const pass  = $('#loginPass').value;
    if (!email || !pass) return toast('E-posta ve şifre gir', 'error');

    const btn = $('#btnLogin');
    btn.disabled = true;
    btn.textContent = 'Giriş yapılıyor...';

    try {
      await auth.signInWithEmailAndPassword(email, pass);
      // onAuthStateChanged devralır
    } catch(e){
      console.error(e);
      let msg = 'Giriş başarısız';
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'E-posta veya şifre yanlış';
      else if (e.code === 'auth/user-not-found') msg = 'Bu e-posta kayıtlı değil';
      else if (e.code === 'auth/too-many-requests') msg = 'Çok fazla deneme. Sonra tekrar dene.';
      toast(msg, 'error');
    }
    btn.disabled = false;
    btn.textContent = 'Giriş Yap';
  });

  /* =================== ŞİFREMİ UNUTTUM =================== */
  $('#btnForgot').addEventListener('click', () => {
    $('#forgotEmail').value = $('#loginEmail').value;
    showAuthPanel('forgot');
  });
  $('#btnForgotBack').addEventListener('click', () => showAuthPanel('login'));
  $('#btnForgotSend').addEventListener('click', async () => {
    const email = $('#forgotEmail').value.trim().toLowerCase();
    if (!email) return toast('E-posta gir', 'error');
    try {
      await auth.sendPasswordResetEmail(email);
      toast('Sıfırlama bağlantısı gönderildi', 'success');
      setTimeout(()=>showAuthPanel('login'), 1500);
    } catch(e){
      toast('Hata: ' + (e.message || 'gönderilemedi'), 'error');
    }
  });

  /* =================== DOĞRULAMA =================== */
  $('#btnVerifyCheck').addEventListener('click', async () => {
    if (!auth.currentUser) return showAuthPanel('login');
    await auth.currentUser.reload();
    if (auth.currentUser.emailVerified){
      await dbUpdate(`users/${auth.currentUser.uid}`, { verified: true });
      toast('Doğrulandı!', 'success');
      enterGame();
    } else {
      toast('Henüz doğrulanmamış. E-postanı kontrol et.', 'warn');
    }
  });
  $('#btnVerifyResend').addEventListener('click', async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.sendEmailVerification();
      toast('Tekrar gönderildi', 'success');
    } catch(e){
      toast('Hata: ' + (e.message||''), 'error');
    }
  });
  $('#btnVerifyLogout').addEventListener('click', async () => {
    await auth.signOut();
    showAuthPanel('login');
  });
  $('#btnBanLogout').addEventListener('click', async () => {
    await auth.signOut();
    location.reload();
  });

  /* =================== AUTH STATE =================== */
  auth.onAuthStateChanged(async (user) => {
    splash.classList.remove('hidden');
    if (!user){
      authScreen.classList.add('active');
      gameScreen.classList.remove('active');
      banScreen.classList.remove('active');
      splash.classList.add('hidden');
      GZ.user = null;
      GZ.uid = null;
      return;
    }

    GZ.user = user;
    GZ.uid  = user.uid;

    // Doğrulanmamışsa
    if (!user.emailVerified){
      $('#verifyEmailText').textContent = `${user.email} adresine doğrulama bağlantısı gönderildi. Bağlantıya tıkla ve aşağıdaki butona bas.`;
      authScreen.classList.add('active');
      gameScreen.classList.remove('active');
      showAuthPanel('verify');
      splash.classList.add('hidden');
      return;
    }

    // Veri yükle
    const userData = await dbGet(`users/${user.uid}`);
    if (!userData){
      // Verisi yoksa oluştur (kayıttan sonra hata olursa fallback)
      const username = user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g,'').slice(0,16);
      await dbSet(`users/${user.uid}`, {
        username, usernameLower: username.toLowerCase(),
        email: user.email, level:1, xp:0, money:6000, diamonds:10,
        location:'İstanbul', online:true, lastSeen: firebase.database.ServerValue.TIMESTAMP,
        createdAt: firebase.database.ServerValue.TIMESTAMP, banned:false, verified:true, bio:'', netWorth:6000
      });
    }

    // Ban kontrolü
    const banned = await dbGet(`users/${user.uid}/banned`);
    if (banned){
      authScreen.classList.remove('active');
      gameScreen.classList.remove('active');
      banScreen.classList.add('active');
      splash.classList.add('hidden');
      const reason = await dbGet(`users/${user.uid}/banReason`);
      if (reason) $('#banReason').textContent = reason;
      return;
    }

    // doğrulamayı işaretle
    if (!userData?.verified){
      await dbUpdate(`users/${user.uid}`, { verified:true });
    }

    enterGame();
  });

  async function enterGame(){
    authScreen.classList.remove('active');
    banScreen.classList.remove('active');
    gameScreen.classList.add('active');

    // Presence
    setupPresence(GZ.uid);

    // Dinleyici: kullanıcı verisi
    const userRef = db.ref(`users/${GZ.uid}`);
    const cb = userRef.on('value', s => {
      GZ.data = s.val() || {};
      renderTopbar();
      // Ban anlık kontrol
      if (GZ.data.banned){
        location.reload();
      }
    });
    GZ.listeners.push({ ref:userRef, cb });

    // İlk render
    if (typeof initEkonomi === 'function') initEkonomi();
    if (typeof initUI === 'function') initUI();

    splash.classList.add('hidden');
  }

  function renderTopbar(){
    const d = GZ.data || {};
    $('#cashTxt').textContent = cashFmt(d.money||0);
    $('#diaTxt').textContent  = fmtInt(d.diamonds||0);
    $('#lvlPill').textContent = 'Lv ' + (d.level||1);
    const need = xpForLevel(d.level||1);
    const pct = Math.min(100, Math.floor(((d.xp||0)/need)*100));
    $('#xpFill').style.width = pct + '%';
    $('#xpText').textContent = (d.xp||0) + '/' + need;
  }

  // Splash başlangıç
  setTimeout(()=>{
    if (!auth.currentUser) splash.classList.add('hidden');
  }, 1500);

})();
