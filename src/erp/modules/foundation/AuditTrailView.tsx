import React, { useState } from 'react';
import { erpEngine } from '../../engine/erpEngine';
import { History, Search, Filter, ShieldCheck, Clock, User, CheckCircle2, FileText } from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterRequestId, setFilterRequestId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const logs = erpEngine.getAuditLogs({
    entityType: filterEntity !== 'all' ? filterEntity : undefined,
    requestId: filterRequestId ? filterRequestId : undefined,
  });

  const filteredLogs = logs.filter((l) => {
    const text = `${l.actorName} ${l.notes || ''} ${l.action} ${l.entityId} ${l.entityType}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  const entityTypes = [
    { id: 'all', label: 'كافة الكيانات' },
    { id: 'request', label: 'الطلبات المركزية' },
    { id: 'customer', label: 'سجلات العملاء' },
    { id: 'setting', label: 'إعدادات النظام والسلاسل' },
    { id: 'user', label: 'المستخدمين والجلسات' },
  ];

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-[#D99B00]" />
            <h2 className="text-xl font-bold text-slate-900">سجل التدقيق العام والتوثيق (Universal Audit Trail)</h2>
          </div>
          <p className="text-xs text-slate-500">
            سجل إلحاقي حصري (Append-Only) غير قابل للتعديل أو الحذف، يوثق كل قرار وتغيير حالة في النظام.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>إجمالي السجلات الموثقة: {logs.length}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="بحث في الملاحظات، الفاعل، الكود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="w-full sm:w-56">
            <input
              type="text"
              placeholder="تصفية برقم الطلب (Request ID)..."
              value={filterRequestId}
              onChange={(e) => setFilterRequestId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {entityTypes.map((et) => (
            <button
              key={et.id}
              onClick={() => setFilterEntity(et.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterEntity === et.id
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-slate-100 text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB]'
              }`}
            >
              {et.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Timeline List */}
      <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-[#64748B] text-xs">
            لا توجد سجلات تدقيق مطابقة لمعايير البحث الحالية.
          </div>
        ) : (
          <div className="relative pr-6 border-r-2 border-[#E2E8F0] space-y-6">
            {filteredLogs.map((log) => {
              return (
                <div key={log.id} className="relative group text-right">
                  {/* Bullet */}
                  <div className="absolute -right-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-[#F5B800] bg-white ring-4 ring-amber-50 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#F5B800]" />
                  </div>

                  {/* Card Content */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-[#E2E8F0] hover:border-blue-200 transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E2E8F0]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#172033] text-xs flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>{log.actorName}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EFF6FF] text-[#2563EB] border border-blue-200">
                          {log.actorRole}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-600 bg-slate-200">
                          {log.action}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono" dir="ltr">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-800 font-medium leading-relaxed">
                      {log.notes || 'لا توجد ملاحظات إضافية.'}
                    </div>

                    {/* Metadata Pill */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 font-mono">
                      <span>الكيان: <b>{log.entityType}</b></span>
                      <span>معرف الكيان: <b>{log.entityId}</b></span>
                      {log.requestId && (
                        <span className="text-[#D99B00] font-bold">معرف الطلب: {log.requestId}</span>
                      )}
                    </div>

                    {/* State Diff preview if available */}
                    {(log.previousState || log.newState) && (
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[10px] font-mono text-slate-600 space-y-1 overflow-x-auto">
                        {log.previousState && (
                          <div>
                            <span className="text-rose-600 font-bold">الحالة السابقة: </span>
                            {JSON.stringify(log.previousState)}
                          </div>
                        )}
                        {log.newState && (
                          <div>
                            <span className="text-emerald-700 font-bold">الحالة الجديدة: </span>
                            {JSON.stringify(log.newState)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
