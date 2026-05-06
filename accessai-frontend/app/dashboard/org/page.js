'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { runAudit, getAudits } from '@/lib/api';
import { useGlobalLoader } from '@/context/GlobalLoaderContext';

const getWebsiteName = (fullUrl) => {
  try {
    const parsed = new URL(fullUrl);
    return parsed.hostname.replace('www.', '');
  } catch {
    return fullUrl;
  }
};

const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-600';
};

const getWcagExplanation = (level) => {
  if (level === 'AAA') return 'Excellent accessibility (highest standard)';
  if (level === 'AA') return 'Good accessibility (recommended standard)';
  if (level === 'A') return 'Basic accessibility';
  return 'Needs improvement';
};

const calculatePercentages = (issues) => {
  if (!issues || issues.length === 0) return { critical: 0, serious: 0, minor: 0 };
  let critical = 0, serious = 0, minor = 0;
  issues.forEach(issue => {
    const sev = issue.severity?.toLowerCase();
    if (sev === 'critical') critical++;
    else if (sev === 'serious') serious++;
    else minor++;
  });
  const total = issues.length;
  return {
    critical: Math.round((critical / total) * 100),
    serious: Math.round((serious / total) * 100),
    minor: Math.round((minor / total) * 100)
  };
};

const getSummaryMessage = (percentages, issuesCount) => {
  if (issuesCount === 0) return 'No major accessibility issues found.';
  if (percentages.critical >= 20) return 'This website has critical accessibility issues that need immediate attention.';
  if (percentages.serious >= 30) return 'This website has some serious accessibility issues. Improving contrast and structure is recommended.';
  return 'This website has good accessibility overall, but has some minor issues to improve.';
};

// Local LoadingOverlay removed in favor of global loader

