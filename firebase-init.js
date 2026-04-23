/* ============================================================
   GAME ZONE ERP — firebase-init.js
   Firebase initialization, authentication & Firestore sync
   ============================================================ */

'use strict';

/* ---- Firebase Config ---- */
const FB_CONFIG = {
  apiKey: "AIzaSyCZ-maUXnCNTHR1BlSwTzjMUaotJduTDQs",
  authDomain: "gamezone-erp.firebaseapp.com",
  projectId: "gamezone-erp",
  storageBucket: "gamezone-erp.firebasestorage.app",
  messagingSenderId: "948726896226",
  appId: "1:948726896226:web:e417b0f8375f7a4ec2233b",
  databaseURL: "https://gamezone-e11b0-default-rtdb.europe-west1.firebasedatabase.app/"
};

/* ---- Module references (populated after dynamic import) ---- */
let fbApp = null;
let fbAuth = null;
let fbDb = null;     // Firestore
let fbRtdb = null;   // Realtime DB
let fbUser = null;
let fbUnsub = null;
let fbChatUnsub = null;

window.fs = null;
window.db = null;
window.auth = null;

/* ============================================================
   DEVICE ID (anti-cheat, multi-device)
   Migrates old keys → gz_did_v2 seamlessly.
   ============================================================ */
const deviceId = (() => {
  let id = localStorage.getItem('gz_did_v2');
  if (!id) {
    id = localStorage.getItem('gz_did') || localStorage.getItem('gz_deviceId');
    if (!id) id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('gz_did_v2', id);
  }
  return id;
})();

/* ============================================================
   SCREEN HELPERS
   ============================================================ */
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

/* ============================================================
   FIREBASE INIT
   Dynamic import — works offline gracefully.
   ============================================================ */
async function initFirebase() {
  showLS('Firebase yükleniyor...');
  try {
    const [appM, authM, fsM, rtM] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js')
    ]);

    const existing = appM.getApps ? appM.getApps() : [];
    fbApp = existing.length ? existing[0] : appM.initializeApp(FB_CONFIG);

    fbAuth = authM.getAuth(fbApp);
    window.auth = fbAuth;

    fbDb = fsM.getFirestore(fbApp);
    window.fs = fbDb;

    fbRtdb = rtM.getDatabase(fbApp);
    window.db = fbRtdb;

    /* Store lib refs on window for cross-module access */
    window._fbAuthLib = {
      createUserWithEmailAndPassword: authM.createUserWithEmailAndPassword,
      signInWithEmailAndPassword:     authM.signInWithEmailAndPassword,
      sendPasswordResetEmail:         authM.sendPasswordResetEmail,
      onAuthStateChanged:             authM.onAuthStateChanged,
      signOut:                        authM.signOut
    };

    window._fbDbLib = {
      doc:       fsM.doc,
      setDoc:    fsM.setDoc,
      getDoc:    fsM.getDoc,
      onSnapshot: fsM.onSnapshot,
      updateDoc: fsM.updateDoc,
      collection: fsM.collection,
      query:     fsM.query,
      orderBy:   fsM.orderBy,
      limit:     fsM.limit
    };

    window._rtLib = {
      ref:         rtM.ref,
      push:        rtM.push,
      onValue:     rtM.onValue,
      query:       rtM.query,
      orderByChild: rtM.orderByChild,
      limitToLast: rtM.limitToLast,
      set:         rtM.set
    };

    /* Auth state observer */
    authM.onAuthStateChanged(fbAuth, async user => {
      if (user) {
        fbUser = user;
        const mainEl = document.getElementById('main');
        if (!mainEl || !mainEl.classList.contains('active')) {
          showLS('Veriler yükleniyor...');
          await loadFsState();
        }
      } else {
        hideLS();
        if (typeof showScreen === 'function') showScreen('welcome');
      }
    });

  } catch (err) {
    console.warn('Firebase offline moda geçildi:', err);
    hideLS();
    if (typeof loadState === 'function') loadState();
    if (window.state && window.state.user) {
      if (typeof showMain === 'function') showMain();
    } else {
      if (typeof showScreen === 'function') showScreen('welcome');
    }
  }
}

/* ============================================================
   FIRESTORE — Load player state
   ============================================================ */
async function loadFsState() {
  if (!fbDb || !fbUser || !window._fbDbLib) {
    hideLS();
    if (typeof showScreen === 'function') showScreen('welcome');
    return;
  }
  try {
    const { doc, getDoc, onSnapshot } = window._fbDbLib;
    const ref = doc(fbDb, 'players', fbUser.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();

      /* Soft device-id migration (no forced logout) */
      if (data.deviceId && data.deviceId !== deviceId) {
        console.log('DeviceID güncelleniyor (normal)');
      }

      const saved = data.gameState || {};
      if (typeof state !== 'undefined') {
        Object.assign(state, saved);
        state.user = data.user || state.user;
        _ensureStateDefaults();
      }

      /* Ban check */
      const banSnap = await getDoc(doc(fbDb, 'bans', fbUser.uid)).catch(() => null);
      if (banSnap && banSnap.exists()) {
        if (typeof state !== 'undefined') {
          state.banned = true;
          state.banReason = banSnap.data().reason || 'Admin yasağı';
        }
      }
    } else {
      await saveFsState();
    }

    /* Subscribe to ban updates */
    if (fbUnsub) fbUnsub();
    fbUnsub = onSnapshot(doc(fbDb, 'bans', fbUser.uid), s2 => {
      if (s2.exists() && typeof state !== 'undefined') {
        state.banned = true;
        state.banReason = s2.data().reason;
        if (typeof showBanScreen === 'function') showBanScreen(s2.data().reason);
      }
    });

    hideLS();
    if (typeof showMain === 'function') showMain();

  } catch (err) {
    console.warn('Firestore hatası, offline moda:', err);
    if (typeof loadState === 'function') loadState();
    hideLS();
    if (typeof state !== 'undefined' && state.user) {
      if (typeof showMain === 'function') showMain();
    } else {
      if (typeof showScreen === 'function') showScreen('welcome');
    }
  }
}

