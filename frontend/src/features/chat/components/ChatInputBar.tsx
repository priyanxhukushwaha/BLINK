import React, { useEffect, useRef, useState } from 'react';
import { Send, Image, Plus, X, AlertCircle } from 'lucide-react';

interface ChatInputBarProps {
  onSendMessage: (text: string, photo?: File) => void;
  disabled?: boolean;
}

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB limit

interface SelectedPhoto {
  file: File;
  previewUrl: string;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<SelectedPhoto | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const clearPhoto = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setSelectedPhoto(null);
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !selectedPhoto) return;

    onSendMessage(trimmed, selectedPhoto?.file);
    setText('');
    clearPhoto();
    setFileError(null);
    setShowAttachMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileError('Invalid file type: Please select an image file (PNG, JPG, WebP).');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setFileError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Limit is 2 MB.`);
      e.target.value = '';
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setSelectedPhoto({ file, previewUrl });

    e.target.value = '';
  };

  return (
    <div className="relative w-full px-4 pb-4 pt-1 z-30 pointer-events-auto">
      {/* File Error Notification */}
      {fileError && (
        <div className="mb-2 p-2.5 rounded-2xl bg-rose-950/80 border border-rose-500/30 flex items-center justify-between text-xs text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{fileError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFileError(null)}
            className="p-1 rounded-full text-rose-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selected Photo Preview before sending */}
      {selectedPhoto && (
        <div className="relative mb-2 inline-block rounded-2xl overflow-hidden border border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.35)] animate-fade-in">
          <img
            src={selectedPhoto.previewUrl}
            alt="Preview"
            className="w-20 h-20 object-cover"
          />
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-black"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Expandable Attachment Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-16 left-4 z-40 p-2 rounded-2xl bg-[#14062a]/95 backdrop-blur-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col gap-1.5 min-w-[200px] animate-fade-in">
          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
              setShowAttachMenu(false);
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-200 hover:text-white hover:bg-purple-900/40 transition-colors"
          >
            <Image className="w-4 h-4 text-cyan-400" />
            <span>Upload Photo (&le; 2 MB)</span>
          </button>
        </div>
      )}

      {/* Hidden file input strictly filtering image/* */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Input Row */}
      <div className="flex items-center gap-2">
        {/* Quick Attach Button (+) */}
        <button
          type="button"
          onClick={() => setShowAttachMenu((prev) => !prev)}
          aria-label="Add attachment"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/[0.09] hover:bg-white/[0.09] hover:border-purple-400/40 text-purple-200 hover:text-white transition-all duration-200 flex-shrink-0 active:scale-95"
        >
          <Plus className={`w-5 h-5 transition-transform duration-200 ${showAttachMenu ? 'rotate-45 text-cyan-400' : ''}`} />
        </button>

        {/* Text Input Pill */}
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#120626]/80 backdrop-blur-xl border border-purple-500/20 shadow-[0_0_20px_rgba(0,0,0,0.5)] focus-within:border-purple-400/50 transition-all">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            className="w-full bg-transparent text-sm text-white placeholder-purple-300/40 outline-none"
          />

          {/* Photo quick trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Choose photo"
            className="p-1 rounded-full text-purple-300/50 hover:text-purple-200 transition-colors"
            title="Attach photo (&le; 2 MB)"
          >
            <Image className="w-4 h-4" />
          </button>
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !selectedPhoto)}
          aria-label="Send message"
          className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-violet-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.55)] hover:shadow-[0_0_30px_rgba(168,85,247,0.8)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:shadow-none transition-all duration-300 flex-shrink-0"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </div>
    </div>
  );
};
