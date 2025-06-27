export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  permissions: Permission[];
  lastLoginAt?: string;
  emailVerifiedAt?: string;
  profilePicture?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  bio?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
  deviceInfo: string;
  ipAddress: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  roleId: string;
  invitedById: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weekStartsOn: number;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export interface AuthState {
  user: User | null;
  session: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  permissions: string[];
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  invitationToken?: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}
</parameter>