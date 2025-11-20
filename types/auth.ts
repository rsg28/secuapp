export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'employee' | 'manager';
  company?: string;
  phone?: string;
  profile_image_url?: string;
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
  register: (params: { firstName: string; lastName: string; email: string; password: string; phone: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  isManager: boolean;
  userCompanies: any[];
  currentCompany: any | null;
  hasMultipleCompanies: boolean;
  getCurrentCompany: () => any | null;
  changeCurrentCompany: (company: any) => void;
  loadUserCompanies: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (profileData: { first_name?: string; last_name?: string; phone?: string; profile_image_url?: string }) => Promise<any>;
}


