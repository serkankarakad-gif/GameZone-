// ============================================================
// CakeSmash - Firebase Başlatma Modülü
// Geliştirici: Serkan Karakaş
// Açıklama: Firebase bağlantısını başlatır, Auth ve Realtime
// Database referanslarını dışa aktarır. Tüm modüller bu dosyadan
// "auth" ve "db" referanslarını import eder.
// ============================================================

// --- Firebase SDK importları (CDN üzerinden modül tabanlı) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  push,
  child,
  onValue,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast,
  equalTo
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// --- Firebase yapılandırması (kullanıcı tarafından sağlandı) ---
const firebaseConfig = {
  apiKey: "AIzaSyB5pl78DRao2SmUWsMYMSZ6YbfX4rtRNdc",
  authDomain: "gamezone-e11b0.firebaseapp.com",
  databaseURL: "https://gamezone-e11b0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gamezone-e11b0",
  storageBucket: "gamezone-e11b0.firebasestorage.app",
  messagingSenderId: "775694460272",
  appId: "1:775694460272:web:7e5fd5691df9d8399d5bb5",
  measurementId: "G-3M7FXX8XR4"
};

// --- Uygulamayı başlat ---
const app = initializeApp(firebaseConfig);

// Analytics yalnızca destekleniyorsa açılır (bazı tarayıcılarda hata verebilir)
let analytics = null;
analyticsSupported().then((ok) => {
  if (ok) {
    try { analytics = getAnalytics(app); } catch (e) { console.warn("Analytics atlandı:", e); }
  }
}).catch(() => {});

// Auth ve Database referansları
const auth = getAuth(app);
const db = getDatabase(app);

// Oturum kalıcılığı (sayfa kapanınca da açık kalsın)
setPersistence(auth, browserLocalPersistence).catch((e) => console.warn("Persistence ayarlanamadı:", e));

// --- Yardımcı veri yolları ---
const PATHS = {
  user: (uid) => `users/${uid}`,
  profile: (uid) => `users/${uid}/profile`,
  economy: (uid) => `users/${uid}/economy`,
  progress: (uid) => `users/${uid}/progress`,
  settings: (uid) => `users/${uid}/settings`,
  inventory: (uid) => `users/${uid}/inventory`,
  friends: (uid) => `users/${uid}/friends`,
  mailbox: (uid) => `users/${uid}/mailbox`,
  achievements: (uid) => `users/${uid}/achievements`,
  daily: (uid) => `users/${uid}/daily`,
  wheel: (uid) => `users/${uid}/wheel`,
  shop: () => `shop/items`,
  leaderboard: () => `leaderboard/scores`,
  events: () => `events/active`,
  news: () => `news/items`
};

// --- Yeni kullanıcı için varsayılan veri şablonu ---
function buildDefaultUserData(user, displayName) {
  const now = Date.now();
  return {
    profile: {
      uid: user.uid,
      email: user.email || null,
      displayName: displayName || user.displayName || "Tatlı Oyuncu",
      avatar: "default",
      country: "TR",
      bio: "",
      createdAt: now,
      lastLoginAt: now,
      level: 1,
      xp: 0,
      vip: false,
      vipUntil: 0
    },
    economy: {
      gold: 100,
      gems: 0,
      lives: 5,
      maxLives: 5,
      lastLifeAt: now,
      streak: 0,
      streakDay: 1,
      lastDailyClaimAt: 0,
      wheelSpinAt: 0,
      energy: 30,
      maxEnergy: 30,
      keys: 0,
      tickets: 0
    },
    progress: {
      world: 1,
      level: 1,
      stars: 0,
      totalScore: 0,
      bestCombo: 0,
      cakesSmashed: 0,
      missionsDone: 0
    },
    settings: {
      music: true,
      sfx: true,
      musicVolume: 0.7,
      sfxVolume: 1.0,
      vibration: true,
      notifications: true,
      language: "tr",
      hints: true,
      flashEffects: true,
      mono: false,
      grayscale: false,
      balance: 0,
      bass: 0.5,
      treble: 0.5
    },
    inventory: {
      hammer: 0,
      bomb: 0,
      rainbow: 0,
      shuffle: 0,
      extraMoves: 0,
      timeFreeze: 0,
      magnet: 0,
      doubleScore: 0
    },
    achievements: {},
    friends: {},
    mailbox: {},
    daily: { claimedDays: {} },
    wheel: { totalSpins: 0, lastReward: null }
  };
}

// --- Hata mesajlarını Türkçeleştir ---
function tr_AuthError(code) {
  const m = {
    "auth/email-already-in-use": "Bu e-posta zaten kayıtlı.",
    "auth/invalid-email": "Geçersiz e-posta adresi.",
    "auth/weak-password": "Şifre çok zayıf, en az 6 karakter olmalı.",
    "auth/user-not-found": "Kullanıcı bulunamadı.",
    "auth/wrong-password": "Şifre hatalı.",
    "auth/invalid-credential": "Bilgiler hatalı veya süresi dolmuş.",
    "auth/too-many-requests": "Çok fazla deneme yaptın. Bir süre bekle.",
    "auth/network-request-failed": "İnternet bağlantı hatası.",
    "auth/popup-closed-by-user": "Giriş penceresi kapatıldı.",
    "auth/operation-not-allowed": "Bu yöntem etkin değil."
  };
  return m[code] || "Bir hata oluştu: " + code;
}

// --- Tek bir nesnede dışa aktar ---
export const FB = {
  app, auth, db, analytics,
  // auth metotları
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile, sendPasswordResetEmail,
  GoogleAuthProvider, signInWithPopup, signInAnonymously,
  // db metotları
  ref, set, get, update, remove, push, child, onValue, serverTimestamp,
  query, orderByChild, limitToLast, equalTo,
  // yardımcılar
  PATHS, buildDefaultUserData, tr_AuthError
};

// Bazı yerlerde kolaylık olsun diye window'a da bağlayalım (debug için)
if (typeof window !== "undefined") {
  window.FB = FB;
}

console.info("[CakeSmash] Firebase başlatıldı.");
