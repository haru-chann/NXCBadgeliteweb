import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc,
  serverTimestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Real-time profile views subscription
export function subscribeToProfileViews(
  profileId: string, 
  callback: (views: any[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'profileViews'),
    where('profileId', '==', profileId),
    orderBy('viewedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const views = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(views);
  });
}

// Real-time connections subscription
export function subscribeToUserConnections(
  userId: string,
  callback: (connections: any[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'connections'),
    where('fromUserId', '==', userId),
    orderBy('connectedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const connections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(connections);
  });
}

// Real-time analytics subscription
export function subscribeToAnalytics(
  userId: string,
  callback: (analytics: any) => void
): Unsubscribe {
  const analyticsRef = doc(db, 'analytics', userId);

  return onSnapshot(analyticsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({
        id: snapshot.id,
        ...snapshot.data()
      });
    } else {
      callback(null);
    }
  });
}

// Track profile view
export async function trackProfileView(
  profileId: string,
  viewerData: {
    viewerUserId?: string;
    viewerLocation?: string;
    viewerDevice?: string;
    ipAddress?: string;
    userAgent?: string;
  }
) {
  try {
    await addDoc(collection(db, 'profileViews'), {
      profileId,
      ...viewerData,
      viewedAt: serverTimestamp(),
      viewDuration: 0, // Will be updated when user leaves
    });
  } catch (error) {
    console.error('Error tracking profile view:', error);
  }
}

// Create connection
export async function createConnection(connectionData: {
  fromUserId: string;
  toUserId: string;
  toProfileId: string;
  scanMethod: 'nfc' | 'qr' | 'link';
  notes?: string;
}) {
  try {
    await addDoc(collection(db, 'connections'), {
      ...connectionData,
      isFavorite: false,
      connectedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating connection:', error);
    throw error;
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  profileData: any
) {
  try {
    await setDoc(
      doc(db, 'profiles', userId),
      {
        ...profileData,
        userId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}