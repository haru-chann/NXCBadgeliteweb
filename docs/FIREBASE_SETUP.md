# Firebase Backend Setup & Integration Guide

## Overview

This guide walks you through setting up Firebase for your NXC Badge digital business card app. Firebase will provide authentication, real-time database, cloud storage, and push notifications.

## Prerequisites

- Firebase account
- NXC Badge app running on Replit
- Admin access to Firebase Console

## 1. Firebase Console Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `nxc-badge-lite`
4. Enable Google Analytics (recommended)
5. Select Analytics account or create new one
6. Click "Create project"

### Step 2: Configure Web App

1. In your Firebase project, click "Add app" (</> icon)
2. Register app:
   - App nickname: `NXC Badge Web`
   - Check "Also set up Firebase Hosting" (optional)
3. Copy the configuration object (save for later)

### Step 3: Enable Authentication

1. Go to Authentication > Sign-in method
2. Enable the following providers:
   - **Google** (primary)
   - **Email/Password** (backup)
   - **Anonymous** (for guest access)

3. Configure Google Sign-In:
   - Add your Replit domain to authorized domains
   - Set up OAuth consent screen
   - Download service account key

### Step 4: Set up Firestore Database

1. Go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select nearest region
5. Click "Done"

### Step 5: Configure Storage

1. Go to Storage
2. Click "Get started"
3. Start in test mode
4. Choose same region as Firestore

### Step 6: Enable Cloud Messaging

1. Go to Cloud Messaging
2. Click "Get started"
3. Generate a new private key for server authentication

## 2. Environment Configuration

Add these secrets to your Replit project:

```bash
# Firebase Web Config
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here

# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"

# Cloud Messaging
FCM_SERVER_KEY=your_fcm_server_key_here
```

## 3. Firestore Database Schema

### Collections Structure

```
users/
  {userId}/
    - email: string
    - displayName: string
    - photoURL: string
    - createdAt: timestamp
    - lastLoginAt: timestamp
    - fcmTokens: array<string>

profiles/
  {profileId}/
    - userId: string (reference)
    - name: string
    - profession: string
    - company: string
    - bio: string
    - phone: string
    - website: string
    - socialLinks: object
    - nfcTagId: string (unique)
    - isPublic: boolean
    - createdAt: timestamp
    - updatedAt: timestamp

connections/
  {connectionId}/
    - fromUserId: string
    - toUserId: string
    - toProfileId: string
    - scanMethod: string (nfc|qr|link)
    - isFavorite: boolean
    - notes: string
    - connectedAt: timestamp

profileViews/
  {viewId}/
    - profileId: string
    - viewerUserId: string (optional)
    - viewerLocation: string
    - viewerDevice: string
    - ipAddress: string
    - userAgent: string
    - viewDuration: number
    - viewedAt: timestamp

analytics/
  {userId}/
    - totalViews: number
    - totalConnections: number
    - viewsThisWeek: number
    - connectionsThisWeek: number
    - topProfessions: array
    - topCountries: array
    - lastUpdated: timestamp
```

### Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Profiles - public read, owner write
    match /profiles/{profileId} {
      allow read: if resource.data.isPublic == true || 
                     (request.auth != null && request.auth.uid == resource.data.userId);
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Connections - user can manage their own connections
    match /connections/{connectionId} {
      allow read, write: if request.auth != null && 
                            (request.auth.uid == resource.data.fromUserId ||
                             request.auth.uid == resource.data.toUserId);
    }
    
    // Profile views - anyone can create, owner can read
    match /profileViews/{viewId} {
      allow create: if true; // Allow anonymous viewing
      allow read: if request.auth != null;
    }
    
    // Analytics - owner only
    match /analytics/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 4. Client-Side Integration

### Firebase Configuration

```typescript
// client/src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Auth functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Offline support
export const enableOffline = () => disableNetwork(db);
export const enableOnline = () => enableNetwork(db);
```

### Authentication Hook

```typescript
// client/src/hooks/useFirebaseAuth.ts
import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Update user document
        await setDoc(
          doc(db, 'users', firebaseUser.uid),
          {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            lastLoginAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
```

## 5. Server-Side Integration

### Firebase Admin Setup

```typescript
// server/firebase-admin.ts
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminMessaging = admin.messaging();
```

### Authentication Middleware

```typescript
// server/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../firebase-admin';

export interface AuthenticatedRequest extends Request {
  user: {
    uid: string;
    email?: string;
    name?: string;
  };
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    (req as AuthenticatedRequest).user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

## 6. Real-time Features

### Connection Notifications

```typescript
// client/src/services/notifications.ts
import { messaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'your-vapid-key-here'
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
}

export function setupMessageListener() {
  onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    // Handle foreground messages
    new Notification(payload.notification?.title || 'New notification', {
      body: payload.notification?.body,
      icon: '/icon-192.png',
    });
  });
}
```

### Real-time Profile Views

```typescript
// client/src/services/realtime.ts
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function subscribeToProfileViews(profileId: string, callback: (views: any[]) => void) {
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
```

## 7. Cloud Functions (Optional)

### Analytics Function

```typescript
// functions/src/analytics.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const updateAnalytics = functions.firestore
  .document('profileViews/{viewId}')
  .onCreate(async (snap, context) => {
    const view = snap.data();
    const profileId = view.profileId;
    
    // Get profile to find owner
    const profileDoc = await admin.firestore()
      .collection('profiles')
      .doc(profileId)
      .get();
    
    if (!profileDoc.exists) return;
    
    const profile = profileDoc.data();
    const userId = profile?.userId;
    
    // Update analytics
    const analyticsRef = admin.firestore()
      .collection('analytics')
      .doc(userId);
    
    await analyticsRef.set({
      totalViews: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });
```

## 8. Deployment Steps

### 1. Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Deploy Cloud Functions
```bash
firebase deploy --only functions
```

### 3. Configure Hosting (Optional)
```bash
firebase init hosting
firebase deploy --only hosting
```

## 9. Testing & Monitoring

### Performance Monitoring
```typescript
// client/src/lib/performance.ts
import { getPerformance } from 'firebase/performance';
import { app } from './firebase';

export const perf = getPerformance(app);
```

### Analytics
```typescript
// client/src/lib/analytics.ts
import { getAnalytics, logEvent } from 'firebase/analytics';
import { app } from './firebase';

export const analytics = getAnalytics(app);

export function trackProfileView(profileId: string) {
  logEvent(analytics, 'profile_view', {
    profile_id: profileId,
  });
}

export function trackConnection(method: string) {
  logEvent(analytics, 'new_connection', {
    scan_method: method,
  });
}
```

## 10. Migration from PostgreSQL

### Data Migration Script
```typescript
// scripts/migrate-to-firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, batch } from 'firebase/firestore';
import { db as pgDb } from '../server/db';

async function migrateData() {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);
  
  // Migrate users
  const users = await pgDb.select().from(pgUsers);
  const userBatch = batch(firestore);
  
  users.forEach(user => {
    const userRef = doc(collection(firestore, 'users'), user.id);
    userBatch.set(userRef, {
      email: user.email,
      displayName: `${user.firstName} ${user.lastName}`,
      photoURL: user.profileImageUrl,
      createdAt: user.createdAt,
    });
  });
  
  await userBatch.commit();
  console.log('Users migrated successfully');
  
  // Migrate profiles, connections, etc...
}
```

## 11. Best Practices

### Security
- Always validate data on server-side
- Use Firebase Security Rules effectively
- Implement proper error handling
- Monitor authentication events

### Performance
- Use Firestore offline persistence
- Implement proper indexing
- Paginate large data sets
- Optimize bundle size

### Monitoring
- Set up Firebase Performance Monitoring
- Use Firebase Analytics for user insights
- Monitor Cloud Function execution
- Set up error reporting with Crashlytics

## Support & Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Firebase Performance Best Practices](https://firebase.google.com/docs/perf-mon/best-practices)
- [Cloud Functions Guide](https://firebase.google.com/docs/functions)

## Troubleshooting

### Common Issues

1. **CORS Errors**: Add your domain to Firebase authorized domains
2. **Quota Exceeded**: Monitor usage in Firebase Console
3. **Authentication Issues**: Check token expiration and refresh logic
4. **Offline Support**: Implement proper error handling for network issues

### Debug Commands
```bash
# Check Firebase CLI version
firebase --version

# Login to Firebase
firebase login

# Check current project
firebase use

# Test security rules locally
firebase emulators:start --only firestore

# Debug cloud functions
firebase functions:log
```