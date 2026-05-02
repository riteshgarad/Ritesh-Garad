importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBvFO_aNMJ3r50puIWr7fdLVjR9LLM_60k",
  authDomain: "gen-lang-client-0399133290.firebaseapp.com",
  projectId: "gen-lang-client-0399133290",
  storageBucket: "gen-lang-client-0399133290.firebasestorage.app",
  messagingSenderId: "446284173588",
  appId: "1:446284173588:web:6aa8fb4797a677c3ed3201"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
