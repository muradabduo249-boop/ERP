import React, { createContext, useContext, useState, useEffect } from 'react';
import { Department, PermissionCode, Role, User } from '../../types';
import { erpEngine } from '../engine/erpEngine';
import {
  canUserViewFinancials,
  canUserViewCustoms,
  canUserViewProcurement,
  isUserAllowedRequestSubTab,
  getEffectiveRole,
  RoleConfig,
} from '../security/rbacPolicy';

const AUTH_STORAGE_KEY = 'sahla_erp_auth_session_active_v1';
const AUTH_TOKEN_KEY = 'sahla_erp_auth_token_v1';

export const GUEST_USER: User = {
  id: 'guest',
  name: 'غير مسجل دخول',
  username: 'guest',
  email: 'guest@sahla.sd',
  phone: '',
  departmentId: 'dept-mgmt-001',
  roleId: 'role-viewer',
  roleCode: 'viewer',
  roleNameAr: 'زائر',
  departmentCode: 'MANAGEMENT',
  departmentNameAr: 'غير محدد',
  status: 'inactive',
  allowedModules: [],
  createdAt: '',
};

interface ErpAuthContextType {
  currentUser: User;
  sessionToken: string | null;
  isAuthenticated: boolean;
  users: User[];
  departments: Department[];
  roles: Role[];
  effectiveRole: RoleConfig;
  canViewFinancials: boolean;
  canViewCustoms: boolean;
  canViewProcurement: boolean;
  isRequestSubTabAllowed: (
    subTabId: 'overview' | 'procurement' | 'finance' | 'operations' | 'attachments' | 'audit'
  ) => boolean;
  login: (loginId: string, pin: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  logout: () => void;
  setCurrentUser: (user: User) => void;
  switchUserById: (userId: string) => void;
  isModuleAllowed: (moduleId: string) => boolean;
  hasPermission: (permission: PermissionCode) => boolean;
  addUser: (user: User) => User;
  updateUser: (userId: string, updates: Partial<User>) => User;
  deleteUser: (userId: string) => boolean;
  refreshData: () => void;
}

const ErpAuthContext = createContext<ErpAuthContextType | undefined>(undefined);

export const ErpAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const allUsers = erpEngine.getUsers();
  