/* ============================================================
   FIRESTORE — Save player state
   ============================================================ */
async function saveFsState() {
  if (!fbDb || !fbUser || !window._fbDbLib) return;
  if (typeof state === 'undefined') return;
  try {
    const { doc, setDoc } = window._fbDbLib;
    await setDoc(doc(fbDb, 'players', fbUser.uid), {
      user: state.user || null,
      gameState: state,
      deviceId,
      lastSave: Date.now()
    });
  } catch (e) {
    console.warn('saveFsState hatası:', e);
  }
}

/* ============================================================
   REALTIME CHAT — init
   ============================================================ */
function initRealtimeChat() {
  if (!fbRtdb || !window._rtLib) return;
  const { ref, query, orderByChild, limitToLast, onValue } = window._rtLib;
  const chatRef = query(ref(fbRtdb, 'chat'), orderByChild('ts'), limitToLast(30));

  if (fbChatUnsub) fbChatUnsub();
  fbChatUnsub = onValue(chatRef, snap => {
    const msgs = [];
    snap.forEach(child => msgs.push({ id: child.key, ...child.val() }));
    if (typeof renderChatMessages === 'function') renderChatMessages(msgs);
  });
}

/* ============================================================
   SEND CHAT MESSAGE
   ============================================================ */
async function sendChatMessage(text) {
  if (!text || !text.trim()) return;
  if (!fbRtdb || !window._rtLib) {
    if (typeof toast === 'function') toast('Sohbet çevrimdışı', 'error');
    return;
  }
  const { ref, push } = window._rtLib;
  const name = (typeof state !== 'undefined' && state.user?.name) || 'Misafir';
  await push(ref(fbRtdb, 'chat'), {
    user: name,
    text: text.trim(),
    ts: Date.now(),
    av: name[0]?.toUpperCase() || '😊'
  });
}

/* ============================================================
   SIGN OUT
   ============================================================ */
async function doSignOut() {
  if (!fbAuth || !window._fbAuthLib) return;
  try {
    await window._fbAuthLib.signOut(fbAuth);
    fbUser = null;
    if (typeof state !== 'undefined') {
      state.user = null;
    }
    if (typeof showScreen === 'function') showScreen('welcome');
  } catch (e) {
    console.warn('Sign-out hatası:', e);
  }
}

/* ============================================================
   BAN
   ============================================================ */
function triggerBan(reason) {
  if (typeof state !== 'undefined') {
    state.banned = true;
    state.banReason = reason;
    if (typeof saveState === 'function') saveState();
  }
  if (fbDb && fbUser && window._fbDbLib) {
    const { doc, setDoc } = window._fbDbLib;
    setDoc(doc(fbDb, 'bans', fbUser.uid), { reason, ts: Date.now() }).catch(() => {});
  }
  if (typeof showBanScreen === 'function') showBanScreen(reason);
}

function showBanScreen(r) {
  const el = document.getElementById('ban-reason-txt');
  if (el) el.textContent = r || 'Kural ihlali.';
  document.getElementById('ban-scr').classList.add('show');
}

function checkBanned() {
  if (typeof state !== 'undefined' && state.banned) showBanScreen(state.banReason);
}

/* ============================================================
   STATE DEFAULTS (called after merge)
   ============================================================ */
function _ensureStateDefaults() {
  if (typeof state === 'undefined') return;
  if (!state.bank) state.bank = { balance: 0, investment: 0, credit: 0, profit: 0 };
  if (!state.tesisler) state.tesisler = { bahce: [], ciftlik: [], fabrika: [], maden: [] };
  ['bahce', 'ciftlik', 'fabrika', 'maden'].forEach(k => {
    if (!state.tesisler[k]) state.tesisler[k] = [];
  });
  if (!state.depolar) state.depolar = [];
  if (!state.kripto) state.kripto = {};
  if (!state.kriptoHistory) state.kriptoHistory = [];
  if (!state.exportOrders) state.exportOrders = [];
  if (!state.notifications) state.notifications = [];
  if (!state.pazarListings) state.pazarListings = [];
  if (!state.chatHistory) state.chatHistory = [];
}

/* ---- Expose globals ---- */
window.initFirebase = initFirebase;
window.saveFsState = saveFsState;
window.loadFsState = loadFsState;
window.initRealtimeChat = initRealtimeChat;
window.sendChatMessage = sendChatMessage;
window.doSignOut = doSignOut;
window.triggerBan = triggerBan;
window.showBanScreen = showBanScreen;
window.checkBanned = checkBanned;
window.retryConn = retryConn;
window.showNoNet = showNoNet;
window.hideNoNet = hideNoNet;
window.deviceId = deviceId;
window.fbUser = null; // will be assigned internally
