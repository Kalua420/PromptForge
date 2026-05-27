import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Copy, CornerUpLeft, User as UserIcon, Plus, Edit2, Check, X, Star, Sparkles, Send, StopCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar.jsx';
import Toast from '../../components/Toast.jsx';
import InsufficientCreditsModal from '../../components/InsufficientCreditsModal.jsx';
import ConversationCard from '../../components/ConversationCard.jsx';
import api from '../../utils/api.js';
import { useConversationStore } from '../../stores/conversationStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import { useCreditStore } from '../../stores/creditStore.js';
import { USE_CASES, PROVIDERS, TEXTAREA_LINE_HEIGHT, MAX_TEXTAREA_ROWS, MIN_TEXTAREA_ROWS, CREDIT_COSTS } from '../../utils/constants.js';

function flattenConversation(conversation) {
  const msgs = [];
  for (const prompt of (conversation.prompts || [])) {
    msgs.push({
      role: 'user',
      content: prompt.content,
      useCase: prompt.useCase,
      provider: prompt.provider,
      promptId: prompt.id,
      createdAt: prompt.createdAt,
    });
    for (const gen of (prompt.generations || [])) {
      msgs.push({
        role: 'assistant',
        content: gen.content,
        generationId: gen.id,
        promptId: prompt.id,
        createdAt: gen.createdAt,
      });
    }
  }
  return msgs;
}

