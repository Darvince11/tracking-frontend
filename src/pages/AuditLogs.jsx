import { useState, useEffect, useRef } from 'react';
import useAxios from '../hooks/useAxios';
import { useNotification } from '../context/NotificationContext';
import { Search, User, ChevronLeft, ChevronRight, LogIn, LogOut, Sparkles, History, ShieldCheck, Activity } from 'lucide-react';

const PAGE_SIZE = 10;

const AuditLogs = () => {
  const api = useAxios();
  const { showNotification } = useNotification();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationIssue, setPaginationIssue] = useState(false);
  const pageSignatures = useRef(new Map());
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    hasNext: false,
    hasPrev: false,
  });

  // 1. Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      if (searchTerm !== debouncedSearch) {
        setCurrentPage(1);
        pageSignatures.current.clear();
        setPaginationIssue(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch]);

  // 2. Fetch Data
  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/admin/audit-logs', {
          params: {
            page: currentPage,
            limit: PAGE_SIZE,
            search: debouncedSearch || undefined
          }
        });

        if (isMounted) {
          // ✅ FIX: Safely extracts the array whether it's sent directly or nested inside a 'logs' object
          const responseData = response.data?.data;
          const rawData = Array.isArray(responseData)
            ? responseData
            : (responseData?.logs || responseData?.auditLogs || responseData?.items || response.data?.logs || response.data?.auditLogs || []);
          
          const normalizedLogs = Array.isArray(rawData) ? rawData : [];
          const signature = normalizedLogs.map((log) => log.id || `${log.createdAt}-${log.action}`).join('|');
          const firstPageSignature = pageSignatures.current.get(1);
          const repeatedFirstPage = currentPage > 1 && signature && signature === firstPageSignature;
          pageSignatures.current.set(currentPage, signature);
          setPaginationIssue(repeatedFirstPage);
          setLogs(repeatedFirstPage ? [] : normalizedLogs);
          
          const pageData = response.data?.pagination || responseData?.pagination || response.data?.meta || responseData?.meta || {};
          const explicitTotal = pageData.total ?? pageData.totalItems ?? pageData.count;
          const total = explicitTotal == null ? ((currentPage - 1) * PAGE_SIZE) + normalizedLogs.length : Number(explicitTotal);
          const resolvedPage = Number(pageData.currentPage ?? pageData.page ?? currentPage) || currentPage;
          const serverHasNext = pageData.hasNext ?? pageData.hasNextPage;
          const fallbackHasNext = normalizedLogs.length === PAGE_SIZE;
          const hasNext = repeatedFirstPage ? false : (serverHasNext ?? (pageData.pages != null || pageData.totalPages != null ? resolvedPage < Number(pageData.pages ?? pageData.totalPages) : fallbackHasNext));
          const pages = Math.max(1, Number(pageData.pages ?? pageData.totalPages ?? (explicitTotal != null ? Math.ceil(total / PAGE_SIZE) : resolvedPage + (hasNext ? 1 : 0))) || 1);
          setPagination({
            total,
            pages,
            totalKnown: explicitTotal != null,
            hasNext,
            hasPrev: resolvedPage > 1,
          });
        }
      } catch (error) {
        console.error("Failed to fetch audit logs", error);
        if (isMounted) showNotification("Failed to load audit logs", "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchLogs();
    return () => { isMounted = false; };
  }, [currentPage, debouncedSearch, api, showNotification]);

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-9 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg mb-2"></div>
          <div className="h-4 w-72 bg-gray-100 dark:bg-gray-800/50 rounded-lg"></div>
        </div>
        <div className="bg-white dark:bg-[#1a1d27] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
          <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
            <div key={i} className="h-12 bg-gray-50 dark:bg-gray-800/40 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell audit-shell">
      <section className="dashboard-hero audit-hero"><div className="hero-orb hero-orb-one"/><div className="hero-orb hero-orb-two"/><div className="relative z-10"><div className="eyebrow"><Sparkles size={14}/> Security and accountability</div><h1>Every action, clearly recorded.</h1><p>Trace access, changes, and system activity through a dependable operational history.</p></div></section>

      <section className="audit-summary"><div><History size={18}/><span>Current page<strong>{currentPage}</strong></span></div><div><Activity size={18}/><span>Visible events<strong>{logs.length}</strong></span></div><div><ShieldCheck size={18}/><span>Audit status<strong>{paginationIssue ? 'Check API' : 'Healthy'}</strong></span></div></section>

      {paginationIssue && <div className="audit-pagination-warning"><ShieldCheck size={18}/><div><strong>The backend returned page 1 again.</strong><p>The frontend sent page={currentPage}, but received the same records. The audit endpoint must apply page and limit when querying the database.</p></div></div>}

      <div className="audit-log-panel">
        
        {/* Search Input */}
        <div className="audit-search">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text"
            placeholder="Search action (e.g. LOGIN, LOGOUT) or entity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white w-full"
          />
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50 text-sm">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    {loading ? 'Searching...' : 'No audit logs found.'}
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const entityName = log.entity || log.entityType || 'SYSTEM';
                  
                  const detailsText = log.details || log.newValue || log.metadata || log.description || 'No additional details logged';
                  
                  const actionUpper = String(log.action || '').toUpperCase();
                  
                  let actionBadgeStyle = "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50";
                  if (actionUpper.includes('LOGIN')) {
                    actionBadgeStyle = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50";
                  } else if (actionUpper.includes('LOGOUT')) {
                    actionBadgeStyle = "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50";
                  } else if (actionUpper.includes('DELETE') || actionUpper.includes('LOCKED')) {
                    actionBadgeStyle = "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800/50";
                  }

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-4 px-4 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString([], {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {log.user ? log.user.firstName?.[0] : <User size={14} />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System Action'}
                            </p>
                            {log.user?.email && (
                              <p className="text-xs text-gray-500">{log.user.email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${actionBadgeStyle}`}>
                          {actionUpper.includes('LOGIN') && <LogIn size={12} />}
                          {actionUpper.includes('LOGOUT') && <LogOut size={12} />}
                          {log.action}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 tracking-wider">
                          {entityName}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <p className="text-gray-600 dark:text-gray-300 text-xs max-w-xs truncate" title={typeof detailsText === 'string' ? detailsText : JSON.stringify(detailsText)}>
                          {typeof detailsText === 'string' ? detailsText : JSON.stringify(detailsText)}
                        </p>
                        {log.ipAddress && log.ipAddress !== '::1' && (
                          <p className="text-[10px] text-gray-400 mt-1 font-mono">IP: {log.ipAddress}</p>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800/60 pt-4 mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{logs.length > 0 ? ((currentPage - 1) * PAGE_SIZE) + 1 : 0}</span> to <span className="font-semibold text-gray-900 dark:text-white">{logs.length > 0 ? ((currentPage - 1) * PAGE_SIZE) + logs.length : 0}</span>{pagination.totalKnown && <> of <span className="font-semibold text-gray-900 dark:text-white">{pagination.total}</span> entries</>}
          </p>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={loading || currentPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#13151c] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="grid min-w-20 place-items-center px-2 text-xs font-bold text-gray-500 dark:text-gray-400">
              {currentPage} / {pagination.pages}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={loading || !pagination.hasNext}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#13151c] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuditLogs;
