export type ScreenId =
  | 'splash'
  | 'onboarding-intro'
  | 'onboarding-features'
  | 'home-rooms'
  | 'my-profile'
  | 'friend-profile'
  | 'settings'
  | 'private-chat'
  | 'group-chat'
  | 'message-timer'
  | 'invite-friends'
  | 'private-notifications'
  | 'message-disappearing';

export type BottomNavTab = 'home' | 'rooms' | 'create' | 'chat' | 'profile';

export interface NavigationState {
  currentScreen: ScreenId;
  previousScreen?: ScreenId;
  activeRoomId?: string;
  selectedFriendId?: string;
  activeNavTab: BottomNavTab;
  isDevMode: boolean; // strictly for development inspection
}

