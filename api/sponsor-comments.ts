export default function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const comment = req.body || {};
    return res.status(200).json({
      success: true,
      data: {
        id: 'comment-' + Date.now(),
        ...comment,
        createdAt: new Date().toISOString()
      }
    });
  }

  return res.status(200).json({ success: true, comments: [] });
}
