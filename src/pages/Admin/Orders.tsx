import React, { useEffect, useState } from 'react';

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/orders', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOrders(data.orders);
        } else {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  if (loading) return <div className="p-4">Loading orders...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border-b text-left">Order ID</th>
            <th className="py-2 px-4 border-b text-left">Customer</th>
            <th className="py-2 px-4 border-b text-left">Total</th>
            <th className="py-2 px-4 border-b text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order: any) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b">{order.orderId}</td>
              <td className="py-2 px-4 border-b">{order.customerName}</td>
              <td className="py-2 px-4 border-b">৳{order.totalAmount}</td>
              <td className="py-2 px-4 border-b">{order.orderStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminOrders;
