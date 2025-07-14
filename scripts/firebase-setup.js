#!/usr/bin/env node

/**
 * Firebase Setup Script for NXC Badge
 * 
 * This script helps you configure Firebase for your NXC Badge app.
 * Run with: node scripts/firebase-setup.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔥 Firebase Setup for NXC Badge');
  console.log('=====================================\n');

  console.log('Please gather the following information from your Firebase Console:');
  console.log('1. Go to https://console.firebase.google.com/');
  console.log('2. Create or select your project');
  console.log('3. Add a web app and copy the config\n');

  const apiKey = await question('Firebase API Key: ');
  const projectId = await question('Firebase Project ID: ');
  const appId = await question('Firebase App ID: ');
  const messagingSenderId = await question('Firebase Messaging Sender ID: ');

  console.log('\n📱 For push notifications, you need:');
  console.log('1. Go to Project Settings > Cloud Messaging');
  console.log('2. Generate a VAPID key\n');

  const vapidKey = await question('VAPID Key (optional): ');

  console.log('\n🔐 For server-side features, you need a service account:');
  console.log('1. Go to Project Settings > Service Accounts');
  console.log('2. Generate new private key\n');

  const serviceAccountEmail = await question('Service Account Email (optional): ');
  const privateKey = await question('Private Key (paste the entire key, optional): ');

  // Create environment template
  const envTemplate = `# Firebase Configuration
VITE_FIREBASE_API_KEY=${apiKey}
VITE_FIREBASE_PROJECT_ID=${projectId}
VITE_FIREBASE_APP_ID=${appId}
VITE_FIREBASE_AUTH_DOMAIN=${projectId}.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=${projectId}.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}

# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=${projectId}
FIREBASE_CLIENT_EMAIL=${serviceAccountEmail}
FIREBASE_PRIVATE_KEY="${privateKey}"

# Push Notifications
VAPID_KEY=${vapidKey}
`;

  // Write to .env.example
  fs.writeFileSync('.env.example', envTemplate);
  
  // Update Firebase config in service worker
  const swContent = fs.readFileSync('client/public/firebase-messaging-sw.js', 'utf8');
  const updatedSw = swContent
    .replace('"your-api-key-here"', `"${apiKey}"`)
    .replace('"your-project-id.firebaseapp.com"', `"${projectId}.firebaseapp.com"`)
    .replace('"your-project-id"', `"${projectId}"`)
    .replace('"your-project-id.firebasestorage.app"', `"${projectId}.firebasestorage.app"`)
    .replace('"your-sender-id"', `"${messagingSenderId}"`)
    .replace('"your-app-id"', `"${appId}"`);
  
  fs.writeFileSync('client/public/firebase-messaging-sw.js', updatedSw);

  // Update VAPID key in notifications service
  if (vapidKey) {
    const notificationsPath = 'client/src/services/firebase-notifications.ts';
    const notificationsContent = fs.readFileSync(notificationsPath, 'utf8');
    const updatedNotifications = notificationsContent.replace(
      'your-vapid-key-here',
      vapidKey
    );
    fs.writeFileSync(notificationsPath, updatedNotifications);
  }

  console.log('\n✅ Configuration complete!');
  console.log('\nNext steps:');
  console.log('1. Copy .env.example to .env and review the values');
  console.log('2. Set up Firebase Authentication providers in the console');
  console.log('3. Configure Firestore security rules');
  console.log('4. Enable Cloud Storage');
  console.log('5. Set up Cloud Messaging for push notifications');
  console.log('\nSee docs/FIREBASE_SETUP.md for detailed instructions.');

  rl.close();
}

main().catch(console.error);