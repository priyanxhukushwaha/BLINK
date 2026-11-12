# BLINK (EPHEMERAL) — Master Task Tracker & Engineering Roadmap

> **"Be present. Leave no history."**  
> *Last Updated: November 11, 2026*  
> *Repository: `priyanxhukushwaha/BLINK`*

---

## 📌 Project Overview & Status Summary

| Area | Status | Completion | Summary |
|---|:---:|:---:|---|
| **Foundation & Design System** | ✅ Complete | 100% | Vite, React 18, TypeScript (strict), Tailwind CSS neon tokens, Glassmorphism, Plus Jakarta Sans. |
| **Reusable Component Library** | ✅ Complete | 100% | `ProfileView`, `NeonAvatar`, `GlassCard`, `GlowButton`, `StatusBar`, `BackButton`, `BottomNav`, `ResponsiveContainer`. |
| **VFX & Expiration Engine** | ✅ Complete | 100% | Wall-clock epoch expiration math, HTML5 Canvas glowing particle disintegration engine. |
| **Approved UI Screens (12 Total)** | 🔄 In Progress | 67% (8 of 12 complete) | Screens 1, 2, 3, 4, 5, 7, 8, 9 complete. Screens 6, 10, 11, 12 pending. |
| **Client-Side Demo State & Persistence** | ✅ Complete | 100% | `localStorage` persistence with quota error handling, boot expiration purge, and read receipt simulation. |
| **Backend & Real-Time Server** | ⏳ Future Phase | 0% | Planned for future development (WebSockets, Redis TTL, E2EE). |

---

## 📱 The 12 Approved Screens: Detailed Status

### [x] Screen 1: Splash Screen (`src/screens/01_SplashScreen.tsx`)
- [x] Dual-tone pulsing neon infinity logo (`#C084FC` to `#22D3EE`).
- [x] Tracking typography `EPHEMERAL` (`tracking-[0.25em]`).
- [x] Brand tagline: *"Be present. Leave no history."* & *"Conversations for the moment."*
- [x] Automated transition to Onboarding after 2.8 seconds.
- [x] Instant tap-to-skip gesture.
- [x] Top device `StatusBar`.

### [x] Screen 2: Onboarding — Introduction (`src/screens/02_OnboardingIntro.tsx`)
- [x] 3D glassmorphic floating chat bubble with glowing clock badge.
- [x] Floating stars and ambient particle dust.
- [x] Headline: *"Chat Freely, It Disappears"*.
- [x] Subtitle: *"Send messages, share moments, and let them fade — automatically."*
- [x] Two-step carousel indicator (Step 1 active).
- [x] *"Skip"* button (navigates directly to Home).
- [x] *"Get Started →"* gradient glow pill button.

### [x] Screen 3: Onboarding — Features (`src/screens/03_OnboardingFeatures.tsx`)
- [x] Three glassmorphism feature cards:
  - [x] **Privacy First:** Shield icon, *"No history, No backups."*
  - [x] **Your Time, Your Chat:** Clock icon, *"Messages delete automatically (1 min – 60 min)."*
  - [x] **Chat Together:** Users icon, *"Private & group rooms with full control."*
- [x] Two-step carousel indicator (Step 2 active).
- [x] *"Continue"* gradient glow pill button (navigates to Home).

### [x] Screen 4: Home — Conversation Rooms & Friends (`src/screens/04_HomeRooms.tsx`)
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

### [x] Screen 5: My Profile & Friend Profile (`src/screens/05_MyProfile.tsx` & `src/screens/FriendProfileScreen.tsx`)
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

### [ ] Screen 6: Settings (`src/screens/06_Settings.tsx`) — PENDING
- [ ] Header with back navigation to Home.
- [ ] Grouped glassmorphism setting sections:
  - [ ] **Account:** Edit username, display name, profile avatar.
  - [ ] **Chat & Rooms:** Default message expiration timer (1m, 5m, 15m, 30m, 60m), auto-delete read receipts.
  - [ ] **Notifications:** Private notification alert toggles, sound chimes, haptics.
  - [ ] **Privacy & Security:** Clear local storage cache, view privacy policy, data deletion.
  - [ ] **Appearance:** Neon accent colors (Purple, Violet, Cyan), ambient glow intensity.
  - [ ] **About:** Version info (v1.0.0), ephemeral protocol philosophy, open-source acknowledgments.

### [x] Screen 7: Private Chat Room (`src/screens/07_PrivateChatRoom.tsx`)
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
- [x] Integrated `ChatInputBar` with photo attachment support.

### [x] Screen 8: Group Chat Room (`src/features/chat/screens/08_GroupChatRoom.tsx`)
- [x] Header:
  - [x] Back button to Home.
  - [x] Group Avatar (independent click opens Group Admin Profile).
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

