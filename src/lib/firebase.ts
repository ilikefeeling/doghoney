import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Guard: Only initialize if required config values are present
const hasRequiredConfig = firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.projectId;

if (!hasRequiredConfig) {
  console.warn(
    '[Doghoney] Firebase 환경변수가 설정되지 않았습니다.\n' +
    '필요한 변수: VITE_FIREBASE_API_KEY, VITE_FIREBASE_APP_ID, VITE_FIREBASE_PROJECT_ID\n' +
    'Firebase 기능(로그인, 기록 저장)은 비활성화됩니다.'
  );
}

// Initialize Firebase (only once, only if config is valid)
const app = hasRequiredConfig
  ? (getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig))
  : null;

// Initialize Firebase services (null-safe)
export const analytics = (app && typeof window !== 'undefined') ? getAnalytics(app) : null;
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;

export default app;
