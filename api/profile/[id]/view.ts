import { storage } from '../../../../../server/storage';

export default async function handler(req: any, res: any) {
  const { id } = req.query;
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }
  try {
    const profileId = parseInt(Array.isArray(id) ? id[0] : id as string);
    const { viewerLocation, viewDuration } = req.body;
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    await storage.recordProfileView({
      profileId,
      viewerLocation,
      viewerDevice: userAgent,
      viewDuration,
      ipAddress,
    });
    return res.status(200).json({ message: 'Profile view recorded' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to record profile view' });
  }
} 