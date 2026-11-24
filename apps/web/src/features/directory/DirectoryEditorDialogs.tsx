'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProjectChannel, ProjectContact } from '@/lib/api/endpoints/directory';

export function ContactEditorDialog({
  open,
  onOpenChange,
  initial,
  defaultProjectKey,
  availableProjects,
  isVi,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: ProjectContact | null;
  defaultProjectKey: string;
  availableProjects: Array<{ key: string; name: string }>;
  isVi: boolean;
  saving: boolean;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const [name, setName] = React.useState('');
  const [projectKey, setProjectKey] = React.useState(defaultProjectKey);
  const [role, setRole] = React.useState('');
  const [raciRole, setRaciRole] = React.useState('CONSULTED');
  const [orgId, setOrgId] = React.useState('ORG-PRODUCTAI');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [zalo, setZalo] = React.useState('');
  const [telegram, setTelegram] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setProjectKey(initial?.projectKey ?? defaultProjectKey);
    setRole(initial?.role ?? '');
    setRaciRole(initial?.raciRole?.split(',')[0] || 'CONSULTED');
    setOrgId(initial?.orgId || 'ORG-PRODUCTAI');
    setEmail(initial?.primaryEmail ?? '');
    setPhone(initial?.phone ?? '');
    const ch = initial?.channelHandles ?? {};
    const getDirect = (k: string) => {
      const v = ch[k];
      if (typeof v === 'string') return v;
      if (v && typeof v === 'object' && typeof (v as Record<string, unknown>).direct === 'string') {
        return (v as Record<string, string>).direct;
      }
      return '';
    };
    setZalo(getDirect('zalo'));
    setTelegram(getDirect('telegram'));
  }, [open, initial, defaultProjectKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const channel_handles: Record<string, unknown> = {};
    if (zalo.trim()) channel_handles.zalo = { direct: zalo.trim() };
    if (telegram.trim()) channel_handles.telegram = { direct: telegram.trim() };
    onSave({
      external_key: initial?.externalKey || undefined,
      project_key: projectKey,
      name: name.trim(),
      role: role.trim(),
      raci_role: raciRole,
      org_id: orgId.trim() || 'ORG-PRODUCTAI',
      primary_email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      channel_handles,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial
              ? isVi
                ? 'Cập nhật liên hệ'
                : 'Edit Contact'
              : isVi
                ? 'Thêm liên hệ vào Danh bạ'
                : 'Add Contact to Directory'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{isVi ? 'Tên liên hệ' : 'Name'}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{isVi ? 'Dự án' : 'Project'}</Label>
              <select
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-2 font-mono text-xs"
              >
                {availableProjects.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.key} — {p.name}
                  </option>
                ))}
                {!availableProjects.some((p) => p.key === projectKey) && (
                  <option value={projectKey}>{projectKey}</option>
                )}
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{isVi ? 'Vai trò / Chức danh' : 'Role / Title'}</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>RACI</Label>
              <select
                value={raciRole}
                onChange={(e) => setRaciRole(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
              >
                {['ACCOUNTABLE', 'RESPONSIBLE', 'CONSULTED', 'INFORMED'].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Zalo</Label>
              <Input value={zalo} onChange={(e) => setZalo(e.target.value)} placeholder="Display name / ID" />
            </div>
            <div className="space-y-1">
              <Label>Telegram</Label>
              <Input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Email (Vaulted)</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <Label>{isVi ? 'Điện thoại (Vaulted)' : 'Phone (Vaulted)'}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isVi ? 'Hủy' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? (isVi ? 'Đang lưu...' : 'Saving...') : isVi ? 'Lưu & Đồng bộ' : 'Save & Sync'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ChannelEditorDialog({
  open,
  onOpenChange,
  initial,
  defaultProjectKey,
  availableProjects,
  isVi,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: ProjectChannel | null;
  defaultProjectKey: string;
  availableProjects: Array<{ key: string; name: string }>;
  isVi: boolean;
  saving: boolean;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const [projectKey, setProjectKey] = React.useState(defaultProjectKey);
  const [platform, setPlatform] = React.useState('zalo');
  const [threadType, setThreadType] = React.useState('GROUP');
  const [displayName, setDisplayName] = React.useState('');
  const [targetId, setTargetId] = React.useState('');
  const [aliasesText, setAliasesText] = React.useState('');
  const [status, setStatus] = React.useState('ACTIVE');

  React.useEffect(() => {
    if (!open) return;
    setProjectKey(initial?.projectKey ?? defaultProjectKey);
    setPlatform(initial?.platform ?? 'zalo');
    setThreadType(initial?.threadType ?? 'GROUP');
    setDisplayName(initial?.displayName ?? '');
    setTargetId(initial?.targetId ?? '');
    setAliasesText((initial?.aliases ?? []).join(', '));
    setStatus(initial?.status ?? 'ACTIVE');
  }, [open, initial, defaultProjectKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    const aliases = aliasesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onSave({
      channel_id: initial?.channelId || undefined,
      project_key: projectKey,
      platform,
      thread_type: threadType,
      display_name: displayName.trim(),
      target_id: (targetId || displayName).trim(),
      aliases,
      status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial
              ? isVi
                ? 'Cập nhật kênh liên lạc'
                : 'Edit Communication Channel'
              : isVi
                ? 'Thêm kênh liên lạc'
                : 'Add Communication Channel'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{isVi ? 'Dự án' : 'Project'}</Label>
              <select
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-2 font-mono text-xs"
              >
                {availableProjects.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.key} — {p.name}
                  </option>
                ))}
                {!availableProjects.some((p) => p.key === projectKey) && (
                  <option value={projectKey}>{projectKey}</option>
                )}
              </select>
            </div>
            <div className="space-y-1">
              <Label>{isVi ? 'Nền tảng' : 'Platform'}</Label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
              >
                {['zalo', 'telegram', 'email', 'discord', 'messenger', 'viber', 'phone', 'whatsapp'].map((pl) => (
                  <option key={pl} value={pl}>
                    {pl}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{isVi ? 'Tên hiển thị' : 'Display Name'}</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{isVi ? 'Target ID / Handle' : 'Target ID / Handle'}</Label>
              <Input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="Group ID or handle" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{isVi ? 'Loại luồng' : 'Thread Type'}</Label>
              <select
                value={threadType}
                onChange={(e) => setThreadType(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
              >
                {['GROUP', 'USER_DM', 'DIRECT', 'CALENDAR'].map((tt) => (
                  <option key={tt} value={tt}>
                    {tt}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>{isVi ? 'Trạng thái' : 'Status'}</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>{isVi ? 'Tên gọi khác (phân tách dấu phẩy)' : 'Aliases (comma-separated)'}</Label>
            <Input value={aliasesText} onChange={(e) => setAliasesText(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isVi ? 'Hủy' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={saving || !displayName.trim()}>
              {saving ? (isVi ? 'Đang lưu...' : 'Saving...') : isVi ? 'Lưu & Đồng bộ' : 'Save & Sync'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
