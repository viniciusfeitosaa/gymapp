import type { UserType } from '../types';

export function dashboardPathForUserType(userType: UserType): string {
  return userType === 'personal' ? '/personal/home' : '/student/dashboard';
}
