import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import GlowingButton from "@/components/glowing-button";
import ProfileAvatar from "@/components/profile-avatar";
import { startNFCScan, isNFCSupported } from "@/lib/nfc";
import { startQRScan } from "@/lib/qr";
import { ArrowLeft, Wifi, Camera, QrCode } from "lucide-react";

export default function ScanNFC() {
  const { isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [nfcSupported, setNFCSupported] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    setNFCSupported(isNFCSupported());
  }, []);

  const createConnectionMutation = useMutation({
    mutationFn: async (data: { toUserId: string; toProfileId: number; scanMethod: string }) => {
      await apiRequest("POST", "/api/connections", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Connection saved successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save connection",
        variant: "destructive",
      });
    },
  });

  const handleNFCScan = async () => {
    if (!nfcSupported) {
      toast({
        title: "NFC Not Supported",
        description: "NFC is not supported on this device",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    try {
      const scannedData = await startNFCScan();
      
      // Check if it's a URL (new format) or tag ID (legacy format)
      if (scannedData.startsWith('http')) {
        // Extract profile ID from URL
        const profileId = extractProfileIdFromUrl(scannedData);
        if (profileId) {
          // Fetch profile by ID
          const response = await fetch(`/api/profile/${profileId}`);
          if (!response.ok) {
            throw new Error("Profile not found");
          }
          
          const profile = await response.json();
          
          // Save connection
          createConnectionMutation.mutate({
            toUserId: profile.userId,
            toProfileId: profile.id,
            scanMethod: "nfc",
          });

          // Navigate to profile view
          setLocation(`/profile/${profile.id}`);
        } else {
          throw new Error("Invalid profile URL");
        }
      } else {
        // Legacy format - NFC tag ID
        const response = await fetch(`/api/profile/nfc/${scannedData}`);
        if (!response.ok) {
          throw new Error("Profile not found");
        }
        
        const profile = await response.json();
        
        // Save connection
        createConnectionMutation.mutate({
          toUserId: profile.userId,
          toProfileId: profile.id,
          scanMethod: "nfc",
        });

        // Navigate to profile view
        setLocation(`/profile/${profile.id}`);
      }
      
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to scan NFC card",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleQRScan = async () => {
    setIsScanning(true);
    try {
      const qrData = await startQRScan();
      
      // Parse QR code data (should contain profile URL)
      const profileId = extractProfileIdFromUrl(qrData);
      if (!profileId) {
        throw new Error("Invalid QR code");
      }

      // Fetch profile by ID
      const response = await fetch(`/api/profile/${profileId}`);
      if (!response.ok) {
        throw new Error("Profile not found");
      }
      
      const profile = await response.json();
      
      // Save connection
      createConnectionMutation.mutate({
        toUserId: profile.userId,
        toProfileId: profile.id,
        scanMethod: "qr",
      });

      // Navigate to profile view
      setLocation(`/profile/${profileId}`);
      
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to scan QR code",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const extractProfileIdFromUrl = (url: string): string | null => {
    // Extract profile ID from URL like "https://app.com/profile/123" or just "123"
    const match = url.match(/profile\/(\d+)/) || url.match(/^(\d+)$/);
    return match ? match[1] : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-24 slide-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setLocation("/")}
          className="border-border"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Scan NFC Card</h1>
        <div></div>
      </div>

      {/* NFC Scanner Area */}
      <div className="text-center mb-8">
        <div className="w-48 h-48 mx-auto bg-card rounded-full border-4 border-dashed border-secondary flex items-center justify-center mb-6 pulse-glow floating">
          <Wifi className="text-secondary text-6xl" size={64} />
        </div>
        <h2 className="text-xl font-semibold mb-2">Ready to Scan</h2>
        <p className="text-muted-foreground mb-8">
          {nfcSupported 
            ? "Hold your device near an NFC card"
            : "NFC not supported on this device"
          }
        </p>
        
        <GlowingButton
          onClick={handleNFCScan}
          disabled={isScanning || !nfcSupported}
          className="bg-gradient-to-r from-secondary to-primary text-black px-8"
        >
          <Wifi className="w-4 h-4 mr-2" />
          {isScanning ? "Scanning..." : "Tap Your NXC Card"}
        </GlowingButton>
      </div>

      {/* Alternative QR Code Scanner */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <QrCode className="text-primary" size={20} />
            Alternative: QR Code
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            If NFC is not available, scan a QR code instead
          </p>
          <Button
            onClick={handleQRScan}
            disabled={isScanning}
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary hover:text-black"
          >
            <Camera className="w-4 h-4 mr-2" />
            {isScanning ? "Scanning..." : "Scan QR Code"}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      <div className="mt-8">
        <h3 className="font-semibold mb-4">Recent Scans</h3>
        <div className="space-y-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"
                  alt="Contact"
                  className="w-12 h-12"
                />
                <div className="flex-1">
                  <h4 className="font-medium">Alex Johnson</h4>
                  <p className="text-muted-foreground text-sm">Product Manager</p>
                </div>
                <span className="text-muted-foreground text-xs">2h ago</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
