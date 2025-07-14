import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, batch, writeBatch } from 'firebase/firestore';
import { db as pgDb } from '../server/db';
import { users, profiles, connections, profileViews } from '../shared/schema';

// Firebase configuration - you'll need to fill this with your actual config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

async function migrateUsers() {
  console.log('🔄 Migrating users...');
  
  const pgUsers = await pgDb.select().from(users);
  const batchSize = 500; // Firestore batch limit
  
  for (let i = 0; i < pgUsers.length; i += batchSize) {
    const batch = writeBatch(firestore);
    const usersBatch = pgUsers.slice(i, i + batchSize);
    
    usersBatch.forEach(user => {
      const userRef = doc(collection(firestore, 'users'), user.id);
      batch.set(userRef, {
        email: user.email,
        displayName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.email?.split('@')[0] || 'User',
        firstName: user.firstName,
        lastName: user.lastName,
        photoURL: user.profileImageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.updatedAt, // Use updatedAt as last login
      });
    });
    
    await batch.commit();
    console.log(`✅ Migrated ${Math.min(i + batchSize, pgUsers.length)}/${pgUsers.length} users`);
  }
  
  console.log('✅ Users migration completed');
}

async function migrateProfiles() {
  console.log('🔄 Migrating profiles...');
  
  const pgProfiles = await pgDb.select().from(profiles);
  const batchSize = 500;
  
  for (let i = 0; i < pgProfiles.length; i += batchSize) {
    const batch = writeBatch(firestore);
    const profilesBatch = pgProfiles.slice(i, i + batchSize);
    
    profilesBatch.forEach(profile => {
      const profileRef = doc(collection(firestore, 'profiles'), profile.id.toString());
      batch.set(profileRef, {
        userId: profile.userId,
        name: profile.name,
        profession: profile.profession,
        company: profile.company,
        bio: profile.bio,
        phone: profile.phone,
        website: profile.website,
        socialLinks: profile.socialLinks || {},
        nfcTagId: profile.nfcTagId,
        qrCodeData: profile.qrCodeData,
        isPublic: profile.isPublic ?? true,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      });
    });
    
    await batch.commit();
    console.log(`✅ Migrated ${Math.min(i + batchSize, pgProfiles.length)}/${pgProfiles.length} profiles`);
  }
  
  console.log('✅ Profiles migration completed');
}

async function migrateConnections() {
  console.log('🔄 Migrating connections...');
  
  const pgConnections = await pgDb.select().from(connections);
  const batchSize = 500;
  
  for (let i = 0; i < pgConnections.length; i += batchSize) {
    const batch = writeBatch(firestore);
    const connectionsBatch = pgConnections.slice(i, i + batchSize);
    
    connectionsBatch.forEach(connection => {
      const connectionRef = doc(collection(firestore, 'connections'));
      batch.set(connectionRef, {
        fromUserId: connection.fromUserId,
        toUserId: connection.toUserId,
        toProfileId: connection.toProfileId?.toString(),
        scanMethod: connection.scanMethod || 'link',
        isFavorite: connection.isFavorite ?? false,
        notes: connection.notes,
        connectedAt: connection.connectedAt,
      });
    });
    
    await batch.commit();
    console.log(`✅ Migrated ${Math.min(i + batchSize, pgConnections.length)}/${pgConnections.length} connections`);
  }
  
  console.log('✅ Connections migration completed');
}

async function migrateProfileViews() {
  console.log('🔄 Migrating profile views...');
  
  const pgViews = await pgDb.select().from(profileViews);
  const batchSize = 500;
  
  for (let i = 0; i < pgViews.length; i += batchSize) {
    const batch = writeBatch(firestore);
    const viewsBatch = pgViews.slice(i, i + batchSize);
    
    viewsBatch.forEach(view => {
      const viewRef = doc(collection(firestore, 'profileViews'));
      batch.set(viewRef, {
        profileId: view.profileId.toString(),
        viewerUserId: view.viewerUserId,
        viewerLocation: view.viewerLocation,
        viewerDevice: view.viewerDevice,
        ipAddress: view.ipAddress,
        userAgent: view.userAgent,
        viewDuration: view.viewDuration || 0,
        viewedAt: view.viewedAt,
      });
    });
    
    await batch.commit();
    console.log(`✅ Migrated ${Math.min(i + batchSize, pgViews.length)}/${pgViews.length} profile views`);
  }
  
  console.log('✅ Profile views migration completed');
}

async function generateAnalytics() {
  console.log('🔄 Generating analytics...');
  
  // Get all users and generate their analytics
  const pgUsers = await pgDb.select().from(users);
  
  for (const user of pgUsers) {
    const userProfiles = await pgDb.select().from(profiles).where(eq(profiles.userId, user.id));
    const userConnections = await pgDb.select().from(connections).where(eq(connections.fromUserId, user.id));
    
    let totalViews = 0;
    for (const profile of userProfiles) {
      const views = await pgDb.select().from(profileViews).where(eq(profileViews.profileId, profile.id));
      totalViews += views.length;
    }
    
    const analyticsRef = doc(collection(firestore, 'analytics'), user.id);
    await setDoc(analyticsRef, {
      totalViews,
      totalConnections: userConnections.length,
      viewsThisWeek: 0, // Would need to calculate based on dates
      connectionsThisWeek: 0, // Would need to calculate based on dates
      topProfessions: [],
      topCountries: [],
      lastUpdated: new Date(),
    });
  }
  
  console.log('✅ Analytics generation completed');
}

async function main() {
  console.log('🚀 Starting migration from PostgreSQL to Firebase');
  console.log('================================================\n');
  
  try {
    // Run migrations in order
    await migrateUsers();
    await migrateProfiles();
    await migrateConnections();
    await migrateProfileViews();
    await generateAnalytics();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your app to use Firebase instead of PostgreSQL');
    console.log('2. Deploy Firestore security rules');
    console.log('3. Test the application thoroughly');
    console.log('4. Update your replit.md with Firebase architecture details');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  main().catch(console.error);
}

export { main as migrateToFirebase };