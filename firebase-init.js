// ================================================================
// GAME ZONE ERP v5.0 — Firebase Başlatma ve Yardımcı Fonksiyonlar
// ================================================================

import { loadFsState } from './economy.js';

// --- Firebase Yapılandırması ---
const FB_CONFIG = {
  apiKey: "AIzaSyCZ-maUXnCNTHR1BlSwTzjMUaotJduTDQs",
  authDomain: "gamezone-erp.firebaseapp.com",
  projectId: "gamezone-erp",
  storageBucket: "gamezone-erp.firebasestorage.app",
  messagingSenderId: "948726896226",
  appId: "1:948726896226:web:e417b0f8375f7a4ec2233b",
  databaseURL: "https://gamezone-e11b0-default-rtdb.europe-west1.firebasedatabase.app/"
};

// --- DeviceID (Kalıcı) ---
let deviceId = (() => {
  let id = localStorage.getItem('gz_did_v2');
  if (!id) {
    id = localStorage.getItem('gz_did') ||
         localStorage.getItem('gz_deviceId') ||
         (Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem('gz_did_v2', id);
  }
  return id;
})();

// --- Firebase Referansları (export edilecek) ---
export let fbApp = null;
export let fbAuth = null;
export let fbDb = null;    // Firestore
export let fbRtdb = null; // Realtime Database
export let fbUser = null;
export let fbUnsub = null;
export let fbChatUnsub = null;

// --- UI Yardımcıları ---
export function showLS(msg) {
  const el = document.getElementById('ls');
  if (el) {
    el.style.display = 'flex';
    el.classList.remove('hide');
  }
  const sub = document.getElementById('ls-msg');
  if (sub) sub.textContent = msg || 'Bağlanıyor...';
}

export function hideLS() {
  const el = document.getElementById('ls');
  if (el) {
    el.classList.add('hide');
    setTimeout(() => {
      if (el.classList.contains('hide')) el.style.display = 'none';
    }, 500);
  }
}

export function showNoNet() {
  hideLS();
  document.getElementById('no-net').classList.add('show');
}

export function hideNoNet() {
  document.getElementById('no-net').classList.remove('show');
}

export function retryConn() {
  hideNoNet();
  initFirebase();
}

// --- Firebase Başlatma ---
export async function initFirebase() {
  showLS('Firebase yükleniyor...');
  try {
    const [appM, authM, fsM, rtM] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js')
    ]);

    const apps = appM.getApps ? appM.getApps() : [];
    fbApp = apps.length ? apps[0] : appM.initializeApp(FB_CONFIG);
    fbAuth = authM.getAuth(fbApp);
    fbDb = fsM.getFirestore(fbApp);
    fbRtdb = rtM.getDatabase(fbApp);

    // Yardımcı kütüphane referanslarını window'a ekleyelim (diğer modüller için)
    window._fbAuthLib = {
      createUserWithEmailAndPassword: authM.createUserWithEmailAndPassword,
      signInWithEmailAndPassword: authM.signInWithEmailAndPassword,
      sendPasswordResetEmail: authM.sendPasswordResetEmail,
      onAuthStateChanged: authM.onAuthStateChanged
    };
    window._fbDbLib = {
      doc: fsM.doc,
      setDoc: fsM.setDoc,
      getDoc: fsM.getDoc,
      onSnapshot: fsM.onSnapshot,
      updateDoc: fsM.updateDoc
    };
    window._rtLib = {
      ref: rtM.ref,
      push: rtM.push,
      onValue: rtM.onValue,
      query: rtM.query,
      orderByChild: rtM.orderByChild,
      limitToLast: rtM.limitToLast
    };

    // Kimlik doğrulama durumu izleyicisi
    authM.onAuthStateChanged(fbAuth, async (user) => {
      if (user) {
        fbUser = user;
        const mainEl = document.getElementById('main');
        if (!mainEl || !mainEl.classList.contains('active')) {
          showLS('Veriler yükleniyor...');
          await loadFsState(); // economy.js'den gelir
        }
      } else {
        hideLS();
        // Giriş yapılmamışsa hoş geldin ekranını göster
        const { showScreen } = await import('./ui-manager.js');
        showScreen('welcome');
      }
    });

  } catch (err) {
    console.warn('Firebase çevrimdışı moda geçildi:', err);
    hideLS();
    // Çevrimdışı deneyim – eğer localStorage'da kullanıcı varsa göster
    const { loadState } = await import('./economy.js');
    loadState();
    const { state } = await import('./economy.js');
    if (state.user) {
      const { showMain } = await import('./ui-manager.js');
      showMain();
    } else {
      const { showScreen } = await import('./ui-manager.js');
      showScreen('welcome');
    }
  }
}

// --- Doğrudan başlat ---
initFirebase();

// --- DeviceId dışa aç ---
export { deviceId };
