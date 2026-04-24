// Firebase yapılandırması ve ortak modüller
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, update, onValue, push, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Kullanıcı durumu
let currentUser = null;
let userData = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userRef = ref(db, 'users/' + user.uid);
    const snap = await get(userRef);
    if (!snap.exists()) {
      const initial = {
        uid: user.uid,
        email: user.email,
        username: user.displayName || 'Oyuncu',
        level: 1,
        xp: 0,
        coins: 500,
        gems: 10,
        vip: false,
        vipExpiry: null,
        gifts: [],
        unlockedLevels: { chapter1: 1 },
        highScore: 0,
        totalCakesSmashed: 0
      };
      await set(userRef, initial);
    }
    onValue(userRef, (snapshot) => {
      userData = snapshot.val();
      document.dispatchEvent(new CustomEvent('authStateChanged', { detail: { loggedIn: true } }));
    });
  } else {
    currentUser = null;
    userData = null;
    document.dispatchEvent(new CustomEvent('authStateChanged', { detail: { loggedIn: false } }));
  }
});

window.logout = () => signOut(auth);

export { auth, db, currentUser, userData, ref, set, get, update, onValue, push, runTransaction };
