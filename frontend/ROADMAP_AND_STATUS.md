# EPHEMERAL — Master Task Tracker & Engineering Roadmap

> **"Be present. Leave no history."**  
> *Last Updated: November 15, 2026*  
> *Repository: `priyanxhukushwaha/EPHEMERAL`*  
> *Product Direction: A Premium Social Privacy Messenger*

---

## 📌 Project Overview & Status Summary

| Area | Status | Completion | Summary |
|---|:---:|:---:|---|
| **Foundation & Design System** | ✅ Complete | 100% | Vite, React 18, TypeScript (strict), Tailwind CSS neon tokens, Glassmorphism, Plus Jakarta Sans, Framer Motion. |
| **Reusable Component Library** | ✅ Complete | 100% | `ProfileView`, `NeonAvatar`, `GlassCard`, `GlowButton`, `StatusBar`, `BackButton`, `BottomNav`, `ResponsiveContainer`, `TypingIndicator`. |
| **VFX & Expiration Engine** | ✅ Complete | 100% | Wall-clock epoch expiration math, HTML5 Canvas glowing particle disintegration engine, 60-min ceiling. |
| **Approved UI Screens (12 Total)** | 🔄 In Progress | 67% (8 of 12 complete) | Screens 1, 2, 3, 4, 5, 7, 8, 9 complete. Screens 6, 10, 11, 12 pending as placeholders. |
| **Authentication & App Gating** | ✅ Complete | 100% | Real JWT token auth flow + Dev-only Demo Mode toggle with clean state separation. |
| **Development Demo Mode (Milestone 3A)** | ✅ Complete | 100% | Offline local simulation mode in DEV, `DEMO MODE · LOCAL SIMULATION` pill indicator, zero token pollution. |
| **Floating Typing Indicator (Milestone 3B)** | ✅ Complete | 100% | Bubble-less neon typing indicator, `ws:typing` socket integration, 2.8s auto-dismiss, partner simulation in demo mode. |
| **Client-Side Persistence & State** | ✅ Complete | 100% | `localStorage` persistence (`ephemeral_demo_messages_v2`), quota safety, boot expiration purge, read receipts. |
| **Backend & Real-Time Server** | ⏳ Teammate Domain | In Development | Express, Prisma PostgreSQL, JWT auth, Socket.IO handlers, automated message deletion worker. |

---

## 📱 The 12 Approved Screens: Detailed Status

### [x] Screen 1: Splash Screen (`src/features/onboarding/pages/SplashScreen.tsx`)
- [x] Dual-tone pulsing neon infinity logo (`#C084FC` to `#22D3EE`).
- [x] Tracking typography `EPHEMERAL` (`tracking-[0.25em]`).
- [x] Brand tagline: *"Be present. Leave no history."* & *"Conversations for the moment."*
- [x] Automated transition to Onboarding after 2.8 seconds.
- [x] Instant tap-to-skip gesture.
- [x] Top device `StatusBar`.

### [x] Screen 2: Onboarding — Introduction (`src/features/onboarding/pages/OnboardingIntroScreen.tsx`)
- [x] 3D glassmorphic floating chat bubble with glowing clock badge.
- [x] Floating stars and ambient particle dust.
- [x] Headline: *"Chat Freely, It Disappears"*.
- [x] Subtitle: *"Send messages, share moments, and let them fade — automatically."*
- [x] Two-step carousel indicator (Step 1 active).
- [x] *"Skip"* button (navigates directly to Home).
- [x] *"Get Started →"* gradient glow pill button.

### [x] Screen 3: Onboarding — Features (`src/features/onboarding/pages/OnboardingFeaturesScreen.tsx`)
- [x] Three glassmorphism feature cards:
  - [x] **Privacy First:** Shield icon, *"No history, No backups."*
  - [x] **Your Time, Your Chat:** Clock icon, *"Messages delete automatically (1 min – 60 min)."*
  - [x] **Chat Together:** Users icon, *"Private & group rooms with full control."*
- [x] Two-step carousel indicator (Step 2 active).
- [x] *"Continue"* gradient glow pill button (navigates to Home).

