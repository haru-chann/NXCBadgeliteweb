import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProfileSchema, insertConnectionSchema, insertProfileViewSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertProfileSchema.parse({ ...req.body, userId });
      
      const existingProfile = await storage.getUserProfile(userId);
      let profile;
      
      if (existingProfile) {
        profile = await storage.updateProfile(userId, profileData);
      } else {
        profile = await storage.createProfile(profileData);
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error saving profile:", error);
      res.status(500).json({ message: "Failed to save profile" });
    }
  });

  app.get('/api/profile/nfc/:tagId', async (req, res) => {
    try {
      const { tagId } = req.params;
      const profile = await storage.getProfileByNFC(tagId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile by NFC:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get('/api/profile/:id', async (req, res) => {
    try {
      const profileId = parseInt(req.params.id);
      const profile = await storage.getProfileById(profileId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Record view if not the owner
      const userAgent = req.get('User-Agent') || '';
      const ipAddress = req.ip;
      
      await storage.recordProfileView({
        profileId,
        viewerLocation: null,
        viewerDevice: userAgent,
        viewDuration: null,
        ipAddress,
        userAgent,
      });
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Connection routes
  app.get('/api/connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connections = await storage.getUserConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  app.post('/api/connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connectionData = insertConnectionSchema.parse({
        ...req.body,
        fromUserId: userId,
      });
      
      const connection = await storage.createConnection(connectionData);
      res.json(connection);
    } catch (error) {
      console.error("Error creating connection:", error);
      res.status(500).json({ message: "Failed to create connection" });
    }
  });

  app.patch('/api/connections/:id/favorite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connectionId = parseInt(req.params.id);
      
      await storage.toggleFavoriteConnection(userId, connectionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      const [connectionStats, viewStats] = await Promise.all([
        storage.getConnectionStats(userId),
        storage.getProfileViewStats(profile.id),
      ]);
      
      res.json({
        connections: connectionStats,
        views: viewStats,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/analytics/views/:profileId', async (req, res) => {
    try {
      const profileId = parseInt(req.params.profileId);
      const views = await storage.getProfileViews(profileId);
      res.json(views);
    } catch (error) {
      console.error("Error fetching profile views:", error);
      res.status(500).json({ message: "Failed to fetch profile views" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
