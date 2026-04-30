import { auth } from '../App';

export async function sendPushNotification(data: {
  title: string;
  message: string;
  segment?: string;
  externalIds?: string[];
  url?: string;
}) {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const idToken = await user.getIdToken();

    const response = await fetch('/api/notify/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      console.warn('Push Notification Failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Push Notification Error:', error);
    return false;
  }
}
