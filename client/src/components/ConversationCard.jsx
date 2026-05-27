import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Trash2, Edit2, Check, X } from 'lucide-react';

export default function ConversationCard({ conversation, active, onSelect, onDelete, onRename }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const inputRef = useRef(null);

  const title = conversation.title === 'New Conversation'
    ? (conversation.lastPrompt?.content?.slice(0, 60) || 'New Conversation')
    : conversation.title;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setEditTitle(title);
    setIsEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e?.stopPropagation();
    const newTitle = editTitle.trim();
    if (newTitle && newTitle !== title && onRename) {
      await onRename(conversation.id, newTitle);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditTitle('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit(e);
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div
        onClick={() => !isEditing && onSelect?.(conversation)}
        className={`group flex items-start gap-2.5 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
          active
            ? 'bg-primary/10 border border-primary/20'
            : 'hover:bg-white/[0.03] border border-transparent'
        }`}
      >
        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          active ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text/40'
        }`}>
          <MessageSquare size={15} />
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-sm bg-black/40 border border-primary/40 rounded px-2 py-1 text-text outline-none focus:border-primary"
              maxLength={100}
            />
          ) : (
            <p className={`text-sm truncate ${active ? 'text-primary font-medium' : 'text-text'}`}>{title}</p>
          )}
          {!isEditing && conversation.lastPrompt && (
            <p className="text-xs text-text/30 truncate mt-0.5">{conversation.lastPrompt.content?.slice(0, 80)}</p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="text-green-400 hover:text-green-300 transition-all p-1"
              >
                <Check size={14} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="text-text/30 hover:text-red-400 transition-all p-1"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              {onRename && (
                <button
                  onClick={handleStartEdit}
                  className="opacity-0 group-hover:opacity-100 text-text/30 hover:text-primary transition-all p-1"
                >
                  <Edit2 size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(conversation.id); }}
                  className="opacity-0 group-hover:opacity-100 text-text/30 hover:text-red-400 transition-all p-1"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
