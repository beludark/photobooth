const loginGate = document.getElementById('loginGate');
const appRoot = document.getElementById('app');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');

function showLoginError(msg) {
  loginError.textContent = msg;
  loginError.classList.remove('hidden');
}

function toAuthEmail(input) {
  const value = input.trim();
  return value.includes('@') ? value : `${value}@nous.local`;
}

function doLogin() {
  loginError.classList.add('hidden');
  const email = loginEmail.value;
  const pass = loginPassword.value;
  if (!email.trim() || !pass) {
    showLoginError(t('login.errorEmpty'));
    return;
  }
  btnLogin.disabled = true;
  firebase.auth().signInWithEmailAndPassword(toAuthEmail(email), pass)
    .catch(() => showLoginError(t('login.errorWrong')))
    .finally(() => { btnLogin.disabled = false; });

btnLogin.addEventListener('click', doLogin);
loginPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
loginEmail.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginPassword.focus(); });

btnLogout.addEventListener('click', () => firebase.auth().signOut());

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    loginGate.classList.add('hidden');
    appRoot.classList.remove('hidden');
  } else {
    appRoot.classList.add('hidden');
    loginGate.classList.remove('hidden');
    loginPassword.value = '';
  }
});
