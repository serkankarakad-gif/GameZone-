// Giriş ve kayıt işlemleri
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const auth = getAuth();
const db = getDatabase();

// Hata mesajlarını gösterme
function showError(msg) {
  const errorDiv = document.getElementById('authError');
  if (errorDiv) {
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
  }
}

// Başarılı mesajı
function showSuccess(msg) {
  const successDiv = document.getElementById('authSuccess');
  if (successDiv) {
    successDiv.textContent = msg;
    successDiv.style.display = 'block';
    setTimeout(() => successDiv.style.display = 'none', 3000);
  }
}

// Kayıt Ol
window.register = async () => {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  if (!name || !email || !password) {
    showError('Tüm alanları doldurun.');
    return;
  }
  if (password.length < 6) {
    showError('Şifre en az 6 karakter olmalı.');
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // Veritabanına kullanıcı adı yaz
    await set(ref(db, 'users/' + cred.user.uid + '/username'), name);
    showSuccess('Kayıt başarılı! Giriş yapılıyor...');
  } catch (e) {
    showError(e.message.replace('Firebase: ', ''));
  }
};

// Giriş Yap
window.login = async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showError('E-posta ve şifre gerekli.');
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showSuccess('Giriş başarılı!');
  } catch (e) {
    showError(e.message.replace('Firebase: ', ''));
  }
};

// Şifre Sıfırlama
window.resetPassword = async () => {
  const email = prompt('E-posta adresinizi girin:');
  if (!email) return;
  try {
    await sendPasswordResetEmail(auth, email);
    alert('Şifre sıfırlama bağlantısı gönderildi.');
  } catch (e) {
    showError(e.message.replace('Firebase: ', ''));
  }
};
