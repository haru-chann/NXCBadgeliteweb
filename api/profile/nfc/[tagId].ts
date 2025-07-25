import { storage } from '../../../../server/storage';

export default async function handler(req: any, res: any) {
  const { tagId } = req.query;
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }
  try {
    const tag = Array.isArray(tagId) ? tagId[0] : tagId as string;
    const profile = await storage.getProfileByNFC(tag);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    return res.status(200).json(profile);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
} 