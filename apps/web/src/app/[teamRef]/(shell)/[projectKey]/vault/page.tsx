'use client';

import React, { useState, useEffect } from 'react';

const VAULT_API = 'http://127.0.0.1:8765';

function copyTextFallback(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function VaultPage() {
  const [secrets, setSecrets] = useState<any[]>([]);
  const [ssoAccounts, setSsoAccounts] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchSecrets = async () => {
    try {
      const res = await fetch(`${VAULT_API}/api/secrets`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.secrets || [];
      setSecrets(list);
      const poolEmails = list
        .filter((s: any) => typeof s.key === 'string' && s.key.startsWith('AGY_CLI_POOL:'))
        .map((s: any) => s.key.replace('AGY_CLI_POOL:', ''));
      if (poolEmails.length > 0) {
        setSsoAccounts(poolEmails);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSso = async () => {
    try {
      const res = await fetch(`${VAULT_API}/api/sso/status`);
      const data = await res.json();
      if (data && Array.isArray(data.accounts) && data.accounts.length > 0) {
        setSsoAccounts(data.accounts.map((a: any) => (typeof a === 'string' ? a : a.email)));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchSecrets();
    fetchSso();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setKeyInput('');
    setValueInput('');
    setDescInput('');
    setModalOpen(true);
  };

  const openEditModal = async (s: any) => {
    setIsEditing(true);
    setKeyInput(s.key);
    setDescInput(s.desc || s.description || '');
    let currentVal = revealed[s.key] || '';
    if (!currentVal) {
      try {
        const res = await fetch(`${VAULT_API}/api/secrets/${encodeURIComponent(s.key)}`);
        if (res.ok) {
          const d = await res.json();
          currentVal = d.value || '';
        }
      } catch {}
    }
    setValueInput(currentVal);
    setModalOpen(true);
  };

  const handleSaveSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${VAULT_API}/api/secrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyInput, value: valueInput, description: descInput }),
      });
      if (res.ok) {
        setModalOpen(false);
        setRevealed((prev) => {
          const next = { ...prev };
          delete next[keyInput];
          return next;
        });
        await fetchSecrets();
      }
    } catch (e) {}
  };

  const handleToggleReveal = async (key: string) => {
    if (revealed[key] !== undefined) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    try {
      const res = await fetch(`${VAULT_API}/api/secrets/${encodeURIComponent(key)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.value !== undefined) {
          setRevealed((prev) => ({ ...prev, [key]: String(data.value) }));
        }
      }
    } catch (e) {
      console.error('Reveal failed:', e);
    }
  };

  const handleCopy = async (key: string) => {
    try {
      let secretVal = revealed[key];
      if (secretVal === undefined) {
        const res = await fetch(`${VAULT_API}/api/secrets/${encodeURIComponent(key)}`);
        if (res.ok) {
          const data = await res.json();
          secretVal = data.value !== undefined ? String(data.value) : '';
        }
      }
      if (secretVal !== undefined && secretVal !== '') {
        let copied = false;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(secretVal);
            copied = true;
          } catch {
            copied = copyTextFallback(secretVal);
          }
        } else {
          copied = copyTextFallback(secretVal);
        }
        if (copied) {
          setCopiedKey(key);
          setTimeout(() => {
            setCopiedKey((prev) => (prev === key ? null : prev));
          }, 1500);
        }
      }
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleDelete = async (key: string) => {
    if (!window.confirm(`Delete secret "${key}"?`)) return;
    try {
      await fetch(`${VAULT_API}/api/secrets/${encodeURIComponent(key)}`, { method: 'DELETE' });
      fetchSecrets();
    } catch (e) {}
  };

  const filteredSecrets = secrets.filter(
    (s) =>
      (s.key || '').toLowerCase().includes(filter.toLowerCase()) ||
      (s.desc || s.description || '').toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#09090b] p-8 font-sans text-[#fafafa]">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-[#27272a] pb-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Secret Vault</h1>
            <p className="text-sm text-[#a1a1aa]">
              Secure environment variables and CLI SSO credentials
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {ssoAccounts.map((email) => (
              <div
                key={email}
                className="flex items-center gap-2 rounded-md border border-[#27272a] bg-[#121215] px-3 py-1.5 text-xs text-[#a1a1aa]"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>{email}</span>
              </div>
            ))}
            <button
              onClick={() => window.open(`${VAULT_API}/api/sso/redirect`, '_blank')}
              className="cursor-pointer rounded-md border border-[#27272a] bg-[#18181b] px-3 py-1.5 text-xs font-medium text-[#fafafa] transition-colors hover:bg-[#27272a]"
            >
              + Connect Google CLI (SSO)
            </button>
            <button
              onClick={openAddModal}
              className="cursor-pointer rounded-md bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#09090b] transition-colors hover:bg-[#e4e4e7]"
            >
              + Add Secret
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Filter secrets..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full max-w-sm rounded-md border border-[#27272a] bg-[#121215] px-3 py-2 text-sm text-[#fafafa] focus:border-[#fafafa] focus:outline-none"
          />
        </div>

        <div className="overflow-hidden rounded-lg border border-[#27272a] bg-[#121215]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#27272a] bg-[#18181b] text-xs text-[#a1a1aa]">
                <th className="p-3 font-medium">Key</th>
                <th className="p-3 font-medium">Value</th>
                <th className="p-3 font-medium">Description</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-sm">
              {filteredSecrets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-[#a1a1aa]">
                    No secrets found.
                  </td>
                </tr>
              ) : (
                filteredSecrets.map((s) => {
                  const isRevealed = revealed[s.key] !== undefined;
                  const isCopied = copiedKey === s.key;
                  const displayValue = isRevealed ? revealed[s.key] : s.masked || '••••••••••••';
                  return (
                    <tr key={s.key} className="transition-colors hover:bg-[#18181b]/50">
                      <td className="p-3 font-mono text-xs text-[#fafafa]">{s.key}</td>
                      <td
                        className="max-w-xs p-3 font-mono text-xs break-all text-[#a1a1aa]"
                        data-testid={`val-${s.key}`}
                      >
                        {displayValue}
                      </td>
                      <td className="p-3 text-xs text-[#a1a1aa]">
                        {s.desc || s.description || '-'}
                      </td>
                      <td className="space-x-1.5 p-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleReveal(s.key)}
                          className="cursor-pointer rounded border border-[#27272a] bg-[#18181b] px-2 py-1 text-xs text-[#fafafa] hover:bg-[#27272a]"
                        >
                          {isRevealed ? 'Hide' : 'Reveal'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(s.key)}
                          className="cursor-pointer rounded border border-[#27272a] bg-[#18181b] px-2 py-1 text-xs text-[#fafafa] hover:bg-[#27272a]"
                        >
                          {isCopied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(s)}
                          className="cursor-pointer rounded border border-[#27272a] bg-[#18181b] px-2 py-1 text-xs text-[#fafafa] hover:bg-[#27272a]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s.key)}
                          className="cursor-pointer rounded border border-[#27272a] bg-[#18181b] px-2 py-1 text-xs text-red-400 hover:bg-[#27272a]"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md space-y-4 rounded-lg border border-[#27272a] bg-[#121215] p-6">
              <h2 className="text-lg font-semibold">{isEditing ? 'Edit Secret' : 'Add Secret'}</h2>
              <form onSubmit={handleSaveSecret} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-[#a1a1aa]">Key</label>
                  <input
                    type="text"
                    required
                    disabled={isEditing}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    className="w-full rounded border border-[#27272a] bg-[#18181b] px-3 py-2 font-mono text-sm text-[#fafafa] focus:border-[#fafafa] focus:outline-none disabled:opacity-60"
                    placeholder="API_KEY"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#a1a1aa]">Value</label>
                  <input
                    type="text"
                    required
                    value={valueInput}
                    onChange={(e) => setValueInput(e.target.value)}
                    className="w-full rounded border border-[#27272a] bg-[#18181b] px-3 py-2 font-mono text-sm text-[#fafafa] focus:border-[#fafafa] focus:outline-none"
                    placeholder="secret-value"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#a1a1aa]">Description</label>
                  <input
                    type="text"
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    className="w-full rounded border border-[#27272a] bg-[#18181b] px-3 py-2 text-sm text-[#fafafa] focus:border-[#fafafa] focus:outline-none"
                    placeholder="Production API key"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="cursor-pointer rounded border border-[#27272a] bg-transparent px-3 py-2 text-xs text-[#fafafa] hover:bg-[#18181b]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer rounded bg-[#fafafa] px-4 py-2 text-xs font-medium text-[#09090b] hover:bg-[#e4e4e7]"
                  >
                    Save Secret
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