### [x] Screen 9: Message Timer Modal (`src/screens/09_MessageTimerModal.tsx`)
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

### [ ] Screen 10: Invite Friends Screen (`src/screens/10_InviteFriends.tsx`) — PENDING
- [ ] Top header with back navigation.
- [ ] Hero illustration: Glowing neon purple & cyan chain link graphic with celestial particle dust.
- [ ] Headline: *"Invite Friends"* & subtext *"Share your invite link with friends and start a temporary chat."*
- [ ] Share Link Glass Card: `ephemeral.app/invite/pkdev` with one-tap copy button and visual confirmation.
- [ ] Full-width *"Share Link"* button triggering `navigator.share` (with clipboard fallback).
- [ ] Ephemeral QR Code preview for in-person scanning.

### [ ] Screen 11: Private Notifications (`src/screens/11_PrivateNotifications.tsx`) — PENDING
- [ ] Top header with back navigation.
- [ ] Hero illustration: Glowing neon purple acoustic bell graphic with ripple waves.
- [ ] Realistic system notification banner mockup:
  - [ ] App brandmark + "now" timestamp.
  - [ ] Text: *"Aryan sent you a message."* (Strictly zero message preview).
- [ ] Privacy Reassurance Card:
  - [ ] Crossed-out bell / silent shield glyph.
  - [ ] Copy: *"No message preview. Your conversations stay private."*
- [ ] Interactive demo toggle: "Trigger Test Notification" to preview the banner live.

### [ ] Screen 12: Message Disappearing Animation Showcase (`src/screens/12_MessageDisappearingDemo.tsx`) — PENDING
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
| `AmbientGlowBackground` | `src/components/common/AmbientGlowBackground.tsx` | Ambient purple/magenta/cyan blur orbs, fluid neon SVG wave. | [x] Complete |
| `GlassCard` | `src/components/common/GlassCard.tsx` | Frosted glass panel, hover glow, border variants (`default`, `elevated`, `subtle`, `danger`). | [x] Complete |
| `GlowButton` | `src/components/common/GlowButton.tsx` | Gradient pill button, hover glow shadow, haptic active press, icon slots. | [x] Complete |
| `NeonAvatar` | `src/components/common/NeonAvatar.tsx` | Neon glowing borders, sizes (`xs` to `2xl`), decoupled click handlers, gradient initials fallback. | [x] Complete |
| `ProfileView` | `src/components/common/ProfileView.tsx` | Unified profile renderer for User Profile and Friend/Admin Profile, copy ID with feedback. | [x] Complete |
| `StatusBar` | `src/components/common/StatusBar.tsx` | Dynamic wall-clock time, cellular bars, Wi-Fi icon, battery indicator. | [x] Complete |
| `BackButton` | `src/components/common/BackButton.tsx` | Touch-friendly glass navigation button. | [x] Complete |
| `BottomNav` | `src/components/layout/BottomNav.tsx` | Floating glass dock with glowing active indicators and center `(+)` glowing action button. | [x] Complete |
| `ResponsiveContainer` | `src/components/layout/ResponsiveContainer.tsx` | Responsive layout (edge-to-edge mobile, centered `max-w-[430px]` desktop shell). | [x] Complete |
| `FloatingMessage` | `src/components/chat/FloatingMessage.tsx` | Bubble-less floating message text, wall-clock countdown, status ticks (`Sent (Demo)`, `Read (Demo)`), simulate read trigger, particle hook. | [x] Complete |
| `ChatInputBar` | `src/components/chat/ChatInputBar.tsx` | Glass text input pill, 2 MB image file validator, demo photo preset, glowing send button, quota error banner. | [x] Complete |
| `ParticleDisintegration` | `src/components/chat/ParticleDisintegration.tsx` | HTML5 Canvas vector particle burst on expiration, 60fps `requestAnimationFrame` loop, `onComplete` lifecycle. | [x] Complete |
| `DevScreenSwitcher` | `src/components/dev/DevScreenSwitcher.tsx` | Development harness for 12-screen jumping (`Ctrl + Shift + D` or bottom-right pill). | [x] Complete |

---

## ⚙️ Core Logic, Contexts & Utilities Matrix

### `src/utils/expiration.ts`
- [x] `calculateExpirationTime(message: Message): number`: Computes exact expiration timestamp enforcing the 60-minute ceiling: `min(sentAt + 60m, firstReadAt ? firstReadAt + timerDuration : sentAt + 60m)`.
- [x] `getRemainingTimeMs(message: Message, now?: number): number`: Wall-clock difference (`expiresAt - Date.now()`). Never resets on page refresh.
- [x] `formatRemainingTime(remainingMs: number): string`: Formats time to `5m`, `45s`, `1h`, or `0s`.
- [x] `isMessageExpired(message: Message, now?: number): boolean`: Checks if `getRemainingTimeMs <= 0`.

