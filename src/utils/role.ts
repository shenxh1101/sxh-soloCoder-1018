import Taro from '@tarojs/taro';
import type { UserRole } from '@/types';

export const ROLE_STORAGE_KEY = 'water_transport_user_role';

export const setUserRole = (role: UserRole): void => {
  try {
    Taro.setStorageSync(ROLE_STORAGE_KEY, role);
    console.log('[Role] 用户角色已设置:', role);
  } catch (error) {
    console.error('[Role] 设置用户角色失败:', error);
  }
};

export const getUserRole = (): UserRole => {
  try {
    const role = Taro.getStorageSync(ROLE_STORAGE_KEY);
    if (role === 'crew' || role === 'dispatcher') {
      return role;
    }
    return 'crew';
  } catch (error) {
    console.error('[Role] 获取用户角色失败:', error);
    return 'crew';
  }
};

export const isCrew = (): boolean => {
  return getUserRole() === 'crew';
};

export const isDispatcher = (): boolean => {
  return getUserRole() === 'dispatcher';
};

export const toggleRole = (): UserRole => {
  const currentRole = getUserRole();
  const newRole: UserRole = currentRole === 'crew' ? 'dispatcher' : 'crew';
  setUserRole(newRole);
  return newRole;
};

export const getRoleText = (role: UserRole): string => {
  const texts: Record<UserRole, string> = {
    crew: '船员',
    dispatcher: '调度员'
  };
  return texts[role];
};
