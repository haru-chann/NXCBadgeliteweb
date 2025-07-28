import { messaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';

// VAPID key - you'll get this from Firebase Console
const VAPID_KEY = 'your-vapid-key-here';

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Check if messaging is available
    if (!messaging) {
      // console.log('Firebase messaging not supported');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // console.log('Notification permission granted');
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });
      
      // console.log('FCM Token:', token);
      return token;
    } else {
      // console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    toast({
  title: "Notification Permission Error",
  description: error?.message || "Error getting notification permission.",
  variant: "destructive",
});
    return null;
  }
}

export function setupMessageListener() {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    // console.log('Message received in foreground:', payload);
    
    // Handle foreground messages
    if (payload.notification) {
      new Notification(payload.notification.title || 'New notification', {
        body: payload.notification.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'nxc-badge-notification',
        renotify: true,
      });
    }
  });
}

export async function saveTokenToDatabase(userId: string, token: string) {
  try {
    // Save FCM token to user's document
    const response = await fetch('/api/users/fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, token }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save FCM token');
    }
    
    // console.log('FCM token saved successfully');
  } catch (error) {
    toast({
  title: "FCM Token Save Error",
  description: error?.message || "Error saving FCM token.",
  variant: "destructive",
});
  }
}