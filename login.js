import { auth, db, ref, set, get, GoogleAuthProvider, FacebookAuthProvider } from './firebase-init.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

function msg(text, color) {
  const el = document.getElementById('authMsg');
  el.textContent = text; el.style.color = color; el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

window.register = async () => {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPassword').value;
  if (!name || !email || !pass) return msg('Tüm alanları doldurun', 'red');
  if (pass.length < 6) return msg('Şifre en az 6 karakter', 'red');
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    msg('Kayıt başarılı! Giriş yapılıyor...', 'green');
  } catch (e) { msg(e.message.replace('Firebase: ', ''), 'red'); }
};

window.login = async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  if (!email || !pass) return msg('E-posta ve şifre gerekli', 'red');
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) { msg(e.message.replace('Firebase: ', ''), 'red'); }
};

window.resetPassword = async () => {
  const email = prompt('E-posta adresinizi girin:');
  if (!email) return;
  try {
    await sendPasswordResetEmail(auth, email);
    alert('Şifre sıfırlama bağlantısı gönderildi.');
  } catch (e) { alert('Hata: ' + e.message); }
};

// Temsili sosyal medya girişleri (gerçek entegrasyon için Firebase console'dan etkinleştirilmeli)
window.googleLogin = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (e) { alert("Google girişi şu anda desteklenmiyor."); }
};
window.facebookLogin = async () => {
  try {
    const provider = new FacebookAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (e) { alert("Facebook girişi şu anda desteklenmiyor."); }
};

// Kayıt ekranını göster
window.showRegister = () => {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
};
window.showLogin = () => {
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
};
