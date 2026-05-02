import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
let messaging: Messaging | null = null;

try {
  // Messaging only works in secure contexts (HTTPS or localhost)
  // And requires service worker support
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (e) {
  console.warn("Firebase Messaging not supported in this environment:", e);
}

export const requestFirebaseNotificationPermission = async () => {
  if (!messaging) {
    console.warn("Messaging not initialized");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // You must provide your own VAPID key here from Firebase Console
      // Settings -> Cloud Messaging -> Web Push certificates
      const vapidKey = (import.meta as any).env.VITE_FIREBASE_VAPID_KEY;
      
      const token = await getToken(messaging, { 
        vapidKey: vapidKey || undefined 
      });
      
      if (token) {
        console.log("FCM Token:", token);
        return token;
      } else {
        console.warn("No registration token available. Request permission to generate one.");
        return null;
      }
    } else {
      console.warn("Notification permission denied");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token:", err);
    return null;
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (messaging) {
    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  }
  return () => {};
};