### [x] Screen 4: Home — Conversation Rooms & Friends (`src/features/rooms/pages/HomeScreen.tsx`)
- [x] Top header with animated infinity logo and tracked brand title.
- [x] Live expandable search bar filtering rooms and friends in real time.
- [x] Notification bell with glowing unread pulse dot (routes to Screen 11).
- [x] Segmented navigation control: **Rooms** vs **Friends** (zero page reload).
- [x] **Rooms Tab:**
  - [x] Displays active rooms: *Late Night Crew 🌙*, *Project Squad*, *Weekend Plans 🌊*.
  - [x] Clicking group image/avatar opens the **Group Admin's profile** (`ProfileView`).
  - [x] Clicking room text/row navigates into the group conversation.
  - [x] Displays member counts, latest message preview, and lifetime countdown badges.
- [x] **Friends Tab:**
  - [x] Generous, spacious list with zero boxed cards or heavy border enclosures.
  - [x] **Independent Click Target 1:** Clicking friend avatar opens that friend's profile (`ProfileView`).
  - [x] **Independent Click Target 2:** Clicking username/name opens private chat directly.
  - [x] Event isolation with `e.stopPropagation()` preventing cross-click conflicts.
- [x] Central `(+)` button opening glassmorphism Action Menu modal:
  - [x] *Start Private Chat*
  - [x] *Create Group Room*
  - [x] *Invite Friends*
- [x] Floating glass dock bottom navigation (Home, Rooms, +, Chat, Profile).
- [x] Strict compliance: Zero presence dots, zero online/offline indicators, zero last seen, zero stories.

### [x] Screen 5: My Profile & Friend Profile (`src/features/profile/pages/MyProfileScreen.tsx` & `FriendProfileScreen.tsx`)
- [x] Built using unified, reusable `ProfileView.tsx`.
- [x] **When viewing My Profile (`isCurrentUser = true`):**
  - [x] Large glowing avatar with neon purple ring.
  - [x] Handle `@pkdev`, Full name *Priyanx Kushwaha*, bio *Just a moment here. ✨*.
  - [x] My ID row with one-tap clipboard copy and visual checkmark confirmation.
  - [x] Invite Friends row (routes to Screen 10).
  - [x] Chat Timer Default row showing default duration (`15 Minutes`).
  - [x] Privacy row (routes to Settings).
  - [x] Destructive glassmorphic *Log Out* button.
- [x] **When viewing Friend / Admin Profile (`isCurrentUser = false`):**
  - [x] Friend's avatar, handle, display name, and bio.
  - [x] *Start Temporary Chat* gradient action button.
  - [x] Ephemeral room settings & privacy disclaimer.

### [ ] Screen 6: Settings (`src/features/settings` / `src/shared/screens/PlaceholderScreen.tsx #6`) — PENDING
- [ ] Header with back navigation to Home.
- [ ] Grouped glassmorphism setting sections:
  - [ ] **Account:** Edit username, display name, profile avatar.
  - [ ] **Chat & Rooms:** Default message expiration timer (1m, 5m, 15m, 30m, 60m), auto-delete read receipts.
  - [ ] **Notifications:** Private notification alert toggles, sound chimes, haptics.
  - [ ] **Privacy & Security:** Clear local storage cache, view privacy policy, data deletion.
  - [ ] **Appearance:** Neon accent colors (Purple, Violet, Cyan), ambient glow intensity.
  - [ ] **About:** Version info (v1.0.0), ephemeral protocol philosophy, open-source acknowledgments.
  - [ ] **Demo Mode Utility:** Reset demo data and clear local cache button.

### [x] Screen 7: Private Chat Room (`src/features/chat/pages/PrivateChatScreen.tsx`)
- [x] Header area:
  - [x] Back button to Home.
  - [x] Recipient Avatar and Name (`Aryan`), with *Tap for profile* trigger.
  - [x] Active Expiration Timer Badge (`5m`) with live modal launcher.
  - [x] Options dropdown menu.
  - [x] Strictly zero voice/video calling icons.
