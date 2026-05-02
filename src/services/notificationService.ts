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
    console.warn("Messaging not initialized - possible environment restriction or missing service worker");
    return null;
  }

  try {
    const vapidKey = (import.meta as any).env.VITE_FIREBASE_VAPID_KEY;
    console.log("FCM Debug: VAPID Key presence:", !!vapidKey);
    
    const permission = await Notification.requestPermission();
    console.log("FCM Debug: Permission request result:", permission);

    if (permission === 'granted') {
      if (!vapidKey) {
        console.error("FCM Error: VITE_FIREBASE_VAPID_KEY is missing in environment variables.");
        return null;
      }
      
      const token = await getToken(messaging, { 
        vapidKey: vapidKey
      });
      
      if (token) {
        console.log("FCM Success: Token acquired");
        return token;
      } else {
        console.warn("FCM Warning: No registration token available.");
        return null;
      }
    } else {
      console.warn("FCM Warning: Notification permission denied by user.");
      return null;
    }
  } catch (err) {
    console.error("FCM Error during token retrieval:", err);
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
