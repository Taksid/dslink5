export default function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer dslink_jwt_') || authHeader.startsWith('Bearer ')) {
    return res.status(200).json({
      success: true,
      username: 'admin',
      role: 'superadmin'
    });
  }

  return res.status(401).json({ success: false, error: 'Unauthorized' });
}
