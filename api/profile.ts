// NOTE: Vercel automatically parses req.body as JSON if content-type is application/json
import { storage } from '../server/storage';
import { insertProfileSchema } from '../shared/schema';

// TODO: Replace this with real authentication logic
async function getUserIdFromRequest(req: any): Promise<string | null> {
  // Example: extract from cookie, header, or session
  return null;
}

export default async function handler(req: any, res: any) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const profile = await storage.getUserProfile(userId);
      return res.status(200).json(profile);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch profile' });
    }
  } else if (req.method === 'POST') {
    try {
      const profileData = insertProfileSchema.parse({ ...req.body, userId });
      const existingProfile = await storage.getUserProfile(userId);
      let profile;
      if (existingProfile) {
        profile = await storage.updateProfile(userId, profileData);
      } else {
        profile = await storage.createProfile(profileData);
      }
      return res.status(200).json(profile);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to save profile' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end('Method Not Allowed');
  }
} 