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
        try {
          // Update user document in Firestore
          await setDoc(
            doc(db, 'users', firebaseUser.uid),
            {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              lastLoginAt: serverTimestamp(),
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (error) {
          console.error('Error updating user document:', error);
        }
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { 
    user, 
    loading, 
    isAuthenticated: !!user 
  };
}