import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyAiQL8MBcsvXnbBv1dXRyRw3dSywcUgXDM',
  authDomain: 'um-tech-tracksuite-c20f1.firebaseapp.com',
  projectId: 'um-tech-tracksuite-c20f1',
  storageBucket: 'um-tech-tracksuite-c20f1.firebasestorage.app',
  messagingSenderId: '476113890604',
  appId: '1:476113890604:web:76fe189c6ca3d7d6599089',
  measurementId: 'G-C64FN4TYBH',
};

const app = initializeApp(firebaseConfig);

let analytics = null;

if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      analytics = null;
    });
}

export { app, analytics };
