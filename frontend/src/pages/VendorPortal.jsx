import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";

export default function VendorPortal() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.linkedRef) {
      setLoading(false);
      return;
    }
    Promise.all([
      api.get(`/vendors/${user.linkedRef}`),
      api.get("/inventory", { params: { limit: 20, vendor: user.linkedRef } }),
    ])
      .then(([vRes, iRes]) => {
        setVendor(vRes.data);
        setInventory(iRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="table-loading">Loading…</div>;

  if (!user?.linkedRef) {
    return (
      <div className="empty-state">
        <div className="big">📦</div>
        <p>Your vendor account is not linked yet. Contact the clinic admin.</p>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="section-head">
        <div>
          <h2>Vendor Portal</h2>
          <p>{vendor?.name || user.name}</p>
        </div>
      </div>
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h3>Vendor Details</h3></div>
        <div className="stat-grid" style={{ marginBottom: 0 }}>
          <div className="row-item"><div className="av">👤</div><div className="info"><div className="nm">{vendor?.contactPerson}</div><div className="sub">Contact Person</div></div></div>
          <div className="row-item"><div className="av">📞</div><div className="info"><div className="nm">{vendor?.phone}</div><div className="sub">Phone</div></div></div>
          <div className="row-item"><div className="av">📧</div><div className="info"><div className="nm">{vendor?.email}</div><div className="sub">Email</div></div></div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><h3>Supplied Items</h3></div>
        {inventory.length === 0 ? (
          <div className="empty-state"><div className="big">📦</div>No inventory items</div>
        ) : (
          inventory.map((item) => (
            <div className="row-item" key={item._id}>
              <div className="av">📦</div>
              <div className="info">
                <div className="nm">{item.name}</div>
                <div className="sub">Qty: {item.quantity} {item.unit}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