  // Strict initial state: Unauthenticated guest by default unless valid server token exists
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const savedUserId = localStorage.getItem(AUTH_STORAGE_KEY);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (savedUserId && token) {
        const found = allUsers.find((u) => u.id === savedUserId && u.status === 'active');
        if (found) return found;
      }
    } catch {}
    return GUEST_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedUserId = localStorage.getItem(AUTH_STORAGE_KEY);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token && savedUserId) {
        return !!allUsers.find((u) => u.id === savedUserId && u.status === 'active');
      }
    } catch {}
    return false; // Show Login Screen by default on first load
  });

  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [departments, setDepartments] = useState<Department[]>(erpEngine.getDepartments());
  const [roles, setRoles] = useState<Role[]>(erpEngine.getRoles());
  const [users, setUsers] = useState<User[]>(allUsers);

  // Validate server session on mount with authoritative /api/auth/me
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const serverUser = data.data;
            const mappedUser: User = {
              id: serverUser.id,
              username: serverUser.username,
              email: serverUser.email,
              name: serverUser.name,
              phone: serverUser.phone || '',
              departmentId: serverUser.department?.id || 'dept-mgmt-001',
              departmentCode: serverUser.department?.code || 'MANAGEMENT',
              departmentNameAr: serverUser.department?.nameAr || 'الإدارة العامة',
              roleId: serverUser.role?.id || 'role-superadmin',
              roleCode: serverUser.role?.code || 'super_admin',
              roleNameAr: serverUser.role?.nameAr || 'المدير العام',
              status: serverUser.status || 'active',
              allowedModules: serverUser.allowedModules || ['dashboard', 'requests_backbone'],
              createdAt: new Date().toISOString(),
            };
            setCurrentUser(mappedUser);
            setIsAuthenticated(true);
            setSessionToken(token);
          } else {
            // Session expired or invalid on server
            setIsAuthenticated(false);
            setSessionToken(null);
            setCurrentUser(GUEST_USER);
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        })
        .catch(() => {
          // If server error or offline, reject unverified session
          setIsAuthenticated(false);
          setSessionToken(null);
          setCurrentUser(GUEST_USER);
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        });
    } else {
      setIsAuthenticated(false);
      setSessionToken(null);
      setCurrentUser(GUEST_USER);
    }
  }, []);

  const refreshData = async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      try {
        const [meRes, deptsRes, rolesRes] = await Promise.all([
          fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/departments', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/roles', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.data) {
            const serverUser = meData.data;
            setCurrentUser((prev) => ({
              ...prev,
              id: serverUser.id,
              name: serverUser.name,
              status: serverUser.status,
              allowedModules: serverUser.allowedModules || prev.allowedModules,
            }));
          }
        }
        if (deptsRes.ok) {
          const dData = await deptsRes.json();
          if (dData.success && dData.data && dData.data.length > 0) {
            setDepartments(dData.data);
          }
        }
        if (rolesRes.ok) {
          const rData = await rolesRes.json();
          if (rData.success && rData.data && rData.data.length > 0) {
            setRoles(rData.data);
          }
        }
      } catch {}
    }

    const updatedUsers = erpEngine.getUsers();
    setUsers(updatedUsers);
  };

  const login = async (loginId: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginId, password: pin }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.data) {
        const { user: serverUser, token } = data.data;
        const mappedUser: User = {
          id: serverUser.id,
          username: serverUser.username,
          email: serverUser.email,
          name: serverUser.name,
          phone: serverUser.phone || '',
          departmentId: serverUser.department?.id || 'dept-mgmt-001',
          departmentCode: serverUser.department?.code || 'MANAGEMENT',
          departmentNameAr: serverUser.department?.nameAr || 'الإدارة العامة',
          roleId: serverUser.role?.id || 'role-superadmin',
          roleCode: serverUser.role?.code || 'super_admin',
          roleNameAr: serverUser.role?.nameAr || 'المدير العام',
          status: serverUser.status || 'active',
          allowedModules: serverUser.allowedModules || ['dashboard', 'requests_backbone'],
          createdAt: new Date().toISOString(),
        };

        setCurrentUser(mappedUser);
        setIsAuthenticated(true);
        setSessionToken(token);
        try {
          localStorage.setItem(AUTH_TOKEN_KEY, token);
          localStorage.setItem(AUTH_STORAGE_KEY, mappedUser.id);
        } catch {}

        return { success: true };
      } else {
        return { success: false, error: data.error?.message || 'اسم المستخدم أو رمز PIN غير صحيح' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل الاتصال بخادم المصادقة المركزي' };
    }
  };

  const logout = () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }

    setIsAuthenticated(false);
    setSessionToken(null);
    setCurrentUser(GUEST_USER);
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
  };

  const switchUserById = () => {
    // Unconditionally require logging out to switch user with valid credentials
    logout();
  };

  const isModuleAllowed = (moduleId: string): boolean => {
    if (!isAuthenticated) return false;
    return erpEngine.isModuleAllowed(currentUser, moduleId);
  };

  const hasPermission = (permission: PermissionCode): boolean => {
    if (!isAuthenticated) return false;
    return erpEngine.checkPermission(currentUser, permission);
  };

  const addUser = (newUser: User): User => {
    if (!currentUser) throw new Error('Not authenticated');
    const added = erpEngine.addUser(newUser, currentUser);
    refreshData();
    return added;
  };

  const updateUser = (userId: string, updates: Partial<User>): User => {
    if (!currentUser) throw new Error('Not authenticated');
    const updated = erpEngine.updateUser(userId, updates, currentUser);
    refreshData();
    return updated;
  };

  const deleteUser = (userId: string): boolean => {
    if (!currentUser) throw new Error('Not authenticated');
    const deleted = erpEngine.deleteUser(userId, currentUser);
    refreshData();
    return deleted;
  };

  const effectiveRole = getEffectiveRole(currentUser);
  const canViewFinancials = canUserViewFinancials(currentUser);
  const canViewCustoms = canUserViewCustoms(currentUser);
  const canViewProcurement = canUserViewProcurement(currentUser);
  const isRequestSubTabAllowed = (
    subTabId: 'overview' | 'procurement' | 'finance' | 'operations' | 'attachments' | 'audit'
  ): boolean => {
    return isUserAllowedRequestSubTab(currentUser, subTabId);
  };

  return (
    <ErpAuthContext.Provider
      value={{
        currentUser,
        sessionToken,
        isAuthenticated,
        users,
        departments,
        roles,
        effectiveRole,
        canViewFinancials,
        canViewCustoms,
        canViewProcurement,
        isRequestSubTabAllowed,
        login,
        logout,
        setCurrentUser,
        switchUserById,
        isModuleAllowed,
        hasPermission,
        addUser,
        updateUser,
        deleteUser,
        refreshData,
      }}
    >
      {children}
    </ErpAuthContext.Provider>
  );
};

export const useErpAuth = (): ErpAuthContextType => {
  const context = useContext(ErpAuthContext);
  if (!context) {
    throw new Error('useErpAuth must be used within an ErpAuthProvider');
  }
  return context;
};
