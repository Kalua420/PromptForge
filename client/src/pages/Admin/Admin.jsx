import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, FileText, CreditCard, Settings, Activity,
  Trash2, Edit3, X, Check, Search, Plus, Shield, ShieldOff,
  Menu, ArrowLeft, LogOut, User, Mail, Calendar, Globe, Key,
  Camera, Eye, EyeOff, BarChart3, Clock, AlertCircle, Copy,
  CheckCircle, XCircle, Hash, Link as LinkIcon,
} from 'lucide-react';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import Toast from '../../components/Toast.jsx';
import api from '../../utils/api.js';
import { useAuthStore } from '../../stores/authStore.js';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'templates', label: 'Templates', icon: FileText },
  { key: 'plans', label: 'Plans', icon: CreditCard },
  { key: 'services', label: 'Services', icon: Activity },
  { key: 'apikeys', label: 'API Keys', icon: Key },
  { key: 'usage', label: 'Usage Logs', icon: BarChart3 },
  { key: 'profile', label: 'Profile', icon: Settings },
];

const categories = ['chatbot', 'coding', 'writing', 'research', 'image'];
const planOptions = ['free', 'pro', 'team'];

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-paper border border-border rounded-xl p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
        <Icon size={24} className="text-accent" />
      </div>
      <div>
        <p className="text-sm text-text/50">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [activeNav, setActiveNav] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState({ message: '', visible: false, type: 'info' });

  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const NavLink = ({ item }) => {
    const Icon = item.icon;
    const isActive = activeNav === item.key;
    return (
      <button
        onClick={() => setActiveNav(item.key)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 text-left ${
          isActive
            ? 'bg-accent/15 text-accent border border-accent/20'
            : 'text-text/50 hover:text-text hover:bg-white/[0.04] border border-transparent'
        }`}
      >
        <Icon size={18} />
        <span>{item.label}</span>
        {isActive && <motion.div layoutId="admin-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Admin top bar */}
      <div className="h-14 border-b border-border bg-black/30 flex items-center px-4 md:px-6 gap-3 fixed top-0 left-0 right-0 z-50">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-text/30 hover:text-text transition-colors">
          <Menu size={20} />
        </button>
        <span className="text-sm font-bold">
          <span className="text-accent">Admin</span>
          <span className="text-text/50 mx-1.5">/</span>
          <span className="text-text capitalize">{activeNav}</span>
        </span>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-xs text-text/40 hover:text-text transition-colors"
          >
            <ArrowLeft size={14} /> Back to app
          </button>
          <span className="text-xs text-text/30">{user?.email}</span>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-1.5 text-xs text-text/30 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Admin sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -220 }}
            animate={{ x: 0 }}
            exit={{ x: -220 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-14 bottom-0 w-56 bg-black/20 backdrop-blur-xl border-r border-border z-40 p-4 flex flex-col gap-1 overflow-y-auto"
          >
            <div className="text-xs font-medium text-text/30 uppercase tracking-wider mb-4 px-3">Admin Panel</div>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.key} item={item} />
            ))}
            <div className="mt-auto pt-4 border-t border-border px-3">
              <div className="flex items-center gap-2 text-xs text-text/40">
                <Shield size={12} className="text-accent" />
                <span>Administrator</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={`pt-14 transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-0'}`}>
        <div className="p-4 md:p-6 xl:p-8">
          {activeNav === 'overview' && <OverviewTab />}
          {activeNav === 'users' && <UsersTab setToast={setToast} />}
          {activeNav === 'templates' && <TemplatesTab setToast={setToast} />}
          {activeNav === 'plans' && <PlansTab />}
          {activeNav === 'services' && <ServicesTab />}
          {activeNav === 'apikeys' && <ApiKeysTab setToast={setToast} />}
          {activeNav === 'usage' && <UsageLogsTab setToast={setToast} />}
          {activeNav === 'profile' && <ProfileTab setToast={setToast} />}
        </div>
      </div>

      <Toast {...toast} onClose={() => setToast((t) => ({ ...t, visible: false }))} />
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-32">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-text/50 text-sm mt-1">Key metrics at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} icon={Users} />
        <StatCard label="Total Prompts" value={stats.totalPrompts} icon={FileText} />
        <StatCard label="Templates" value={stats.totalTemplates} icon={FileText} />
        <StatCard label="Conversations" value={stats.totalConversations} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-paper border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-text/50 uppercase tracking-wider mb-4">Plan Distribution</h3>
          {stats.planDistribution?.length > 0 ? (
            <div className="space-y-3">
              {stats.planDistribution.map((d) => (
                <div key={d.plan} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-text/70">{d.plan}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 rounded-full bg-black/30 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${(d.count / Math.max(stats.totalUsers, 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{d.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text/30">No subscription data</p>
          )}
        </div>

        <div className="bg-paper border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-text/50 uppercase tracking-wider mb-4">Total Payments</h3>
          <p className="text-3xl font-bold text-accent">{stats.totalPayments}</p>
          <p className="text-xs text-text/30 mt-1">All-time payment records</p>
        </div>
      </div>

      {stats.recentUsers?.length > 0 && (
        <div className="bg-paper border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-text/50 uppercase tracking-wider mb-4">Recent Registrations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-border">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                  {u.name?.charAt(0) || u.email?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.name || '—'}</p>
                  <p className="text-xs text-text/40 truncate">{u.email}</p>
                </div>
                <span className="ml-auto text-xs text-text/30">{new Date(u.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UsersTab({ setToast }) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [viewingUser, setViewingUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get('/api/admin/users', { params });
      setUsers(data.users);
      setTotal(data.total);
    } catch { setToast({ message: 'Failed to load users', visible: true, type: 'error' }); }
    setLoading(false);
  }, [page, search, roleFilter, setToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleUpdateRole = async () => {
    try {
      await api.patch(`/api/admin/users/${editingUser.id}`, { role: editRole });
      setToast({ message: 'User role updated', visible: true, type: 'success' });
      setEditingUser(null);
      fetchUsers();
    } catch { setToast({ message: 'Failed to update user', visible: true, type: 'error' }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user? All their data will be permanently removed.')) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      setToast({ message: 'User deleted', visible: true, type: 'success' });
      fetchUsers();
    } catch { setToast({ message: 'Failed to delete user', visible: true, type: 'error' }); }
  };

  const viewUserDetails = async (id) => {
    try {
      const { data } = await api.get(`/api/admin/users/${id}`);
      setViewingUser(data);
    } catch { setToast({ message: 'Failed to load user details', visible: true, type: 'error' }); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-text/50 text-sm mt-1">{total} total users</p>
        </div>
        <div className="w-64">
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            suffix={<Search size={16} className="text-text/30" />}
          />
        </div>
      </div>

      {/* Role filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text/40">Filter:</span>
        {[
          { value: '', label: 'All' },
          { value: 'admin', label: 'Admins' },
          { value: 'user', label: 'Users' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setRoleFilter(value); setPage(1); }}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              roleFilter === value
                ? 'bg-accent text-white border-accent'
                : 'border-border text-text/50 hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-paper border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text/50 text-xs uppercase tracking-wider">
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Plan</th>
                <th className="text-left p-4">Prompts</th>
                <th className="text-left p-4">Joined</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <button onClick={() => viewUserDetails(u.id)} className="flex items-center gap-3 hover:text-accent transition-colors">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                        {u.name?.charAt(0) || u.email?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium truncate max-w-[120px]">{u.name || '—'}</span>
                    </button>
                  </td>
                  <td className="p-4 text-text/70">{u.email}</td>
                  <td className="p-4">
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit ${
                      u.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-white/5 text-text/50'
                    }`}>
                      {u.role === 'admin' ? <Shield size={12} /> : <ShieldOff size={12} />}
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.subscription?.planId === 'pro' ? 'bg-primary/10 text-primary' :
                      u.subscription?.planId === 'team' ? 'bg-accent/10 text-accent' :
                      'bg-white/5 text-text/50'
                    }`}>
                      {u.subscription?.planId || 'free'}
                    </span>
                  </td>
                  <td className="p-4 text-text/70">{u._count?.prompts || 0}</td>
                  <td className="p-4 text-text/50 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditingUser(u); setEditRole(u.role); }}
                        className="p-1.5 rounded-lg hover:bg-accent/10 text-text/30 hover:text-accent transition-all"
                        title="Edit role"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => viewUserDetails(u.id)}
                        className="p-1.5 rounded-lg hover:bg-accent/10 text-text/30 hover:text-accent transition-all"
                        title="View details"
                      >
                        <User size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-text/30 hover:text-red-400 transition-all"
                        title="Delete user"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full" />
          </div>
        )}
        {!loading && users.length === 0 && (
          <p className="text-center text-text/30 py-8 text-sm">No users found.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 text-xs rounded-lg transition-all ${
                p === page ? 'bg-accent text-white' : 'bg-paper border border-border text-text/50 hover:text-text'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Edit role modal */}
      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User Role">
        {editingUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
                {editingUser.name?.charAt(0) || editingUser.email?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-sm font-medium">{editingUser.name || '—'}</p>
                <p className="text-xs text-text/50">{editingUser.email}</p>
              </div>
            </div>
            <p className="text-sm text-text/70">
              Current role: <strong>{editingUser.role}</strong>
            </p>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-text text-sm outline-none focus:border-accent transition-colors"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button onClick={handleUpdateRole}>Save</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* User details modal */}
      <Modal open={!!viewingUser} onClose={() => setViewingUser(null)} title="User Details">
        {viewingUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-lg font-bold text-accent">
                {viewingUser.name?.charAt(0) || viewingUser.email?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-lg font-medium">{viewingUser.name || '—'}</p>
                <p className="text-sm text-text/50">{viewingUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-text/70">
                <Shield size={14} /> Role: <strong className="text-text capitalize">{viewingUser.role}</strong>
              </div>
              <div className="flex items-center gap-2 text-text/70">
                <CreditCard size={14} /> Plan: <strong className="text-text capitalize">{viewingUser.subscription?.planId || 'free'}</strong>
              </div>
              <div className="flex items-center gap-2 text-text/70">
                <Calendar size={14} /> Joined: <strong className="text-text">{new Date(viewingUser.createdAt).toLocaleDateString()}</strong>
              </div>
              <div className="flex items-center gap-2 text-text/70">
                <FileText size={14} /> Prompts: <strong className="text-text">{viewingUser._count?.prompts || 0}</strong>
              </div>
            </div>
            {viewingUser.payments?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-text/50 uppercase tracking-wider mb-2">Recent Payments</h4>
                <div className="space-y-1">
                  {viewingUser.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs text-text/70 p-2 rounded bg-black/20">
                      <span className="capitalize">{p.plan} — {p.status}</span>
                      <span>₹{(p.amount / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function TemplatesTab({ setToast }) {
  const [templates, setTemplates] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'chatbot', content: '', plan: 'free', featured: false });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/templates', { params: { page, limit: 20 } });
      setTemplates(data.templates);
      setTotal(data.total);
    } catch { setToast({ message: 'Failed to load templates', visible: true, type: 'error' }); }
    setLoading(false);
  }, [page, setToast]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const openNew = () => {
    setForm({ title: '', description: '', category: 'chatbot', content: '', plan: 'free', featured: false });
    setEditing('new');
  };

  const openEdit = (t) => {
    setForm({ title: t.title, description: t.description || '', category: t.category, content: t.content, plan: t.plan, featured: t.featured });
    setEditing(t.id);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setToast({ message: 'Title and content are required', visible: true, type: 'error' });
      return;
    }
    try {
      if (editing === 'new') {
        await api.post('/api/admin/templates', form);
        setToast({ message: 'Template created', visible: true, type: 'success' });
      } else {
        await api.patch(`/api/admin/templates/${editing}`, form);
        setToast({ message: 'Template updated', visible: true, type: 'success' });
      }
      setEditing(null);
      fetchTemplates();
    } catch { setToast({ message: 'Failed to save template', visible: true, type: 'error' }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.delete(`/api/admin/templates/${id}`);
      setToast({ message: 'Template deleted', visible: true, type: 'success' });
      fetchTemplates();
    } catch { setToast({ message: 'Failed to delete template', visible: true, type: 'error' }); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Template Management</h1>
          <p className="text-text/50 text-sm mt-1">{total} total templates</p>
        </div>
        <Button onClick={openNew}><Plus size={14} /> New Template</Button>
      </div>

      <div className="bg-paper border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text/50 text-xs uppercase tracking-wider">
                <th className="text-left p-4">Title</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Plan</th>
                <th className="text-left p-4">Featured</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-medium max-w-xs truncate">{t.title}</td>
                  <td className="p-4"><span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent capitalize">{t.category}</span></td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      t.plan === 'pro' ? 'bg-primary/10 text-primary' :
                      t.plan === 'team' ? 'bg-accent/10 text-accent' : 'bg-white/5 text-text/50'
                    }`}>{t.plan}</span>
                  </td>
                  <td className="p-4">{t.featured ? <Check size={14} className="text-accent" /> : <X size={14} className="text-text/30" />}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-accent/10 text-text/30 hover:text-accent transition-all" title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-text/30 hover:text-red-400 transition-all" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full" />
          </div>
        )}
        {!loading && templates.length === 0 && (
          <p className="text-center text-text/30 py-8 text-sm">No templates found.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 text-xs rounded-lg transition-all ${p === page ? 'bg-accent text-white' : 'bg-paper border border-border text-text/50 hover:text-text'}`}>{p}</button>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Create Template' : 'Edit Template'}>
        <div className="space-y-4">
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Template title" />
          <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description" />
          <div className="flex gap-2">
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-border text-text text-sm outline-none focus:border-accent transition-colors">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))} className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-border text-text text-sm outline-none focus:border-accent transition-colors">
              {planOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Template content..." rows={8} className="w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-text text-sm outline-none focus:border-accent transition-colors resize-none font-mono" />
          <label className="flex items-center gap-2 text-sm text-text/70 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 rounded accent-accent" />
            Featured template
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PlansTab() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);   // null | 'new' | plan object
  const [deleting, setDeleting] = useState(null); // plan object to confirm delete
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false, type: 'info' });

  const emptyForm = { name: '', credits: '', bonus: '', price: '', popular: false, displayOrder: '', isActive: true };
  const [form, setForm] = useState(emptyForm);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/plans');
      setPlans(Array.isArray(data.plans) ? data.plans : Object.values(data.plans));
    } catch {
      setToast({ message: 'Failed to load plans', visible: true, type: 'error' });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openNew = () => {
    setForm({ ...emptyForm, displayOrder: plans.length });
    setEditing('new');
  };

  const openEdit = (plan) => {
    setForm({
      name: plan.name,
      credits: plan.credits,
      bonus: plan.bonus ?? 0,
      price: plan.price / 100,          // paise → ₹ for display
      popular: plan.popular,
      displayOrder: plan.displayOrder ?? 0,
      isActive: plan.isActive,
    });
    setEditing(plan);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.credits === '' || form.price === '') {
      setToast({ message: 'Name, credits, and price are required', visible: true, type: 'error' });
      return;
    }
    if (Number(form.credits) < 1) {
      setToast({ message: 'Credits must be at least 1', visible: true, type: 'error' });
      return;
    }
    if (Number(form.price) < 0) {
      setToast({ message: 'Price cannot be negative', visible: true, type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        credits: Number(form.credits),
        bonus: Number(form.bonus || 0),
        price: Number(form.price),       // backend multiplies by 100 → paise
        popular: Boolean(form.popular),
        displayOrder: Number(form.displayOrder || 0),
        isActive: Boolean(form.isActive),
      };
      if (editing === 'new') {
        await api.post('/api/admin/plans', payload);
        setToast({ message: 'Plan created', visible: true, type: 'success' });
      } else {
        await api.patch(`/api/admin/plans/${editing.id}`, payload);
        setToast({ message: 'Plan updated', visible: true, type: 'success' });
      }
      setEditing(null);
      fetchPlans();
    } catch (err) {
      setToast({ message: err?.response?.data?.error || 'Failed to save plan', visible: true, type: 'error' });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/api/admin/plans/${deleting.id}`);
      setToast({ message: 'Plan deleted', visible: true, type: 'success' });
      setDeleting(null);
      fetchPlans();
    } catch {
      setToast({ message: 'Failed to delete plan', visible: true, type: 'error' });
    }
  };

  const toggleActive = async (plan) => {
    try {
      await api.patch(`/api/admin/plans/${plan.id}`, { isActive: !plan.isActive });
      fetchPlans();
    } catch {
      setToast({ message: 'Failed to update plan', visible: true, type: 'error' });
    }
  };

  const totalCredits = (p) => (Number(form.credits) || 0) + (Number(form.bonus) || 0);
  const pricePerCredit = () => {
    const c = Number(form.credits);
    const p = Number(form.price);
    return c > 0 && p > 0 ? (p / c).toFixed(4) : '—';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Credit Packs</h1>
          <p className="text-text/50 text-sm mt-1">Manage pay-as-you-go credit pack offerings.</p>
        </div>
        <Button onClick={openNew}><Plus size={14} /> New Pack</Button>
      </div>

      {/* Plan cards */}
      {plans.length === 0 ? (
        <div className="bg-paper border border-border rounded-xl p-16 text-center">
          <CreditCard size={32} className="mx-auto text-text/20 mb-3" />
          <p className="text-text/40 text-sm">No credit packs yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((pack) => {
            const total = pack.credits + (pack.bonus || 0);
            return (
              <div
                key={pack.id}
                className={`bg-paper border rounded-xl p-5 flex flex-col gap-4 relative transition-all ${
                  pack.isActive ? 'border-border' : 'border-border/30 opacity-50'
                }`}
              >
                {/* Status + popular badges */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {pack.popular && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-white font-medium">Popular</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    pack.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {pack.isActive ? 'Live' : 'Hidden'}
                  </span>
                </div>

                {/* Name + price */}
                <div>
                  <h3 className="text-base font-bold pr-24">{pack.name}</h3>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-2xl font-bold">₹{(pack.price / 100).toLocaleString()}</span>
                    <span className="text-text/40 text-xs mb-1">one-time</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-sm border-t border-border/50 pt-3">
                  <div className="flex justify-between">
                    <span className="text-text/50">Base credits</span>
                    <span className="font-medium">{pack.credits.toLocaleString()}</span>
                  </div>
                  {pack.bonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text/50">Bonus credits</span>
                      <span className="font-medium text-accent">+{pack.bonus.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border/50 pt-2">
                    <span className="text-text/50">Total</span>
                    <span className="font-bold">{total.toLocaleString()} credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text/50">Per credit</span>
                    <span className="font-medium">₹{pack.pricePerCredit?.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text/50">Display order</span>
                    <span className="font-medium">{pack.displayOrder}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                  <button
                    onClick={() => openEdit(pack)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-all"
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => toggleActive(pack)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg transition-all ${
                      pack.isActive
                        ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                        : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    }`}
                  >
                    {pack.isActive ? <EyeOff size={12} /> : <Eye size={12} />}
                    {pack.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => setDeleting(pack)}
                    className="flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Credit cost reference */}
      <div className="bg-paper border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-text/50 uppercase tracking-wider mb-4">Credit Cost per Generation (by Provider)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { provider: 'Groq',      cost: 1, color: 'text-green-400',  bg: 'bg-green-500/10' },
            { provider: 'SambaNova', cost: 2, color: 'text-blue-400',   bg: 'bg-blue-500/10' },
            { provider: 'Gemini',    cost: 2, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { provider: 'Anthropic', cost: 3, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { provider: 'OpenCode',  cost: 1, color: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
          ].map(({ provider, cost, color, bg }) => (
            <div key={provider} className={`${bg} rounded-xl p-4 flex flex-col items-center gap-1`}>
              <span className={`text-2xl font-bold ${color}`}>{cost}</span>
              <span className="text-xs text-text/50">credit{cost > 1 ? 's' : ''}</span>
              <span className="text-xs font-medium text-text/70 mt-1">{provider}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Create Credit Pack' : `Edit — ${editing?.name}`}
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs text-text/50 mb-1 block">Pack name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Starter Pack"
            />
          </div>

          {/* Credits + Bonus */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text/50 mb-1 block">Base credits *</label>
              <Input
                type="number"
                min="1"
                value={form.credits}
                onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))}
                placeholder="100"
              />
            </div>
            <div>
              <label className="text-xs text-text/50 mb-1 block">Bonus credits</label>
              <Input
                type="number"
                min="0"
                value={form.bonus}
                onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Price + Order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text/50 mb-1 block">Price (₹) *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="99"
              />
            </div>
            <div>
              <label className="text-xs text-text/50 mb-1 block">Display order</label>
              <Input
                type="number"
                min="0"
                value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Live preview */}
          {(form.credits || form.price) && (
            <div className="bg-black/20 border border-border/50 rounded-lg p-3 text-xs space-y-1">
              <p className="text-text/40 uppercase tracking-wider font-medium mb-2">Preview</p>
              <div className="flex justify-between text-text/70">
                <span>Total credits</span>
                <span className="font-medium text-text">{(Number(form.credits || 0) + Number(form.bonus || 0)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-text/70">
                <span>Price per credit</span>
                <span className="font-medium text-text">₹{pricePerCredit()}</span>
              </div>
            </div>
          )}

          {/* Toggles */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm text-text/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.popular}
                onChange={(e) => setForm((f) => ({ ...f, popular: e.target.checked }))}
                className="accent-primary w-4 h-4"
              />
              Mark as Popular
            </label>
            <label className="flex items-center gap-2 text-sm text-text/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="accent-accent w-4 h-4"
              />
              Live (visible to users)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing === 'new' ? 'Create Pack' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Credit Pack">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-text/70">
              Are you sure you want to delete <strong className="text-text">{deleting.name}</strong>?
              This cannot be undone. Existing payments referencing this pack will be unaffected.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Toast {...toast} onClose={() => setToast((t) => ({ ...t, visible: false }))} />
    </div>
  );
}

function ServicesTab() {
  const [services, setServices] = useState(null);
  const [failures, setFailures] = useState(null);
  const [loadingFailures, setLoadingFailures] = useState(false);
  const [filterProvider, setFilterProvider] = useState('');
  const [resetting, setResetting] = useState(null);

  const PROVIDERS = ['groq', 'sambanova', 'anthropic', 'opencode', 'gemini'];

  const fetchAll = useCallback(async () => {
    try {
      const [svcRes, failRes] = await Promise.all([
        api.get('/api/admin/services'),
        api.get('/api/admin/api-key-failures', { params: { limit: 50 } }),
      ]);
      setServices(svcRes.data.services);
      setFailures(failRes.data);
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchFailures = useCallback(async () => {
    setLoadingFailures(true);
    try {
      const params = { limit: 50 };
      if (filterProvider) params.provider = filterProvider;
      const { data } = await api.get('/api/admin/api-key-failures', { params });
      setFailures(data);
    } catch { /* non-fatal */ }
    setLoadingFailures(false);
  }, [filterProvider]);

  useEffect(() => { fetchFailures(); }, [fetchFailures]);

  const handleReset = async (keyId) => {
    setResetting(keyId);
    try {
      await api.post(`/api/admin/api-key-failures/${keyId}/reset`);
      await fetchAll();
    } catch { /* non-fatal */ }
    setResetting(null);
  };

  const providerColor = (p) => {
    const map = {
      groq: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      sambanova: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      anthropic: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      opencode: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      gemini: 'bg-green-500/10 text-green-400 border-green-500/20',
    };
    return map[p] || 'bg-white/5 text-text/50 border-border';
  };

  const errorCodeColor = (code) => {
    if (!code) return 'text-text/40';
    const n = Number(code);
    if (n === 401 || n === 403) return 'text-red-400';
    if (n === 429) return 'text-yellow-400';
    if (n >= 500) return 'text-orange-400';
    return 'text-text/50';
  };

  if (!services) {
    return (
      <div className="flex items-center justify-center py-32">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full" />
      </div>
    );
  }

  const failingKeys = failures?.failing || [];
  const recentLogs = failures?.logs || [];
  const totalFailing = failingKeys.length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services & Integrations</h1>
          <p className="text-text/50 text-sm mt-1">Status of all platform services and API key health.</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-1.5 text-xs text-text/40 hover:text-text transition-colors"
        >
          <Activity size={13} /> Refresh
        </button>
      </div>

      {/* Infrastructure cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-paper border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text/50 uppercase tracking-wider">Database</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${services.database.status === 'connected' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {services.database.status}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${services.database.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">{services.database.provider}</span>
          </div>
        </div>

        <div className="bg-paper border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text/50 uppercase tracking-wider">Payments</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${services.razorpay.status === 'configured' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
              {services.razorpay.status}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${services.razorpay.status === 'configured' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-sm">Razorpay</span>
          </div>
        </div>
      </div>

      {/* AI Providers overview */}
      <div className="bg-paper border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-text/50 uppercase tracking-wider mb-4">AI Providers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(services.ai).map(([key, svc]) => {
            const hasFailing = (svc.failingCount || 0) > 0;
            return (
              <div key={key} className={`flex items-center gap-3 p-4 rounded-lg bg-black/20 border transition-colors ${hasFailing ? 'border-red-500/30' : 'border-border'}`}>
                <span className={`w-3 h-3 rounded-full shrink-0 ${svc.status === 'configured' ? (hasFailing ? 'bg-red-500' : 'bg-green-500') : 'bg-yellow-500'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize">{key}</p>
                  <p className="text-xs text-text/40">
                    {svc.status === 'configured'
                      ? `${svc.keyCount} key${svc.keyCount !== 1 ? 's' : ''} configured`
                      : 'No keys configured'}
                  </p>
                </div>
                <div className="ml-auto flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${svc.status === 'configured' ? (hasFailing ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-500') : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {svc.status === 'configured' ? (hasFailing ? 'Degraded' : 'Healthy') : 'Inactive'}
                  </span>
                  {hasFailing && (
                    <span className="text-xs text-red-400">{svc.failingCount} failing</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Failing keys alert */}
      {totalFailing > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-red-400">
              {totalFailing} Key{totalFailing !== 1 ? 's' : ''} Failing or in Cooldown
            </h3>
          </div>
          <div className="space-y-2">
            {failingKeys.map((k) => (
              <div key={k.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-red-500/10">
                <span className={`text-xs px-2 py-0.5 rounded border capitalize font-medium shrink-0 ${providerColor(k.provider)}`}>
                  {k.provider}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text/80 truncate">{k.label || <span className="italic text-text/30">No label</span>}</p>
                  <p className="text-xs text-text/40">
                    {k.failCount} failure{k.failCount !== 1 ? 's' : ''}
                    {k.lastFailAt && ` · last at ${new Date(k.lastFailAt).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${k.failCount >= 3 ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                    {k.failCount >= 3 ? 'Cooldown' : 'Warning'}
                  </span>
                  <button
                    onClick={() => handleReset(k.id)}
                    disabled={resetting === k.id}
                    className="text-xs px-2.5 py-1 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all disabled:opacity-50"
                  >
                    {resetting === k.id ? '…' : 'Reset'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalFailing === 0 && failures && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/5 border border-green-500/20 text-sm text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          All API keys are healthy — no failures detected.
        </div>
      )}

      {/* Recent failure log */}
      <div className="bg-paper border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-sm font-medium text-text/50 uppercase tracking-wider">Recent Failure Log</h3>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <button
                onClick={() => setFilterProvider('')}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${!filterProvider ? 'bg-accent text-white border-accent' : 'border-border text-text/50 hover:text-text'}`}
              >
                All
              </button>
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterProvider(filterProvider === p ? '' : p)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all capitalize ${filterProvider === p ? 'bg-accent text-white border-accent' : 'border-border text-text/50 hover:text-text'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loadingFailures ? (
          <div className="flex items-center justify-center py-10">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full" />
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-text/30 text-sm">No failure events recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text/50 text-xs uppercase tracking-wider">
                  <th className="text-left p-4">Provider</th>
                  <th className="text-left p-4">Key Label</th>
                  <th className="text-left p-4">Error Code</th>
                  <th className="text-left p-4">Error Message</th>
                  <th className="text-left p-4">Time</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded border capitalize font-medium ${providerColor(log.provider)}`}>
                        {log.provider}
                      </span>
                    </td>
                    <td className="p-4 text-text/60 max-w-[140px] truncate">
                      {log.apiKey?.label || <span className="italic text-text/30">No label</span>}
                    </td>
                    <td className="p-4">
                      <span className={`font-mono text-xs font-semibold ${errorCodeColor(log.errorCode)}`}>
                        {log.errorCode || '—'}
                      </span>
                    </td>
                    <td className="p-4 text-text/50 text-xs max-w-[280px] truncate" title={log.errorMsg || ''}>
                      {log.errorMsg || '—'}
                    </td>
                    <td className="p-4 text-text/40 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      {log.apiKey && (log.apiKey.failCount > 0) && (
                        <button
                          onClick={() => handleReset(log.apiKeyId)}
                          disabled={resetting === log.apiKeyId}
                          className="text-xs px-2.5 py-1 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all disabled:opacity-50"
                        >
                          {resetting === log.apiKeyId ? '…' : 'Reset Key'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ApiKeysTab({ setToast }) {
  const PROVIDERS = ['groq', 'sambanova', 'anthropic', 'opencode', 'gemini'];

  const [keys, setKeys] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterProvider, setFilterProvider] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ provider: 'groq', apiKey: '', label: '', priority: 0 });
  const [editingKey, setEditingKey] = useState(null);
  const [editForm, setEditForm] = useState({ label: '', priority: 0, isActive: true, apiKey: '', showKey: false });
  const [editLoading, setEditLoading] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterProvider ? { provider: filterProvider } : {};
      const [keysRes, statsRes] = await Promise.all([
        api.get('/api/admin/api-keys', { params }),
        api.get('/api/admin/api-keys/stats'),
      ]);
      setKeys(keysRes.data.keys);
      setStats(statsRes.data.stats);
    } catch {
      setToast({ message: 'Failed to load API keys', visible: true, type: 'error' });
    }
    setLoading(false);
  }, [filterProvider, setToast]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleAdd = async () => {
    if (!form.apiKey.trim()) {
      setToast({ message: 'API key value is required', visible: true, type: 'error' });
      return;
    }
    try {
      await api.post('/api/admin/api-keys', {
        provider: form.provider,
        apiKey: form.apiKey.trim(),
        label: form.label.trim() || null,
        priority: Number(form.priority) || 0,
      });
      setToast({ message: 'API key added', visible: true, type: 'success' });
      setShowAdd(false);
      setForm({ provider: 'groq', apiKey: '', label: '', priority: 0 });
      fetchKeys();
    } catch (err) {
      setToast({ message: err?.response?.data?.error || 'Failed to add key', visible: true, type: 'error' });
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        label: editForm.label.trim() || null,
        priority: Number(editForm.priority) || 0,
        isActive: editForm.isActive,
      };
      // Only send apiKey if user typed a new value (not the masked placeholder)
      const trimmed = editForm.apiKey.trim();
      if (trimmed && !trimmed.includes('*')) {
        payload.apiKey = trimmed;
      }
      await api.patch(`/api/admin/api-keys/${editingKey.id}`, payload);
      setToast({ message: 'API key updated', visible: true, type: 'success' });
      setEditingKey(null);
      fetchKeys();
    } catch {
      setToast({ message: 'Failed to update key', visible: true, type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this API key? This cannot be undone.')) return;
    try {
      await api.delete(`/api/admin/api-keys/${id}`);
      setToast({ message: 'API key deleted', visible: true, type: 'success' });
      fetchKeys();
    } catch {
      setToast({ message: 'Failed to delete key', visible: true, type: 'error' });
    }
  };

  const handleToggleActive = async (key) => {
    try {
      await api.patch(`/api/admin/api-keys/${key.id}`, { isActive: !key.isActive });
      setToast({ message: key.isActive ? 'Key disabled' : 'Key enabled', visible: true, type: 'success' });
      fetchKeys();
    } catch {
      setToast({ message: 'Failed to update key', visible: true, type: 'error' });
    }
  };

  const handleResetFails = async (key) => {
    try {
      await api.post(`/api/admin/api-key-failures/${key.id}/reset`);
      setToast({ message: 'Fail count reset', visible: true, type: 'success' });
      fetchKeys();
    } catch {
      setToast({ message: 'Failed to reset fail count', visible: true, type: 'error' });
    }
  };

  const openEdit = async (key) => {
    setEditingKey(key);
    setEditForm({ label: key.label || '', priority: key.priority, isActive: key.isActive, apiKey: '', showKey: false });
    setEditLoading(true);
    try {
      const { data } = await api.get(`/api/admin/api-keys/${key.id}`);
      setEditForm(f => ({ ...f, apiKey: data.key.apiKeyMasked || '' }));
    } catch {
      // non-fatal — user can still type a new key manually
    }
    setEditLoading(false);
  };

  const providerColor = (p) => {
    const map = {
      groq: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      sambanova: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      anthropic: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      opencode: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      gemini: 'bg-green-500/10 text-green-400 border-green-500/20',
    };
    return map[p] || 'bg-white/5 text-text/50 border-border';
  };

  const failBadge = (count) => {
    if (count === 0) return <span className="text-xs text-green-400">Healthy</span>;
    if (count < 3) return <span className="text-xs text-yellow-400">{count} fail{count > 1 ? 's' : ''}</span>;
    return <span className="text-xs text-red-400">Cooldown ({count})</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Key Management</h1>
          <p className="text-text/50 text-sm mt-1">
            Store multiple keys per provider. Automatic failover when a key fails.
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Key
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {PROVIDERS.map((p) => {
          const s = stats[p] || { total: 0, active: 0, failing: 0 };
          return (
            <div
              key={p}
              onClick={() => setFilterProvider(filterProvider === p ? '' : p)}
              className={`cursor-pointer rounded-xl p-4 border transition-all ${
                filterProvider === p
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-paper hover:border-accent/40'
              }`}
            >
              <p className={`text-xs font-medium capitalize mb-2 px-1.5 py-0.5 rounded border w-fit ${providerColor(p)}`}>{p}</p>
              <p className="text-xl font-bold">{s.active}<span className="text-text/30 text-sm font-normal">/{s.total}</span></p>
              <p className="text-xs text-text/40 mt-0.5">
                {s.failing > 0
                  ? <span className="text-red-400">{s.failing} failing</span>
                  : <span className="text-green-400">All healthy</span>}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-text/50">Filter:</span>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterProvider('')}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              !filterProvider ? 'bg-accent text-white border-accent' : 'border-border text-text/50 hover:text-text'
            }`}
          >
            All
          </button>
          {PROVIDERS.map((p) => (
            <button
              key={p}
              onClick={() => setFilterProvider(filterProvider === p ? '' : p)}
              className={`text-xs px-3 py-1 rounded-full border transition-all capitalize ${
                filterProvider === p ? 'bg-accent text-white border-accent' : 'border-border text-text/50 hover:text-text'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button onClick={fetchKeys} className="ml-auto text-xs text-text/40 hover:text-text transition-colors flex items-center gap-1">
          <Activity size={12} /> Refresh
        </button>
      </div>

      {/* Keys table */}
      <div className="bg-paper border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text/50 text-xs uppercase tracking-wider">
                <th className="text-left p-4">Provider</th>
                <th className="text-left p-4">Label</th>
                <th className="text-left p-4">Priority</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Health</th>
                <th className="text-left p-4">Last Used</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className={`border-b border-border/50 transition-colors ${k.isActive ? 'hover:bg-white/[0.02]' : 'opacity-50'}`}>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 rounded border capitalize font-medium ${providerColor(k.provider)}`}>
                      {k.provider}
                    </span>
                  </td>
                  <td className="p-4 text-text/70 max-w-[160px] truncate">
                    {k.label || <span className="text-text/30 italic">No label</span>}
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-mono bg-black/30 px-2 py-0.5 rounded border border-border">
                      {k.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(k)}
                      title={k.isActive ? 'Click to disable' : 'Click to enable'}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                        k.isActive
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20'
                      }`}
                    >
                      {k.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="p-4">{failBadge(k.failCount)}</td>
                  <td className="p-4 text-text/40 text-xs">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : '—'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {k.failCount > 0 && (
                        <button
                          onClick={() => handleResetFails(k)}
                          title="Reset fail count"
                          className="p-1.5 rounded-lg hover:bg-green-500/10 text-text/30 hover:text-green-400 transition-all"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(k)}
                        className="p-1.5 rounded-lg hover:bg-accent/10 text-text/30 hover:text-accent transition-all"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(k.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-text/30 hover:text-red-400 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full" />
          </div>
        )}
        {!loading && keys.length === 0 && (
          <div className="text-center py-12">
            <Key size={32} className="text-text/20 mx-auto mb-3" />
            <p className="text-text/30 text-sm">No API keys found.</p>
            <p className="text-text/20 text-xs mt-1">Add a key to get started, or check your .env file for fallback keys.</p>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-sm text-text/60 space-y-1">
        <p className="font-medium text-text/80 flex items-center gap-2"><Key size={14} className="text-accent" /> How failover works</p>
        <p>Keys are tried in order of <strong className="text-text/80">priority</strong> (highest first). Same-priority keys are randomly selected for load balancing.</p>
        <p>After <strong className="text-text/80">3 consecutive failures</strong>, a key enters a 5-minute cooldown. Success resets the fail count immediately.</p>
        <p>Environment variable keys in <code className="text-accent text-xs">.env</code> are always used as a final fallback.</p>
      </div>

      {/* Add key modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add API Key">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-text/50 uppercase tracking-wider mb-1.5">Provider</label>
            <select
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-text text-sm outline-none focus:border-accent transition-colors capitalize"
            >
              {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text/50 uppercase tracking-wider mb-1.5">API Key <span className="text-red-400">*</span></label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder="Paste your API key here..."
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-text text-sm outline-none focus:border-accent transition-colors font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-text/50 uppercase tracking-wider mb-1.5">Label <span className="text-text/30">(optional)</span></label>
            <input
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Production Key 1, Backup Key..."
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-text text-sm outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-text/50 uppercase tracking-wider mb-1.5">
              Priority <span className="text-text/30">(higher = tried first, default 0)</span>
            </label>
            <input
              type="number"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              min={0}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-text text-sm outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd}><Plus size={14} /> Add Key</Button>
          </div>
        </div>
      </Modal>

      {/* Edit key modal */}
      <Modal open={!!editingKey} onClose={() => { setEditingKey(null); }} title="Edit API Key" className="!max-w-[493px]" contentClassName="!pt-7 !pb-10">
        {editingKey && (
          <div className="space-y-4">
            {/* Key info header */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-border">
              <span className={`text-xs px-2 py-0.5 rounded border capitalize font-medium ${providerColor(editingKey.provider)}`}>
                {editingKey.provider}
              </span>
              <span className="text-xs text-text/40 font-mono">ID: {editingKey.id.slice(0, 12)}…</span>
              <span className="ml-auto text-xs text-text/30">Added {new Date(editingKey.createdAt).toLocaleDateString()}</span>
            </div>

            {/* API Key value */}
            <div>
              <label className="block text-xs text-text/50 uppercase tracking-wider mb-1.5">
                API Key Value
                <span className="ml-2 normal-case text-text/30 font-normal">— clear and type a new value to replace</span>
              </label>
              <div className="relative">
                {editLoading ? (
                  <div className="w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-text/30 text-sm flex items-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-3 h-3 border border-accent/30 border-t-accent rounded-full shrink-0" />
                    Loading…
                  </div>
                ) : (
                  <textarea
                    rows={5}
                    value={editForm.showKey ? editForm.apiKey : editForm.apiKey.replace(/./g, '•')}
                    onChange={(e) => setEditForm((f) => ({ ...f, apiKey: e.target.value }))}
                    placeholder="Paste new API key to replace existing…"
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-text text-sm outline-none focus:border-accent transition-colors font-mono resize-none"
                    spellCheck={false}
                    autoComplete="off"
                  />
                )}
                {!editLoading && (
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditForm(f => ({ ...f, showKey: !f.showKey }))}
                      className="text-xs text-text/30 hover:text-text transition-colors px-1.5 py-0.5 rounded bg-black/40"
                    >
                      {editForm.showKey ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm(f => ({ ...f, apiKey: '' }))}
                      className="text-xs text-text/30 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded bg-black/40"
                      title="Clear"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-text/30 mt-1">
                {editForm.apiKey.includes('*')
                  ? 'Showing masked current key. Clear the field and paste a new key to replace it.'
                  : editForm.apiKey
                    ? <span className="text-yellow-400">New key will be saved on submit.</span>
                    : 'Field is empty — existing key will be kept unchanged.'}
              </p>
            </div>

            {/* Label */}
            <div>
              <label className="block text-xs text-text/50 uppercase tracking-wider mb-1.5">Label</label>
              <input
                value={editForm.label}
                onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Production Key 1"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-text text-sm outline-none focus:border-accent transition-colors"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs text-text/50 uppercase tracking-wider mb-1.5">
                Priority <span className="text-text/30 normal-case font-normal">(higher = tried first)</span>
              </label>
              <input
                type="number"
                value={editForm.priority}
                onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value }))}
                min={0}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-border text-text text-sm outline-none focus:border-accent transition-colors"
              />
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-2 text-sm text-text/70 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded accent-accent"
              />
              Key is active
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditingKey(null)}>Cancel</Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function UsageLogsTab({ setToast }) {
  const PROVIDERS = ['groq', 'sambanova', 'anthropic', 'opencode', 'gemini'];

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterProvider, setFilterProvider] = useState('');
  const [filterSuccess, setFilterSuccess] = useState('');
  const [viewingLog, setViewingLog] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setToast({ message: 'Copied to clipboard', visible: true, type: 'info' });
    }).catch(() => {});
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (filterProvider) params.provider = filterProvider;
      if (filterSuccess) params.success = filterSuccess;
      const { data } = await api.get('/api/admin/api-key-usage', { params });
      setLogs(data.logs);
      setTotal(data.total);
    } catch {
      setToast({ message: 'Failed to load usage logs', visible: true, type: 'error' });
    }
    setLoading(false);
  }, [page, filterProvider, filterSuccess, setToast]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/api-key-usage/stats');
      setStats(data);
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const providerColor = (p) => {
    const map = {
      groq: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      sambanova: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      anthropic: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      opencode: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      gemini: 'bg-green-500/10 text-green-400 border-green-500/20',
    };
    return map[p] || 'bg-white/5 text-text/50 border-border';
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usage Logs</h1>
          <p className="text-text/50 text-sm mt-1">
            Complete audit trail of <span className="text-accent">{total.toLocaleString()}</span> API requests
          </p>
        </div>
        <button onClick={() => { fetchLogs(); fetchStats(); }} className="flex items-center gap-1.5 text-xs text-text/40 hover:text-text transition-colors">
          <Activity size={13} /> Refresh
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-paper border border-border rounded-xl p-4">
            <p className="text-xs text-text/40 uppercase tracking-wider mb-1">Total Requests</p>
            <p className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</p>
          </div>
          <div className="bg-paper border border-green-500/20 rounded-xl p-4">
            <p className="text-xs text-text/40 uppercase tracking-wider mb-1">Successful</p>
            <p className="text-2xl font-bold text-green-400">{stats.successfulRequests.toLocaleString()}</p>
          </div>
          <div className="bg-paper border border-red-500/20 rounded-xl p-4">
            <p className="text-xs text-text/40 uppercase tracking-wider mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-400">{stats.failedRequests.toLocaleString()}</p>
          </div>
          <div className="bg-paper border border-accent/20 rounded-xl p-4">
            <p className="text-xs text-text/40 uppercase tracking-wider mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-accent">{stats.successRate}%</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-text/40">Provider:</span>
        <div className="flex gap-2">
          <button
            onClick={() => { setFilterProvider(''); setPage(1); }}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${!filterProvider ? 'bg-accent text-white border-accent' : 'border-border text-text/50 hover:text-text'}`}
          >
            All
          </button>
          {PROVIDERS.map(p => (
            <button
              key={p}
              onClick={() => { setFilterProvider(filterProvider === p ? '' : p); setPage(1); }}
              className={`text-xs px-3 py-1 rounded-full border transition-all capitalize ${filterProvider === p ? 'bg-accent text-white border-accent' : 'border-border text-text/50 hover:text-text'}`}
            >
              {p}
            </button>
          ))}
        </div>

        <span className="text-xs text-text/40 ml-4">Status:</span>
        <div className="flex gap-2">
          {[
            { value: '', label: 'All' },
            { value: 'true', label: 'Success' },
            { value: 'false', label: 'Failed' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setFilterSuccess(value); setPage(1); }}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${filterSuccess === value ? 'bg-accent text-white border-accent' : 'border-border text-text/50 hover:text-text'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs table */}
      <div className="bg-paper border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text/50 text-xs uppercase tracking-wider">
                <th className="text-left p-4">Time</th>
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Provider</th>
                <th className="text-left p-4">Use Case</th>
                <th className="text-left p-4">Tokens</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Error</th>
                <th className="text-left p-4">API Key</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const user = log.user;
                return (
                  <tr
                    key={log.id}
                    onClick={() => setViewingLog(log)}
                    className="border-b border-border/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="p-4 text-text/60 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-text/30 shrink-0" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      {user ? (
                        <div>
                          <p className="text-sm font-medium text-text/80">{user.name}</p>
                          <p className="text-xs text-text/40">{user.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-text/30 italic">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {user && (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          user.role === 'admin'
                            ? 'bg-accent/10 text-accent border border-accent/20'
                            : 'bg-white/5 text-text/50 border border-border/50'
                        }`}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded border capitalize font-medium ${providerColor(log.provider)}`}>
                        {log.provider}
                      </span>
                    </td>
                    <td className="p-4 text-text/60 capitalize text-xs">{log.useCase || '—'}</td>
                    <td className="p-4 text-text/60 font-mono text-xs">{log.tokensUsed?.toLocaleString() || '—'}</td>
                    <td className="p-4">
                      {log.success ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1 w-fit">
                          <CheckCircle size={10} /> Success
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 w-fit">
                          <XCircle size={10} /> Failed
                        </span>
                      )}
                    </td>
                    <td className="p-4 max-w-[160px]">
                      {log.success ? (
                        <span className="text-xs text-text/20">—</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertCircle size={11} className="text-red-400 shrink-0" />
                          <span className="text-xs text-red-400/80 truncate block" title={log.errorMsg || ''}>
                            {log.errorMsg || 'Unknown error'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-xs">
                        <span className="font-mono text-text/40">{log.apiKeyId.slice(0, 12)}...</span>
                        {log.apiKey?.label && (
                          <span className="block text-text/30 mt-0.5 truncate max-w-[100px]" title={log.apiKey.label}>
                            {log.apiKey.label}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full" />
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 size={32} className="text-text/20 mx-auto mb-3" />
            <p className="text-text/30 text-sm">No usage logs found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs rounded-lg border border-border text-text/50 hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <span className="text-xs text-text/50">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs rounded-lg border border-border text-text/50 hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!viewingLog} onClose={() => setViewingLog(null)} title="Usage Log Details" className="!max-w-[493px]" contentClassName="max-h-[70vh] overflow-y-auto">
        {viewingLog && (
          <div className="space-y-5">
            {/* Status banner */}
            <div className={`p-4 rounded-lg border ${viewingLog.success ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <div className="flex items-center gap-2">
                {viewingLog.success ? (
                  <CheckCircle size={18} className="text-green-400" />
                ) : (
                  <XCircle size={18} className="text-red-400" />
                )}
                <div>
                  <span className={`text-sm font-medium ${viewingLog.success ? 'text-green-400' : 'text-red-400'}`}>
                    {viewingLog.success ? 'Request Successful' : 'Request Failed'}
                  </span>
                  <p className="text-[11px] text-text/40 mt-0.5">{new Date(viewingLog.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Section: Request Info */}
            <div>
              <p className="text-xs text-text/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Activity size={12} /> Request Info
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-black/20 border border-border">
                  <p className="text-[10px] text-text/40 uppercase tracking-wider mb-1">Provider</p>
                  <span className={`text-xs px-2 py-0.5 rounded border capitalize font-medium ${providerColor(viewingLog.provider)}`}>
                    {viewingLog.provider}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-black/20 border border-border">
                  <p className="text-[10px] text-text/40 uppercase tracking-wider mb-1">Use Case</p>
                  <p className="text-text/80 capitalize text-xs">{viewingLog.useCase || '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-black/20 border border-border">
                  <p className="text-[10px] text-text/40 uppercase tracking-wider mb-1">Tokens Used</p>
                  <p className="text-text/80 font-mono text-xs">{viewingLog.tokensUsed?.toLocaleString() || '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-black/20 border border-border">
                  <p className="text-[10px] text-text/40 uppercase tracking-wider mb-1">Created</p>
                  <p className="text-text/60 text-xs">{new Date(viewingLog.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Section: User Details */}
            <div>
              <p className="text-xs text-text/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <User size={12} /> User Details
              </p>
              {viewingLog.user ? (
                <div className="p-4 rounded-lg bg-black/20 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                      {viewingLog.user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text/80 truncate">{viewingLog.user.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          viewingLog.user.role === 'admin'
                            ? 'bg-accent/10 text-accent border border-accent/20'
                            : 'bg-white/5 text-text/50 border border-border/50'
                        }`}>
                          {viewingLog.user.role}
                        </span>
                      </div>
                      <p className="text-xs text-text/40 truncate">{viewingLog.user.email}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(viewingLog.userId)}
                      className="text-text/20 hover:text-text/60 transition-colors shrink-0"
                      title="Copy user ID"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-black/20 border border-border">
                  <p className="text-xs text-text/30 italic">User info unavailable</p>
                  <p className="text-[11px] font-mono text-text/40 mt-1">ID: {viewingLog.userId}</p>
                </div>
              )}
            </div>

            {/* Section: API Key Details */}
            <div>
              <p className="text-xs text-text/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Key size={12} /> API Key Details
              </p>
              <div className="p-4 rounded-lg bg-black/20 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text/40">Key ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-text/60">{viewingLog.apiKeyId}</span>
                    <button
                      onClick={() => copyToClipboard(viewingLog.apiKeyId)}
                      className="text-text/20 hover:text-text/60 transition-colors"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                {viewingLog.apiKey?.label && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text/40">Label</span>
                    <span className="text-xs text-text/60">{viewingLog.apiKey.label}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text/40">Provider</span>
                  <span className={`text-xs px-2 py-0.5 rounded border capitalize font-medium ${providerColor(viewingLog.provider)}`}>
                    {viewingLog.provider}
                  </span>
                </div>
              </div>
            </div>

            {/* Section: Associated Data */}
            {(viewingLog.promptId || viewingLog.generationId || viewingLog.prompt) && (
              <div>
                <p className="text-xs text-text/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <LinkIcon size={12} /> Associated Data
                </p>
                <div className="space-y-2">
                  {viewingLog.prompt && (
                    <div className="p-3 rounded-lg bg-black/20 border border-border">
                      <p className="text-[10px] text-text/40 uppercase tracking-wider mb-1">Prompt</p>
                      <p className="text-xs text-text/80 font-medium truncate">{viewingLog.prompt.title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-text/40 capitalize">{viewingLog.prompt.useCase}</span>
                        {viewingLog.prompt.tokensUsed && (
                          <span className="text-[10px] text-text/40">{viewingLog.prompt.tokensUsed} tokens</span>
                        )}
                      </div>
                    </div>
                  )}
                  {viewingLog.promptId && !viewingLog.prompt && (
                    <div className="flex items-center justify-between p-2.5 rounded bg-black/20 border border-border">
                      <span className="text-xs text-text/40">Prompt ID</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-text/60">{viewingLog.promptId}</span>
                        <button
                          onClick={() => copyToClipboard(viewingLog.promptId)}
                          className="text-text/20 hover:text-text/60 transition-colors"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                    </div>
                  )}
                  {viewingLog.generationId && (
                    <div className="flex items-center justify-between p-2.5 rounded bg-black/20 border border-border">
                      <span className="text-xs text-text/40">Generation ID</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-text/60">{viewingLog.generationId}</span>
                        <button
                          onClick={() => copyToClipboard(viewingLog.generationId)}
                          className="text-text/20 hover:text-text/60 transition-colors"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section: Error Details */}
            {!viewingLog.success && viewingLog.errorMsg && (
              <div>
                <p className="text-xs text-text/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertCircle size={12} /> Error Details
                </p>
                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                  <p className="text-xs text-red-400 font-mono whitespace-pre-wrap break-words leading-relaxed">
                    {viewingLog.errorMsg}
                  </p>
                </div>
              </div>
            )}

            {/* Section: Raw IDs */}
            <div>
              <p className="text-xs text-text/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Hash size={12} /> Record IDs
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-black/20">
                  <span className="text-text/40">Log ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-text/60">{viewingLog.id}</span>
                    <button
                      onClick={() => copyToClipboard(viewingLog.id)}
                      className="text-text/20 hover:text-text/60 transition-colors"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-black/20">
                  <span className="text-text/40">User ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-text/60">{viewingLog.userId}</span>
                    <button
                      onClick={() => copyToClipboard(viewingLog.userId)}
                      className="text-text/20 hover:text-text/60 transition-colors"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-black/20">
                  <span className="text-text/40">API Key ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-text/60">{viewingLog.apiKeyId}</span>
                    <button
                      onClick={() => copyToClipboard(viewingLog.apiKeyId)}
                      className="text-text/20 hover:text-text/60 transition-colors"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                </div>
                {viewingLog.promptId && (
                  <div className="flex items-center justify-between p-2 rounded bg-black/20">
                    <span className="text-text/40">Prompt ID</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-text/60">{viewingLog.promptId}</span>
                      <button
                        onClick={() => copyToClipboard(viewingLog.promptId)}
                        className="text-text/20 hover:text-text/60 transition-colors"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>
                )}
                {viewingLog.generationId && (
                  <div className="flex items-center justify-between p-2 rounded bg-black/20">
                    <span className="text-text/40">Generation ID</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-text/60">{viewingLog.generationId}</span>
                      <button
                        onClick={() => copyToClipboard(viewingLog.generationId)}
                        className="text-text/20 hover:text-text/60 transition-colors"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ProfileTab({ setToast }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user?.name || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarData, setAvatarData] = useState(undefined);
  const [profileSaving, setProfileSaving] = useState(false);
  const fileInputRef = React.useRef(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  function resizeImage(file, size = 256) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size; canvas.height = size;
          const ctx = canvas.getContext('2d');
          const min = Math.min(img.width, img.height);
          const sx = (img.width - min) / 2;
          const sy = (img.height - min) / 2;
          ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setToast({ message: 'Please select an image file', visible: true, type: 'error' }); return; }
    if (file.size > 5 * 1024 * 1024) { setToast({ message: 'Image must be under 5 MB', visible: true, type: 'error' }); return; }
    try {
      const dataUrl = await resizeImage(file, 256);
      setAvatarPreview(dataUrl);
      setAvatarData(dataUrl);
    } catch { setToast({ message: 'Failed to process image', visible: true, type: 'error' }); }
    e.target.value = '';
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) { setToast({ message: 'Name cannot be empty', visible: true, type: 'error' }); return; }
    setProfileSaving(true);
    try {
      const payload = { name: name.trim() };
      if (avatarData !== undefined) payload.avatar = avatarData;
      const { data } = await api.patch('/api/auth/profile', payload);
      setUser(data.user);
      setAvatarData(undefined);
      setToast({ message: 'Profile updated', visible: true, type: 'success' });
    } catch (err) {
      setToast({ message: err?.response?.data?.error || 'Failed to save profile', visible: true, type: 'error' });
    }
    setProfileSaving(false);
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { setToast({ message: 'All password fields are required', visible: true, type: 'error' }); return; }
    if (newPassword !== confirmPassword) { setToast({ message: 'New passwords do not match', visible: true, type: 'error' }); return; }
    setPasswordSaving(true);
    try {
      await api.patch('/api/auth/profile', { currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setToast({ message: 'Password changed successfully', visible: true, type: 'success' });
    } catch (err) {
      setToast({ message: err?.response?.data?.error || 'Failed to change password', visible: true, type: 'error' });
    }
    setPasswordSaving(false);
  };

  const initials = (user?.name || user?.email || 'A').charAt(0).toUpperCase();
  const profileDirty = name.trim() !== (user?.name || '') || avatarData !== undefined;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Admin Profile</h1>
        <p className="text-text/50 text-sm mt-1">Manage your admin account details and security.</p>
      </div>

      {/* Profile card */}
      <div className="bg-paper border border-border rounded-xl p-6 space-y-6">
        <h3 className="text-sm font-medium text-text/50 uppercase tracking-wider">Profile</h3>

        {/* Avatar + name header */}
        <div className="flex items-center gap-5">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-accent/20 flex items-center justify-center">
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-accent">{initials}</span>}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Camera size={20} className="text-white" />
            </button>
            {avatarPreview && (
              <button
                onClick={() => { setAvatarPreview(null); setAvatarData(null); }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-bg flex items-center justify-center hover:bg-red-400 transition-colors"
              >
                <X size={10} className="text-white" />
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Profile photo</p>
            <p className="text-xs text-text/40">JPG, PNG or GIF · max 5 MB</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-accent/50 hover:text-accent transition-all text-text/60"
            >
              Upload photo
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Name + email fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text/70 mb-1.5">Full name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-black/30 border border-border text-text text-sm outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-text/70 mb-1.5">Email address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" />
              <input
                value={user?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-black/30 border border-border text-text/40 text-sm outline-none cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-text/30 mt-1">Email cannot be changed</p>
          </div>
        </div>

        <Button onClick={handleSaveProfile} disabled={!profileDirty || profileSaving}>
          {profileSaving ? 'Saving…' : <><Check size={14} /> Save profile</>}
        </Button>
      </div>

      {/* Password card */}
      <div className="bg-paper border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-medium text-text/50 uppercase tracking-wider">Change Password</h3>

        {[
          { label: 'Current password', value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
          { label: 'New password', value: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(v => !v) },
          { label: 'Confirm new password', value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v), mismatch: confirmPassword && confirmPassword !== newPassword },
        ].map(({ label, value, set, show, toggle, mismatch }) => (
          <div key={label}>
            <label className="block text-sm text-text/70 mb-1.5">{label}</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={(e) => set(e.target.value)}
                className={`w-full px-3 py-2.5 pr-10 rounded-lg bg-black/30 border text-text text-sm outline-none focus:border-accent transition-colors ${mismatch ? 'border-red-500/50' : 'border-border'}`}
              />
              <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-text/30 hover:text-text transition-colors">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {mismatch && <p className="text-xs text-red-400 mt-1">Passwords do not match</p>}
          </div>
        ))}

        <Button
          onClick={handleSavePassword}
          disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
        >
          {passwordSaving ? 'Changing…' : 'Change password'}
        </Button>
      </div>
    </div>
  );
}
