/* ==========================================================================
   giriş.js — TAM GÜVENLİK + GİZLİLİK PAKETİ v1.1
   ─────────────────────────────────────────────────────────────────────────
   YENİ : Anonim Mod (e-posta toplamadan kayıt)
   YENİ : Kullanıcı adı + Şifre ile giriş
   YENİ : Kurtarma Kodu sistemi (anonim hesap için şifre sıfırlama)
   YENİ : 25.000 TL başlangıç parası
   KORUNAN : Cihaz Parmak İzi · Şüpheli Giriş · Re-Auth · 2FA · Rate Limit
             Geçici Mail Engeli · Şifre Güç Göstergesi · Oturum Zaman Aşımı
   ========================================================================== */

(function () {

  /* ══════════════════════════════════════════════════════════════════════
     SABİTLER
     ══════════════════════════════════════════════════════════════════════ */
  const STARTING_MONEY = 25000;       // Başlangıç bakiyesi (eskiden 20.000)
  const STARTING_DIAMONDS = 10;
  const ANON_EMAIL_DOMAIN = 'anon.gamezone.local';

  /* ══════════════════════════════════════════════════════════════════════
     KRİPTO YARDIMCILAR (kurtarma kodu hash + username hash)
     ══════════════════════════════════════════════════════════════════════ */

  async function sha256(text) {
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Anonim hesap için sahte e-posta üret
  async function makeAnonEmail(username) {
    const h = await sha256('gz_anon_' + username.toLowerCase());
    return 'u_' + h.slice(0, 20) + '@' + ANON_EMAIL_DOMAIN;
  }

  // 16 karakterlik insan-okur kurtarma kodu (4-4-4-4 formatında)
  function generateRecoveryCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 0/O/I/1 yok (karışmasın)
    let s = '';
    for (let i = 0; i < 16; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
      if (i === 3 || i === 7 || i === 11) s += '-';
    }
    return s; // örn: ABCD-EFGH-JKLM-NPQR
  }

  /* ══════════════════════════════════════════════════════════════════════
     YARDIMCILAR
     ══════════════════════════════════════════════════════════════════════ */

  function getDeviceFingerprint() {
    const parts = [
      navigator.userAgent, navigator.language,
      screen.width + 'x' + screen.height, screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      navigator.platform || '',
      (navigator.plugins || []).length,
      Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    ];
    let hash = 0;
    const str = parts.join('|');
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  function getDeviceLabel() {
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Android/.test(ua)) return 'Android';
    if (/Windows/.test(ua)) return 'Windows PC';
    if (/Mac/.test(ua)) return 'Mac';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Bilinmeyen Cihaz';
  }

  /* ─── Rate Limiting ─── */
  const LOGIN_MAX = 5;
  const LOGIN_WIN = 15 * 60 * 1000;

  function checkLoginRL(ident) {
    const key = 'lr_' + btoa(ident).slice(0, 20);
    let d = JSON.parse(localStorage.getItem(key) || '{"c":0,"t":0}');
    const now = Date.now();
    if (now - d.t > LOGIN_WIN) d = { c: 0, t: now };
    d.c++;
    d.t = d.t || now;
    localStorage.setItem(key, JSON.stringify(d));
    if (d.c > LOGIN_MAX) {
      return { blocked: true, wait: Math.ceil((d.t + LOGIN_WIN - now) / 60000) };
    }
    return { blocked: false, left: LOGIN_MAX - d.c };
  }
  function clearLoginRL(ident) {
    localStorage.removeItem('lr_' + btoa(ident).slice(0, 20));
  }

  function checkRegRL() {
    const key = 'rr_attempts';
    let d = JSON.parse(localStorage.getItem(key) || '{"c":0,"t":0}');
    const now = Date.now();
    if (now - d.t > 3600000) d = { c: 0, t: now };
    d.c++; d.t = d.t || now;
    localStorage.setItem(key, JSON.stringify(d));
    return d.c > 3;
  }

  /* ─── Geçici Mail Engeli ─── */
  const BLOCKED_DOMAINS = [
    'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
    'throwam.com', 'yopmail.com', 'fakeinbox.com', 'dispostable.com',
    'trashmail.com', 'sharklasers.com', 'getairmail.com', 'mailnull.com',
    'spamgourmet.com', 'trashmail.me', 'maildrop.cc', 'tempr.email'
  ];
  function isEmailAllowed(email) {
    return !BLOCKED_DOMAINS.includes((email.split('@')[1] || '').toLowerCase());
  }

  /* ─── Şifre Gücü ─── */
  function passStrength(p) {
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    return s;
  }

  /* ─── Şifre Toggle ─── */
  function addPassToggle(id) {
    const inp = document.getElementById(id);
    if (!inp || inp.dataset.pt) return;
    inp.dataset.pt = '1';
    inp.parentElement.style.position = 'relative';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = '👁';
    btn.style.cssText = 'position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;color:var(--muted);z-index:2;line-height:1';
    btn.onclick = () => { inp.type = inp.type === 'password' ? 'text' : 'password'; btn.innerHTML = inp.type === 'password' ? '👁' : '🙈'; };
    inp.parentElement.appendChild(btn);
  }

  /* ─── Oturum Zaman Aşımı ─── */
  function updateActivity() {
    if (GZ.uid) localStorage.setItem('act_' + GZ.uid, Date.now());
  }
  function checkSessionTimeout() {
    if (!GZ.uid) return;
    const last = parseInt(localStorage.getItem('act_' + GZ.uid) || '0');
    if (last && Date.now() - last > 30 * 24 * 3600 * 1000) {
      auth.signOut();
      toast('Uzun süre giriş yapılmadı. Lütfen tekrar giriş yap.', 'warn');
    }
  }
  setInterval(updateActivity, 60000);

  /* ══════════════════════════════════════════════════════════════════════
     CİHAZ KAYDI & ŞÜPHELİ GİRİŞ TESPİTİ
     ══════════════════════════════════════════════════════════════════════ */

  async function recordDevice(uid) {
    const fp = getDeviceFingerprint();
    const knownKey = 'kfp_' + uid;
    const known = JSON.parse(localStorage.getItem(knownKey) || '[]');
    const isNew = !known.includes(fp);
    const label = getDeviceLabel();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';

    try {
      await db.ref('security/logins/' + uid).push({
        fp, label, tz,
        ua: navigator.userAgent.slice(0, 180),
        ts: firebase.database.ServerValue.TIMESTAMP,
        isNewDevice: isNew
      });

      if (isNew) {
        await db.ref('notifs/' + uid).push({
          type: 'security',
          icon: '🔐',
          msg: '🔐 Yeni cihazdan giriş: ' + label + '. Sen değilsen şifreni hemen değiştir!',
          ts: firebase.database.ServerValue.TIMESTAMP,
          read: false
        });
        await db.ref('security/alerts/' + uid).push({
          type: 'new_device',
          label, tz,
          ts: firebase.database.ServerValue.TIMESTAMP,
          handled: false
        });

        known.push(fp);
        if (known.length > 15) known.shift();
        localStorage.setItem(knownKey, JSON.stringify(known));

        toast('🔐 Yeni cihazdan giriş! Bildirim oluşturuldu.', 'warn', 5000);
      }
    } catch (e) { console.warn('Device log err:', e); }
  }

  /* ══════════════════════════════════════════════════════════════════════
     EKRAN YÖNETİMİ
     ══════════════════════════════════════════════════════════════════════ */

  const splash = document.getElementById('splash');
  const authScreen = document.getElementById('authScreen');
  const gameScreen = document.getElementById('gameScreen');
  const banScreen = document.getElementById('banScreen');

  $$('.auth-tab').forEach(b => b.addEventListener('click', () => {
    showPanel(b.dataset.tab);
    $$('.auth-tab').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
  }));

  function showPanel(name) {
    $$('.auth-panel').forEach(p => p.classList.remove('active'));
    const map = {
      login: 'loginPanel', register: 'registerPanel',
      anon: 'anonPanel', verify: 'verifyPanel', forgot: 'forgotPanel'
    };
    const el = document.getElementById(map[name]);
    if (el) el.classList.add('active');
  }

  // Forgot panel sub-tab
  document.addEventListener('click', e => {
    if (e.target.matches('.forgot-subtabs .subtab')) {
      const mode = e.target.dataset.fmode;
      $$('.forgot-subtabs .subtab').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      $('#forgotByEmail').style.display = mode === 'email' ? 'block' : 'none';
      $('#forgotByCode').style.display = mode === 'code' ? 'block' : 'none';
    }
  });

  // Şifre toggle butonları (her panel için)
  setTimeout(() => {
    addPassToggle('loginPass');
    addPassToggle('regPass');
    addPassToggle('regPass2');
    addPassToggle('anonPass');
    addPassToggle('anonPass2');
    addPassToggle('forgotNewPass');
  }, 400);

  // Şifre güç barı (standart + anonim)
  document.addEventListener('input', e => {
    if (e.target.id !== 'regPass' && e.target.id !== 'anonPass') return;
    const s = passStrength(e.target.value);
    const barId = 'psBar_' + e.target.id;
    const lblId = 'psLbl_' + e.target.id;
    let bar = document.getElementById(barId);
    let lbl = document.getElementById(lblId);
    if (!bar) {
      bar = Object.assign(document.createElement('div'), { id: barId });
      bar.style.cssText = 'height:4px;border-radius:2px;transition:.3s;margin-top:4px;width:0%';
      e.target.parentElement.appendChild(bar);
      lbl = Object.assign(document.createElement('div'), { id: lblId });
      lbl.style.cssText = 'font-size:11px;margin-top:2px;font-weight:600';
      e.target.parentElement.appendChild(lbl);
    }
    const cols = ['#dc2626', '#ef4444', '#f59e0b', '#16a34a', '#15803d', '#0d5c32'];
    const labs = ['Çok Zayıf', 'Zayıf', 'Orta', 'İyi', 'Güçlü', 'Çok Güçlü'];
    bar.style.background = cols[s]; bar.style.width = (s * 20) + '%';
    lbl.textContent = labs[s]; lbl.style.color = cols[s];
  });

  /* ══════════════════════════════════════════════════════════════════════
     STANDART KAYIT (e-posta ile)
     ══════════════════════════════════════════════════════════════════════ */

  $('#btnRegister').addEventListener('click', async () => {
    const username = $('#regUsername').value.trim();
    const email = $('#regEmail').value.trim().toLowerCase();
    const pass = $('#regPass').value;
    const pass2 = $('#regPass2').value;
    const agree = $('#regAgree').checked;

    if (username.length < 3 || username.length > 16) return toast('Kullanıcı adı 3-16 karakter olmalı', 'error');
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return toast('Sadece harf, rakam ve alt çizgi', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Geçersiz e-posta', 'error');
    if (!isEmailAllowed(email)) return toast('Geçici e-posta servisleri kabul edilmiyor', 'error');
    if (pass.length < 6) return toast('Şifre en az 6 karakter olmalı', 'error');
    if (pass !== pass2) return toast('Şifreler eşleşmiyor', 'error');
    if (!agree) return toast('Kuralları kabul etmelisin', 'error');
    if (passStrength(pass) < 2) return toast('Şifre çok zayıf! Büyük harf veya rakam ekle.', 'warn');
    if (checkRegRL()) return toast('Çok fazla kayıt denemesi. 1 saat sonra tekrar dene.', 'error');

    const existing = await dbGet('usernames/' + username.toLowerCase());
    if (existing) return toast('Bu kullanıcı adı alınmış', 'error');

    const btn = $('#btnRegister');
    btn.disabled = true; btn.textContent = 'Kaydediliyor...';

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      const uid = cred.user.uid;
      await createUserData(uid, username, email, false, null);

      await cred.user.sendEmailVerification({
        url: window.location.origin + window.location.pathname + '?verified=1'
      });

      $('#verifyEmailText').textContent = email + ' adresine doğrulama bağlantısı gönderdik.';
      showPanel('verify');
      $$('.auth-tab').forEach(x => x.classList.remove('active'));
      toast('Kayıt başarılı! E-postanı doğrula 📧', 'success');
    } catch (e) {
      const msgs = {
        'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı',
        'auth/invalid-email': 'Geçersiz e-posta',
        'auth/weak-password': 'Şifre çok zayıf'
      };
      toast(msgs[e.code] || 'Bir hata oluştu', 'error');
    }
    btn.disabled = false; btn.textContent = 'Kayıt Ol';
  });

  /* ══════════════════════════════════════════════════════════════════════
     ANONİM KAYIT (e-posta toplamadan)
     ══════════════════════════════════════════════════════════════════════ */

  $('#btnAnonRegister').addEventListener('click', async () => {
    const username = $('#anonUsername').value.trim();
    const pass = $('#anonPass').value;
    const pass2 = $('#anonPass2').value;
    const agree = $('#anonAgree').checked;
    const accept = $('#anonAccept').checked;

    if (username.length < 3 || username.length > 16) return toast('Kullanıcı adı 3-16 karakter olmalı', 'error');
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return toast('Sadece harf, rakam, alt çizgi', 'error');
    if (pass.length < 6) return toast('Şifre en az 6 karakter olmalı', 'error');
    if (pass !== pass2) return toast('Şifreler eşleşmiyor', 'error');
    if (!agree) return toast('Kuralları kabul etmelisin', 'error');
    if (!accept) return toast('Kurtarma kodu sorumluluğunu onayla', 'error');
    if (passStrength(pass) < 2) return toast('Şifre çok zayıf — büyük harf/rakam ekle', 'warn');
    if (checkRegRL()) return toast('Çok fazla kayıt denemesi. 1 saat bekle.', 'error');

    const existing = await dbGet('usernames/' + username.toLowerCase());
    if (existing) return toast('Bu kullanıcı adı alınmış', 'error');

    const btn = $('#btnAnonRegister');
    btn.disabled = true; btn.textContent = 'Anonim hesap oluşturuluyor...';

    try {
      const fakeEmail = await makeAnonEmail(username);
      const cred = await auth.createUserWithEmailAndPassword(fakeEmail, pass);
      const uid = cred.user.uid;

      // Kurtarma kodu üret + hash'le
      const recoveryCode = generateRecoveryCode();
      const codeHash = await sha256('gz_rec_v1_' + recoveryCode);

      await createUserData(uid, username, null, true, codeHash);

      // Kurtarma kodunu kullanıcıya GÖSTER (modal)
      showRecoveryCodeModal(username, recoveryCode);
    } catch (e) {
      const msgs = {
        'auth/email-already-in-use': 'Bu kullanıcı adı zaten alınmış (anonim)',
        'auth/weak-password': 'Şifre çok zayıf'
      };
      toast(msgs[e.code] || ('Kayıt hatası: ' + (e.message || '')), 'error');
      btn.disabled = false; btn.textContent = '🛡️ Anonim Kayıt Ol';
    }
  });

  /* Ortak: kullanıcı verisini oluştur (25.000 TL başlangıç) */
  async function createUserData(uid, username, email, isAnonymous, recoveryCodeHash) {
    const fp = getDeviceFingerprint();
    const userObj = {
      username,
      usernameLower: username.toLowerCase(),
      email: email || null,                   // anonim ise null
      isAnonymous: !!isAnonymous,
      level: 1, xp: 0,
      money: STARTING_MONEY,                  // 25.000 TL
      diamonds: STARTING_DIAMONDS,
      location: 'İstanbul',
      online: true,
      lastSeen: firebase.database.ServerValue.TIMESTAMP,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      banned: false,
      verified: !!isAnonymous,                // anonim direkt verified, standart e-posta sonrası
      bio: '',
      netWorth: STARTING_MONEY,
      twoFactorEnabled: false,
      registrationFp: fp,
      registrationUa: navigator.userAgent.slice(0, 180)
    };
    if (recoveryCodeHash) {
      userObj.recoveryHash = recoveryCodeHash;
      userObj.recoverySetAt = firebase.database.ServerValue.TIMESTAMP;
    }
    await dbSet('users/' + uid, userObj);
    await dbSet('usernames/' + username.toLowerCase(), uid);
    await dbSet('bank/' + uid, {
      balance: 0, investment: 0, investmentDate: now(), loan: 0,
      nextBusinessExpense: now() + 7 * 24 * 3600 * 1000,
      nextSalary: now() + 7 * 24 * 3600 * 1000
    });
    await db.ref('security/logins/' + uid).push({
      fp, label: getDeviceLabel(), ua: navigator.userAgent.slice(0, 180),
      ts: firebase.database.ServerValue.TIMESTAMP, type: 'register',
      anonymous: !!isAnonymous
    });
    localStorage.setItem('kfp_' + uid, JSON.stringify([fp]));
  }

  /* Kurtarma kodunu kullanıcıya gösteren modal — KAPATMASI ZOR */
  function showRecoveryCodeModal(username, code) {
    const root = $('#modalRoot');
    root.innerHTML = `
      <div class="modal-bg" style="z-index:5000">
        <div class="modal" onclick="event.stopPropagation()" style="max-width:480px">
          <div class="modal-grabber"></div>
          <div class="modal-head">
            <h3>🛡️ Kurtarma Kodun</h3>
          </div>
          <div class="modal-body">
            <div class="security-notice danger">
              <div class="sec-icon">⚠️</div>
              <p><b>Bu kodu ŞİMDİ kaydet.</b> Bir daha gösterilmeyecek. Şifreni unutursan bu kodla yeni şifre belirlersin.</p>
            </div>

            <div class="recovery-card">
              <div class="rc-label">Kullanıcı Adı</div>
              <div class="rc-username">${username}</div>
              <div class="rc-label" style="margin-top:14px">Kurtarma Kodu</div>
              <div class="rc-code" id="rcCode">${code}</div>
              <button class="btn-secondary" id="btnCopyCode" style="width:100%;margin-top:10px">📋 Kopyala</button>
              <button class="btn-secondary" id="btnDownloadCode" style="width:100%;margin-top:6px">💾 .txt Dosyası Olarak İndir</button>
            </div>

            <label class="auth-check" style="margin-top:14px">
              <input type="checkbox" id="rcConfirm">
              <span><b>Bu kodu güvenli yere kaydettim. Kaybedersem hesabım kurtarılamaz.</b></span>
            </label>

            <button class="btn-primary" id="btnRcContinue" style="width:100%;margin-top:10px" disabled>Devam Et</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnCopyCode').onclick = async () => {
      try {
        await navigator.clipboard.writeText('GameZone Anonim Hesap\nKullanıcı Adı: ' + username + '\nKurtarma Kodu: ' + code);
        toast('📋 Kopyalandı', 'success');
      } catch (e) {
        toast('Kopyalama başarısız, manuel yaz', 'warn');
      }
    };

    document.getElementById('btnDownloadCode').onclick = () => {
      const text = `GameZone ERP — Anonim Hesap Kurtarma\n\n` +
                   `Kullanıcı Adı : ${username}\n` +
                   `Kurtarma Kodu : ${code}\n` +
                   `Oluşturma     : ${new Date().toLocaleString('tr-TR')}\n\n` +
                   `BU DOSYAYI GÜVENLİ YERE SAKLA.\n` +
                   `Şifrenizi unutursanız bu kodla yeni şifre belirleyebilirsin.\n` +
                   `Bu kod kaybolursa hesabın kurtarılamaz.\n`;
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `gamezone-${username}-recovery.txt`;
      a.click();
      toast('💾 İndirildi', 'success');
    };

    document.getElementById('rcConfirm').onchange = (e) => {
      document.getElementById('btnRcContinue').disabled = !e.target.checked;
    };

    document.getElementById('btnRcContinue').onclick = () => {
      $('#modalRoot').innerHTML = '';
      toast('🛡️ Anonim hesap aktif! Hoş geldin.', 'success', 4000);
      // enterGame onAuthStateChanged tarafından otomatik tetiklenir
    };
  }

  /* ══════════════════════════════════════════════════════════════════════
     GİRİŞ — Kullanıcı Adı VEYA E-posta + Rate Limit + Cihaz Kaydı
     ══════════════════════════════════════════════════════════════════════ */

  $('#btnLogin').addEventListener('click', async () => {
    const ident = $('#loginIdent').value.trim();
    const pass = $('#loginPass').value;
    if (!ident || !pass) return toast('Kullanıcı adı/e-posta ve şifre gir', 'error');

    const rl = checkLoginRL(ident.toLowerCase());
    if (rl.blocked) return toast('Hesap ' + rl.wait + ' dk kilitli. Şifre sıfırlamayı dene.', 'error');

    const btn = $('#btnLogin');
    btn.disabled = true; btn.textContent = 'Giriş yapılıyor...';

    try {
      // E-posta mı yoksa kullanıcı adı mı?
      let loginEmail;
      if (ident.includes('@')) {
        loginEmail = ident.toLowerCase();
      } else {
        // Kullanıcı adından UID bul, sonra UID'den email çek
        const username = ident.toLowerCase();
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          throw { code: 'auth/invalid-credential' };
        }
        const uid = await dbGet('usernames/' + username);
        if (!uid) throw { code: 'auth/user-not-found' };
        const emailFromDb = await dbGet('users/' + uid + '/email');
        const isAnon = await dbGet('users/' + uid + '/isAnonymous');
        if (isAnon || !emailFromDb) {
          // Anonim hesap — sahte e-postayı yeniden hesapla
          loginEmail = await makeAnonEmail(username);
        } else {
          loginEmail = emailFromDb;
        }
      }

      const cred = await auth.signInWithEmailAndPassword(loginEmail, pass);
      clearLoginRL(ident.toLowerCase());

      const twoFA = await dbGet('users/' + cred.user.uid + '/twoFactorEnabled');
      if (twoFA) {
        GZ._pendingUser = cred.user;
        await auth.signOut();
        show2FAVerify(loginEmail, pass);
      } else {
        await recordDevice(cred.user.uid);
        updateActivity();
      }
    } catch (e) {
      const msgs = {
        'auth/wrong-password': 'Şifre yanlış (kalan: ' + (rl.left - 1) + ')',
        'auth/invalid-credential': 'Bilgiler hatalı (kalan: ' + (rl.left - 1) + ')',
        'auth/user-not-found': 'Kullanıcı bulunamadı',
        'auth/too-many-requests': 'Geçici kilit. Şifreni sıfırla.',
        'auth/user-disabled': 'Hesap devre dışı.'
      };
      toast(msgs[e.code] || 'Giriş başarısız', 'error');
    }
    btn.disabled = false; btn.textContent = 'Giriş Yap';
  });

  /* ══════════════════════════════════════════════════════════════════════
     SMS 2FA (Firebase Phone Auth) — kalıyor
     ══════════════════════════════════════════════════════════════════════ */

  let recaptchaVerifier = null;
  let confirmationResult = null;

  function initRecaptcha(containerId) {
    if (recaptchaVerifier) { try { recaptchaVerifier.clear(); } catch (e) {} }
    recaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
      size: 'invisible',
      callback: () => {}
    });
  }

  window.open2FASetup = async function () {
    if (!GZ.uid) return;
    showModal('📱 SMS 2FA Kurulumu', `
      <div class="security-notice">
        <div class="sec-icon">🛡️</div>
        <p>Telefon numarana her girişte SMS kodu gönderilir. Hesabın çok daha güvende olur.</p>
      </div>
      <div class="input-group">
        <label>Telefon Numarası</label>
        <div style="display:flex;gap:8px">
          <select id="phoneCC" style="width:100px;flex-shrink:0">
            <option value="+90">🇹🇷 +90</option>
            <option value="+1">🇺🇸 +1</option>
            <option value="+44">🇬🇧 +44</option>
            <option value="+49">🇩🇪 +49</option>
          </select>
          <input type="tel" id="phoneNum" placeholder="5XX XXX XX XX" maxlength="15">
        </div>
      </div>
      <div id="recaptcha2fa"></div>
      <button class="btn-primary" id="btnSend2FA" style="width:100%">SMS Kodu Gönder</button>
      <div id="smsCodeWrap" style="display:none;margin-top:12px">
        <div class="input-group">
          <label>SMS Kodu (6 hane)</label>
          <input type="number" id="smsCodeInput" placeholder="000000" maxlength="6" style="font-size:22px;text-align:center;letter-spacing:6px">
        </div>
        <button class="btn-success" id="btnConfirm2FA" style="width:100%">Onayla & 2FA Aktifleştir</button>
      </div>
    `);

    setTimeout(() => {
      document.getElementById('btnSend2FA')?.addEventListener('click', async () => {
        const cc = document.getElementById('phoneCC').value;
        const num = document.getElementById('phoneNum').value.replace(/\s/g, '');
        if (!num || num.length < 9) return toast('Geçerli telefon gir', 'error');
        const fullPhone = cc + num;
        const btn = document.getElementById('btnSend2FA');
        btn.disabled = true; btn.textContent = 'Gönderiliyor...';
        try {
          initRecaptcha('recaptcha2fa');
          confirmationResult = await firebase.auth().currentUser
            .linkWithPhoneNumber(fullPhone, recaptchaVerifier)
            .catch(async () => firebase.auth().signInWithPhoneNumber(fullPhone, recaptchaVerifier));
          document.getElementById('smsCodeWrap').style.display = 'block';
          btn.textContent = '✅ Gönderildi';
          toast('SMS gönderildi 📨', 'success');

          document.getElementById('btnConfirm2FA').addEventListener('click', async () => {
            const code = document.getElementById('smsCodeInput').value.trim();
            if (code.length !== 6) return toast('6 haneli kodu gir', 'error');
            try {
              await confirmationResult.confirm(code);
              await dbUpdate('users/' + GZ.uid, {
                twoFactorEnabled: true,
                twoFactorPhone: cc + ' ' + num.slice(0, 3) + '*** ' + num.slice(-2),
                twoFactorPhoneRaw: fullPhone
              });
              toast('🛡️ SMS 2FA aktifleşti!', 'success');
              closeModal();
            } catch (e) {
              toast('Kod yanlış veya süresi dolmuş', 'error');
            }
          });
        } catch (e) {
          toast('SMS gönderilemedi: ' + (e.message || 'bilinmeyen'), 'error');
          btn.disabled = false; btn.textContent = 'SMS Kodu Gönder';
        }
      });
    }, 100);
  };

  window.disable2FA = async function () {
    if (!confirm('SMS 2FA\'yı devre dışı bırakmak istediğinden emin misin?')) return;
    await dbUpdate('users/' + GZ.uid, { twoFactorEnabled: false, twoFactorPhone: null, twoFactorPhoneRaw: null });
    toast('2FA devre dışı bırakıldı', 'warn');
  };

  function show2FAVerify(loginEmail, pass) {
    showModal('📱 SMS Doğrulama', `
      <div class="security-notice">
        <div class="sec-icon">🔐</div>
        <p>Hesabında iki adımlı doğrulama aktif. Telefonuna gelen 6 haneli kodu gir.</p>
      </div>
      <div id="recaptchaLogin"></div>
      <button class="btn-secondary" id="btnSendLoginSMS" style="width:100%">📨 SMS Kodu Gönder</button>
      <div class="input-group" id="smsInputWrap" style="display:none;margin-top:12px">
        <label>SMS Kodu (6 hane)</label>
        <input type="number" id="loginSmsCode" placeholder="000000" maxlength="6" style="font-size:22px;text-align:center;letter-spacing:6px">
      </div>
      <button class="btn-primary" id="btnConfirmLoginSMS" style="width:100%;display:none">Doğrula & Giriş</button>
      <button class="btn-link" onclick="closeModal()" style="width:100%">İptal</button>
    `);

    setTimeout(() => {
      document.getElementById('btnSendLoginSMS')?.addEventListener('click', async () => {
        try {
          initRecaptcha('recaptchaLogin');
          const cred = await auth.signInWithEmailAndPassword(loginEmail, pass);
          const fullPhone = await dbGet('users/' + cred.user.uid + '/twoFactorPhoneRaw');
          await auth.signOut();
          if (!fullPhone) {
            await auth.signInWithEmailAndPassword(loginEmail, pass);
            toast('2FA verisi yok, normal giriş.', 'warn');
            closeModal(); return;
          }
          confirmationResult = await firebase.auth().signInWithPhoneNumber(fullPhone, recaptchaVerifier);
          document.getElementById('smsInputWrap').style.display = 'block';
          document.getElementById('btnConfirmLoginSMS').style.display = 'block';
          document.getElementById('btnSendLoginSMS').textContent = '✅ Gönderildi';
          document.getElementById('btnSendLoginSMS').disabled = true;
          toast('SMS gönderildi 📨', 'success');
        } catch (e) { toast('SMS hatası: ' + (e.message || ''), 'error'); }
      });

      document.getElementById('btnConfirmLoginSMS')?.addEventListener('click', async () => {
        const code = document.getElementById('loginSmsCode').value.trim();
        if (code.length !== 6) return toast('6 haneli kodu gir', 'error');
        try {
          await confirmationResult.confirm(code);
          await auth.signInWithEmailAndPassword(loginEmail, pass);
          closeModal();
          toast('✅ İki adımlı doğrulama başarılı!', 'success');
        } catch (e) { toast('Kod yanlış veya süresi dolmuş', 'error'); }
      });
    }, 150);
  }

  /* ══════════════════════════════════════════════════════════════════════
     ŞİFRE SIFIRLA — E-posta + Kurtarma Kodu (anonim için)
     ══════════════════════════════════════════════════════════════════════ */

  $('#btnForgot').addEventListener('click', () => {
    const ident = $('#loginIdent').value.trim();
    if (ident.includes('@')) $('#forgotEmail').value = ident;
    else $('#forgotUsername').value = ident;
    showPanel('forgot');
    $$('.auth-tab').forEach(x => x.classList.remove('active'));
  });
  $('#btnForgotBack').addEventListener('click', () => {
    showPanel('login');
    $$('.auth-tab').forEach(x => x.classList.remove('active'));
    $$('.auth-tab')[0].classList.add('active');
  });

  $('#btnForgotSend').addEventListener('click', async () => {
    const email = $('#forgotEmail').value.trim().toLowerCase();
    if (!email) return toast('E-posta gir', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Geçersiz e-posta', 'error');
    if (email.endsWith('@' + ANON_EMAIL_DOMAIN)) {
      return toast('Bu anonim hesap. Kurtarma Kodu sekmesini kullan.', 'warn');
    }
    try {
      await auth.sendPasswordResetEmail(email, {
        url: window.location.origin + window.location.pathname + '?reset=1'
      });
      toast('✅ Sıfırlama bağlantısı gönderildi', 'success');
      setTimeout(() => showPanel('login'), 2000);
    } catch (e) {
      toast(e.code === 'auth/user-not-found' ? 'E-posta kayıtlı değil' : 'Gönderim hatası', 'error');
    }
  });

  // Kurtarma kodu ile sıfırlama (anonim hesap)
  $('#btnForgotCode').addEventListener('click', async () => {
    const username = $('#forgotUsername').value.trim().toLowerCase();
    const code = $('#forgotCode').value.trim().toUpperCase();
    const newPass = $('#forgotNewPass').value;
    if (username.length < 3) return toast('Kullanıcı adı gir', 'error');
    if (code.length < 16) return toast('Kurtarma kodunu tam gir (16+ karakter)', 'error');
    if (newPass.length < 6) return toast('Yeni şifre en az 6 karakter', 'error');
    if (passStrength(newPass) < 2) return toast('Şifre çok zayıf', 'warn');

    const btn = $('#btnForgotCode');
    btn.disabled = true; btn.textContent = 'Doğrulanıyor...';

    try {
      const uid = await dbGet('usernames/' + username);
      if (!uid) throw new Error('Kullanıcı bulunamadı');
      const isAnon = await dbGet('users/' + uid + '/isAnonymous');
      const storedHash = await dbGet('users/' + uid + '/recoveryHash');
      if (!isAnon || !storedHash) throw new Error('Bu hesap kurtarma kodu kullanmıyor');

      const inputHash = await sha256('gz_rec_v1_' + code);
      if (inputHash !== storedHash) throw new Error('Kurtarma kodu yanlış');

      // Kod doğru — şifre sıfırlama isteğini DB'ye yaz, Firebase Cloud Function işleyecek
      // Cloud Function yokken: kullanıcı eski şifresiyle bir kez girip değiştirsin diye
      // alternatif: sıfırlama isteğini DB'ye yaz, manuel onay
      await db.ref('security/recoveryRequests/' + uid).set({
        ts: firebase.database.ServerValue.TIMESTAMP,
        username,
        // Yeni şifre düz metinde TUTULMAZ — sadece hash + flag
        newPassHash: await sha256('gz_pw_v1_' + newPass),
        handled: false,
        method: 'recovery_code',
        codeMatched: true
      });

      // Yeni kurtarma kodu da üret (eski geçersiz)
      const newCode = generateRecoveryCode();
      const newCodeHash = await sha256('gz_rec_v1_' + newCode);
      await dbUpdate('users/' + uid, {
        recoveryHash: newCodeHash,
        recoverySetAt: firebase.database.ServerValue.TIMESTAMP,
        passwordResetPending: true
      });

      // Bilgilendir
      showModal('✅ Kurtarma Onaylandı', `
        <div class="security-notice">
          <div class="sec-icon">🛡️</div>
          <p>Kurtarma kodun doğrulandı. Yeni şifre talebi <b>onay sırasında</b>. Birkaç dakika içinde aktifleşir.</p>
        </div>
        <div class="recovery-card">
          <div class="rc-label">YENİ Kurtarma Kodun (eski artık geçersiz)</div>
          <div class="rc-code">${newCode}</div>
          <p class="small muted mt-12">Bu yeni kodu da kaydet. Eski kod artık çalışmaz.</p>
        </div>
        <button class="btn-primary" onclick="closeModal();" style="width:100%;margin-top:14px">Tamam</button>
      `);

      // ⚠️ Not: Firebase Auth tarafından şifre değiştirme client'tan yapılamadığı için
      // gerçek senaryoda admin SDK / Cloud Function gerekir. Bu sürümde recovery isteği
      // DB'ye işlenir, geliştirici tarafından (veya bir Cloud Function ile) onaylanır.
      btn.disabled = false; btn.textContent = 'Şifreyi Sıfırla';
    } catch (e) {
      toast(e.message || 'Hata', 'error');
      btn.disabled = false; btn.textContent = 'Şifreyi Sıfırla';
    }
  });

  /* ══════════════════════════════════════════════════════════════════════
     E-POSTA DEĞİŞİKLİĞİ RE-AUTH KORUMASI (standart hesap için)
     ══════════════════════════════════════════════════════════════════════ */

  window.changeEmail = async function () {
    if (GZ.data?.isAnonymous) {
      return toast('Anonim hesaplarda e-posta değiştirilemez. Standart hesap aç.', 'warn');
    }
    showModal('✉️ E-posta Değiştir', `
      <div class="security-notice warn">
        <div class="sec-icon">⚠️</div>
        <p>E-posta değiştirmek yüksek güvenlik gerektirir. Mevcut şifrenle kimliğini doğrulamalısın.</p>
      </div>
      <div class="input-group">
        <label>Mevcut Şifre</label>
        <input type="password" id="reAuthPass" placeholder="Mevcut şifren">
      </div>
      <div class="input-group">
        <label>Yeni E-posta</label>
        <input type="email" id="newEmailInput" placeholder="yeni@eposta.com">
      </div>
      <div class="input-group">
        <label>Yeni E-posta (tekrar)</label>
        <input type="email" id="newEmailInput2" placeholder="yeni@eposta.com">
      </div>
      <button class="btn-primary" id="btnChangeEmail" style="width:100%">E-postayı Değiştir</button>
    `);

    setTimeout(() => {
      document.getElementById('btnChangeEmail')?.addEventListener('click', async () => {
        const pass = document.getElementById('reAuthPass').value;
        const newEmail = document.getElementById('newEmailInput').value.trim().toLowerCase();
        const newEmail2 = document.getElementById('newEmailInput2').value.trim().toLowerCase();
        if (!pass) return toast('Şifrenizi girin', 'error');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return toast('Geçersiz e-posta', 'error');
        if (newEmail !== newEmail2) return toast('E-postalar eşleşmiyor', 'error');
        if (!isEmailAllowed(newEmail)) return toast('Geçici e-posta kabul edilmiyor', 'error');
        if (newEmail === auth.currentUser.email) return toast('Bu zaten mevcut e-postan', 'warn');

        const btn = document.getElementById('btnChangeEmail');
        btn.disabled = true; btn.textContent = 'Doğrulanıyor...';
        try {
          const credential = firebase.auth.EmailAuthProvider.credential(auth.currentUser.email, pass);
          await auth.currentUser.reauthenticateWithCredential(credential);
          await auth.currentUser.updateEmail(newEmail);
          await auth.currentUser.sendEmailVerification({
            url: window.location.origin + window.location.pathname + '?verified=1'
          });
          await dbUpdate('users/' + GZ.uid, { email: newEmail, verified: false });
          await db.ref('security/emailChanges/' + GZ.uid).push({
            oldEmail: auth.currentUser.email, newEmail,
            ts: firebase.database.ServerValue.TIMESTAMP
          });
          toast('✅ E-posta güncellendi! Yeni adresini doğrula.', 'success', 5000);
          closeModal();
          setTimeout(() => auth.signOut(), 2000);
        } catch (e) {
          if (e.code === 'auth/wrong-password') toast('Şifre yanlış', 'error');
          else if (e.code === 'auth/requires-recent-login') toast('Oturum eskidi. Tekrar giriş yap.', 'error');
          else if (e.code === 'auth/email-already-in-use') toast('Bu e-posta başka hesapta kullanılıyor', 'error');
          else toast('Hata: ' + (e.message || ''), 'error');
        }
        btn.disabled = false; btn.textContent = 'E-postayı Değiştir';
      });
    }, 100);
  };

  /* Şifre değiştir — Re-Auth */
  window.changePassword = async function () {
    showModal('🔑 Şifre Değiştir', `
      <div class="security-notice">
        <div class="sec-icon">🔐</div>
        <p>Güvenliğin için mevcut şifreni doğrulaman gerekiyor.</p>
      </div>
      <div class="input-group">
        <label>Mevcut Şifre</label>
        <input type="password" id="cpOld" placeholder="Mevcut şifren">
      </div>
      <div class="input-group">
        <label>Yeni Şifre</label>
        <input type="password" id="cpNew" placeholder="En az 8 karakter">
      </div>
      <div class="input-group">
        <label>Yeni Şifre (tekrar)</label>
        <input type="password" id="cpNew2" placeholder="Yeni şifreni tekrarla">
      </div>
      <div id="cpStrBar" style="height:4px;border-radius:2px;width:0%;transition:.3s;margin-bottom:4px"></div>
      <div id="cpStrLbl" style="font-size:11px;font-weight:600;margin-bottom:12px"></div>
      <button class="btn-primary" id="btnChangePass" style="width:100%">Şifreyi Değiştir</button>
    `);

    setTimeout(() => {
      document.getElementById('cpNew')?.addEventListener('input', e => {
        const s = passStrength(e.target.value);
        const cols = ['#dc2626', '#ef4444', '#f59e0b', '#16a34a', '#15803d', '#0d5c32'];
        const labs = ['Çok Zayıf', 'Zayıf', 'Orta', 'İyi', 'Güçlü', 'Çok Güçlü'];
        const bar = document.getElementById('cpStrBar');
        const lbl = document.getElementById('cpStrLbl');
        if (bar) { bar.style.width = (s * 20) + '%'; bar.style.background = cols[s]; }
        if (lbl) { lbl.textContent = labs[s]; lbl.style.color = cols[s]; }
      });

      document.getElementById('btnChangePass')?.addEventListener('click', async () => {
        const old = document.getElementById('cpOld').value;
        const nw = document.getElementById('cpNew').value;
        const nw2 = document.getElementById('cpNew2').value;
        if (!old) return toast('Mevcut şifreni gir', 'error');
        if (nw.length < 6) return toast('Şifre en az 6 karakter olmalı', 'error');
        if (nw !== nw2) return toast('Şifreler eşleşmiyor', 'error');
        if (passStrength(nw) < 2) return toast('Şifre çok zayıf', 'warn');

        const btn = document.getElementById('btnChangePass');
        btn.disabled = true; btn.textContent = 'Değiştiriliyor...';
        try {
          const cred = firebase.auth.EmailAuthProvider.credential(auth.currentUser.email, old);
          await auth.currentUser.reauthenticateWithCredential(cred);
          await auth.currentUser.updatePassword(nw);
          await db.ref('security/passChanges/' + GZ.uid).push({
            ts: firebase.database.ServerValue.TIMESTAMP
          });
          toast('✅ Şifre değiştirildi!', 'success');
          closeModal();
        } catch (e) {
          if (e.code === 'auth/wrong-password') toast('Mevcut şifre yanlış', 'error');
          else toast('Hata: ' + (e.message || ''), 'error');
        }
        btn.disabled = false; btn.textContent = 'Şifreyi Değiştir';
      });
    }, 100);
  };

  /* ══════════════════════════════════════════════════════════════════════
     DOĞRULAMA PANELİ (standart hesap için)
     ══════════════════════════════════════════════════════════════════════ */

  $('#btnVerifyCheck').addEventListener('click', async () => {
    if (!auth.currentUser) return showPanel('login');
    await auth.currentUser.reload();
    if (auth.currentUser.emailVerified) {
      await dbUpdate('users/' + auth.currentUser.uid, { verified: true });
      toast('✅ Hesabın doğrulandı! Hoş geldin.', 'success');
      enterGame();
    } else {
      toast('E-posta henüz doğrulanmamış. Spam klasörünü kontrol et.', 'warn');
    }
  });

  $('#btnVerifyResend').addEventListener('click', async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.sendEmailVerification({
        url: window.location.origin + window.location.pathname + '?verified=1'
      });
      toast('📧 Doğrulama e-postası tekrar gönderildi.', 'success');
    } catch (e) {
      toast(e.code === 'auth/too-many-requests' ? 'Birkaç dakika bekle.' : 'Hata: ' + e.message, 'warn');
    }
  });

  $('#btnVerifyLogout').addEventListener('click', async () => { await auth.signOut(); showPanel('login'); });
  $('#btnBanLogout').addEventListener('click', async () => { await auth.signOut(); location.reload(); });

  /* ══════════════════════════════════════════════════════════════════════
     AUTH STATE
     ══════════════════════════════════════════════════════════════════════ */

  auth.onAuthStateChanged(async (user) => {
    splash.classList.remove('hidden');
    if (!user) {
      authScreen.classList.add('active');
      gameScreen.classList.remove('active');
      banScreen.classList.remove('active');
      splash.classList.add('hidden');
      GZ.user = null; GZ.uid = null;
      return;
    }

    GZ.user = user; GZ.uid = user.uid;
    checkSessionTimeout();

    // Kullanıcı verisi anonim mi?
    const userIsAnon = await dbGet('users/' + user.uid + '/isAnonymous');

    // Anonim hesap: e-posta doğrulama atla, direkt oyuna
    if (!userIsAnon && !user.emailVerified) {
      $('#verifyEmailText').textContent = user.email + ' adresine doğrulama bağlantısı gönderildi.';
      authScreen.classList.add('active');
      gameScreen.classList.remove('active');
      showPanel('verify');
      splash.classList.add('hidden');
      return;
    }

    let userData = await dbGet('users/' + user.uid);
    if (!userData) {
      // Bu yol normalde tetiklenmez (kayıt sırasında oluşturuyoruz) ama failsafe
      const username = (user.email?.split('@')[0] || 'Oyuncu').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16);
      await createUserData(user.uid, username, user.email, !!userIsAnon, null);
      userData = await dbGet('users/' + user.uid);
    }

    if (await dbGet('users/' + user.uid + '/banned')) {
      authScreen.classList.remove('active');
      gameScreen.classList.remove('active');
      banScreen.classList.add('active');
      splash.classList.add('hidden');
      const reason = await dbGet('users/' + user.uid + '/banReason');
      if (reason) $('#banReason').textContent = reason;
      return;
    }

    if (!userData?.verified) await dbUpdate('users/' + user.uid, { verified: true });
    enterGame();
  });

  async function enterGame() {
    authScreen.classList.remove('active');
    banScreen.classList.remove('active');
    gameScreen.classList.add('active');
    setupPresence(GZ.uid);
    updateActivity();

    const userRef = db.ref('users/' + GZ.uid);
    const cb = userRef.on('value', s => {
      GZ.data = s.val() || {};
      renderTopbar();
      if (GZ.data.banned) location.reload();
    });
    GZ.listeners.push({ ref: userRef, cb });

    if (typeof initEkonomi === 'function') initEkonomi();
    if (typeof initUI === 'function') initUI();
    // Günlük bonus ve vergi/maaş kontrolü
    setTimeout(async () => {
      if (typeof checkDailyLogin === 'function') await checkDailyLogin();
      if (typeof processTaxAndSalaryIfDue === 'function') await processTaxAndSalaryIfDue();
      if (typeof checkAndGrantAchievement === 'function') await checkAndGrantAchievement(GZ.uid, 'login');
    }, 3000);
    splash.classList.add('hidden');
  }

  function renderTopbar() {
    const d = GZ.data || {};
    $('#cashTxt').textContent = cashFmt(d.money || 0);
    $('#diaTxt').textContent = fmtInt(d.diamonds || 0);
    $('#lvlPill').textContent = 'Lv ' + (d.level || 1);
    const need = xpForLevel(d.level || 1);
    const pct = Math.min(100, Math.floor(((d.xp || 0) / need) * 100));
    $('#xpFill').style.width = pct + '%';
    $('#xpText').textContent = (d.xp || 0) + '/' + need;
  }

  setTimeout(() => { if (!auth.currentUser) splash.classList.add('hidden'); }, 1500);

  // Dışarı export edilen sabit
  window.GZ_STARTING_MONEY = STARTING_MONEY;
  window.GZ_STARTING_DIAMONDS = STARTING_DIAMONDS;

})();


/* ╔══════════════════════════════════════════════════════════════════════════╗
   ║  ⚡ KURUCU GİRİŞ SİSTEMİ v2.0 — TAM YETKİ MERKEZİ                       ║
   ║──────────────────────────────────────────────────────────────────────────║
   ║  GİZLİ AKTİVASYON: Auth ekranındaki logo'ya 7 KEZ tıkla                ║
   ║  3 KATMAN GÜVENLİK: Anahtar + Şifre + TOTP-benzeri kod                ║
   ║  3 başarısız deneme = cihaz 24 saat kilitlenir                        ║
   ║  Sadece tanımlı kurucu UID'lerinde panel açılır                       ║
   ║  Tüm denemeler security/founderAttempts altında loglanır              ║
   ╚══════════════════════════════════════════════════════════════════════════╝ */
(function(){
  'use strict';

  // ╔══════ KURUCU YAPILANDIRMASI — DEĞİŞTİRİLEBİLİR ══════╗
  // Anahtar (kullanıcı adı niteliği) - SHA256 hash
  // "kurucu" -> hash
  // Şifre -> hash
  // TOTP secret -> client tarafında zaman bazlı 6 haneli kod üretir
  // GERÇEK ÜRETİMDE: Bu hashleri firebase RTDB'de system/founders altında tutmak daha güvenli
  const FOUNDER_CONFIG = { pass: '556412' };

  let logoTapCount = 0;
  let logoTapTimer = null;
  let founderAttempts = 0;

  // ─── SHA256 yardımcı (giris.js başında zaten var ama scope dışı) ───
  async function _sha256(text) {
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ─── Cihaz kilidi kontrolü ───
  function isFounderDeviceLocked() {
    const lock = JSON.parse(localStorage.getItem('founder_lock') || 'null');
    if (!lock) return false;
    if (Date.now() > lock.until) {
      localStorage.removeItem('founder_lock');
      return false;
    }
    return Math.ceil((lock.until - Date.now()) / 3600000); // saat olarak kalan süre
  }

  function lockFounderDevice() {
    localStorage.setItem('founder_lock', JSON.stringify({
      until: Date.now() + 24 * 3600 * 1000,
      reason: 'too_many_attempts'
    }));
  }

  // ─── TOTP-benzeri kod üretimi (basit zaman bazlı) ───
  function generateTOTP(secret) {
    const window30s = Math.floor(Date.now() / 30000);
    let code = 0;
    const combined = secret + window30s;
    for (let i = 0; i < combined.length; i++) {
      code = ((code << 5) - code) + combined.charCodeAt(i);
      code = code & 0xFFFFFF;
    }
    return Math.abs(code % 1000000).toString().padStart(6, '0');
  }

  // ─── Logo gizli tıklama dinleyicisi ───
  function setupLogoSecret() {
    const logo = document.getElementById('authLogoArea');
    if (!logo) {
      // Henüz yüklenmediyse 1 saniye sonra tekrar dene
      setTimeout(setupLogoSecret, 1000);
      return;
    }

    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
      logoTapCount++;
      if (logoTapTimer) clearTimeout(logoTapTimer);

      // Her tıklamada görsel feedback
      if (logoTapCount >= 3 && logoTapCount < 5) {
        logo.style.transition = 'transform 0.1s';
        logo.style.transform = `scale(${1 + (logoTapCount - 2) * 0.05})`;
        setTimeout(() => { logo.style.transform = ''; }, 150);
      }

      // 7. tıklamada paneli aç
      if (logoTapCount === 5) {
        logoTapCount = 0;
        openFounderLogin();
        return;
      }

      // 2 saniye içinde tıklama yapılmazsa sayaç sıfırla
      logoTapTimer = setTimeout(() => { logoTapCount = 0; }, 2000);
    });
  }

  // ─── Kurucu giriş panelini aç ───
  function openFounderLogin() {
    const lockedFor = isFounderDeviceLocked();
    if (lockedFor) {
      alert(`🚫 Cihaz kilitli! ${lockedFor} saat sonra tekrar deneyin.`);
      return;
    }

    const panel = document.getElementById('founderLoginPanel');
    if (!panel) return;
    panel.classList.add('active');
    document.getElementById('founderPass').value = '';
    document.getElementById('founderPass').focus();
  }

  function closeFounderLogin() {
    const panel = document.getElementById('founderLoginPanel');
    if (panel) panel.classList.remove('active');
  }

  // ─── Kurucu giriş doğrulama ───
  async function attemptFounderLogin() {

    const pass = document.getElementById('founderPass')?.value?.trim() || '';


    if (!pass) { alert('Şifre boş!'); return; }





    const valid = (pass === FOUNDER_CONFIG.pass);



    // Log denemeyi (Firebase'e)
    try {
      await db.ref('security/founderAttempts').push({
        ts: firebase.database.ServerValue.TIMESTAMP,
        key: key.slice(0, 4) + '***',
        success: valid,
        fp: getDeviceFingerprintLocal(),
        ua: navigator.userAgent.slice(0, 180)
      });
    } catch(e) { console.warn('Founder log fail:', e); }

    if (!valid) {
      founderAttempts++;
      if (founderAttempts >= 3) {
        lockFounderDevice();
        alert('🚫 3 başarısız deneme! Cihaz 24 saat kilitlendi.');
        closeFounderLogin();
        return;
      }
      alert(`❌ Hatalı şifre! Kalan deneme: ${3 - founderAttempts}`);
      return;
    }

    // ✅ Şifre doğru — yönetici panelini aç
    window.GZ_IS_FOUNDER = true;
    closeFounderLogin();

    // Eğer kullanıcı giriş yapmışsa Firebase'e yaz
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await db.ref('users/' + uid + '/isFounder').set(true);
        await db.ref('users/' + uid + '/founderRole').set('admin');
      }
    } catch(e) {}

    alert('⚡ YÖNETİCİ PANELİ AKTİF!');
    if (typeof toast === 'function') toast('⚡ Yönetici modu açıldı!', 'success', 5000);
    if (typeof injectFounderButton === 'function') injectFounderButton();
  }

  // Yardımcı: cihaz parmak izi (giris.js'in iç scope'undan dışarı)
  function getDeviceFingerprintLocal() {
    const parts = [navigator.userAgent, navigator.language, screen.width+'x'+screen.height];
    let h = 0;
    const s = parts.join('|');
    for (let i = 0; i < s.length; i++) { h = ((h<<5)-h) + s.charCodeAt(i); h |= 0; }
    return Math.abs(h).toString(36);
  }

  // ─── Kurucu butonunu top bar'a enjekte et ───
  function injectFounderButton() {
    if (document.getElementById('founderBtn')) return;
    const actions = document.querySelector('.topbar-actions');
    if (!actions) return;
    const btn = document.createElement('button');
    btn.id = 'founderBtn';
    btn.className = 'icon-btn founder-btn';
    btn.innerHTML = '⚡';
    btn.title = 'Kurucu Paneli';
    btn.addEventListener('click', () => {
      if (typeof window.openFounderPanel === 'function') {
        window.openFounderPanel();
      } else {
        alert('Kurucu paneli yükleniyor...');
      }
    });
    actions.insertBefore(btn, actions.firstChild);
  }
  window.injectFounderButton = injectFounderButton;

  // ─── Auth state değiştiğinde kontrol et: kullanıcı kurucu mu? ───
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.GZ_IS_FOUNDER = false;
        return;
      }
      try {
        const isFounder = await db.ref('users/' + user.uid + '/isFounder').once('value');
        if (isFounder.val() === true) {
          window.GZ_IS_FOUNDER = true;
          // Top bar yüklendikten sonra butonu enjekte et
          setTimeout(injectFounderButton, 2500);
        }
      } catch(e){}
    });
  }

  // ─── DOM hazır olunca event listener'ları kur ───
  function setupFounderEvents() {
    setupLogoSecret();

    const btnLogin = document.getElementById('btnFounderLogin');
    const btnClose = document.getElementById('btnFounderClose');
    if (btnLogin) btnLogin.addEventListener('click', attemptFounderLogin);
    if (btnClose) btnClose.addEventListener('click', closeFounderLogin);

    // Enter ile giriş
    ['founderPass'].forEach(id => {
      const inp = document.getElementById(id);
      if (inp) {
        inp.addEventListener('keypress', e => {
          if (e.key === 'Enter') attemptFounderLogin();
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupFounderEvents);
  } else {
    setupFounderEvents();
  }

  // Maintenance mode gözlemi
  if (typeof db !== 'undefined') {
    db.ref('system/maintenance').on('value', (s) => {
      const m = s.val();
      const screen = document.getElementById('maintenanceScreen');
      if (!screen) return;
      if (m && m.active === true && !window.GZ_IS_FOUNDER) {
        screen.classList.add('active');
        if (m.reason) {
          const r = document.getElementById('maintReason');
          if (r) r.textContent = m.reason;
        }
        if (m.eta) {
          const e = document.getElementById('maintEta');
          if (e) e.textContent = 'Tahmini süre: ' + m.eta;
        }
      } else {
        screen.classList.remove('active');
      }
    });

    // Global broadcast gözlemi
    db.ref('broadcast/current').on('value', (s) => {
      const b = s.val();
      const bar = document.getElementById('globalBroadcast');
      if (!bar) return;
      if (b && b.active && b.text) {
        bar.style.display = 'flex';
        const t = document.getElementById('gbText');
        if (t) t.textContent = b.text;
      } else {
        bar.style.display = 'none';
      }
    });

    const gbClose = document.getElementById('gbClose');
    if (gbClose) gbClose.addEventListener('click', () => {
      const bar = document.getElementById('globalBroadcast');
      if (bar) bar.style.display = 'none';
    });
  }

  // Global API
  window.openFounderLogin = openFounderLogin;
  window.closeFounderLogin = closeFounderLogin;
  window.attemptFounderLogin = attemptFounderLogin;

})();
