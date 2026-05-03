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

export const isNativeApp = () => {
  return typeof window !== 'undefined' && (!!(window as any).median || !!(window as any).gonative);
};

export const getNativePlayerId = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  try {
    // Median Bridge
    if ((window as any).median?.onesignal?.getInfo) {
      const info = await (window as any).median.onesignal.getInfo();
      return info?.oneSignalUserId || info?.userId || null;
    }
    
    // GoNative Bridge
    if ((window as any).gonative?.onesignal?.info) {
       const info = await (window as any).gonative.onesignal.info();
       return info?.oneSignalUserId || null;
    }
  } catch (e) {
    console.error("Failed to get native player ID:", e);
  }
  return null;
};

export const requestFirebaseNotificationPermission = async () => {
  if (isNativeApp()) {
    console.log("FCM: Native App detected. Handing off to bridge.");
    try {
      if ((window as any).median?.onesignal?.register) {
        await (window as any).median.onesignal.register();
      } else if ((window as any).gonative) {
        window.location.href = "gonative://onesignal/register";
      }
      
      // Wait a bit for registration to complete then try to get ID
      await new Promise(resolve => setTimeout(resolve, 2000));
      const playerId = await getNativePlayerId();
      return playerId ? `native_${playerId}` : "native_registered";
    } catch (e) {
      console.error("Native bridge failure:", e);
    }
  }

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