- [x] Bubble-less floating message stream on dark gradient background.
- [x] Real-time message status transparency: `Sent (Demo)` vs `Read (Demo)`.
- [x] Visible `[Simulate Recipient Read (Demo)]` badge for unread outgoing messages.
- [x] Coordinated HTML5 Canvas particle disintegration when messages expire.
- [x] Auto-scrolling to latest message.
- [x] Ephemeral Empty State (*"All messages have vanished. Be present. Leave no history."*).
- [x] Integrated `ChatInputBar` with photo attachment support (2 MB validation).
- [x] **Floating Typing Indicator:**
  - [x] Shows `Aryan is typing...` with animated cyan/purple/fuchsia neon dots.
  - [x] Emits rate-limited `ws:typing` events on input change.
  - [x] Auto-dismisses on message send or 2.8s inactivity.
  - [x] Dev-only `[Simulate Partner Typing]` button in Demo Mode.

### [x] Screen 8: Group Chat Room (`src/features/chat/pages/GroupChatScreen.tsx`)
- [x] Header:
  - [x] Back button to Home.
  - [x] Group Avatar (independent click opens Group Admin Profile: `Meera`).
  - [x] Group Name (*Late Night Crew 🌙*) + member count (`12 members`).
  - [x] Group Expiration Timer Badge (`30m`).
  - [x] Strictly zero voice/video calling icons.
- [x] Multi-user floating text stream:
  - [x] Color-differentiated sender labels (Meera, Kabir, Tanya, You).
  - [x] Real-time "First-seen, starts timer" group countdown badges.
  - [x] Stable member IDs in data layer (`user-meera`, `user-kabir`, `user-tanya`, `user-me`) with UI display name mapping.
  - [x] Particle disintegration animation when group messages expire.
- [x] Group message input composer with 2 MB attachment validation.
- [x] Group members list slide-over drawer with 12 members.
- [x] Non-destructive LocalStorage migration from `ephemeral_messages_v1` to `ephemeral_demo_messages_v2`.
- [x] **Group Floating Typing Indicator:**
  - [x] Supports natural multi-member grammar: `Meera is typing...`, `Meera and Kabir are typing...`.
  - [x] Automatic name deduplication and independent member inactivity timers.
  - [x] Dev-only `[Simulate Group Typing]` simulation control in Demo Mode.

### [x] Screen 9: Message Timer Modal (`src/features/chat/components/MessageTimerModal.tsx`)
- [x] Standalone and embedded modal sheet modes.
- [x] Header with animated clock icon and close trigger.
- [x] Explanatory copy: *"Timer begins once read. Absolute maximum lifetime is 60 minutes."*
- [x] 5 Radio options with glowing purple checkmark rings:
  - [x] `1 Minute`
  - [x] `5 Minutes`
  - [x] `15 Minutes`
  - [x] `30 Minutes`
  - [x] `60 Minutes (Max)`
- [x] Immediate update of `ChatContext` active room timer.
- [x] Local storage persistence of room timer preferences.
- [x] Newly sent messages immediately inherit selected duration.

### [ ] Screen 10: Invite Friends Screen (`src/shared/screens/PlaceholderScreen.tsx #10`) — PENDING
- [ ] Top header with back navigation.
- [ ] Hero illustration: Glowing neon purple & cyan chain link graphic with celestial particle dust.
- [ ] Headline: *"Invite Friends"* & subtext *"Share your invite link with friends and start a temporary chat."*
- [ ] Share Link Glass Card: `ephemeral.app/invite/pkdev` with one-tap copy button and visual confirmation.
- [ ] Full-width *"Share Link"* button triggering `navigator.share` (with clipboard fallback).
- [ ] Ephemeral QR Code preview for in-person scanning.

### [ ] Screen 11: Private Notifications (`src/shared/screens/PlaceholderScreen.tsx #11`) — PENDING
- [ ] Top header with back navigation.
- [ ] Hero illustration: Glowing neon purple acoustic bell graphic with ripple waves.
- [ ] Realistic system notification banner mockup:
  - [ ] App brandmark + "now" timestamp.
  - [ ] Text: *"Aryan sent you a message."* (Strictly zero message preview).
- [ ] Privacy Reassurance Card:
  - [ ] Crossed-out bell / silent shield glyph.
  - [ ] Copy: *"No message preview. Your conversations stay private."*
- [ ] Interactive demo toggle: "Trigger Test Notification" to preview the banner live.

