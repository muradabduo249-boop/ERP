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
  addUser: (user: User, pinOrPassword?: string) => Promise<User>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<User>;
  deleteUser: (userId: string) => Promise<boolean>;
  updateProfile: (data: { name?: string; phone?: string; email?: string }) => Promise<void>;
  changePassword: (currentSecret: string, newSecret: string) => Promise<void>;
  refreshData: () => Promise<void>;
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

  // Validate server session on mount with authoritative /api/auth/me or standalone fallback
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUserId = localStorage.getItem(AUTH_STORAGE_KEY);

    if (token) {
      // If session was authenticated via standalone engine (e.g. on static Vercel)
      if (token.startsWith('sahla_standalone_token_') && storedUserId) {
        const engineUser = erpEngine.getUsers().find((u) => u.id === storedUserId);
        if (engineUser && engineUser.id !== 'guest') {
          setCurrentUser(engineUser);
          setIsAuthenticated(true);
          setSessionToken(token);
          return;
        }
      }

      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            throw new Error('Non-JSON response from server');
          }
          return res.json();
        })
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
            setTimeout(() => {
              refreshData();
            }, 50);
          } else {
            // Check if user exists in local erpEngine as fallback
            if (storedUserId) {
              const engineUser = erpEngine.getUsers().find((u) => u.id === storedUserId);
              if (engineUser && engineUser.id !== 'guest') {
                setCurrentUser(engineUser);
                setIsAuthenticated(true);
                return;
              }
            }
            setIsAuthenticated(false);
            setSessionToken(null);
            setCurrentUser(GUEST_USER);
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        })
        .catch(() => {
          // If server error or offline or on Vercel without DB, fallback to stored engine user
          if (storedUserId) {
            const engineUser = erpEngine.getUsers().find((u) => u.id === storedUserId);
            if (engineUser && engineUser.id !== 'guest') {
              setCurrentUser(engineUser);
              setIsAuthenticated(true);
              setSessionToken(token);
              return;
            }
          }
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
    if (token && !token.startsWith('sahla_standalone_token_')) {
      try {
        const [meRes, deptsRes, rolesRes, usersRes] = await Promise.all([
          fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
          fetch('/api/departments', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
          fetch('/api/roles', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
          fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        ]);

        if (meRes && meRes.ok && meRes.headers.get('content-type')?.includes('application/json')) {
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
        if (deptsRes && deptsRes.ok && deptsRes.headers.get('content-type')?.includes('application/json')) {
          const dData = await deptsRes.json();
          if (dData.success && dData.data && dData.data.length > 0) {
            setDepartments(dData.data);
          }
        }
        if (rolesRes && rolesRes.ok && rolesRes.headers.get('content-type')?.includes('application/json')) {
          const rData = await rolesRes.json();
          if (rData.success && rData.data && rData.data.length > 0) {
            setRoles(rData.data);
          }
        }
        if (usersRes && usersRes.ok && usersRes.headers.get('content-type')?.includes('application/json')) {
          const uData = await usersRes.json();
          if (uData.success && Array.isArray(uData.data)) {
            const mappedUsers: User[] = uData.data.map((u: any) => ({
              id: u.id,
              username: u.username,
              email: u.email,
              name: u.name,
              phone: u.phone || '',
              departmentId: u.departmentId || 'dept-mgmt-001',
              departmentCode: u.departmentCode || 'MANAGEMENT',
              departmentNameAr: u.departmentNameAr || 'الإدارة العامة',
              roleId: u.roleId || 'role-viewer',
              roleCode: u.roleCode || 'viewer',
              roleNameAr: u.roleNameAr || 'مستعرض',
              status: u.status || 'active',
              allowedModules: u.allowedModules || ['dashboard', 'requests_backbone'],
              createdAt: u.createdAt || new Date().toISOString(),
            }));
            setUsers(mappedUsers);
            erpEngine.syncUsersFromBackend(mappedUsers);
            return;
          }
        }
      } catch (err) {
        console.warn('refreshData backend sync notice:', err);
      }
    }

    const updatedUsers = erpEngine.getUsers();
    setUsers(updatedUsers);
  };

  const login = async (loginId: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    let backendFailed = false;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginId, password: pin }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
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

          setTimeout(() => {
            refreshData();
          }, 50);

          return { success: true };
        } else if (!response.ok) {
          const errMsg = data?.error?.message || '';
          const isDbQueryError =
            errMsg.includes('Failed query') ||
            errMsg.includes('select') ||
            errMsg.includes('from') ||
            errMsg.includes('params:') ||
            errMsg.includes('connect') ||
            errMsg.includes('database') ||
            errMsg.includes('users') ||
            errMsg.includes('ECONNREFUSED') ||
            response.status >= 500;

          if (isDbQueryError) {
            backendFailed = true;
          } else {
            // Also test if local engine can authenticate the user immediately
            const localUser = erpEngine.authenticateUser(loginId, pin);
            if (localUser) {
              backendFailed = true;
            } else {
              return { success: false, error: 'اسم المستخدم أو رمز PIN غير صحيح' };
            }
          }
        } else {
          backendFailed = true;
        }
      } else {
        // Returned HTML (e.g. Vercel 404 "The page could not be found")
        backendFailed = true;
      }
    } catch {
      backendFailed = true;
    }

    // Graceful Standalone Fallback for Vercel/Static Deployments:
    // If backend is not available or returned non-JSON, fall back seamlessly to client-side erpEngine!
    if (backendFailed) {
      const engineUser = erpEngine.authenticateUser(loginId, pin);
      if (engineUser) {
        setCurrentUser(engineUser);
        setIsAuthenticated(true);
        const token = `sahla_standalone_token_${engineUser.id}`;
        setSessionToken(token);
        try {
          localStorage.setItem(AUTH_TOKEN_KEY, token);
          localStorage.setItem(AUTH_STORAGE_KEY, engineUser.id);
        } catch {}

        setTimeout(() => {
          refreshData();
        }, 50);

        return { success: true };
      }
      return { success: false, error: 'اسم المستخدم أو رمز PIN غير صحيح' };
    }

    return { success: false, error: 'فشل الاتصال بخادم المصادقة المركزي' };
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

  const addUser = async (newUser: User, pinOrPassword?: string): Promise<User> => {
    if (!currentUser) throw new Error('Not authenticated');
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUser.username,
          email: newUser.email,
          password: pinOrPassword || newUser.pin || '1234',
          name: newUser.name,
          phone: newUser.phone,
          departmentId: newUser.departmentId,
          departmentCode: newUser.departmentCode,
          roleId: newUser.roleId,
          roleCode: newUser.roleCode,
          allowedModules: newUser.allowedModules,
          status: newUser.status,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'فشل حفظ الموظف في قاعدة البيانات');
      }
      if (data.data?.id) {
        newUser.id = data.data.id;
      }
    }
    const added = erpEngine.addUser(newUser, currentUser);
    await refreshData();
    return added;
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
    if (!currentUser) throw new Error('Not authenticated');
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      const payload: Record<string, any> = {
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        departmentId: updates.departmentId,
        departmentCode: updates.departmentCode,
        roleId: updates.roleId,
        roleCode: updates.roleCode,
        status: updates.status,
        allowedModules: updates.allowedModules,
      };
      if (updates.username) {
        payload.username = updates.username;
      }
      if (updates.pin && updates.pin.trim().length >= 3) {
        payload.password = updates.pin.trim();
      }

      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'فشل تحديث بيانات الموظف في قاعدة البيانات');
      }
    }
    const engineUpdates = { ...updates };
    if (!engineUpdates.pin || engineUpdates.pin.trim().length === 0) {
      delete engineUpdates.pin;
    }
    const updated = erpEngine.updateUser(userId, engineUpdates, currentUser);
    await refreshData();
    return updated;
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    if (!currentUser) throw new Error('Not authenticated');
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'فشل حذف الموظف من قاعدة البيانات');
      }
    }
    const deleted = erpEngine.deleteUser(userId, currentUser);
    await refreshData();
    return deleted;
  };

  const updateProfile = async (data: { name?: string; phone?: string; email?: string }): Promise<void> => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) throw new Error('غير مسجل دخول');
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!resData.success) {
      throw new Error(resData.error?.message || 'فشل تحديث الملف الشخصي');
    }
    await refreshData();
  };

  const changePassword = async (currentSecret: string, newSecret: string): Promise<void> => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) throw new Error('غير مسجل دخول');
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword: currentSecret, newPassword: newSecret }),
    });
    const resData = await res.json();
    if (!resData.success) {
      throw new Error(resData.error?.message || 'فشل تغيير كلمة المرور');
    }
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
        updateProfile,
        changePassword,
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
