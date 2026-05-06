'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getHistory, deleteHistoryItem, clearAllHistory } from '@/lib/api';

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, simplify, explain, summarize, alttext

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const res = await getHistory();
      if (res.success && Array.isArray(res.data)) {
        setHistoryItems(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteHistoryItem(id);
      setHistoryItems(prev => prev.filter(item => item.id !== id));
      toast.success('Item deleted');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all history? This cannot be undone.')) return;
    try {
      setIsLoading(true);
      await clearAllHistory();
      setHistoryItems([]);
      toast.success('All history cleared');
    } catch (error) {
      toast.error('Failed to clear history');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (filter === 'all') return historyItems;
    return historyItems.filter(item => item.type === filter);
  }, [historyItems, filter]);

  // Derive unique types for dynamic filtering
  const availableTypes = useMemo(() => {
    const types = new Set(historyItems.map(item => item.type));
    return Array.from(types).sort();
  }, [historyItems]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <main className="min-h-screen bg-background text-textPrimary px-6 py-10 md:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 border-b border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-primary font-medium hover:underline flex items-center gap-2">
              <span>←</span> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold mt-6">Activity History</h1>
            <p className="text-textSecondary mt-2">View and manage your past AI requests and tools usage.</p>
          </div>
          {historyItems.length > 0 && !isLoading && (
            <button
              onClick={handleClearAll}
              className="text-error font-medium bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition"
            >
              Clear All
            </button>
          )}
        </header>

        {/* Filters */}
        {!isLoading && historyItems.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition whitespace-nowrap ${
                filter === 'all' ? 'bg-primary text-black' : 'bg-gray-200 text-textSecondary hover:bg-gray-300'
              }`}
            >
              All Types
            </button>
            {availableTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition whitespace-nowrap ${
                  filter === type ? 'bg-primary text-black' : 'bg-gray-200 text-textSecondary hover:bg-gray-300'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-6">
          {isLoading ? (
            // Skeleton Loaders
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-border shadow-sm animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-6 w-24 bg-gray-200 rounded-md"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded-md"></div>
                </div>
                <div className="space-y-4 mt-4">
                  <div>
                    <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
                    <div className="h-10 w-full bg-gray-100 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
                    <div className="h-16 w-full bg-gray-100 rounded"></div>
                  </div>
                </div>
              </div>
            ))
          ) : filteredItems.length === 0 ? (
            // Empty State
            <div className="text-center py-20 bg-white border border-border rounded-xl">
              <span className="text-4xl mb-4 block">🕒</span>
              <h3 className="text-xl font-bold mb-2">No history found</h3>
              <p className="text-textSecondary">
                {filter !== 'all' ? `No requests of type "${filter}"` : "You haven't made any AI requests yet."}
              </p>
            </div>
          ) : (
            // History Items
            filteredItems.map(item => (
              <article key={item.id} className="bg-white p-6 rounded-xl border border-border shadow-sm hover:border-primary transition duration-300 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-gray-100 text-textPrimary px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      {item.type}
                    </span>
                    <span className="text-sm text-textSecondary">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-gray-400 hover:text-error transition opacity-0 group-hover:opacity-100"
                    title="Delete item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  {/* Input Side */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-border overflow-hidden">
                    <h4 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">Input</h4>
                    <div className="text-sm line-clamp-4 hover:line-clamp-none transition-all whitespace-pre-wrap">
                      {item.input_text || (item.input ? String(item.input) : 'N/A')}
                    </div>
                  </div>

                  {/* Output Side */}
                  <div className="bg-[#FFF9E6] rounded-lg p-4 border border-[#F5C518] border-opacity-40 overflow-hidden">
                    <h4 className="text-xs font-bold text-[#b38f00] uppercase tracking-wider mb-2">AI Output</h4>
                    <div className="text-sm line-clamp-4 hover:line-clamp-none transition-all whitespace-pre-wrap">
                      {item.output_text || (item.output ? String(item.output) : 'N/A')}
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