### [ ] Screen 12: Message Disappearing Animation Showcase (`src/shared/screens/PlaceholderScreen.tsx #12`) — PENDING
- [ ] Top header with back navigation.
- [ ] Interactive 4-stage visual demonstration canvas:
  - [ ] **Stage 1 (Active):** Floating message with active timer (`5m ✓✓`).
  - [ ] **Stage 2 (Dissolving):** Fading opacity, softened edges, blur filter, and countdown ticking down to `1m`.
  - [ ] **Stage 3 (Vaporizing):** Live HTML5 Canvas vector particle explosion with glowing purple and cyan particles scattering into the dark void.
  - [ ] **Stage 4 (Vanished):** Dust clears, revealing *"Message deleted"* with subtle vanish glyph.
- [ ] Interactive *"Trigger Vanish Animation"* control allowing manual replay of the physics at any time.
- [ ] Sliders to experiment with particle count, dispersion speed, and neon colors.

---

## 🧩 Reusable Component Library: Function & Status Matrix

| Component | File Path | Functions / Sub-elements | Status |
|---|---|---|:---:|
| `AmbientGlowBackground` | `src/shared/components/AmbientGlowBackground.tsx` | Ambient purple/magenta/cyan blur orbs, fluid neon SVG wave. | [x] Complete |
| `GlassCard` | `src/shared/components/GlassCard.tsx` | Frosted glass panel, hover glow, border variants (`default`, `elevated`, `subtle`, `danger`). | [x] Complete |
| `GlowButton` | `src/shared/components/GlowButton.tsx` | Gradient pill button, hover glow shadow, haptic active press, icon slots. | [x] Complete |
| `NeonAvatar` | `src/shared/components/NeonAvatar.tsx` | Neon glowing borders, sizes (`xs` to `2xl`), decoupled click handlers, gradient initials fallback. | [x] Complete |
| `ProfileView` | `src/features/profile/components/ProfileView.tsx` | Unified profile renderer for User Profile and Friend/Admin Profile, copy ID with feedback. | [x] Complete |
| `StatusBar` | `src/shared/components/StatusBar.tsx` | Dynamic wall-clock time, cellular bars, Wi-Fi icon, battery indicator. | [x] Complete |
| `BackButton` | `src/shared/components/BackButton.tsx` | Touch-friendly glass navigation button. | [x] Complete |
| `BottomNav` | `src/shared/layout/BottomNav.tsx` | Floating glass dock with glowing active indicators and center `(+)` glowing action button. | [x] Complete |
| `ResponsiveContainer` | `src/shared/layout/ResponsiveContainer.tsx` | Responsive layout (edge-to-edge mobile, centered `max-w-[430px]` desktop shell). | [x] Complete |
| `FloatingMessage` | `src/features/chat/components/FloatingMessage.tsx` | Bubble-less floating message text, wall-clock countdown, status ticks (`Sent (Demo)`, `Read (Demo)`), simulate read trigger, particle hook. | [x] Complete |
| `TypingIndicator` | `src/features/chat/components/TypingIndicator.tsx` | Floating bubble-less typing indicator with animated cyan/purple/fuchsia dots and Framer Motion transitions. | [x] Complete |
| `ChatInputBar` | `src/features/chat/components/ChatInputBar.tsx` | Glass text input pill, 2 MB image file validator, demo photo preset, glowing send button, quota banner, typing callback. | [x] Complete |
| `MessageTimerModal` | `src/features/chat/components/MessageTimerModal.tsx` | 5-tier duration selector (1m–60m max), persistent room timer updates. | [x] Complete |
| `ParticleDisintegration` | `src/features/chat/components/ParticleDisintegration.tsx` | HTML5 Canvas vector particle burst on expiration, 60fps `requestAnimationFrame` loop, `onComplete` lifecycle. | [x] Complete |
| `DevScreenSwitcher` | `src/shared/dev/DevScreenSwitcher.tsx` | Development harness for 12-screen jumping (`Ctrl + Shift + D` or bottom-right pill). | [x] Complete |
| `PlaceholderScreen` | `src/shared/screens/PlaceholderScreen.tsx` | Glassmorphic fallback renderer for pending screens (6, 10, 11, 12). | [x] Complete |

---

## ⚙️ Core Logic, Contexts & Utilities Matrix

