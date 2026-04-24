// Firebase yapılandırması ve başlatma
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, update, onValue, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Global kullanıcı durumu
let currentUser = null;
let userData = null;

// Oturum durumunu izle
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    // Kullanıcı verisini çek
    const userRef = ref(db, 'users/' + user.uid);
    onValue(userRef, (snapshot) => {
      userData = snapshot.val();
      if (!userData) {
        // İlk kez giriş yapıyorsa veri oluştur
        const initialData = {
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
          currentChapter: 'chapter1',
          currentLevel: 1,
          totalCakesSmashed: 0,
          highScore: 0,
          createdAt: Date.now()
        };
        set(userRef, initialData);
      }
    });
    // UI güncelleme için event tetikle
    document.dispatchEvent(new CustomEvent('authStateChanged', { detail: { loggedIn: true } }));
  } else {
    currentUser = null;
    userData = null;
    document.dispatchEvent(new CustomEvent('authStateChanged', { detail: { loggedIn: false } }));
  }
});

// Çıkış fonksiyonu
window.logout = async () => {
  await signOut(auth);
};
