import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { UserRole, Voyage, FleetOverview } from '@/types';
import { getUserRole, setUserRole } from '@/utils/role';

interface AppState {
  userRole: UserRole;
  currentVoyage: Voyage | null;
  unreadMessageCount: number;
  fleetOverview: FleetOverview | null;
}

type AppAction =
  | { type: 'SET_USER_ROLE'; payload: UserRole }
  | { type: 'SET_CURRENT_VOYAGE'; payload: Voyage | null }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'DECREMENT_UNREAD_COUNT' }
  | { type: 'SET_FLEET_OVERVIEW'; payload: FleetOverview | null };

const initialState: AppState = {
  userRole: 'crew',
  currentVoyage: null,
  unreadMessageCount: 0,
  fleetOverview: null
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER_ROLE':
      setUserRole(action.payload);
      return { ...state, userRole: action.payload };
    case 'SET_CURRENT_VOYAGE':
      return { ...state, currentVoyage: action.payload };
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadMessageCount: action.payload };
    case 'DECREMENT_UNREAD_COUNT':
      return { ...state, unreadMessageCount: Math.max(0, state.unreadMessageCount - 1) };
    case 'SET_FLEET_OVERVIEW':
      return { ...state, fleetOverview: action.payload };
    default:
      return state;
  }
};

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const role = getUserRole();
    dispatch({ type: 'SET_USER_ROLE', payload: role });
    console.log('[AppContext] 初始化用户角色:', role);
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