### `src/features/chat/utils/expiration.ts`
- [x] `calculateExpirationTime(message: Message): number`: Computes exact expiration timestamp enforcing the 60-minute ceiling: `min(sentAt + 60m, firstReadAt ? firstReadAt + timerDuration : sentAt + 60m)`.
- [x] `getRemainingTimeMs(message: Message, now?: number): number`: Wall-clock difference (`expiresAt - Date.now()`). Never resets on page refresh.
- [x] `formatRemainingTime(remainingMs: number): string`: Formats time to `5m`, `45s`, `1h`, or `0s`.
- [x] `isMessageExpired(message: Message, now?: number): boolean`: Checks if `getRemainingTimeMs <= 0`.

### `src/features/chat/utils/particlePhysics.ts`
- [x] `createParticlesAt(x, y, width, height, count)`: Generates 85–120 particles with random velocity, upward float, and neon color palette.
- [x] `updateAndRenderParticles(ctx, particles)`: Calculates drag friction (`0.96`), decay, canvas glow shadow (`shadowBlur: 8`), and alpha blending.

### `src/features/auth/state/AuthContext.tsx`
- [x] Real authentication state with JWT token persistence (`access_token`, `refresh_token`).
- [x] `isDemoMode`: Development-only offline bypass state (`enterDemoMode`, `exitDemoMode`).
- [x] Zero leakage of mock credentials into real auth tokens or backend calls.
- [x] `AppLayout.tsx`: Top `DEMO MODE · LOCAL SIMULATION` status pill with one-tap exit.

### `src/features/chat/state/ChatContext.tsx`
- [x] `sendMessage(roomId, text, photoUrl)`: Appends outgoing message with unread default (`firstReadAt = null`) and safe `localStorage` persistence.
- [x] `simulateRecipientRead(roomId, messageId)`: Sets `firstReadAt = Date.now()` and updates status to `Read (Demo)`.
- [x] `markIncomingAsRead(roomId)`: Locks `firstReadAt` for incoming messages upon opening the chat room.
- [x] `evictExpiredMessage(roomId, messageId)`: Coordinated eviction invoked strictly after canvas particle animation finishes.
- [x] `sendTyping(roomId)`: 2-second rate-limited typing emitter through Socket.IO client (`ws:typing`).
- [x] `typingUsers`: Real-time map of members typing per room, with 2.8s inactivity auto-clear.
- [x] `simulatePartnerTyping(roomId, username?)`: Local typing simulation control for development demo testing.
- [x] `setRoomTimer(roomId, minutes)`: Updates room expiration timer and persists to `localStorage`.
- [x] `setDefaultTimer(minutes)`: Updates user profile default timer.
- [x] `safeSaveToLocalStorage(data)`: Catches `QUOTA_EXCEEDED_ERR` gracefully without corrupting messages.

### `src/shared/state/NavigationContext.tsx`
- [x] `navigateTo(screen, params)`: Navigates to target screen with optional `roomId` or `friendId`.
- [x] `goBack()`: History stack traversal with fallback to Home.
- [x] `setActiveNavTab(tab)`: Synchronizes bottom dock active state.
- [x] `toggleDevMode()`: Toggles the development screen switcher (`Ctrl + Shift + D`).

---

## 📋 Outstanding Tasks Checklist (What Has Been Done & What Remains)

### ✅ Completed Milestones

- [x] **Milestone 1: Project Architecture & Modular Feature Restructuring**
  - [x] Restructured frontend into domain-driven folders (`app/`, `features/`, `shared/`).
  - [x] Strict TypeScript configuration and alias resolution (`@/*`).
  - [x] Zero compilation warnings and clean build pipeline.
- [x] **Milestone 2: Group Chat & Local Storage Migration**
  - [x] Implemented `GroupChatScreen.tsx` with multi-member floating stream (Meera, Kabir, Tanya, You).
  - [x] Independent Group Admin profile navigation.
  - [x] Slide-over 12-member drawer.
  - [x] Safe migration from `ephemeral_messages_v1` to `ephemeral_demo_messages_v2`.
- [x] **Milestone 3A: Development Demo Mode**
  - [x] Added dev-only `Enter Demo Mode` button on `AuthScreen`.
  - [x] Implemented `isDemoMode` state in `AuthContext` without fake JWT tokens.
  - [x] Added `DEMO MODE · LOCAL SIMULATION` top banner with exit action.
  - [x] Enabled full offline UI testing across Home, Profile, Private Chat, and Group Chat.
