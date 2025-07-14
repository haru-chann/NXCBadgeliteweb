import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { signInWithGoogle, logout } from '@/lib/firebase';
import { 
  requestNotificationPermission, 
  setupMessageListener,
  saveTokenToDatabase 
} from '@/services/firebase-notifications';
import {
  subscribeToProfileViews,
  subscribeToUserConnections,
  trackProfileView,
  createConnection,
  updateUserProfile
} from '@/services/firebase-realtime';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

/**
 * Complete Firebase Integration Example for NXC Badge
 * 
 * This component demonstrates:
 * 1. Firebase Authentication
 * 2. Real-time data subscriptions
 * 3. Push notifications
 * 4. Profile management
 * 5. Analytics tracking
 */
export default function FirebaseIntegrationExample() {
  const { user, loading, isAuthenticated } = useFirebaseAuth();
  const { toast } = useToast();
  const [profileViews, setProfileViews] = useState([]);
  const [connections, setConnections] = useState([]);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  // Set up real-time subscriptions and notifications
  useEffect(() => {
    if (isAuthenticated && user) {
      // Set up message listener for push notifications
      setupMessageListener();

      // Subscribe to profile views
      const unsubscribeViews = subscribeToProfileViews(
        user.uid, // Using user ID as profile ID for this example
        (views) => {
          setProfileViews(views);
          toast({
            title: "Profile Views Updated",
            description: `You have ${views.length} total profile views`,
          });
        }
      );

      // Subscribe to connections
      const unsubscribeConnections = subscribeToUserConnections(
        user.uid,
        (userConnections) => {
          setConnections(userConnections);
        }
      );

      // Cleanup subscriptions on unmount
      return () => {
        unsubscribeViews();
        unsubscribeConnections();
      };
    }
  }, [isAuthenticated, user, toast]);

  // Handle Google Sign-In
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Google",
      });
    } catch (error) {
      toast({
        title: "Sign In Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await logout();
      toast({
        title: "Goodbye!",
        description: "Successfully signed out",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Enable push notifications
  const enableNotifications = async () => {
    try {
      const token = await requestNotificationPermission();
      if (token && user) {
        await saveTokenToDatabase(user.uid, token);
        setNotificationEnabled(true);
        toast({
          title: "Notifications Enabled",
          description: "You'll receive push notifications for new connections and profile views",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Notification permission was denied",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not enable notifications",
        variant: "destructive",
      });
    }
  };

  // Simulate profile view tracking
  const simulateProfileView = async () => {
    if (user) {
      try {
        await trackProfileView(user.uid, {
          viewerUserId: 'anonymous',
          viewerLocation: 'Demo Location',
          viewerDevice: navigator.userAgent,
          ipAddress: '127.0.0.1',
          userAgent: navigator.userAgent,
        });
        toast({
          title: "Profile View Tracked",
          description: "Simulated a profile view for demo purposes",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not track profile view",
          variant: "destructive",
        });
      }
    }
  };

  // Simulate creating a connection
  const simulateConnection = async () => {
    if (user) {
      try {
        await createConnection({
          fromUserId: 'demo-user',
          toUserId: user.uid,
          toProfileId: user.uid,
          scanMethod: 'qr',
          notes: 'Demo connection via Firebase',
        });
        toast({
          title: "Connection Created",
          description: "Simulated a new connection for demo purposes",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not create connection",
          variant: "destructive",
        });
      }
    }
  };

  // Update profile
  const updateProfile = async () => {
    if (user) {
      try {
        await updateUserProfile(user.uid, {
          name: user.displayName || 'Demo User',
          profession: 'Software Developer',
          company: 'NXC Badge',
          bio: 'Firebase integration demo user',
          isPublic: true,
        });
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated in Firebase",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not update profile",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading Firebase...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Firebase Authentication Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignIn} className="w-full">
              Sign In with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user?.displayName || 'User'}!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
            <Button 
              onClick={enableNotifications} 
              disabled={notificationEnabled}
              variant={notificationEnabled ? "secondary" : "default"}
            >
              {notificationEnabled ? "Notifications Enabled" : "Enable Notifications"}
            </Button>
            <Button onClick={updateProfile} variant="outline">
              Update Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Views ({profileViews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={simulateProfileView} className="mb-4">
              Simulate Profile View
            </Button>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {profileViews.length > 0 ? (
                profileViews.slice(0, 5).map((view: any, index) => (
                  <div key={index} className="text-sm p-2 bg-muted rounded">
                    Viewed from {view.viewerLocation || 'Unknown'} at{' '}
                    {view.viewedAt?.toDate?.()?.toLocaleString() || 'Unknown time'}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground">No profile views yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connections ({connections.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={simulateConnection} className="mb-4">
              Simulate Connection
            </Button>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {connections.length > 0 ? (
                connections.slice(0, 5).map((connection: any, index) => (
                  <div key={index} className="text-sm p-2 bg-muted rounded">
                    Connection via {connection.scanMethod} at{' '}
                    {connection.connectedAt?.toDate?.()?.toLocaleString() || 'Unknown time'}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground">No connections yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Firebase Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-green-600">✓ Authentication</div>
              <div className="text-muted-foreground">Google Sign-In</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">✓ Firestore</div>
              <div className="text-muted-foreground">Real-time Database</div>
            </div>
            <div className="text-center">
              <div className={`font-semibold ${notificationEnabled ? 'text-green-600' : 'text-yellow-600'}`}>
                {notificationEnabled ? '✓' : '○'} Messaging
              </div>
              <div className="text-muted-foreground">Push Notifications</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">✓ Analytics</div>
              <div className="text-muted-foreground">Real-time Tracking</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}