### `src/utils/particlePhysics.ts`
- [x] `createParticlesAt(x, y, width, height, count)`: Generates 85–120 particles with random velocity, upward float, and neon color palette.
- [x] `updateAndRenderParticles(ctx, particles)`: Calculates drag friction (`0.96`), decay, canvas glow shadow (`shadowBlur: 8`), and alpha blending.

### `src/context/ChatContext.tsx`
- [x] `sendMessage(roomId, text, photoUrl)`: Appends outgoing message with unread default (`firstReadAt = null`) and safe `localStorage` persistence.
- [x] `simulateRecipientRead(roomId, messageId)`: Sets `firstReadAt = Date.now()` and updates status to `Read (Demo)`.
- [x] `markIncomingAsRead(roomId)`: Locks `firstReadAt` for incoming messages upon opening the chat room.
- [x] `evictExpiredMessage(roomId, messageId)`: Coordinated eviction invoked strictly after canvas particle animation finishes.
- [x] `setRoomTimer(roomId, minutes)`: Updates room expiration timer and persists to `localStorage`.
- [x] `setDefaultTimer(minutes)`: Updates user profile default timer.
- [x] `getFriendById(friendId)` & `getRoomById(roomId)`: Entity lookup helpers.
- [x] `safeSaveToLocalStorage(data)`: Catches `QUOTA_EXCEEDED_ERR` gracefully without corrupting messages.
- [x] `clearStorageError()`: Dismisses storage alert banners.

### `src/context/NavigationContext.tsx`
- [x] `navigateTo(screen, params)`: Navigates to target screen with optional `roomId` or `friendId`.
- [x] `goBack()`: History stack traversal with fallback to Home.
- [x] `setActiveNavTab(tab)`: Synchronizes bottom dock active state.
- [x] `toggleDevMode()`: Toggles the development screen switcher (`Ctrl + Shift + D`).

---

## 📋 Outstanding Tasks Checklist (What Remains To Be Done)

### Phase A: Complete Remaining UI Screens (Next Priority)
- [ ] **Milestone 2: Screen 8 (Group Chat Room)**
  - [ ] Create `src/screens/08_GroupChatRoom.tsx`.
  - [ ] Implement multi-user floating text stream for *Late Night Crew 🌙*.
  - [ ] Connect group avatar to open Group Admin profile (`Meera`).
  - [ ] Wire "First seen, starts timer" active group countdowns.
  - [ ] Wire `08_GroupChatRoom.tsx` into `src/App.tsx`.
- [ ] **Milestone 3: Screen 10 (Invite Friends)**
  - [ ] Create `src/screens/10_InviteFriends.tsx`.
  - [ ] Render neon chain link illustration.
  - [ ] Implement copy link chip with clipboard feedback.
  - [ ] Wire `10_InviteFriends.tsx` into `src/App.tsx`.
- [ ] **Milestone 4: Screen 11 (Private Notifications)**
  - [ ] Create `src/screens/11_PrivateNotifications.tsx`.
  - [ ] Render neon acoustic bell illustration.
  - [ ] Implement notification banner mockup (*"No message preview"*).
  - [ ] Wire `11_PrivateNotifications.tsx` into `src/App.tsx`.
- [ ] **Milestone 5: Screen 12 (Message Disappearing Showcase)**
  - [ ] Create `src/screens/12_MessageDisappearingDemo.tsx`.
  - [ ] Implement 4-stage interactive animation stepper.
  - [ ] Add interactive "Trigger Vanish" tester button.
  - [ ] Wire `12_MessageDisappearingDemo.tsx` into `src/App.tsx`.
- [ ] **Milestone 6: Screen 6 (Settings)**
  - [ ] Create `src/screens/06_Settings.tsx`.
  - [ ] Implement Account, Chat, Notifications, Privacy, Appearance, and About rows.
  - [ ] Add "Clear Demo Storage" button.
  - [ ] Wire `06_Settings.tsx` into `src/App.tsx`.

### Phase B: Polish & Verification
- [ ] Test full navigation flow across all 12 completed screens.
- [ ] Verify zero console warnings across all user journeys.
- [ ] Verify production build (`npm run build`).
- [ ] Commit and push progress to GitHub (`main` branch).

### Phase C: Future Backend Integration (Post-Frontend Phase)
- [ ] WebSocket server for true real-time message transport.
- [ ] Server-authoritative expiration ticker with Redis TTL.
- [ ] User authentication with public/private cryptographic keypairs.
- [ ] End-to-End Encryption protocol (Signal Protocol / Olm).
- [ ] Media CDN for encrypted temporary photo storage.
- [ ] Push notifications service with privacy-first payloads.

---

*This file will be updated after each completed milestone.*