export default function OrgPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Scanning website...');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const { setGlobalLoading } = useGlobalLoader();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsHistoryLoading(true);
      const res = await getAudits();
      if (res.success) setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch audit history');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleRunAudit = async (e) => {
    if (e) e.preventDefault();
    console.log("Audit process started for URL:", url);

    if (!url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    setResult(null);
    setLoading(true);
    setGlobalLoading(true);
    setLoadingMessage('Scanning website...');

    // Simulate loading steps as requested
    const messages = [
      'Scanning website...',
      'Analyzing accessibility...',
      'Generating report...'
    ];
    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex++;
      if (msgIndex < messages.length) {
        setLoadingMessage(messages[msgIndex]);
      }
    }, 1500); // Changed to 1.5s as requested

    try {
      console.log("Calling API: POST /api/org/audit with URL:", url);
      
      // Use the runAudit function from api.js - it handles token injection automatically
      const res = await runAudit(url);
      
      console.log("API Response received:", res);
      
      if (res.success) {
        setResult(res.data);
        toast.success('Audit complete!');
        fetchHistory(); // Refresh history
      } else {
        toast.error(res.error || 'Audit failed');
      }
    } catch (err) {
      console.error("Audit API call failed:", err);
      const errorMsg = err.response?.data?.error || err.message || 'Audit failed. The site might be blocking us.';
      toast.error(errorMsg);
    } finally {
      clearInterval(interval);
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-textPrimary px-6 py-10 md:px-10">
      
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <Link href="/dashboard" className="text-primary hover:underline font-medium flex items-center gap-2">
            <span>←</span> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mt-6 tracking-tight">Website Audit</h1>
          <p className="text-textSecondary mt-2 text-lg">Scan any website to find and fix accessibility issues.</p>
        </header>

        {/* Input Section */}
        <section className="bg-white p-8 rounded-3xl border border-border shadow-sm mb-10 transition hover:shadow-md">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary">🌐</span>
              <input
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition"
                onKeyDown={(e) => e.key === 'Enter' && handleRunAudit()}
              />
            </div>
            <button
              type="button"
              onClick={handleRunAudit}
              disabled={loading}
              className="bg-primary hover:bg-hover text-black font-bold px-10 py-4 rounded-xl transition disabled:opacity-50 shadow-sm"
            >
              Run Audit
            </button>
          </div>
        </section>

        {/* Result Section */}
        {result && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 pb-6 border-b border-border text-center">
              <h2 className="text-3xl font-bold">Audit Report for <span className="text-primary">{getWebsiteName(url)}</span></h2>
              <div className="mt-4 max-w-2xl mx-auto p-4 bg-gray-50 border border-border rounded-xl">
                <p className="text-lg font-medium text-textPrimary">
                  {getSummaryMessage(calculatePercentages(result.issues), result.issues?.length || 0)}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Score Card */}
              <div className="bg-white p-8 rounded-3xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
                <h3 className="text-textSecondary font-bold uppercase tracking-wider text-xs mb-2">Accessibility Score</h3>
                <div className={`text-7xl font-black ${getScoreColor(result.score)}`}>
                  {result.score} <span className="text-3xl text-textSecondary font-bold">/ 100</span>
                </div>
              </div>

              {/* WCAG Card */}
              <div className="bg-white p-8 rounded-3xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
                <h3 className="text-textSecondary font-bold uppercase tracking-wider text-xs mb-2">WCAG Compliance</h3>
                <div className={`text-5xl font-black ${result.wcagLevel === 'AAA' ? 'text-green-600' : result.wcagLevel === 'Fail' ? 'text-red-600' : 'text-primary'}`}>
                  {result.wcagLevel}
                </div>
                <div className="mt-3 text-sm font-semibold text-textSecondary">{getWcagExplanation(result.wcagLevel)}</div>
              </div>

              {/* Percentage Breakdown Card */}
              <div className="bg-white p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-center">
                <h3 className="text-textSecondary font-bold uppercase tracking-wider text-xs mb-4 text-center">Issue Breakdown</h3>
                {result.issues && result.issues.length > 0 ? (() => {
                  const p = calculatePercentages(result.issues);
                  return (
                    <div className="space-y-3 px-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-red-700">Critical</span>
                        <span className="font-mono font-bold text-lg">{p.critical}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-orange-700">Serious</span>
                        <span className="font-mono font-bold text-lg">{p.serious}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-blue-700">Minor</span>
                        <span className="font-mono font-bold text-lg">{p.minor}%</span>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="text-center text-textSecondary font-medium">No issues found</div>
                )}
              </div>
            </div>

            {/* Issues Table */}
            {(!result.issues || result.issues.length === 0) ? (
              <div className="bg-white p-8 rounded-3xl border border-border shadow-sm text-center mb-8">
                <h3 className="text-2xl font-bold text-green-600">No major accessibility issues found</h3>
                <p className="text-textSecondary mt-2">Excellent! The scanned elements passed the accessibility checks.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border bg-gray-50 flex justify-between items-center">
                  <h2 className="text-xl font-bold">Detected Issues</h2>
                  <span className="text-sm font-medium text-textSecondary bg-white px-3 py-1 rounded-full border border-border">
                    Showing top {result.issues.length} issues
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-background">
                        <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider border-b border-border">Rule</th>
                        <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider border-b border-border">Severity</th>
                        <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider border-b border-border">Element</th>
                        <th className="px-6 py-4 font-bold text-sm uppercase tracking-wider border-b border-border">Recommended Fix</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {result.issues.map((issue, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-semibold text-primary">{issue.rule}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter
                              ${issue.severity === 'critical' ? 'bg-red-100 text-red-700' : 
                                issue.severity === 'serious' ? 'bg-orange-100 text-orange-700' : 
                                issue.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-blue-100 text-blue-700'}`}>
                              {issue.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono bg-gray-50 rounded m-2 block max-w-xs truncate" title={issue.element}>
                            {issue.element}
                          </td>
                          <td className="px-6 py-4 text-sm text-textSecondary">{issue.fix}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* History Section */}
        {((history.length > 0) || isHistoryLoading) && !result && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Recent Audits</h2>
            {isHistoryLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {history.slice(0, 5).map((audit) => (
                  <div key={audit.id} className="bg-white p-5 rounded-2xl border border-border flex justify-between items-center hover:border-primary transition">
                    <div>
                      <div className="font-bold text-lg truncate max-w-md">{audit.url}</div>
                      <div className="text-sm text-textSecondary">{new Date(audit.audited_at).toLocaleDateString()} at {new Date(audit.audited_at).toLocaleTimeString()}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-2xl font-black text-primary">{audit.score}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-textSecondary">Score</div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setResult({
                            score: audit.score,
                            wcagLevel: audit.wcag_level || 'AA',
                            issues: audit.issues || []
                          });
                          setUrl(audit.url);
                        }}
                        className="bg-background hover:bg-gray-100 p-3 rounded-xl border border-border transition"
                      >
                        View Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
