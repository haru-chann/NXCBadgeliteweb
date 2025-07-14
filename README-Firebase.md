# Firebase Backend Setup - Quick Start Guide

This is a simplified setup guide for getting Firebase integrated with your NXC Badge app quickly. For comprehensive details, see `docs/FIREBASE_SETUP.md`.

## 🚀 Quick Setup (5 minutes)

### 1. Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project: `nxc-badge-lite`
3. Add web app, copy config values
4. Enable Authentication → Google Sign-In
5. Create Firestore Database (test mode)
6. Enable Storage

### 2. Configure Environment
Run the setup script:
```bash
node scripts/firebase-setup.js
```

Or manually add these secrets to your Replit:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id  
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
```

### 3. Deploy Security Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and deploy
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules,storage:rules
```

### 4. Test Integration
1. Restart your app
2. Visit the Firebase integration example at `/firebase-example`
3. Sign in with Google
4. Test real-time features

## 🔧 Available Features

### ✅ Ready to Use
- **Authentication**: Google Sign-In via Firebase Auth
- **Real-time Database**: Firestore with live subscriptions
- **Push Notifications**: FCM for mobile alerts
- **File Storage**: Profile images and QR codes
- **Analytics**: Real-time view and connection tracking

### 🎯 How It Works
- **Client**: Uses Firebase SDK for real-time features
- **Server**: Firebase Admin SDK for backend operations
- **Hybrid**: PostgreSQL for core data + Firestore for live features

## 📱 Push Notifications Setup

1. Get VAPID key from Firebase Console → Project Settings → Cloud Messaging
2. Add to your environment: `VAPID_KEY=your_vapid_key`
3. Update `client/src/services/firebase-notifications.ts` with your VAPID key
4. Test with the demo buttons in the integration example

## 🔒 Security Rules

Pre-configured rules ensure:
- Users can only access their own data
- Public profiles are readable by anyone
- Anonymous users can create profile views (for analytics)
- Profile owners can read all their analytics

## 📊 Real-time Features

### Profile Views
```typescript
import { subscribeToProfileViews } from '@/services/firebase-realtime';

subscribeToProfileViews(profileId, (views) => {
  console.log('New profile views:', views);
});
```

### Connections
```typescript
import { subscribeToUserConnections } from '@/services/firebase-realtime';

subscribeToUserConnections(userId, (connections) => {
  console.log('User connections updated:', connections);
});
```

## 🚀 Deployment Options

### Option 1: Replit + Firebase (Recommended)
- Keep PostgreSQL for core features
- Use Firebase for real-time and mobile features
- Best of both worlds

### Option 2: Full Firebase Migration
- Run migration script: `npm run migrate:firebase`
- Update routes to use Firestore
- Deploy to Firebase Hosting

## 🧪 Testing

Test the integration with the example component:
```bash
# Add to your app router
import FirebaseExample from './examples/firebase-integration-example';

// Then visit /firebase-example in your app
```

## 🆘 Troubleshooting

### Common Issues
1. **CORS Errors**: Add your Replit domain to Firebase authorized domains
2. **Permission Denied**: Check Firestore security rules
3. **Notifications Not Working**: Verify VAPID key and service worker registration
4. **Real-time Not Updating**: Check Firestore indexes and network connection

### Debug Commands
```bash
# Test Firebase connection
firebase projects:list

# Test security rules locally
firebase emulators:start --only firestore

# View function logs
firebase functions:log
```

## 📚 Next Steps

1. **Customize**: Modify Firestore schema for your specific needs
2. **Scale**: Add Cloud Functions for complex operations
3. **Monitor**: Set up Firebase Performance and Analytics
4. **Optimize**: Implement offline-first patterns with Firestore persistence

## 🔗 Resources

- [Complete Setup Guide](docs/FIREBASE_SETUP.md) - Detailed instructions
- [Firebase Documentation](https://firebase.google.com/docs)
- [Integration Example](examples/firebase-integration-example.tsx) - Live demo component