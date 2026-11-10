import React, { useState } from 'react';
import { Copy, Check, ChevronRight, Settings, Clock, Shield, UserPlus, LogOut, MessageSquare } from 'lucide-react';
import { StatusBar } from '../../../shared/components/StatusBar';
import { BackButton } from '../../../shared/components/BackButton';
import { NeonAvatar } from '../../../shared/components/NeonAvatar';
import { GlassCard } from '../../../shared/components/GlassCard';
import { GlowButton } from '../../../shared/components/GlowButton';
import { UserProfile, Friend } from '../types/user';

interface ProfileViewProps {
  user: UserProfile | Friend;
  isCurrentUser: boolean;
  onBack: () => void;
  onOpenSettings?: () => void;
  onOpenInvite?: () => void;
  onOpenTimer?: () => void;
  onStartChat?: () => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  isCurrentUser,
  onBack,
  onOpenSettings,
  onOpenInvite,
  onOpenTimer,
  onStartChat,
  onLogout,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard?.writeText(user.username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const defaultTimer = 'defaultTimerMinutes' in user ? user.defaultTimerMinutes : 15;

  return (
    <div className="relative flex-1 flex flex-col justify-between p-5 select-none overflow-y-auto">
      {/* Top Header */}
      <div>
        <StatusBar />
        <div className="flex items-center justify-between pt-2 pb-4">
          <BackButton onClick={onBack} />
          <h1 className="text-base font-bold text-white tracking-wide">
            {isCurrentUser ? 'My Profile' : user.displayName}
          </h1>
          {isCurrentUser && onOpenSettings ? (
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Settings"
              className="p-2 -mr-2 rounded-full text-purple-200/80 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <Settings className="w-5 h-5 stroke-[2]" />
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </div>

      {/* Center Profile Details */}
      <div className="flex flex-col items-center my-2">
        {/* Large Glowing Avatar */}
        <div className="relative p-1 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-violet-400 shadow-[0_0_35px_rgba(168,85,247,0.55)] mb-3">
          <NeonAvatar
            src={user.avatarUrl}
            name={user.displayName}
            size="xl"
            glow={false}
          />
        </div>

        {/* Username Handle */}
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/25 mb-1">
          <span className="text-xs font-mono font-medium text-purple-300">
            {user.username}
          </span>
        </div>

        {/* Full Display Name */}
        <h2 className="text-lg font-bold text-white tracking-tight">
          {user.displayName}
        </h2>

        {/* Bio */}
        <p className="text-xs text-purple-200/70 text-center max-w-xs mt-1">
          {user.bio}
        </p>
      </div>

      {/* Action List Items */}
      <div className="flex flex-col gap-2.5 my-3">
        {/* My ID / Copy Row */}
        <GlassCard
          variant="default"
          onClick={handleCopyId}
          hoverEffect
          className="p-3.5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/20 text-purple-300">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">
                {isCurrentUser ? 'My ID' : 'User ID'}
              </span>
              <span className="text-[11px] font-mono text-purple-300/80">
                {user.username}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="p-2 rounded-lg bg-white/[0.04] text-purple-300 hover:text-white"
            title="Copy username"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </GlassCard>

        {isCurrentUser ? (
          <>
            {/* Invite Friends */}
            <GlassCard
              variant="default"
              onClick={onOpenInvite}
              hoverEffect
              className="p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/20 text-purple-300">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white">Invite Friends</span>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300/60" />
            </GlassCard>

            {/* Chat Timer Default */}
            <GlassCard
              variant="default"
              onClick={onOpenTimer}
              hoverEffect
              className="p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/20 text-purple-300">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white">Chat Timer Default</span>
              </div>
              <span className="text-xs font-medium text-purple-300/90 mr-1">
                {defaultTimer} Minutes
              </span>
            </GlassCard>

            {/* Privacy */}
            <GlassCard
              variant="default"
              onClick={onOpenSettings}
              hoverEffect
              className="p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/20 text-purple-300">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white">Privacy</span>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300/60" />
            </GlassCard>
          </>
        ) : (
          <>
            {/* Friend Profile Action: Start Temporary Chat */}
            <GlowButton
              fullWidth
              size="md"
              onClick={onStartChat}
              icon={<MessageSquare className="w-4 h-4" />}
            >
              Start Temporary Chat
            </GlowButton>

            {/* Shared Timer info */}
            <GlassCard variant="default" className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/20 text-purple-300">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white">Disappearing Timer</span>
                  <span className="text-[11px] text-purple-300/70">
                    Messages delete automatically
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-neon-purple">Active</span>
            </GlassCard>
          </>
        )}
      </div>

      {/* Bottom Log Out (for self) */}
      {isCurrentUser && onLogout && (
        <div className="pt-2 pb-1">
          <GlassCard
            variant="danger"
            onClick={onLogout}
            hoverEffect
            className="p-3 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-red-300">Log Out</span>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

