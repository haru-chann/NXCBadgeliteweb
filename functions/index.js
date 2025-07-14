const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Update analytics when a profile view is created
exports.updateAnalytics = functions.firestore
  .document('profileViews/{viewId}')
  .onCreate(async (snap, context) => {
    const view = snap.data();
    const profileId = view.profileId;
    
    try {
      // Get profile to find owner
      const profileDoc = await admin.firestore()
        .collection('profiles')
        .doc(profileId)
        .get();
      
      if (!profileDoc.exists) {
        console.log('Profile not found:', profileId);
        return;
      }
      
      const profile = profileDoc.data();
      const userId = profile.userId;
      
      // Update analytics
      const analyticsRef = admin.firestore()
        .collection('analytics')
        .doc(userId);
      
      await analyticsRef.set({
        totalViews: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      console.log('Analytics updated for user:', userId);
      
      // Send push notification to profile owner
      await sendProfileViewNotification(userId, view);
      
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  });

// Send notification when someone connects
exports.notifyConnection = functions.firestore
  .document('connections/{connectionId}')
  .onCreate(async (snap, context) => {
    const connection = snap.data();
    const toUserId = connection.toUserId;
    
    try {
      // Get user's FCM tokens
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(toUserId)
        .get();
      
      if (!userDoc.exists) return;
      
      const user = userDoc.data();
      const fcmTokens = user.fcmTokens || [];
      
      if (fcmTokens.length === 0) return;
      
      // Get from user info
      const fromUserDoc = await admin.firestore()
        .collection('users')
        .doc(connection.fromUserId)
        .get();
      
      const fromUser = fromUserDoc.data();
      const fromUserName = fromUser?.displayName || 'Someone';
      
      // Send notification
      const message = {
        notification: {
          title: 'New Connection!',
          body: `${fromUserName} connected with you via ${connection.scanMethod.toUpperCase()}`,
          icon: '/icon-192.png',
        },
        data: {
          type: 'new_connection',
          connectionId: context.params.connectionId,
          fromUserId: connection.fromUserId,
        },
        tokens: fcmTokens,
      };
      
      const response = await admin.messaging().sendMulticast(message);
      console.log('Connection notification sent:', response);
      
    } catch (error) {
      console.error('Error sending connection notification:', error);
    }
  });

// Clean up old FCM tokens
exports.cleanupTokens = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('Starting FCM token cleanup...');
    
    try {
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .get();
      
      const batch = admin.firestore().batch();
      let updateCount = 0;
      
      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        const fcmTokens = user.fcmTokens || [];
        
        if (fcmTokens.length === 0) continue;
        
        // Test tokens
        const validTokens = [];
        for (const token of fcmTokens) {
          try {
            await admin.messaging().send({
              token,
              data: { test: 'true' },
            }, true); // Dry run
            validTokens.push(token);
          } catch (error) {
            console.log('Invalid token removed:', token);
          }
        }
        
        if (validTokens.length !== fcmTokens.length) {
          batch.update(userDoc.ref, { fcmTokens: validTokens });
          updateCount++;
        }
      }
      
      if (updateCount > 0) {
        await batch.commit();
        console.log(`Cleaned up tokens for ${updateCount} users`);
      }
      
    } catch (error) {
      console.error('Error during token cleanup:', error);
    }
  });

// Generate weekly analytics report
exports.weeklyAnalytics = functions.pubsub
  .schedule('every monday 09:00')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Generating weekly analytics...');
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    try {
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .get();
      
      const batch = admin.firestore().batch();
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        
        // Count profile views this week
        const viewsSnapshot = await admin.firestore()
          .collection('profileViews')
          .where('profileId', '>=', userId) // Assuming profile ID matches user ID
          .where('viewedAt', '>=', oneWeekAgo)
          .get();
        
        // Count connections this week
        const connectionsSnapshot = await admin.firestore()
          .collection('connections')
          .where('toUserId', '==', userId)
          .where('connectedAt', '>=', oneWeekAgo)
          .get();
        
        // Update analytics
        const analyticsRef = admin.firestore()
          .collection('analytics')
          .doc(userId);
        
        batch.set(analyticsRef, {
          viewsThisWeek: viewsSnapshot.size,
          connectionsThisWeek: connectionsSnapshot.size,
          lastWeeklyUpdate: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      
      await batch.commit();
      console.log('Weekly analytics updated');
      
    } catch (error) {
      console.error('Error generating weekly analytics:', error);
    }
  });

// Helper function to send profile view notification
async function sendProfileViewNotification(userId, view) {
  try {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    if (!userDoc.exists) return;
    
    const user = userDoc.data();
    const fcmTokens = user.fcmTokens || [];
    
    if (fcmTokens.length === 0) return;
    
    const message = {
      notification: {
        title: 'Profile View',
        body: `Someone viewed your profile from ${view.viewerLocation || 'unknown location'}`,
        icon: '/icon-192.png',
      },
      data: {
        type: 'profile_view',
        viewerId: view.viewerUserId || '',
        location: view.viewerLocation || '',
      },
      tokens: fcmTokens,
    };
    
    const response = await admin.messaging().sendMulticast(message);
    console.log('Profile view notification sent:', response);
    
  } catch (error) {
    console.error('Error sending profile view notification:', error);
  }
}