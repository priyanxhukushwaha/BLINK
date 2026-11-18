import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Camera,
  Check,
  X,
  Pencil,
  Copy,
  Lock,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  StatusBar,
  BackButton,
  NeonAvatar,
  GlassCard,
  useNavigation,
} from '@/shared';
import { useAuth } from '@/features/auth';
import { useProfile } from '@/features/profile';
import { userApi } from '@/shared/api/endpoints';

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_DISPLAY_NAME_LENGTH = 70;
const MAX_BIO_LENGTH = 320;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const SettingsScreen: React.FC = () => {
  const { goBack } = useNavigation();
  const { isDemoMode } = useAuth();
  const { currentUser, updateCurrentUserProfile } = useProfile();

  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Display name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // Bio state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(currentUser.bio || '');
  const [isSavingBio, setIsSavingBio] = useState(false);

  // Copy feedback
  const [hasCopiedId, setHasCopiedId] = useState(false);

  // Banner feedback state
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setStatusFeedback({ type, message });
    setTimeout(() => {
      setStatusFeedback(null);
    }, 3500);
  };

  // Avatar Selection & Validation
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      showFeedback('error', 'Only JPEG, PNG, or WebP images are supported.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      showFeedback('error', 'Image file is too large. Limit is 2 MB.');
      e.target.value = '';
      return;
    }

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setAvatarPreviewUrl(preview);
    setSelectedAvatarFile(file);
    e.target.value = '';
  };

  const handleCancelAvatar = () => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarPreviewUrl(null);
    setSelectedAvatarFile(null);
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatarFile || !avatarPreviewUrl) return;

    setIsUploadingAvatar(true);
    try {
      if (isDemoMode) {
        // Offline demo mode simulation: update state with local object URL
        updateCurrentUserProfile?.({ avatarUrl: avatarPreviewUrl });
        showFeedback('success', 'Profile photo updated (Demo Simulation)');
        setSelectedAvatarFile(null);
        setAvatarPreviewUrl(null);
      } else {
        // Authenticated mode: call backend upload API
        const updatedDto = await userApi.uploadAvatar(selectedAvatarFile);
        updateCurrentUserProfile?.({ avatarUrl: updatedDto.avatarUrl });
        showFeedback('success', 'Profile photo uploaded successfully');
        URL.revokeObjectURL(avatarPreviewUrl);
        setSelectedAvatarFile(null);
        setAvatarPreviewUrl(null);
      }
    } catch {
      showFeedback('error', 'Failed to upload profile photo. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Display Name Save
  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      showFeedback('error', 'Display name cannot be empty.');
      return;
    }

    if (trimmed === currentUser.displayName) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      if (isDemoMode) {
        updateCurrentUserProfile?.({ displayName: trimmed });
        showFeedback('success', 'Display name updated (Demo Mode)');
        setIsEditingName(false);
      } else {
        const updatedDto = await userApi.updateMe({ displayName: trimmed });
        updateCurrentUserProfile?.({ displayName: updatedDto.displayName });
        showFeedback('success', 'Display name saved successfully');
        setIsEditingName(false);
      }
    } catch {
      showFeedback('error', 'Failed to save display name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  // Bio Save
  const handleSaveBio = async () => {
    const trimmed = bioInput.trim();

    if (trimmed === (currentUser.bio || '')) {
      setIsEditingBio(false);
      return;
    }

    setIsSavingBio(true);
    try {
      if (isDemoMode) {
        updateCurrentUserProfile?.({ bio: trimmed });
        showFeedback('success', 'Bio updated (Demo Mode)');
        setIsEditingBio(false);
      } else {
        const updatedDto = await userApi.updateMe({ bio: trimmed });
        updateCurrentUserProfile?.({ bio: updatedDto.bio });
        showFeedback('success', 'Bio saved successfully');
        setIsEditingBio(false);
      }
    } catch {
      showFeedback('error', 'Failed to save bio. Please try again.');
    } finally {
      setIsSavingBio(false);
    }
  };

  // Copy Username
  const handleCopyUsername = () => {
    const rawUsername = currentUser.username.replace(/^@/, '');
    navigator.clipboard?.writeText(`@${rawUsername}`);
    setHasCopiedId(true);
    showFeedback('success', 'Username copied to clipboard');
    setTimeout(() => setHasCopiedId(false), 2000);
  };

  const formattedUsername = currentUser.username.startsWith('@')
    ? currentUser.username
    : `@${currentUser.username || 'pkdev'}`;

  const currentAvatarDisplay = avatarPreviewUrl || currentUser.avatarUrl;

  return (
    <div className="relative flex-1 flex flex-col justify-between p-5 select-none overflow-y-auto bg-[#040208] text-white">
      {/* Top Header */}
      <div>
        <StatusBar />
        <div className="flex items-center justify-between pt-2 pb-2">
          <div className="flex items-center gap-3">
            <BackButton onClick={goBack} />
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">Settings</h1>
              <p className="text-[11px] text-purple-300/60 font-mono tracking-wider -mt-0.5">
                Make your experience yours.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Status Feedback Banner */}
      <AnimatePresence>
        {statusFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`my-2 p-3 rounded-2xl border flex items-center justify-between text-xs z-30 shadow-[0_0_20px_rgba(0,0,0,0.6)] ${
              statusFeedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/30 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusFeedback.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{statusFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusFeedback(null)}
              className="p-1 rounded-full text-white/60 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex-1 flex flex-col gap-5 my-3"
      >
        {/* ============================================================== */}
        {/* SECTION 1: ACCOUNT (MILESTONE 1 CORE)                          */}
        {/* ============================================================== */}
        <div>
          {/* Section Header */}
          <div className="flex items-center gap-2.5 mb-3 px-1">
            <div className="p-1.5 rounded-xl bg-purple-950/60 border border-purple-500/20 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
              <User className="w-3.5 h-3.5 text-neon-purple" />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-wider text-purple-200 uppercase font-mono">
                Account
              </h2>
              <p className="text-[10px] text-purple-300/50">
                Your identity across ephemeral conversations.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* 1. Avatar Card */}
            <GlassCard variant="default" className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar Container with Edit Trigger */}
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-cyan-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-transform group-hover:scale-105">
                      <NeonAvatar
                        src={currentAvatarDisplay}
                        name={currentUser.displayName}
                        size="lg"
                        glow={false}
                      />
                    </div>
                    {/* Camera Badge Overlay */}
                    <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-purple-900 border border-purple-400/50 text-white shadow-[0_0_10px_rgba(168,85,247,0.6)] group-hover:bg-purple-700 transition-colors">
                      <Camera className="w-3 h-3 text-cyan-300" />
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Profile Avatar
                    </span>
                    <span className="text-[11px] text-purple-300/60 block mt-0.5">
                      JPG, PNG, or WebP (&le; 2 MB)
                    </span>
                  </div>
                </div>

                {/* Change Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-full bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-medium transition-all"
                >
                  Change
                </button>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarFileChange}
                className="hidden"
              />

              {/* Pending Avatar Confirmation Bar */}
              {selectedAvatarFile && avatarPreviewUrl && (
                <div className="pt-2 mt-2 border-t border-purple-500/20 flex items-center justify-between animate-fade-in">
                  <span className="text-xs text-cyan-300 flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Previewing new photo
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelAvatar}
                      disabled={isUploadingAvatar}
                      className="px-2.5 py-1 rounded-full text-xs text-purple-300/70 hover:text-white transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAvatar}
                      disabled={isUploadingAvatar}
                      className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-semibold shadow-[0_0_12px_rgba(168,85,247,0.4)] flex items-center gap-1 disabled:opacity-50"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* 2. Display Name Card */}
            <GlassCard variant="default" className="p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-purple-300/60">
                  Display Name
                </span>
                {!isEditingName && (
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(currentUser.displayName || '');
                      setIsEditingName(true);
                    }}
                    className="p-1 rounded-lg text-purple-300/70 hover:text-white transition-colors"
                    title="Edit display name"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isEditingName ? (
                <div className="mt-2 space-y-2.5 animate-fade-in">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={MAX_DISPLAY_NAME_LENGTH}
                    autoFocus
                    placeholder="Enter your display name"
                    className="w-full px-3 py-2 rounded-xl bg-[#090317] border border-purple-500/40 text-sm text-white focus:outline-none focus:border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      disabled={isSavingName}
                      className="px-3 py-1.5 rounded-full text-xs text-purple-300/70 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveName}
                      disabled={isSavingName}
                      className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-semibold shadow-[0_0_12px_rgba(168,85,247,0.4)] flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSavingName ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-bold text-white tracking-wide">
                    {currentUser.displayName || 'No name set'}
                  </span>
                </div>
              )}
            </GlassCard>

            {/* 3. Bio Card */}
            <GlassCard variant="default" className="p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-purple-300/60">
                  Bio
                </span>
                {!isEditingBio && (
                  <button
                    type="button"
                    onClick={() => {
                      setBioInput(currentUser.bio || '');
                      setIsEditingBio(true);
                    }}
                    className="p-1 rounded-lg text-purple-300/70 hover:text-white transition-colors"
                    title="Edit bio"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isEditingBio ? (
                <div className="mt-2 space-y-2.5 animate-fade-in">
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    maxLength={MAX_BIO_LENGTH}
                    rows={3}
                    autoFocus
                    placeholder="Share a fleeting thought or bio..."
                    className="w-full px-3 py-2 rounded-xl bg-[#090317] border border-purple-500/40 text-sm text-white focus:outline-none focus:border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono ${
                        bioInput.length >= 300
                          ? 'text-amber-400 font-semibold'
                          : 'text-purple-300/50'
                      }`}
                    >
                      {bioInput.length} / {MAX_BIO_LENGTH}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingBio(false)}
                        disabled={isSavingBio}
                        className="px-3 py-1.5 rounded-full text-xs text-purple-300/70 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveBio}
                        disabled={isSavingBio}
                        className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-semibold shadow-[0_0_12px_rgba(168,85,247,0.4)] flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isSavingBio ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-purple-200/80 mt-1 leading-relaxed break-words">
                  {currentUser.bio || (
                    <span className="text-purple-300/40 italic">
                      No bio added yet. Tap edit to share a fleeting thought.
                    </span>
                  )}
                </p>
              )}
            </GlassCard>

            {/* 4. Username / User ID Card (Strictly Read-Only & Immutable) */}
            <GlassCard variant="default" className="p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-purple-300/60">
                  User ID
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/70 border border-purple-500/25 text-[10px] font-mono text-purple-300">
                  <Lock className="w-2.5 h-2.5 text-purple-400" />
                  <span>Immutable</span>
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-mono font-bold text-white tracking-wide">
                  {formattedUsername}
                </span>

                <button
                  type="button"
                  onClick={handleCopyUsername}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-xs font-medium text-purple-200 hover:text-white border border-white/[0.08] transition-all"
                  title="Copy username"
                >
                  {hasCopiedId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-purple-300" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-purple-300/45 mt-2 leading-relaxed">
                Your username is permanent and cannot be changed.
              </p>
            </GlassCard>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsScreen;

