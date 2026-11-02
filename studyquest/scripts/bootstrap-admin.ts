import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
const uid = process.env.BOOTSTRAP_ADMIN_UID;
if (!uid) throw new Error('Set BOOTSTRAP_ADMIN_UID to an existing Firebase Authentication UID.');
initializeApp({
  credential: process.env.FIREBASE_CLIENT_EMAIL
    ? cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    : applicationDefault(),
});
const user = await getAuth().getUser(uid);
await getAuth().setCustomUserClaims(uid, { ...user.customClaims, role: 'admin' });
const db = getFirestore(),
  link = await db.collection('authLinks').doc(uid).get();
await db
  .collection('users')
  .doc(link.data()?.actorId || uid)
  .set({ role: 'admin' }, { merge: true });
console.log('Administrator claim configured. Sign out and sign in again.');
