export default function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const orderId = req.query.orderId || 'DSLINK-001';
  const courier = req.query.courier || 'Pathao';

  return res.status(200).json({
    status: 'in-transit',
    lastUpdate: new Date().toISOString(),
    location: 'Dhaka Central Hub - Dispatched for Delivery',
    courier,
    orderId
  });
}
