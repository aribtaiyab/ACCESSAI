'use client';

import { useMemo, useState } from 'react';
import { analyzeCompanion } from '@/lib/api';

const DEFAULT_URL = 'https://www.example.com';

export default function InternetCompanion() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => input.trim().length > 0, [input]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const url = input.trim().startsWith('http') ? input.trim() : '';
      const response = await analyzeCompanion(input.trim(), url);

      if (response?.success && response?.data) {
        setResult(response.data);
      } else {
        setError(response?.error || 'Unable to analyze this content right now.');
      }
    } catch (err) {
      setError(err.message || 'Unable to analyze this content right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-[2rem] border border-border bg-white/90 p-6 shadow-[0_22px_60px_-28px_rgba(23,23,23,0.3)] sm:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">Internet Companion</p>
          <h2 className="mt-2 text-2xl font-semibold text-textPrimary">Understand anything you read online</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-textSecondary">
            Paste a link or a passage and get plain-language insights with simple actions and alerts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInput(DEFAULT_URL)}
          className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-textPrimary transition hover:border-primary hover:text-primary"
        >
          Try example
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-textPrimary" htmlFor="companion-input">
          Paste a link or text
        </label>
        <textarea
          id="companion-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={7}
          placeholder="Paste a link, contract, email, or article..."
          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-textPrimary shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-textSecondary">The companion uses the existing backend AI flow, so it stays compatible with the current setup.</p>
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </form>

      {error ? (
        <div className="mt-6 rounded-2xl border border-error/40 bg-error/10 p-4 text-sm text-error">{error}</div>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-4 rounded-[1.5rem] border border-border bg-background p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Understanding</p>
            <p className="mt-2 text-base leading-7 text-textPrimary">{result.understanding}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Quick points</p>
            <ul className="mt-2 space-y-2 text-sm text-textSecondary">
              {result.points?.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Alerts</p>
              <p className="mt-2 text-sm text-textSecondary">
                {result.noAlerts ? 'No obvious alerts detected.' : result.alerts?.join(' • ') || 'No alerts recorded.'}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Suggested actions</p>
              <ul className="mt-2 space-y-2 text-sm text-textSecondary">
                {result.actions?.map((action) => (
                  <li key={action} className="flex items-start gap-2">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
