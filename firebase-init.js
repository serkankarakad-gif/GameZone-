/* ================================================================
   GAME ZONE ERP — firebase-init.js
   Orijinal 1413 satırlık koddan birebir alınan Firebase yapısı.
   Yükleme sırası: economy.js → firebase-init.js → login.js → ui-manager.js
   ================================================================ */

/* ---------------------------------------------------------------
   DEVİCE ID  (localStorage migration dahil)
   --------------------------------------------------------------- */
var deviceId = (function () {
  var id = localStorage.getItem('gz_did_v2');
  if (!id) {
    id = localStorage.getItem('gz_did') || localStorage.getItem('gz_deviceId');
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); }
    localStorage.setItem('gz_did_v2', id);
  }
  return id;
})();
window.deviceId = deviceId;

/* ---------------------------------------------------------------
   FIREBASE KONFİGÜRASYON  (orijinalden birebir)
   --------------------------------------------------------------- */
var FB_CONFIG = {
  apiKey:            "AIzaSyCZ-maUXnCNTHR1BlSwTzjMUaotJduTDQs",
  authDomain:        "gamezone-erp.firebaseapp.com",
  projectId:         "gamezone-erp",
  storageBucket:     "gamezone-erp.firebasestorage.app",
  messagingSenderId: "948726896226",
  appId:             "1:948726896226:web:e417b0f8375f7a4ec2233b",
  databaseURL:       "https://gamezone-e11b0-default-rtdb.europe-west1.firebasedatabase.app/"
};
window.FB_CONFIG = FB_CONFIG;

/* ---------------------------------------------------------------
   GLOBAL DEGİSKENLER
   --------------------------------------------------------------- */
var fbApp       = null;
var fbAuth      = null;
var fbDb        = null;
var fbRtdb      = null;
var fbUser      = null;
var fbUnsub     = null;
var fbChatUnsub = null;
var _chatInited = false;
window.fbApp    = null;
window.fbAuth   = null;
window.fbDb     = null;
window.fbRtdb   = null;
window.fbUser   = null;
window.auth     = null;
window.fs       = null;
window.db       = null;

/* ---------------------------------------------------------------
   EKRAN YARDIMCILARI
   --------------------------------------------------------------- */
function showLS(msg) {
  var el = document.getElementById('ls');
  if (el) { el.style.display = 'flex'; el.classList.remove('hide'); }
  var s = document.getElementById('ls-msg');
  if (s) s.textContent = msg || 'Baglanıyor...';
}
function hideLS() {
  var el = document.getElementById('ls');
  if (el) {
    el.classList.add('hide');
    setTimeout(function () { if (el.classList.contains('hide')) el.style.display = 'none'; }, 500);
  }
}
function showNoNet()  { hideLS(); var el = document.getElementById('no-net'); if (el) el.classList.add('show'); }
function hideNoNet()  { var el = document.getElementById('no-net'); if (el) el.classList.remove('show'); }
function retryConn()  { hideNoNet(); initFirebase(); }
function showBanScreen(r) {
  var el = document.getElementById('ban-reason-txt');
  if (el) el.textContent = r || 'Kural ihlali.';
  var bs = document.getElementById('ban-scr');
  if (bs) bs.classList.add('show');
}
window.showLS       = showLS;
window.hideLS       = hideLS;
window.showNoNet    = showNoNet;
window.hideNoNet    = hideNoNet;
window.retryConn    = retryConn;
window.showBanScreen = showBanScreen;

/* ---------------------------------------------------------------
   BAN
   --------------------------------------------------------------- */
function triggerBan(reason) {
  state.banned    = true;
  state.banReason = reason;
  if (typeof saveState === 'function') saveState();
  if (fbDb && fbUser && window._fbDbLib) {
    try {
      var d = window._fbDbLib;
      d.setDoc(d.doc(fbDb, 'bans', fbUser.uid), { reason: reason, ts: Date.now() }).catch(function(){});
    } catch (e) {}
  }
  showBanScreen(reason);
}
window.triggerBan = triggerBan;

/* ---------------------------------------------------------------
   FIRESTORE KAYDET
   --------------------------------------------------------------- */
