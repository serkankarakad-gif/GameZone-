import { auth, db, ref, set } from './firebase-init.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

function msg(id, text, color) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.style.color = color;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

window.register = async () => {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPassword').value;
  if (!name || !email || !pass) return msg('authMsg', 'Tüm alanları doldurun', 'red');
  if (pass.length < 6) return msg('authMsg', 'Şifre en az 6 karakter', 'red');
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    msg('authMsg', 'Kayıt başarılı! Giriş yapılıyor...', 'green');
  } catch (e) {
    msg('authMsg', e.message.replace('Firebase: ', ''), 'red');
  }
};

window.login = async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  if (!email || !pass) return msg('authMsg', 'E-posta ve şifre gerekli', 'red');
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    msg('authMsg', 'Giriş başarılı!', 'green');
  } catch (e) {
    msg('authMsg', e.message.replace('Firebase: ', ''), 'red');
  }
};

window.resetPassword = async () => {
  const email = prompt('E-posta adresinizi girin:');
  if (!email) return;
  try {
    await sendPasswordResetEmail(auth, email);
    alert('Şifre sıfırlama bağlantısı gönderildi.');
  } catch (e) {
    alert('Hata: ' + e.message);
  }
};