- [x] **Milestone 3B: Floating Typing Indicator & Socket Integration**
  - [x] Created `TypingIndicator.tsx` with animated cyan/purple/fuchsia neon dots.
  - [x] Integrated `ws:typing` socket listener and 2-second rate-limited emissions.
  - [x] Implemented 2.8s inactivity timeout and instant dismissal on message send.
  - [x] Supported multi-user grammar (`Meera and Kabir are typing...`) with deduplication.
  - [x] Added `Simulate Partner Typing` control in Demo Mode.

---

### ⏳ Remaining Milestones (What Remains To Be Done)

- [ ] **Milestone 3C: Screen 6 — Settings Screen (`src/features/settings`)**
  - [ ] Create dedicated Settings screen replacing `PlaceholderScreen #6`.
  - [ ] Implement grouped glassmorphism sections:
    - [ ] **Account:** Edit username, display name, avatar preview.
    - [ ] **Chat & Rooms:** Default expiration duration, auto-delete preferences.
    - [ ] **Notifications:** Mute, sound chimes, haptics.
    - [ ] **Privacy & Security:** Clear demo storage cache, data erasure confirmation.
    - [ ] **Appearance:** Neon accent selector, ambient glow intensity.
    - [ ] **About:** Ephemeral protocol philosophy, version `v1.0.0`.
  - [ ] Wire Settings navigation from `MyProfileScreen` and Action Menu.

- [ ] **Milestone 4: Screen 10 — Invite Friends Screen (`src/features/invite`)**
  - [ ] Create dedicated Invite Friends screen replacing `PlaceholderScreen #10`.
  - [ ] Render neon purple & cyan chain link graphic.
  - [ ] Share Link Glass Card (`ephemeral.app/invite/pkdev`) with one-tap copy and feedback.
  - [ ] Web Share API integration (`navigator.share`) with clipboard fallback.
  - [ ] Ephemeral QR code generation for in-person scanning.
  - [ ] Connect entry points from `MyProfileScreen` and Home Action Menu.

- [ ] **Milestone 5: Screen 11 — Private Notifications (`src/features/notifications`)**
  - [ ] Create dedicated Private Notifications screen replacing `PlaceholderScreen #11`.
  - [ ] Render glowing acoustic bell graphic with ripple waves.
  - [ ] Mockup system notification banner (*"Aryan sent you a message"* — strictly zero message preview).
  - [ ] Privacy reassurance cards and interactive preview banner trigger.
  - [ ] Connect entry points from Home bell icon and Settings.

- [ ] **Milestone 6: Screen 12 — Message Disappearing Animation Showcase (`src/features/chat/pages/DisappearingDemoScreen.tsx`)**
  - [ ] Create dedicated interactive showcase replacing `PlaceholderScreen #12`.
  - [ ] 4-stage visual demonstration canvas:
    - Stage 1: Active floating message.
    - Stage 2: Dissolving edges, opacity drop, countdown ticking down.
    - Stage 3: HTML5 Canvas vector particle explosion into the dark void.
    - Stage 4: Message vanishes with subtle vanish glyph.
  - [ ] Interactive particle tuning sliders (count, velocity, colors).
  - [ ] Connect entry point from Dev Screen Switcher and Settings.

- [ ] **Milestone 7: End-to-End Polish & Full Journey Verification**
  - [ ] Verify complete user flow across all 12 approved screens.
  - [ ] Run automated build and type check (`npm run build`).
  - [ ] Test edge cases in both Development Demo Mode and real authenticated mode.
  - [ ] Cross-device responsiveness and mobile touch verification.

---

### 🛡️ Teammate Phase: Backend Real-Time Server & Database (Strict Boundary)

*Note: All backend work is managed exclusively by the backend teammate. The frontend communicates via documented contracts.*

- [ ] Real-time Socket.IO chat room gateway (`ws:typing`, `ws:message`, `ws:read`).
- [ ] PostgreSQL + Prisma models for User, Room, RoomMember, Message, Attachment.
- [ ] Redis TTL or scheduled cron worker for automated server-side message purging.
- [ ] Media upload endpoint with ephemeral storage limits.
- [ ] Push notification service with zero-preview privacy payloads.

---

*This file is updated after each completed task and milestone to maintain complete transparency across the engineering team.*
