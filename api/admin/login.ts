export default function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body || {};
    const cleanUser = (username || '').trim().toLowerCase();

    const validPasswords = ['Walid@143', 'admin', 'admin123', '123456'];
    const validUsers = ['admin', 'superadmin', 'walid', 'sales@devsparksoft.com.bd', 'artem.berezinsky@gmail.com', 'taksidwalid150@gmail.com'];

    const isUserValid = validUsers.includes(cleanUser) || cleanUser === 'admin';
    const isPassValid = validPasswords.includes(password);

    if (isUserValid && isPassValid) {
      const token = `dslink_jwt_${Buffer.from(cleanUser + ':' + Date.now()).toString('base64')}`;
      return res.status(200).json({
        success: true,
        token,
        username: cleanUser,
        role: 'superadmin'
      });
    }

    return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Login failed' });
  }
}
