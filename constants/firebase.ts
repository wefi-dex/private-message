import { getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDfSDF29Yf2DypGtpDlkDynbvsDWj1hN0Y',
  projectId: 'private-message-7d650',
  storageBucket: 'private-message-7d650.firebasestorage.app',
  // Optionally add other fields if needed
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export { app, db };

