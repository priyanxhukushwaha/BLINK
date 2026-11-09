import React, { createContext, useContext, useState, useEffect } from 'react';
import { ScreenId, BottomNavTab, NavigationState } from '../types/navigation';

interface NavigationContextType extends NavigationState {
  navigateTo: (screen: ScreenId, params?: { roomId?: string; friendId?: string }) => void;
  goBack: () => void;
  setActiveNavTab: (tab: BottomNavTab) => void;
  toggleDevMode: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<ScreenId[]>(['splash']);
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('splash');
  const [activeRoomId, setActiveRoomId] = useState<string | undefined>('room-late-night');
  const [selectedFriendId, setSelectedFriendId] = useState<string | undefined>('user-aryan');
  const [activeNavTab, setActiveNavTab] = useState<BottomNavTab>('home');
  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('dev') === 'true';
    }
    return false;
  });

  // Toggle dev mode via Ctrl+Shift+D keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsDevMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateTo = (
    screen: ScreenId,
    params?: { roomId?: string; friendId?: string }
  ) => {
    if (params?.roomId) setActiveRoomId(params.roomId);
    if (params?.friendId) setSelectedFriendId(params.friendId);

    setHistory((prev) => [...prev, screen]);
    setCurrentScreen(screen);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const previous = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setCurrentScreen(previous);
    } else {
      // Default fallback
      setCurrentScreen('home-rooms');
    }
  };

  const toggleDevMode = () => setIsDevMode((prev) => !prev);

  return (
    <NavigationContext.Provider
      value={{
        currentScreen,
        previousScreen: history[history.length - 2],
        activeRoomId,
        selectedFriendId,
        activeNavTab,
        isDevMode,
        navigateTo,
        goBack,
        setActiveNavTab,
        toggleDevMode,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

