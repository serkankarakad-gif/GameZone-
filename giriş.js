// ============================================================
// CakeSmash - Giriş / Kayıt Modülü
// Geliştirici: Serkan Karakaş
// Açıklama: Kayıt ol, giriş yap, misafir girişi, Google ile giriş,
// şifre sıfırlama, oturum dinleme, kullanıcı veri yükleme/oluşturma.
// ============================================================

import { FB } from "./firebase-init.js";

// Mevcut oturumdaki kullanıcı verisi (RAM içi cache)
export const Session = {
  user: null,           // Firebase user objesi
  data: null,           // /users/{uid} altındaki tüm veri
  unsubscribe: null,    // realtime dinleyici aboneliği
  isReady: false
};

// Olay aboneleri (UI bildirim için)
const listeners = { ready: [], change: [], logout: [] };
function emit(event, payload) { (listeners[event] || []).forEach(fn => { try { fn(payload); } catch (e) { console.error(e); } }); }
export function on(event, fn) { (listeners[event] = listeners[event] || []).push(fn); return () => off(event, fn); }
export function off(event, fn) { listeners[event] = (listeners[event] || []).filter(x => x !== fn); }

// --- Yardımcı: kullanıcı veri okuma ve gerektiğinde oluşturma ---
async function ensureUserData(user, displayName) {
  const path = FB.PATHS.user(user.uid);
  const snap = await FB.get(FB.ref(FB.db, path));
  if (!snap.exists()) {
    const data = FB.buildDefaultUserData(user, displayName);
    await FB.set(FB.ref(FB.db, path), data);
    return data;
  } else {
    // Son giriş zamanını güncelle
    await FB.update(FB.ref(FB.db, FB.PATHS.profile(user.uid)), { lastLoginAt: Date.now() });
    return snap.val();
  }
}

// --- Realtime dinleyici (veri her değiştiğinde Session.data tazelenir) ---
function attachRealtime(uid) {
  detachRealtime();
  const userRef = FB.ref(FB.db, FB.PATHS.user(uid));
  Session.unsubscribe = FB.onValue(userRef, (snap) => {
    Session.data = snap.val();
    emit("change", Session.data);
  });
}
function detachRealtime() {
  if (typeof Session.unsubscribe === "function") {
    try { Session.unsubscribe(); } catch (_) {}
  }
  Session.unsubscribe = null;
}

// --- Oturum durumunu izle (otomatik giriş için) ---
FB.onAuthStateChanged(FB.auth, async (user) => {
  if (user) {
    Session.user = user;
    try {
      Session.data = await ensureUserData(user, user.displayName);
      attachRealtime(user.uid);
      Session.isReady = true;
      emit("ready", { user, data: Session.data });
    } catch (e) {
      console.error("[Auth] kullanıcı verisi yüklenemedi:", e);
    }
  } else {
    detachRealtime();
    Session.user = null;
    Session.data = null;
    Session.isReady = false;
    emit("logout");
  }
});

// --- Form Doğrulama ---
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim()); }
function isStrongPassword(pw) { return typeof pw === "string" && pw.length >= 6; }
function isValidNick(n) { return typeof n === "string" && n.trim().length >= 2 && n.trim().length <= 18; }

