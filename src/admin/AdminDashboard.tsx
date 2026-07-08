import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getOrders, updateOrderStatus, getStats } from "../lib/api";
import { logoutAdmin } from "../lib/auth";
import "../admin.css";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, totalProducts: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  async function loadData() {
    const [{ data: ordersData }, statsData] = await Promise.all([
      getOrders(statusFilter || undefined),
      getStats(),
    ]);
    setOrders(ordersData);
    setStats(statsData);
  }

  async function handleStatusChange(id: number, status: string) {
    await updateOrderStatus(id, status);
    loadData();
  }

  async function handleLogout() {
    await logoutAdmin();
    setLocation("/admin");
  }

  const statusLabels: Record<string, string> = {
    pending: "⏳ En attente",
    confirmed: "✅ Confirmé",
    preparing: "🔧 Préparation",
    ready: "📦 Prêt",
    delivered: "🚚 Livré",
    cancelled: "❌ Annulé",
  };

  return (
    <div className="admin-container">
      <aside className="sidebar">
        <h2>🚗 UniversalSA</h2>
        <nav>
          <a href="#" className="active">📦 Commandes</a>
        </nav>
        <button onClick={handleLogout} className="logout-btn">
          🚪 Déconnexion
        </button>
      </aside>

      <main className="main-content">
        <header>
          <h1>Commandes</h1>
        </header>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.totalOrders}</h3>
            <p>Commandes</p>
          </div>
          <div className="stat-card">
            <h3>{stats.pendingOrders}</h3>
            <p>En attente</p>
          </div>
          <div className="stat-card">
            <h3>{stats.totalProducts}</h3>
            <p>Produits</p>
          </div>
        </div>

        <div className="filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            {Object.entries(statusLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <table className="orders-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Client</th>
              <th>Tél</th>
              <th>Wilaya</th>
              <th>Produit</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                <td><strong>{o.customer_name}</strong></td>
                <td>{o.phone}</td>
                <td>{o.wilaya || "-"}</td>
                <td>{o.products?.brand} {o.products?.model}</td>
                <td>
                  <select value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}>
                    {Object.entries(statusLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    className="btn-whatsapp"
                    onClick={() => window.open(`https://wa.me/${o.phone.replace(/\s/g, "").replace(/^0/, "213")}`, "_blank")}
                  >
                    WhatsApp
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
