/* ================================================================
   firebase-init.js — Game Zone ERP v5.0
   Firebase CDN (compat) — sunucu gerektirmez, direkt çalışır
   ================================================================ */

const FB_CONFIG = {
  apiKey:            "AIzaSyB5pl78DRao2SmUWsMYMSZ6YbfX4rtRNdc",
  authDomain:        "gamezone-e11b0.firebaseapp.com",
  databaseURL:       "https://gamezone-e11b0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "gamezone-e11b0",
  storageBucket:     "gamezone-e11b0.firebasestorage.app",
  messagingSenderId: "775694460272",
  appId:             "1:775694460272:web:7e5fd5691df9d8399d5bb5",
  measurementId:     "G-3M7FXX8XR4"
};

let fbApp  = null;
let fbAuth = null;
let fbDb   = null;
let fbRtdb = null;
let fbUser = null;
let fbUnsub     = null;
let fbChatUnsub = null;

/* DeviceID */
let deviceId = (() => {
  let id = localStorage.getItem('gz_did_v2');
  if (!id) {
    id = localStorage.getItem('gz_did') || localStorage.getItem('gz_deviceId');
    if (!id) id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('gz_did_v2', id);
  }
  return id;
})();

/* ---- Loading ---- */
function showLS(msg) {
  const el = document.getElementById('ls');
  if (el) { el.style.display = 'flex'; el.classList.remove('hide'); }
  const s = document.getElementById('ls-msg');
  if (s) s.textContent = msg || 'Bağlanıyor...';
}
function hideLS() {
  const el = document.getElementById('ls');
  if (el) {
    el.classList.add('hide');
    setTimeout(() => { if (el.classList.contains('hide')) el.style.display = 'none'; }, 500);
  }
}
function showNoNet() { hideLS(); document.getElementById('no-net').classList.add('show'); }
function hideNoNet() { document.getElementById('no-net').classList.remove('show'); }
function retryConn() { hideNoNet(); initFirebase(); }

/* ---- Script Yükleyici ---- */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ================================================================
   Firebase Başlat
   ================================================================ */
async function initFirebase() {
  showLS('Firebase yükleniyor...');
  try {
    await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js');

    if (!firebase.apps.length) {
      fbApp = firebase.initializeApp(FB_CONFIG);
    } else {
      fbApp = firebase.apps[0];
    }

    fbAuth = firebase.auth();
    fbDb   = firebase.firestore();
    fbRtdb = firebase.database();

    window.auth = fbAuth;
    window.fs   = fbDb;
    window.db   = fbRtdb;

    /* Compat wrapper'ları — economy.js & login.js ile uyumlu */
    window._fbAuthLib = {
      createUserWithEmailAndPassword: (auth, email, pw) => auth.createUserWithEmailAndPassword(email, pw),
      signInWithEmailAndPassword:     (auth, email, pw) => auth.signInWithEmailAndPassword(email, pw),
      sendPasswordResetEmail:         (auth, email)     => auth.sendPasswordResetEmail(email),
      onAuthStateChanged:             (auth, cb)        => auth.onAuthStateChanged(cb)
    };

    window._fbDbLib = {
      doc:       (db, col, id) => db.collection(col).doc(id),
      setDoc:    (ref, data)   => ref.set(data),
      getDoc:    (ref)         => ref.get(),
      onSnapshot:(ref, cb)     => ref.onSnapshot(cb),
      updateDoc: (ref, data)   => ref.update(data)
    };

    window._rtLib = {
      ref:         (db, path) => db.ref(path),
      push:        (ref, data) => ref.push(data),
      onValue:     (ref, cb)   => ref.on('value', cb),
      /* query zinciri: orderByChild + limitToLast */
      query:       (ref, ...fns) => fns.reduce((r, fn) => fn(r), ref),
      orderByChild:(field) => (ref) => ref.orderByChild(field),
      limitToLast: (n)     => (ref) => ref.limitToLast(n)
    };

    /* Auth durum takibi */
    fbAuth.onAuthStateChanged(async user => {
      if (user) {
        fbUser = user;
        const mainEl = document.getElementById('main');
        if (!mainEl || !mainEl.classList.contains('active')) {
          showLS('Veriler yükleniyor...');
          await loadFsState();
        }
      } else {
        hideLS();
        showScreen('welcome');
      }
    });

  } catch (err) {
    console.warn('Firebase yüklenemedi, offline mod:', err);
    hideLS();
    loadState();
    if (state.user) showMain(); else showScreen('welcome');
  }
}

/* ---- Firestore'dan State Yükle ---- */
async function loadFsState() {
  if (!fbDb || !fbUser) { hideLS(); showScreen('welcome'); return; }
  try {
    const ref  = fbDb.collection('players').doc(fbUser.uid);
    const snap = await ref.get();

    if (snap.exists) {
      const data  = snap.data();
      const saved = data.gameState || {};
      state = Object.assign({}, state, saved);
      state.user = data.user || state.user;

      if (!state.tesisler) state.tesisler = { bahce: [], ciftlik: [], fabrika: [], maden: [] };
      ['bahce','ciftlik','fabrika','maden'].forEach(k => { if (!state.tesisler[k]) state.tesisler[k] = []; });
      if (!state.depolar)       state.depolar       = [];
      if (!state.kripto)        state.kripto        = {};
      if (!state.kriptoHistory) state.kriptoHistory = [];
      if (!state.exportOrders)  state.exportOrders  = [];
      if (!state.pazarListings) state.pazarListings  = [];

      /* Ban kontrol */
      try {
        const banSnap = await fbDb.collection('bans').doc(fbUser.uid).get();
        if (banSnap.exists) {
          state.banned    = true;
          state.banReason = banSnap.data().reason || 'Admin yasağı';
        }
      } catch (_) {}
    } else {
      await saveFsState();
    }

    /* Ban snapshot takibi */
    if (fbUnsub) fbUnsub();
    fbUnsub = fbDb.collection('bans').doc(fbUser.uid).onSnapshot(s2 => {
      if (s2.exists) {
        state.banned    = true;
        state.banReason = s2.data().reason;
        showBanScreen(s2.data().reason);
      }
    });

    hideLS();
    showMain();

  } catch (err) {
    console.warn('Firestore hatası, offline:', err);
    loadState();
    hideLS();
    if (state.user) showMain(); else showScreen('welcome');
  }
}

/* ---- Firestore'a State Kaydet ---- */
async function saveFsState() {
  if (!fbDb || !fbUser) { saveState(); return; }
  try {
    await fbDb.collection('players').doc(fbUser.uid).set({
      user:      state.user,
      gameState: state,
      deviceId,
      updatedAt: Date.now()
    });
  } catch (e) {
    saveState();
  }
}

/* Otomatik kayıt — her 15 saniye */
setInterval(() => {
  saveState();
  if (fbDb && fbUser) saveFsState();
}, 15000);