// --- Dışa açılan API ---
export const Auth = {

  // Kayıt ol (e-posta + şifre + nick)
  async register({ email, password, nick }) {
    if (!isValidEmail(email)) throw new Error("Geçersiz e-posta.");
    if (!isStrongPassword(password)) throw new Error("Şifre en az 6 karakter olmalı.");
    if (!isValidNick(nick)) throw new Error("Takma ad 2-18 karakter olmalı.");
    try {
      const cred = await FB.createUserWithEmailAndPassword(FB.auth, email.trim(), password);
      await FB.updateProfile(cred.user, { displayName: nick.trim() });
      // /users/{uid} verisini oluştur
      Session.data = await ensureUserData(cred.user, nick.trim());
      attachRealtime(cred.user.uid);
      return cred.user;
    } catch (e) {
      throw new Error(FB.tr_AuthError(e.code) + (e?.message ? " (" + e.message + ")" : ""));
    }
  },

  // Giriş yap (e-posta + şifre)
  async login({ email, password }) {
    if (!isValidEmail(email)) throw new Error("Geçersiz e-posta.");
    if (!password) throw new Error("Şifre boş olamaz.");
    try {
      const cred = await FB.signInWithEmailAndPassword(FB.auth, email.trim(), password);
      return cred.user;
    } catch (e) {
      throw new Error(FB.tr_AuthError(e.code));
    }
  },

  // Misafir girişi (anonim)
  async loginGuest() {
    try {
      const cred = await FB.signInAnonymously(FB.auth);
      const guestNick = "Misafir-" + Math.floor(1000 + Math.random() * 8999);
      try { await FB.updateProfile(cred.user, { displayName: guestNick }); } catch (_) {}
      return cred.user;
    } catch (e) {
      throw new Error(FB.tr_AuthError(e.code));
    }
  },

  // Google ile giriş (popup)
  async loginGoogle() {
    try {
      const provider = new FB.GoogleAuthProvider();
      const cred = await FB.signInWithPopup(FB.auth, provider);
      return cred.user;
    } catch (e) {
      throw new Error(FB.tr_AuthError(e.code));
    }
  },

  // Şifre sıfırlama maili
  async sendReset(email) {
    if (!isValidEmail(email)) throw new Error("Geçersiz e-posta.");
    try {
      await FB.sendPasswordResetEmail(FB.auth, email.trim());
      return true;
    } catch (e) {
      throw new Error(FB.tr_AuthError(e.code));
    }
  },

  // Çıkış
  async logout() {
    detachRealtime();
    await FB.signOut(FB.auth);
  },

  // Profili güncelle (nick + avatar)
  async updateMyProfile({ nick, avatar, bio, country }) {
    if (!Session.user) throw new Error("Önce giriş yapmalısın.");
    const updates = {};
    if (nick && isValidNick(nick)) updates.displayName = nick.trim();
    if (avatar) updates.avatar = avatar;
    if (typeof bio === "string") updates.bio = bio.slice(0, 160);
    if (country) updates.country = String(country).toUpperCase().slice(0, 3);
    if (Object.keys(updates).length === 0) return;
    await FB.update(FB.ref(FB.db, FB.PATHS.profile(Session.user.uid)), updates);
    if (updates.displayName) {
      try { await FB.updateProfile(Session.user, { displayName: updates.displayName }); } catch (_) {}
    }
  },

  // Şifre değiştirme (yeniden kimlik doğrulama gerekebilir; basit hali)
  async changePassword(newPw) {
    if (!Session.user) throw new Error("Önce giriş yapmalısın.");
    if (!isStrongPassword(newPw)) throw new Error("Yeni şifre en az 6 karakter olmalı.");
    try {
      const { updatePassword } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
      await updatePassword(Session.user, newPw);
      return true;
    } catch (e) {
      throw new Error(FB.tr_AuthError(e.code) + " (Yeniden giriş gerekebilir.)");
    }
  },

  // Hesap sil (Firebase + RTDB veri)
  async deleteAccount() {
    if (!Session.user) throw new Error("Önce giriş yapmalısın.");
    const uid = Session.user.uid;
    try {
      const { deleteUser } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
      await FB.remove(FB.ref(FB.db, FB.PATHS.user(uid)));
      await deleteUser(Session.user);
      return true;
    } catch (e) {
      throw new Error(FB.tr_AuthError(e.code) + " (Yeniden giriş gerekebilir.)");
    }
  },

  // Aktif kullanıcının kullanıcı kimliği (kopyalanabilir)
  getUserId() { return Session.user?.uid || null; },

  // Aktif kullanıcı verisi
  getData() { return Session.data; },

  // Hazır mı
  isReady() { return Session.isReady; }
};

// Global erişim (ui-manager.js bunu kullanır)
if (typeof window !== "undefined") {
  window.Auth = Auth;
  window.Session = Session;
  window.AuthEvents = { on, off };
}