async function saveFsState() {
  if (!fbDb || !fbUser || !window._fbDbLib) {
    if (typeof saveState === 'function') saveState();
    return;
  }
  try {
    var d = window._fbDbLib;
    await d.setDoc(d.doc(fbDb, 'players', fbUser.uid), {
      user:      state.user,
      gameState: state,
      deviceId:  deviceId,
      updatedAt: Date.now()
    });
  } catch (e) {
    if (typeof saveState === 'function') saveState();
  }
}
window.saveFsState = saveFsState;

/* ---------------------------------------------------------------
   FIRESTORE YUKLE
   --------------------------------------------------------------- */
async function loadFsState() {
  if (!fbDb || !fbUser || !window._fbDbLib) {
    hideLS();
    if (typeof showScreen === 'function') showScreen('welcome');
    return;
  }
  try {
    var d    = window._fbDbLib;
    var ref  = d.doc(fbDb, 'players', fbUser.uid);
    var snap = await d.getDoc(ref);

    if (snap.exists()) {
      var data  = snap.data();
      if (data.deviceId && data.deviceId !== deviceId) {
        console.log('DeviceID guncelleniyor (normal)');
      }
      var saved = data.gameState || {};
      state = Object.assign({}, state, saved);
      state.user = data.user || state.user;

      if (!state.bank)       state.bank = { balance:0, investment:0, credit:0, profit:0 };
      if (!state.tesisler)   state.tesisler = { bahce:[], ciftlik:[], fabrika:[], maden:[] };
      ['bahce','ciftlik','fabrika','maden'].forEach(function(k){
        if (!state.tesisler[k]) state.tesisler[k] = [];
      });
      if (!state.depolar)       state.depolar       = [];
      if (!state.kripto)        state.kripto        = {};
      if (!state.kriptoHistory) state.kriptoHistory = [];
      if (!state.exportOrders)  state.exportOrders  = [];
      if (!state.notifications) state.notifications = [];
      if (!state.pazarListings) state.pazarListings = [];

      try {
        var banSnap = await d.getDoc(d.doc(fbDb, 'bans', fbUser.uid));
        if (banSnap && banSnap.exists()) {
          state.banned    = true;
          state.banReason = banSnap.data().reason || 'Admin yasagi';
        }
      } catch (_) {}

    } else {
      await saveFsState();
    }

    if (fbUnsub) fbUnsub();
    fbUnsub = d.onSnapshot(d.doc(fbDb, 'bans', fbUser.uid), function(s2) {
      if (s2.exists()) {
        state.banned    = true;
        state.banReason = s2.data().reason;
        showBanScreen(s2.data().reason);
      }
    });

    hideLS();
    if (typeof showMain === 'function') showMain();

  } catch (err) {
    console.warn('Firestore hatasi, offline mod:', err);
    if (typeof loadState === 'function') loadState();
    hideLS();
    if (state && state.user) {
      if (typeof showMain === 'function') showMain();
    } else {
      if (typeof showScreen === 'function') showScreen('welcome');
    }
  }
}
window.loadFsState = loadFsState;

/* ---------------------------------------------------------------
   FIREBASE BASLAT  (orijinalden birebir)
   --------------------------------------------------------------- */
