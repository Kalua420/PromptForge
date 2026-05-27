import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Eye, EyeOff, Check, User } from 'lucide-react';
import Sidebar from '../../components/Sidebar.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Tabs from '../../components/Tabs.jsx';
import Toast from '../../components/Toast.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import api from '../../utils/api.js';

const tabs = ['Profile', 'Password', 'Theme'];

// Resize + crop an image file to a square data URL
function resizeImage(file, size = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        // Crop to square from center
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

export default function Settings() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const [activeTab, setActiveTab] = useState('Profile');
  const [toast, setToast] = useState({ message: '', visible: false, type: 'info' });

  // Profile tab state
  const [name, setName] = useState(user?.name || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarData, setAvatarData] = useState(undefined); // undefined = no change
  const [profileSaving, setProfileSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Password tab state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  React.useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  // ── Avatar handling ──────────────────────────────────────────────
  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select an image file', visible: true, type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Image must be under 5 MB', visible: true, type: 'error' });
      return;
    }
    try {
      const dataUrl = await resizeImage(file, 256);
      setAvatarPreview(dataUrl);
      setAvatarData(dataUrl);
    } catch {
      setToast({ message: 'Failed to process image', visible: true, type: 'error' });
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, []);

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarData(null); // null = explicitly clear
  };

  // ── Profile save ─────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setToast({ message: 'Name cannot be empty', visible: true, type: 'error' });
      return;
    }
    setProfileSaving(true);
    try {
      const payload = { name: name.trim() };
      if (avatarData !== undefined) payload.avatar = avatarData; // include only if changed
      const { data } = await api.patch('/api/auth/profile', payload);
      setUser(data.user);
      setAvatarData(undefined); // reset dirty flag
      setToast({ message: 'Profile updated', visible: true, type: 'success' });
    } catch (err) {
      setToast({ message: err?.response?.data?.error || 'Failed to save profile', visible: true, type: 'error' });
    }
    setProfileSaving(false);
  };

  // ── Password save ────────────────────────────────────────────────
  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setToast({ message: 'All password fields are required', visible: true, type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ message: 'New passwords do not match', visible: true, type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setToast({ message: 'New password must be at least 8 characters', visible: true, type: 'error' });
      return;
    }
    setPasswordSaving(true);
    try {
      await api.patch('/api/auth/profile', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToast({ message: 'Password changed successfully', visible: true, type: 'success' });
    } catch (err) {
      setToast({ message: err?.response?.data?.error || 'Failed to change password', visible: true, type: 'error' });
    }
    setPasswordSaving(false);
  };

  const initials = (user?.name || user?.email || '?').charAt(0).toUpperCase();
  const profileDirty = name.trim() !== (user?.name || '') || avatarData !== undefined;

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-0'} p-4 md:p-8 transition-all`}>
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="overflow-x-auto">
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="mt-8 max-w-lg">

          {/* ── Profile tab ── */}
          {activeTab === 'Profile' && (
            <div className="space-y-6">
              {/* Avatar section */}
              <div className="flex items-center gap-5">
                <div className="relative group shrink-0">
                  {/* Avatar circle */}
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-accent/20 flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-accent">{initials}</span>
                    )}
                  </div>

                  {/* Upload overlay */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Upload photo"
                  >
                    <Camera size={20} className="text-white" />
                  </button>

                  {/* Remove badge */}
                  {avatarPreview && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-bg flex items-center justify-center hover:bg-red-400 transition-colors"
                      title="Remove photo"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Profile photo</p>
                  <p className="text-xs text-text/40">JPG, PNG or GIF · max 5 MB · cropped to square</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-accent/50 hover:text-accent transition-all text-text/60"
                    >
                      Upload photo
                    </button>
                    {avatarPreview && (
                      <button
                        onClick={handleRemoveAvatar}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-red-500/50 hover:text-red-400 transition-all text-text/60"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Name + email */}
              <div className="space-y-4">
                <Input
                  label="Display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
                <div className="flex flex-col gap-1.5">
                  <Input
                    label="Email"
                    value={user?.email || ''}
                    disabled
                  />
                  <p className="text-xs text-text/40">Email cannot be changed</p>
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={!profileDirty || profileSaving}
                className="w-full"
              >
                {profileSaving ? 'Saving…' : (
                  <><Check size={14} /> Save profile</>
                )}
              </Button>
            </div>
          )}

          {/* ── Password tab ── */}
          {activeTab === 'Password' && (
            <div className="space-y-4">
              <p className="text-sm text-text/50">Change your account password. You'll need your current password to confirm.</p>

              <div className="space-y-4">
                {/* Current password */}
                <div>
                  <label className="block text-xs text-text/50 uppercase tracking-wider mb-1.5">Current password</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3 py-2 pr-10 rounded-lg bg-black/30 border border-border text-text text-sm outline-none focus:border-accent transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text/30 hover:text-text transition-colors"
                    >
                      {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-xs text-text/50 uppercase tracking-wider mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 chars, upper + lower + number"
                      className="w-full px-3 py-2 pr-10 rounded-lg bg-black/30 border border-border text-text text-sm outline-none focus:border-accent transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text/30 hover:text-text transition-colors"
                    >
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm new password */}
                <div>
                  <label className="block text-xs text-text/50 uppercase tracking-wider mb-1.5">Confirm new password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className={`w-full px-3 py-2 pr-10 rounded-lg bg-black/30 border text-text text-sm outline-none focus:border-accent transition-colors ${
                        confirmPassword && confirmPassword !== newPassword
                          ? 'border-red-500/50'
                          : 'border-border'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text/30 hover:text-text transition-colors"
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSavePassword}
                disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full"
              >
                {passwordSaving ? 'Changing…' : 'Change password'}
              </Button>
            </div>
          )}

          {/* ── Theme tab ── */}
          {activeTab === 'Theme' && (
            <div className="p-4 rounded-lg border border-border bg-black/20">
              <p className="text-sm text-text/60">Dark theme is enabled by default. Light theme coming soon.</p>
            </div>
          )}
        </div>
      </div>
      <Toast {...toast} onClose={() => setToast((t) => ({ ...t, visible: false }))} />
    </div>
  );
}