export default function Workspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState(location.state?.templateContent || location.state?.promptContent || '');
  const [useCase, setUseCase] = useState('chatbot');
  const [provider, setProvider] = useState('');
  const [providers, setProviders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState({ message: '', visible: false, type: 'info' });
  const [initialLoading, setInitialLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [sendingPrompt, setSendingPrompt] = useState(false);
  const [insufficientCreditsModal, setInsufficientCreditsModal] = useState({ isOpen: false, balance: 0, required: 0, provider: '' });
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const titleInputRef = useRef(null);
  const loadingConversationRef = useRef(null);

  const { conversations, currentConversation, setConversations, setCurrentConversation, addConversation, removeConversation, updateConversation } = useConversationStore();
  const { setBalance } = useCreditStore();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const messagesEnd = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const minHeight = TEXTAREA_LINE_HEIGHT * MIN_TEXTAREA_ROWS;
    const maxHeight = TEXTAREA_LINE_HEIGHT * MAX_TEXTAREA_ROWS;
    
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const { data } = await api.get('/api/favorites');
        setFavoriteIds(new Set((data || []).map(p => p.id)));
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    };
    
    const user = useAuthStore.getState().user;
    if (user) {
      loadFavorites();
    }
  }, []);

  useEffect(() => {
    // Check authentication
    const user = useAuthStore.getState().user;
    if (!user) {
      navigate('/login');
      return;
    }

    const convId = location.state?.conversationId || localStorage.getItem('currentConversationId');
    
    // Get auth token for Socket.IO
    const token = useAuthStore.getState().accessToken;
    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
    
    // Socket connection handlers
    s.on('connect', () => {
      setSocketConnected(true);
      setToast({ message: 'Connected', visible: true, type: 'success' });
    });

    s.on('disconnect', () => {
      setSocketConnected(false);
      setToast({ message: 'Disconnected from server', visible: true, type: 'error' });
    });

    s.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
      setToast({ message: 'Connection error. Retrying...', visible: true, type: 'error' });
    });

    s.on('reconnect', () => {
      setSocketConnected(true);
      setToast({ message: 'Reconnected', visible: true, type: 'success' });
    });

    s.on('reconnect_failed', () => {
      setToast({ message: 'Failed to reconnect. Please refresh the page.', visible: true, type: 'error' });
    });
    
    setSocket(s);

    Promise.all([
      api.get('/api/conversations'),
      convId ? api.get(`/api/conversations/${convId}`).catch(() => null) : Promise.resolve(null),
    ]).then(([convList, loaded]) => {
      const list = convList.data || [];
      setConversations(list);

      if (loaded?.data) {
        // Loaded the specific conversation — has all prompts + generations
        setCurrentConversation(loaded.data);
        setMessages(flattenConversation(loaded.data));
        setInitialLoading(false);
        return;
      }

      if (list.length > 0) {
        // Always fetch the full detail (list only has lastPrompt, not all prompts)
        api.get(`/api/conversations/${list[0].id}`).then(({ data }) => {
          setCurrentConversation(data);
          setMessages(flattenConversation(data));
          setInitialLoading(false);
        }).catch(() => setInitialLoading(false));
      } else {
        api.post('/api/conversations', {}).then(({ data: conv }) => {
          const full = { ...conv, prompts: [] };
          setCurrentConversation(full);
          addConversation(full);
          setMessages([]);
          setInitialLoading(false);
        }).catch(() => setInitialLoading(false));
      }
    }).catch((error) => {
      console.error('Failed to load conversations:', error);
      setToast({ message: 'Failed to load conversations', visible: true, type: 'error' });
      setInitialLoading(false);
    });

    return () => {
      if (s) {
        s.removeAllListeners();
        s.close();
      }
    };
  }, []);

  useEffect(() => {
    if (currentConversation?.id) {
      localStorage.setItem('currentConversationId', currentConversation.id);
    }
  }, [currentConversation?.id]);

  useEffect(() => {
    api.get('/api/auth/providers').then(({ data }) => {
      const list = data.providers || [];
      setProviders(list);
      if (list.length > 0 && !list.includes(provider)) setProvider(list[0]);
      else if (list.length === 0) {
        setProvider('');
        setToast({ message: 'No AI providers configured. Please contact administrator.', visible: true, type: 'error' });
      }
    }).catch(() => {
      setProviders(PROVIDERS);
      setProvider(PROVIDERS[0]);
      setToast({ message: 'Using default providers', visible: true, type: 'info' });
    });
  }, []);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  useEffect(() => {
    if (!socket) return;
    
    const onToken = ({ token }) => setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, content: last.content + token };
      return copy;
    });
    
    const onDone = ({ fullText, generationId }) => {
      setLoading(false);
      setSendingPrompt(false);

      // Update the last assistant message in the display with final text + generationId
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, content: fullText, generationId };
        return copy;
      });

      setToast({ message: 'Generation complete!', visible: true, type: 'success' });

      // Sync conversation state from DB — this is the source of truth.
      // We do NOT call setMessages here to avoid overwriting the streaming
      // display; the messages array is already correct from the optimistic update.
      const convId = useConversationStore.getState().currentConversation?.id;
      if (convId) {
        api.get(`/api/conversations/${convId}`).then(({ data }) => {
          // Guard: only apply if the user hasn't switched to a different conversation
          // while the request was in-flight.
          if (useConversationStore.getState().currentConversation?.id === data.id) {
            setCurrentConversation(data);
          }
        }).catch(() => {});
      }

      // Refresh sidebar conversation list to update lastPrompt preview
      api.get('/api/conversations').then(({ data }) => {
        setConversations(data || []);
      }).catch(console.error);
    };
    
    const onError = ({ error, code, balance, required, provider }) => {
      setLoading(false);
      setSendingPrompt(false);
      setMessages((prev) => {
        const copy = [...prev];
        if (copy[copy.length - 1]?.role === 'assistant')
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: `Error: ${error}` };
        return copy;
      });
      
      // Handle insufficient credits error
      if (code === 'INSUFFICIENT_CREDITS') {
        setInsufficientCreditsModal({
          isOpen: true,
          balance: balance || 0,
          required: required || 0,
          provider: provider || 'unknown',
        });
      } else {
        setToast({ message: error, visible: true, type: 'error' });
      }
    };
    
    const onCreditBalanceUpdated = ({ balance }) => {
      setBalance(balance);
      setToast({ message: `Credits updated: ${balance} remaining`, visible: true, type: 'info' });
    };
    
    socket.on('token', onToken);
    socket.on('done', onDone);
    socket.on('error', onError);
    socket.on('credit_balance_updated', onCreditBalanceUpdated);
    
    return () => {
      socket.off('token', onToken);
      socket.off('done', onDone);
      socket.off('error', onError);
      socket.off('credit_balance_updated', onCreditBalanceUpdated);
    };
  }, [socket, setConversations, setBalance]);

  const loadConversation = useCallback(async (conv) => {
    try {
      // Mark that we're loading this conversation
      loadingConversationRef.current = conv.id;
      
      const { data } = await api.get(`/api/conversations/${conv.id}`);
      
      // Only update if this is still the conversation we want to load
      if (loadingConversationRef.current === conv.id) {
        setCurrentConversation(data);
        setMessages(flattenConversation(data));
        setContent('');
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.focus();
        }
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setToast({ message: 'Failed to load conversation', visible: true, type: 'error' });
    }
  }, [setCurrentConversation]);

  const handleNewConversation = useCallback(async () => {
    try {
      const { data: conv } = await api.post('/api/conversations', {});
      const full = { ...conv, prompts: [] };
      setCurrentConversation(full);
      addConversation(full);
      setMessages([]);
      setContent('');
      if (textareaRef.current) textareaRef.current.focus();
    } catch {
      setToast({ message: 'Failed to create conversation', visible: true, type: 'error' });
    }
  }, [addConversation]);

  const handleDeleteConversation = useCallback(async (id) => {
    try {
      await api.delete(`/api/conversations/${id}`);
      removeConversation(id);
      if (currentConversation?.id === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        if (remaining.length > 0) {
          loadConversation(remaining[0]);
        } else {
          handleNewConversation();
        }
      }
      setToast({ message: 'Conversation deleted', visible: true, type: 'info' });
    } catch {
      setToast({ message: 'Failed to delete conversation', visible: true, type: 'error' });
    }
  }, [currentConversation, conversations, loadConversation, handleNewConversation, removeConversation]);

  const handleRenameConversation = useCallback(async (id, newTitle) => {
    try {
      await api.patch(`/api/conversations/${id}`, { title: newTitle });
      updateConversation(id, { title: newTitle });
      if (currentConversation?.id === id) {
        setCurrentConversation((prev) => ({ ...prev, title: newTitle }));
      }
      setToast({ message: 'Conversation renamed', visible: true, type: 'success' });
    } catch {
      setToast({ message: 'Failed to rename conversation', visible: true, type: 'error' });
    }
  }, [currentConversation, updateConversation, setCurrentConversation]);

  const handleStartTitleEdit = () => {
    setTempTitle(convTitle);
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleSaveTitleEdit = async () => {
    const newTitle = tempTitle.trim();
    if (newTitle && newTitle !== convTitle && currentConversation) {
      await handleRenameConversation(currentConversation.id, newTitle);
    }
    setEditingTitle(false);
  };

  const handleCancelTitleEdit = () => {
    setEditingTitle(false);
    setTempTitle('');
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitleEdit();
    } else if (e.key === 'Escape') {
      handleCancelTitleEdit();
    }
  };

  const handleSend = useCallback(async () => {
    const text = content.trim();
    if (!text || loading || sendingPrompt || !provider || !currentConversation || !socketConnected) return;
    
    setSendingPrompt(true);
    setContent('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Optimistically add user + empty assistant bubble to the display
    setMessages((prev) => [...prev, { role: 'user', content: text, useCase, provider }, { role: 'assistant', content: '' }]);
    setLoading(true);

    const title = text.split('\n')[0].slice(0, 80) || 'Untitled';
    try {
      const { data: prompt } = await api.post('/api/prompts', {
        title, content: text, useCase, provider,
        conversationId: currentConversation.id,
      });

      // Optimistically add the new prompt to currentConversation.prompts
      // so the store always reflects the latest state without waiting for a GET roundtrip.
      const current = useConversationStore.getState().currentConversation;
      if (current) {
        setCurrentConversation({
          ...current,
          prompts: [...(current.prompts || []), { ...prompt, generations: [] }],
        });
      }

      updateConversation(currentConversation.id, { lastPrompt: { content: text, createdAt: new Date().toISOString() } });

      // Fetch the full conversation in the background so the store eventually has
      // the authoritative prompt list (including any generations that may have
      // been created server-side for earlier prompts).  This is fire-and-forget;
      // the optimistic update above ensures the UI is immediately consistent.
      api.get(`/api/conversations/${currentConversation.id}`).then(({ data }) => {
        // Guard: only apply if the user hasn't switched conversations while the
        // request was in-flight.
        if (useConversationStore.getState().currentConversation?.id === data.id) {
          setCurrentConversation(data);
        }
      }).catch(() => {});

      // Stamp the optimistic user message with the real promptId
      setMessages((prev) => {
        const copy = [...prev];
        const idx = copy.map((m, i) => ({ m, i })).reverse().find(({ m }) => m.role === 'user' && !m.promptId)?.i;
        if (idx !== undefined) copy[idx] = { ...copy[idx], promptId: prompt.id };
        return copy;
      });

      socket?.emit('generate-stream', { promptId: prompt.id, content: text, useCase, provider });
    } catch (error) {
      setLoading(false);
      setSendingPrompt(false);
      setMessages((prev) => { const c = [...prev]; c.splice(c.length - 2, 2); return c; });
      setToast({ message: error?.response?.data?.error || 'Failed to start generation', visible: true, type: 'error' });
    }
  }, [content, useCase, provider, socket, loading, sendingPrompt, currentConversation, socketConnected, updateConversation]);

  const handleRefine = async () => {
    if (!content.trim() || refining || loading || !provider || !currentConversation) return;
    setRefining(true);
    try {
      const { data } = await api.post('/api/prompts/refine', { content, useCase, provider });
      const questionsText = data.questions?.map((q, i) => `${i + 1}. ${q.text}\n   Options: ${q.options?.join(', ')}`).join('\n\n');
      setMessages((prev) => [...prev, { role: 'assistant', content: `Here are some clarifying questions to refine your prompt:\n\n${questionsText || 'No questions returned.'}` }]);
    } catch (error) { 
      setToast({ message: error?.response?.data?.error || 'Failed to refine prompt', visible: true, type: 'error' }); 
    }
    setRefining(false);
  };

  const handleCancel = () => {
    socket?.emit('cancel-generation');
    setLoading(false);
    setSendingPrompt(false);
    setMessages((prev) => {
      const c = [...prev];
      if (c[c.length - 1]?.role === 'assistant' && !c[c.length - 1].content) c.pop();
      if (c[c.length - 1]?.role === 'user' && !c[c.length - 1].promptId) c.pop();
      return c;
    });
    setToast({ message: 'Generation cancelled', visible: true, type: 'info' });
  };

  const handleReloadPrompt = (msg) => {
    setContent(msg.content);
    if (msg.useCase) setUseCase(msg.useCase);
    if (msg.provider) setProvider(msg.provider);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleCopy = async (text) => {
    try { await navigator.clipboard.writeText(text); setToast({ message: 'Copied to clipboard', visible: true, type: 'success' }); }
    catch { setToast({ message: 'Failed to copy', visible: true, type: 'error' }); }
  };

  const handleToggleFavorite = useCallback(async (promptId) => {
    if (!promptId) return;
    
    const isFavorite = favoriteIds.has(promptId);
    
    try {
      if (isFavorite) {
        await api.delete(`/api/favorites/${promptId}`);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(promptId);
          return next;
        });
        setToast({ message: 'Removed from favorites', visible: true, type: 'success' });
      } else {
        await api.post(`/api/favorites/${promptId}`);
        setFavoriteIds((prev) => new Set(prev).add(promptId));
        setToast({ message: 'Added to favorites', visible: true, type: 'success' });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      setToast({ message: 'Failed to update favorite', visible: true, type: 'error' });
    }
  }, [favoriteIds]);

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const convTitle = currentConversation && currentConversation.title !== 'New Conversation'
    ? currentConversation.title
    : (currentConversation?.prompts?.[0]?.content?.slice(0, 60) || 'New Conversation');

  return (
    <div className="min-h-screen bg-bg bg-grid">
      <Sidebar />
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-0'} h-screen flex transition-all`}>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-4 md:px-8 py-3 border-b border-border bg-black/10">
            {editingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  className="flex-1 text-sm bg-black/40 border border-primary/40 rounded-lg px-3 py-1.5 text-text outline-none focus:border-primary"
                  maxLength={100}
                  aria-label="Edit conversation title"
                />
                <button
                  onClick={handleSaveTitleEdit}
                  className="text-green-400 hover:text-green-300 transition-all p-1.5"
                  aria-label="Save title"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={handleCancelTitleEdit}
                  className="text-text/30 hover:text-red-400 transition-all p-1.5"
                  aria-label="Cancel editing"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-medium text-text/70 truncate flex-1">{convTitle}</h2>
                {!socketConnected && (
                  <div className="flex items-center gap-1.5 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md" title="Disconnected from server">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    <span>Reconnecting...</span>
                  </div>
                )}
                {currentConversation && (
                  <button
                    onClick={handleStartTitleEdit}
                    className="text-text/30 hover:text-primary transition-all p-1.5"
                    title="Edit conversation name"
                    aria-label="Edit conversation name"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </>
            )}
            <button
              onClick={handleNewConversation}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
              aria-label="Create new conversation"
            >
              <Plus size={14} /> New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
            {initialLoading ? (
              <div className="flex items-center justify-center h-full">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full" />
              </div>
            ) : messages.length === 0 && !loading ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Bot size={32} className="text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-text/60 mb-2">Start a conversation</h2>
                <p className="text-sm text-text/30 max-w-md">Type your prompt below and press Enter to generate a response.</p>
              </motion.div>
            ) : null}
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={`${msg.promptId || i}-${msg.generationId || i}-${i}`}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot size={16} className="text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[75%] md:max-w-[65%] group ${msg.role === 'user' ? 'order-first' : ''}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-white rounded-br-md cursor-pointer hover:brightness-110 transition-all' : 'bg-black/30 border border-border rounded-bl-md'}`}
                      onClick={msg.role === 'user' ? () => handleReloadPrompt(msg) : undefined}
                    >
                      {msg.content || (msg.role === 'assistant' && i === messages.length - 1 && loading ? (
                        <span className="flex items-center gap-1.5 py-1">
                          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-2 h-2 rounded-full bg-primary" />
                          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="w-2 h-2 rounded-full bg-primary" />
                          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-2 h-2 rounded-full bg-primary" />
                        </span>
                      ) : null)}
                      {!msg.content && msg.role === 'assistant' && i !== messages.length - 1 && (
                        <span className="text-text/30 italic">No content</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {msg.role === 'user' && (
                        <>
                          <button 
                            onClick={() => handleReloadPrompt(msg)} 
                            className="flex items-center gap-1 text-xs text-text/30 hover:text-text transition-colors"
                            aria-label="Reload this prompt"
                          >
                            <CornerUpLeft size={12} /> Load
                          </button>
                          {msg.promptId && (
                            <button 
                              onClick={() => handleToggleFavorite(msg.promptId)} 
                              className={`flex items-center gap-1 text-xs transition-colors ${
                                favoriteIds.has(msg.promptId) 
                                  ? 'text-yellow-400 hover:text-yellow-300' 
                                  : 'text-text/30 hover:text-yellow-400'
                              }`}
                              aria-label={favoriteIds.has(msg.promptId) ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Star size={12} fill={favoriteIds.has(msg.promptId) ? 'currentColor' : 'none'} /> 
                              {favoriteIds.has(msg.promptId) ? 'Favorited' : 'Favorite'}
                            </button>
                          )}
                        </>
                      )}
                      {msg.role === 'assistant' && msg.content && !loading && msg.generationId && (
                        <button 
                          onClick={() => handleCopy(msg.content)} 
                          className="flex items-center gap-1 text-xs text-text/30 hover:text-text transition-colors"
                          aria-label="Copy response to clipboard"
                        >
                          <Copy size={12} /> Copy
                        </button>
                      )}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/10 flex items-center justify-center shrink-0 mt-1">
                      <UserIcon size={16} className="text-accent" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEnd} />
          </div>

          <div className="border-t border-border bg-bg/50 backdrop-blur-xl">
            <div className="px-4 md:px-8 py-3 border-b border-border">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text/40 uppercase tracking-wider whitespace-nowrap">Use Case:</label>
                  <div className="flex gap-1 bg-black/20 rounded-lg p-1 border border-border" role="group" aria-label="Select use case">
                    {USE_CASES.map((u) => (
                      <button
                        key={u}
                        onClick={() => setUseCase(u)}
                        className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-colors duration-100 ${
                          useCase === u
                            ? 'text-white bg-primary'
                            : 'text-text/50 hover:text-text hover:bg-white/[0.04]'
                        }`}
                        aria-label={`Use case: ${u}`}
                        aria-pressed={useCase === u}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text/40 uppercase tracking-wider whitespace-nowrap">Provider:</label>
                  {providers.length > 0 ? (
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-black/20 border border-border text-text hover:bg-black/30 focus:outline-none focus:border-primary transition-colors cursor-pointer"
                      aria-label="Select AI provider"
                    >
                      {providers.map((p) => {
                        const cost = CREDIT_COSTS[p] || 1;
                        return (
                          <option key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)} - {cost} credit{cost > 1 ? 's' : ''}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="text-xs text-red-400 bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20">
                      No providers available
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleRefine()}
                  disabled={refining || loading || !content.trim() || !provider || !currentConversation}
                  className="ml-auto text-xs text-text/40 hover:text-text transition-colors duration-100 flex items-center gap-1.5 disabled:opacity-30 px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
                  aria-label="Refine prompt with AI suggestions"
                >
                  {refining ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full" />
                  ) : <Sparkles size={14} />}
                  Refine
                </button>
              </div>
            </div>
            <div className="p-4 md:px-8">
              <div className="flex gap-3 items-end">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={currentConversation ? "Type your prompt here... (Shift+Enter for new line)" : "Create a conversation to start..."}
                  rows={2}
                  disabled={!currentConversation}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-border text-text placeholder:text-text/25 outline-none focus:border-primary/60 resize-none text-sm disabled:opacity-40 overflow-y-auto"
                  style={{ minHeight: '40px', maxHeight: '200px', transition: 'border-color 0.2s' }}
                  aria-label="Prompt input"
                />
                {loading ? (
                  <button
                    onClick={handleCancel}
                    className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors shrink-0"
                    aria-label="Stop generation"
                  >
                    <StopCircle size={18} className="text-white" />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!content.trim() || !provider || !currentConversation || sendingPrompt || !socketConnected}
                    className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-30 shadow-lg shadow-primary/20 shrink-0"
                    aria-label="Send prompt"
                  >
                    <Send size={18} className="text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-72 border-l border-border overflow-y-auto hidden lg:block bg-black/10 flex flex-col">
          <div className="p-3 border-b border-border">
            <h3 className="text-xs font-medium text-text/40 uppercase tracking-wider">Conversations</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {conversations.map((conv) => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                active={conv.id === currentConversation?.id}
                onSelect={loadConversation}
                onDelete={handleDeleteConversation}
                onRename={handleRenameConversation}
              />
            ))}
            {conversations.length === 0 && !initialLoading && (
              <p className="text-sm text-text/20 italic text-center py-8">No conversations yet</p>
            )}
          </div>
          <div className="p-3 border-t border-border">
            <button
              onClick={handleNewConversation}
              className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg border border-dashed border-border text-text/40 hover:text-text hover:border-primary/40 transition-all"
              aria-label="Create new conversation"
            >
              <Plus size={14} /> New conversation
            </button>
          </div>
        </div>
      </div>
      <Toast {...toast} onClose={() => setToast((t) => ({ ...t, visible: false }))} />
      <InsufficientCreditsModal
        isOpen={insufficientCreditsModal.isOpen}
        onClose={() => setInsufficientCreditsModal({ isOpen: false, balance: 0, required: 0, provider: '' })}
        balance={insufficientCreditsModal.balance}
        required={insufficientCreditsModal.required}
        provider={insufficientCreditsModal.provider}
      />
    </div>
  );
}
