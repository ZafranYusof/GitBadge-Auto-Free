import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useTheme } from '../hooks/useTheme';

export default function AccountSwitcher({ user, linkedAccounts = [] }) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState(linkedAccounts);
  const { isDark } = useTheme();

  // Sync with props
  useEffect(() => {
    setAccounts(linkedAccounts);
  }, [linkedAccounts]);

  // Refresh accounts from server
  const refreshAccounts = useCallback(async () => {
    try {
      const res = await api.get('/api/accounts', { withCredentials: true });
      setAccounts(res.data.linked || []);
    } catch {}
  }, []);

  const switchAccount = async (username) => {
    try {
      await api.post(`/api/accounts/switch/${username}`, {}, { withCredentials: true });
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch account:', err);
    }
  };

  const removeAccount = async (username) => {
    try {
      await api.delete(`/api/accounts/${username}`, { withCredentials: true });
      setAccounts(prev => prev.filter(a => a.username !== username));
    } catch (err) {
      console.error('Failed to remove account:', err);
    }
  };

  const linkNewAccount = () => {
    const popup = window.open('/auth/github?link=true', '_blank', 'width=600,height=700');
    // Poll for popup close, then refresh accounts
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        refreshAccounts();
      }
    }, 500);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-100'}`}
      >
        <img
          src={user.avatar}
          alt={user.username}
          className="w-7 h-7 rounded-full ring-2 ring-green-500/30"
        />
        {accounts.length > 0 && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-[#00ff4120] text-[#00ff41]' : 'bg-green-100 text-green-700'}`}>
            {accounts.length + 1}
          </span>
        )}
        <svg className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={`absolute right-0 top-full mt-2 w-60 rounded-xl border shadow-xl z-50 overflow-hidden ${
                isDark ? 'bg-[#141920] border-white/[0.08]' : 'bg-white border-gray-200'
              }`}
            >
              {/* Primary account */}
              <div className={`px-4 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-green-500 mb-1.5">Active</p>
                <div className="flex items-center gap-2.5">
                  <img src={user.avatar} alt="" className="w-7 h-7 rounded-full" />
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.username}</span>
                  <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>primary</span>
                </div>
              </div>

              {/* Linked accounts */}
              {accounts.length > 0 && (
                <div className={`border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                  <p className={`px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Linked Accounts</p>
                  {accounts.map(account => (
                    <div key={account.username} className={`flex items-center justify-between px-4 py-2 transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'}`}>
                      <button
                        onClick={() => switchAccount(account.username)}
                        className="flex items-center gap-2.5 flex-1"
                        title={`Switch to ${account.username}`}
                      >
                        <img src={account.avatar} alt="" className="w-6 h-6 rounded-full" />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{account.username}</span>
                      </button>
                      <button
                        onClick={() => removeAccount(account.username)}
                        className={`p-1 rounded-md transition-colors ${isDark ? 'text-gray-600 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                        title="Remove account"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add account */}
              <button
                onClick={linkNewAccount}
                className={`w-full px-4 py-3 text-left text-sm flex items-center gap-2.5 transition-colors ${isDark ? 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                Link another account
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

