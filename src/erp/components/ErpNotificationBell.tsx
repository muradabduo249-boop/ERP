import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  UserCheck,
  AlertTriangle,
  GitBranch,
  ShieldCheck,
  X,
  ExternalLink,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'assignment' | 'status_change' | 'approval' | 'task_deadline' | 'system';
  entityType: 'request' | 'task';
  entityId: string;
  isRead: boolean;
  readAt?: string | null;
  metadata?: any;
  createdAt: string;
}

export const ErpNotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('sahla_auth_token') || sessionStorage.getItem('sahla_auth_token');
      if (!token) return;

      const res = await fetch('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      }
    } catch {
      // Background poll failure handled gracefully
    }
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sahla_auth_token') || sessionStorage.getItem('sahla_auth_token');
      if (!token) return;

      const url = filter === 'unread' ? '/api/notifications?unreadOnly=true' : '/api/notifications';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setNotifications(data.data);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem('sahla_auth_token') || sessionStorage.getItem('sahla_auth_token');
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('sahla_auth_token') || sessionStorage.getItem('sahla_auth_token');
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'assignment':
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      case 'status_change':
        return <GitBranch className="w-4 h-4 text-amber-500" />;
      case 'approval':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'task_deadline':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays === 1) return 'أمس';
      if (diffDays < 7) return `منذ ${diffDays} أيام`;
      return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-50 hover:bg-[#EFF6FF] text-[#172033] hover:text-[#2563EB] transition-all cursor-pointer border border-[#E2E8F0] flex items-center justify-center shadow-xs"
        title="التنبيهات والإشعارات"
        aria-label="الإشعارات"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-[#2563EB] text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] z-50 text-[#172033] overflow-hidden text-right animate-in fade-in duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="font-black text-[#172033] text-sm">الإشعارات والتنبيهات</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20 font-mono">
                  {unreadCount} غير مقروء
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer transition-colors"
                title="تحديد جميع الإشعارات كمقروءة"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>قراءة الكل</span>
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-[#E2E8F0] text-xs bg-white">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                filter === 'all'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
              }`}
            >
              جميع الإشعارات
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                filter === 'unread'
                  ? 'bg-[#F5B800] text-slate-950 font-black shadow-xs'
                  : 'text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
              }`}
            >
              غير المقروءة فقط ({unreadCount})
            </button>
          </div>

          {/* Notifications Scroll List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-[#E2E8F0]">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">جاري تحميل الإشعارات...</div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-[#172033]">لا توجد إشعارات حالياً</p>
                <p className="text-[11px] text-[#64748B]">ستصلك التنبيهات عند إسناد طلبات أو مهام جديدة إليك.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-[#EFF6FF]/60 ${
                    !item.isRead ? 'bg-blue-50/40 border-r-4 border-[#2563EB]' : 'opacity-85'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-[#172033] truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-[#64748B] font-mono shrink-0">
                        {formatTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed break-words">
                      {item.message}
                    </p>
                    {item.metadata?.requestCode && (
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-[#172033]">
                          {item.metadata.requestCode}
                        </span>
                      </div>
                    )}
                  </div>
                  {!item.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(item.id, e)}
                      className="p-1 text-[#64748B] hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors shrink-0"
                      title="تحديد كمقروء"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-500">
              يتم حفظ وتحديث الإشعارات فورياً في قاعدة بيانات SAHLA
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
