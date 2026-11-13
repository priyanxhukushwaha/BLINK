import React, { createContext, useContext } from 'react';
import { useRooms } from '../hooks/useRooms';
import type { ConversationRoom, TimerOptionMinutes } from '@/features/chat';

export interface RoomsContextType {
  rooms: ConversationRoom[];
  activeRoomTimer: TimerOptionMinutes;
  setRoomTimer: (roomId: string, minutes: TimerOptionMinutes) => Promise<void> | void;
  getRoomById: (roomId: string) => ConversationRoom | undefined;
  ensurePrivateRoom: (friendId: string) => Promise<string | null>;
}

export const RoomsContext = createContext<RoomsContextType | undefined>(undefined);

export const RoomsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const roomsState = useRooms();

  return (
    <RoomsContext.Provider value={roomsState}>
      {children}
    </RoomsContext.Provider>
  );
};

export const useRoomsContext = (): RoomsContextType => {
  const context = useContext(RoomsContext);
  if (!context) {
    throw new Error('useRoomsContext must be used within a RoomsProvider');
  }
  return context;
};

