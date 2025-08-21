export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'employee' | 'manager';
  company?: string;
  phone?: string;
  joinDate?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  position: string;
  department: string;
  phone: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isManager: boolean;
}


