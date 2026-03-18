export type UserRole = 'admin' | 'user';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: string;
  userRole: UserRole;
}

export interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemo: (role?: UserRole) => Promise<void>;
  clearError: () => void;
}
