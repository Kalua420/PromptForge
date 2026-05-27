import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trash2, FileText, Sparkles } from 'lucide-react';
import Sidebar from '../../components/Sidebar.jsx';
import Card from '../../components/Card.jsx';
import PromptCard from '../../components/PromptCard.jsx';
import Loader from '../../components/Loader.jsx';
import Toast from '../../components/Toast.jsx';
import api from '../../utils/api.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Favorites() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', visible: false, type: 'info' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadFavorites();
  }, [user, navigate]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/favorites');
      setFavorites(data || []);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      setToast({ message: 'Failed to load favorites', visible: true, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = useCallback(async (promptId) => {
    try {
      await api.delete(`/api/favorites/${promptId}`);
      setFavorites((prev) => prev.filter((p) => p.id !== promptId));
      setToast({ message: 'Removed from favorites', visible: true, type: 'success' });
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      setToast({ message: 'Failed to remove favorite', visible: true, type: 'error' });
    }
  }, []);

  const handleDelete = useCallback(async (promptId) => {
    if (!confirm('Delete this prompt? This will also remove it from favorites.')) return;
    
    try {
      await api.delete(`/api/prompts/${promptId}`);
      setFavorites((prev) => prev.filter((p) => p.id !== promptId));
      setToast({ message: 'Prompt deleted', visible: true, type: 'success' });
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      setToast({ message: 'Failed to delete prompt', visible: true, type: 'error' });
    }
  }, []);

  const handleSelect = useCallback((prompt) => {
    navigate('/workspace', { state: { templateContent: prompt.content } });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Sidebar />
        <div className={`${sidebarOpen ? 'ml-64' : 'ml-0'} p-4 md:p-8 transition-all`}>
          <Loader text="Loading your favorites..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg bg-grid">
      <Sidebar />
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-0'} p-4 md:p-8 transition-all duration-300`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 mb-4"
            >
              <Star size={32} className="text-yellow-400" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-3"
            >
              <span className="text-gradient">Favorite Prompts</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-text/70 max-w-2xl mx-auto"
            >
              Your starred prompts for quick access
            </motion.p>
          </div>

          {/* Stats */}
          {favorites.length > 0 && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mb-8"
            >
              <Card>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                      <Star size={20} className="text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-text/50">Total Favorites</p>
                      <p className="text-2xl font-bold text-yellow-400">{favorites.length}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text/40">Quick access to your</p>
                    <p className="text-sm text-text/60">most used prompts</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Favorites Grid */}
          {favorites.length > 0 ? (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {favorites.map((prompt) => (
                  <motion.div
                    key={prompt.id}
                    variants={fadeUp}
                    layout
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group"
                  >
                    <div className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleRemoveFavorite(prompt.id)}
                        className="w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-500 flex items-center justify-center shadow-lg transition-colors"
                        title="Remove from favorites"
                      >
                        <Star size={14} className="text-white" fill="currentColor" />
                      </button>
                    </div>
                    <PromptCard
                      prompt={prompt}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                      onFavorite={handleRemoveFavorite}
                      isFavorite={true}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mx-auto mb-6">
                    <Star size={40} className="text-yellow-400/60" />
                  </div>
                  <h3 className="text-xl font-semibold text-text/70 mb-2">No favorites yet</h3>
                  <p className="text-text/40 text-sm mb-8 max-w-md mx-auto">
                    Star your favorite prompts to quickly access them here. Click the star icon on any prompt card to add it to your favorites.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => navigate('/workspace')}
                      className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-accent transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles size={18} />
                      Create a Prompt
                    </button>
                    <button
                      onClick={() => navigate('/templates')}
                      className="px-6 py-3 rounded-xl bg-white/5 text-text hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText size={18} />
                      Browse Templates
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Toast */}
      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
}
