// Optional cloud save: sign in with Google (Firebase Auth) and keep the save in sync
// across devices (Firestore, one document per user: users/{uid}).
// Off until firebase-config.js is filled in; without it the app is fully offline as before.
//
// Sync rule: the copy with more XP wins (ties: the newer one). We only upload after reading
// the cloud copy this visit, so an old iPad tab can never overwrite newer progress.

import { FIREBASE_CONFIG } from './firebase-config.js';
import * as S from './state.js';

const SDK = 'https://www.gstatic.com/firebasejs/12.19.0';
const PUSH_DELAY_MS = 2000;

let api = null; // { onUser, signIn, signOut, read, write }
let user = null; // { uid, email }
let status = 'signed-out'; // signed-out | syncing | synced | offline
let pulled = false; // read the cloud copy since the app was last shown?
let lastPushed = null;
let timer = null;
const listeners = new Set();

// Automated tests inject a fake Firebase through window.__KLP_FIREBASE.
const fake = () => globalThis.__KLP_FIREBASE;
export const enabled = !!(FIREBASE_CONFIG?.apiKey || fake());

export function onCloudChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function setStatus(s, replaced = false) {
  status = s;
  for (const fn of listeners) fn({ status, user, replaced });
}
export function cloudState() {
  return { enabled, status, user };
}

async function loadSdk() {
  if (api) return api;
  if (fake()) return (api = await fake()(FIREBASE_CONFIG));
  const [app, auth, store] = await Promise.all([
    import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-firestore.js`),
  ]);
  const fbApp = app.initializeApp(FIREBASE_CONFIG);
  const a = auth.getAuth(fbApp);
  const db = store.getFirestore(fbApp);
  api = {
    onUser: (cb) => auth.onAuthStateChanged(a, (u) => cb(u && { uid: u.uid, email: u.email })),
    // A popup, not a redirect: redirects are unreliable in iPad Safari on custom domains.
    signIn: () => auth.signInWithPopup(a, new auth.GoogleAuthProvider()),
    signOut: () => auth.signOut(a),
    read: async (uid) => {
      const snap = await store.getDoc(store.doc(db, 'users', uid));
      return snap.exists() ? snap.data() : null;
    },
    write: (uid, data) => store.setDoc(store.doc(db, 'users', uid), data),
  };
  return api;
}

// Start listening for a remembered sign-in. Safe to call when cloud save is off.
export async function initCloud() {
  if (!enabled) return;
  try {
    await loadSdk();
  } catch (err) {
    console.warn('Cloud save unavailable:', err);
    return setStatus('offline');
  }
  api.onUser((u) => {
    user = u;
    pulled = false;
    lastPushed = null;
    if (u) syncNow();
    else setStatus('signed-out');
  });
  S.onChange(() => {
    if (!user || !pulled) return;
    clearTimeout(timer);
    timer = setTimeout(push, PUSH_DELAY_MS);
  });
}

export async function signIn() {
  await loadSdk();
  await api.signIn(); // onUser then syncs
}

export async function signOut() {
  clearTimeout(timer);
  await api?.signOut(); // progress stays on this device
}

// Read the cloud copy: adopt it if it is ahead, otherwise upload ours.
export async function syncNow() {
  if (!user) return;
  pulled = false;
  setStatus('syncing');
  try {
    const remote = await api.read(user.uid);
    const saved = remote?.save ? JSON.parse(remote.save) : null;
    pulled = true;
    if (saved && S.isBetterSave(saved, S.state)) {
      S.replaceWith(saved);
      lastPushed = JSON.stringify(S.state);
      setStatus('synced', true);
    } else {
      await push();
    }
  } catch (err) {
    console.warn('Cloud sync failed:', err);
    setStatus('offline');
  }
}

async function push() {
  if (!user || !pulled) return;
  const raw = JSON.stringify(S.state);
  if (raw === lastPushed) return setStatus('synced');
  setStatus('syncing');
  try {
    await api.write(user.uid, { save: raw, xp: S.state.xp, updatedAt: S.state.updatedAt });
    lastPushed = raw;
    setStatus('synced');
  } catch (err) {
    console.warn('Cloud save failed:', err);
    setStatus('offline'); // the next change or app visit tries again
  }
}
