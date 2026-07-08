import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Order {
  id: number;
  created_at: string;
  customer_name: string;
  phone: string;
  wilaya: string;
  status: string;
  products: { name: string; brand: string; model: string; price: number } | null;
}

interface Product {
  id: number;
  name: string;
  brand: string;
  model: string;
  type: string;
  price: number;
  image_url: string;
  active: boolean;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, products: 0 });

  useEffect(() => {
    checkAuth();
    loadStats();
    if (activeTab === 'orders') loadOrders();
    else loadProducts();

    // Realtime
    const channel = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
        loadStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTab, statusFilter]);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/admin';
      return;
    }
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (userData?.role !== 'admin') {
      await supabase.auth.signOut();
      window.location.href = '/admin';
    }
  }

  async function loadOrders() {
    let query = supabase
      .from('orders')
      .select('*, products(name, brand, model, price)')
      .order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('status', statusFilter);
    const { data } = await query;
    setOrders(data || []);
  }

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    setProducts(data || []);
  }

  async function loadStats() {
    const { count: total } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const { count: pending } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true);
    setStats({ total: total || 0, pending: pending || 0, products: prodCount || 0 });
  }

  async function updateStatus(orderId: number, newStatus: string) {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    loadOrders();
    loadStats();
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/admin';
  }

  const statusLabels: Record<string, string> = {
    pending: '‚è≥ En attente',
    confirmed: '‚úÖ Confirm√©',
    preparing: 'Ì¥ß Pr√©paration',
    ready: 'Ì≥¶ Pr√™t',
    delivered: 'Ì∫ö Livr√©',
    cancelled: '‚ùå Annul√©',
  };

  return (
    <div className="admin-container">
      <aside className="sidebar">
        <h2>Ì∫ó UniversalSA</h2>
        <nav>
          <a href="#" className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
            Ì≥¶ Commandes
          </a>
          <a href="#" className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
            Ì∫ô Produits
          </a>
        </nav>
        <button onClick={logout} className="logout-btn">Ì∫™ D√©connexion</button>
      </aside>

      <main className="main-content">
        <header>
          <h1>{activeTab === 'orders' ? 'Commandes' : 'Produits'}</h1>
        </header>

        <div className="stats-grid">
          <div className="stat-card"><h3>{stats.total}</h3><p>Commandes</p></div>
          <div className="stat-card"><h3>{stats.pending}</h3><p>En attente</p></div>
          <div className="stat-card"><h3>{stats.products}</h3><p>Produits</p></div>
        </div>

        {activeTab === 'orders' && (
          <div className="tab-content">
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
                <tr><th>ID</th><th>Date</th><th>Client</th><th>T√©l</th><th>Wilaya</th><th>Produit</th><th>Statut</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                    <td><strong>{o.customer_name}</strong></td>
                    <td>{o.phone}</td>
                    <td>{o.wilaya || '-'}</td>
                    <td>{o.products?.brand} {o.products?.model}</td>
                    <td>
                      <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}>
                        {Object.entries(statusLabels).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button className="btn-whatsapp" onClick={() => window.open(`https://wa.me/${o.phone.replace(/\s/g, '').replace(/^0/, '213')}`, '_blank')}>
                        WhatsApp
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="tab-content">
            <table className="products-table">
              <thead>
                <tr><th>Image</th><th>Marque</th><th>Mod√®le</th><th>Type</th><th>Prix</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td><img src={p.image_url || '/placeholder.jpg'} className="product-img" alt={p.name} /></td>
                    <td><strong>{p.brand}</strong></td>
                    <td>{p.model}</td>
                    <td>{p.type || '-'}</td>
                    <td>{p.price?.toLocaleString()} DA</td>
                    <td><span className={`badge ${p.active ? 'badge-active' : 'badge-inactive'}`}>{p.active ? 'Actif' : 'Inactif'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
