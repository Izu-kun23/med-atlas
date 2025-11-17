import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBiNBe394oBcVyEZKSqf9dzNyNlAtwZIWM',
  authDomain: 'medtrackr-19af1.firebaseapp.com',
  projectId: 'medtrackr-19af1',
  storageBucket: 'medtrackr-19af1.firebasestorage.app',
  messagingSenderId: '1040596873230',
  appId: '1:1040596873230:web:2bcc45f865c89ada018c5f',
  measurementId: 'G-940FYYHTLL',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);