async function initFirebase() {
  showLS('Firebase yukleniyor...');
  try {
    var mods = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js')
    ]);
    var appM  = mods[0];
    var authM = mods[1];
    var fsM   = mods[2];
    var rtM   = mods[3];

    var existing = appM.getApps ? appM.getApps() : [];
    fbApp = existing.length ? existing[0] : appM.initializeApp(FB_CONFIG);

    fbAuth = authM.getAuth(fbApp);
    fbDb   = fsM.getFirestore(fbApp);
    fbRtdb = rtM.getDatabase(fbApp);

    window.fbApp  = fbApp;
    window.fbAuth = fbAuth;
    window.fbDb   = fbDb;
    window.fbRtdb = fbRtdb;
    window.auth   = fbAuth;
    window.fs     = fbDb;
    window.db     = fbRtdb;

    window._fbAuthLib = {
      createUserWithEmailAndPassword: authM.createUserWithEmailAndPassword,
      signInWithEmailAndPassword:     authM.signInWithEmailAndPassword,
      sendPasswordResetEmail:         authM.sendPasswordResetEmail,
      onAuthStateChanged:             authM.onAuthStateChanged,
      signOut:                        authM.signOut
    };

    window._fbDbLib = {
      doc:        fsM.doc,
      setDoc:     fsM.setDoc,
      getDoc:     fsM.getDoc,
      onSnapshot: fsM.onSnapshot,
      updateDoc:  fsM.updateDoc,
      collection: fsM.collection,
      getDocs:    fsM.getDocs
    };

    window._rtLib = {
      ref:          rtM.ref,
      push:         rtM.push,
      onValue:      rtM.onValue,
      query:        rtM.query,
      orderByChild: rtM.orderByChild,
      limitToLast:  rtM.limitToLast
    };

    authM.onAuthStateChanged(fbAuth, async function(user) {
      if (user) {
        fbUser        = user;
        window.fbUser = user;
        var mainEl    = document.getElementById('main');
        if (!mainEl || !mainEl.classList.contains('active')) {
          showLS('Veriler yukleniyor...');
          await loadFsState();
        }
      } else {
        hideLS();
        if (typeof showScreen === 'function') showScreen('welcome');
      }
    });

  } catch (err) {
    console.warn('Firebase offline moda gecildi:', err);
    hideLS();
    if (typeof loadState === 'function') loadState();
    if (state && state.user) {
      if (typeof showMain === 'function') showMain();
    } else {
      if (typeof showScreen === 'function') showScreen('welcome');
    }
  }
}
window.initFirebase = initFirebase;

/* ---------------------------------------------------------------
   REALTIME DB: CHAT
   --------------------------------------------------------------- */
function initRealtimeChat() {
  if (_chatInited || !window.db || !window._rtLib) return;
  _chatInited = true;
  var rt  = window._rtLib;
  var ref = rt.query(rt.ref(window.db, 'chat'), rt.orderByChild('ts'), rt.limitToLast(60));
  if (fbChatUnsub) fbChatUnsub();
  fbChatUnsub = rt.onValue(ref, function(snap) {
    var msgs = [];
    snap.forEach(function(c) { msgs.push(c.val()); });
    msgs.reverse();
    if (typeof renderChatMessages === 'function') renderChatMessages(msgs);
  });
}
window.initRealtimeChat = initRealtimeChat;

function sendChatMessage(text) {
  if (!window.db || !window._rtLib) {
    if (!state.chatHistory) state.chatHistory = [];
    var name = (state.user && state.user.name) ? state.user.name : 'Oyuncu';
    state.chatHistory.unshift({ user: name, text: text, time: 'simdi', ts: Date.now() });
    if (typeof renderChatMessages === 'function') renderChatMessages(state.chatHistory.slice(0, 60));
    if (typeof saveState === 'function') saveState();
    return;
  }
  var rt   = window._rtLib;
  var name = (state.user && state.user.name) ? state.user.name : 'Oyuncu';
  var now  = new Date();
  rt.push(rt.ref(window.db, 'chat'), {
    user: name,
    text: text,
    time: now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0'),
    ts:   Date.now()
  }).catch(function(e) { console.warn('Chat gonderilemedi:', e); });
}
window.sendChatMessage = sendChatMessage;

/* ---------------------------------------------------------------
   CIKIS
   --------------------------------------------------------------- */
function doSignOut() {
  if (window._fbAuthLib && fbAuth) {
    window._fbAuthLib.signOut(fbAuth).catch(function(){});
  }
  if (state) state.user = null;
  if (typeof saveState === 'function') saveState();
  fbUser        = null;
  window.fbUser = null;
  _chatInited   = false;
  if (fbChatUnsub) { try { fbChatUnsub(); } catch(_){} fbChatUnsub = null; }
  if (fbUnsub)     { try { fbUnsub();     } catch(_){} fbUnsub     = null; }
  var mainEl = document.getElementById('main');
  if (mainEl) mainEl.classList.remove('active');
  if (typeof showScreen === 'function') showScreen('welcome');
}
window.doSignOut = doSignOut;

/* ---------------------------------------------------------------
   OTOMATİK KAYIT
   --------------------------------------------------------------- */
setInterval(function() {
  if (typeof saveState === 'function') saveState();
  if (fbDb && fbUser) saveFsState();
}, 15000);
