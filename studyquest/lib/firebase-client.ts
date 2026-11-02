'use client';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
export function firebaseAuth() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) return null;
  const app =
    getApps()[0] ||
    initializeApp({
      apiKey,
      projectId,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  return getAuth(app);
}
