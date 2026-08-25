import { useEffect, useMemo, useState } from 'react';
import useAxios from '../../hooks/useAxios';
import { useNotification } from '../../context/NotificationContext';
import { Search, FileText, Users, Sparkles, BookOpen } from 'lucide-react';

const AdminJournal = () => {
  const api = useAxios();
  const { showNotification } = useNotification();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/admin/activity-logs').catch(() => ({ data: [] }));

        const normalized = Array.isArray(response.data?.data?.logs)
          ? response.data.data.logs
          : Array.isArray(response.data?.data)
            ? response.data.data
            : Array.isArray(response.data?.logs)
              ? response.data.logs
              : [];

        setEntries(normalized);
      } catch (error) {
        console.error('Failed to load admin journal entries', error);
        showNotification('Failed to load employee journal entries', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  const filteredEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return entries;

    return entries.filter((entry) => {
      const userName = `${entry.user?.firstName || ''} ${entry.user?.lastName || ''}`.toLowerCase();
      const ticketRef = `${entry.ticket?.trackingNumber || ''}`.toLowerCase();
      const content = `${entry.content || ''}`.toLowerCase();
      return userName.includes(query) || ticketRef.includes(query) || content.includes(query);
    });
  }, [entries, searchTerm]);
  const employeeCount = new Set(entries.map((entry) => entry.user?.id).filter(Boolean)).size;

  return (
    <div className="dashboard-shell admin-journal-shell">
      <section className="dashboard-hero admin-journal-hero"><div className="hero-orb hero-orb-one"/><div className="hero-orb hero-orb-two"/><div className="relative z-10"><div className="eyebrow"><Sparkles size={14}/> Team narrative</div><h1>Employee journal oversight.</h1><p>See the story behind delivery—progress, decisions, blockers, and updates recorded by your team.</p></div></section>

      <section className="journal-summary"><div><BookOpen size={18}/><span>Total updates<strong>{entries.length}</strong></span></div><div><Users size={18}/><span>Contributors<strong>{employeeCount}</strong></span></div></section>

      <div className="admin-journal-search">
        <div className="relative max-w-md">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search employee, ticket, or note..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-[#13151c] dark:text-white"
          />
        </div>
      </div>

      <div className="admin-journal-feed">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-gray-700">
            No journal entries found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="admin-journal-entry">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-indigo-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {entry.user ? `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim() : 'System'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FileText size={14} />
                    <span>{entry.ticket?.trackingNumber || 'General'}</span>
                    <span>•</span>
                    <span>{new Date(entry.logDate || entry.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{entry.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminJournal;
