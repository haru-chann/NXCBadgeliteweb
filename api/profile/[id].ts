import { storage } from '../../../../server/storage';

export default async function handler(req: any, res: any) {
  const { id } = req.query;
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }
  try {
    const profileId = parseInt(Array.isArray(id) ? id[0] : id as string);
    const profile = await storage.getProfileById(profileId);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    return res.status(200).json(profile);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
} 