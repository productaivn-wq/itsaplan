import { type ReactNode } from 'react';
import { Check, Mail, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import SettingsSection from '@/components/common/page/SettingsSection';
import NotificationTelegramAccount from './NotificationTelegramAccount';
import { NOTIFICATION_EVENTS } from '../../utils/notificationEvents';
import type { NotificationPreferencesForm } from '../../hooks/useNotificationPreferencesForm';
import { useTranslations } from 'next-intl';

// A member's own notification preferences for the project: for each issue event, a
// checkbox per channel (email, Telegram). Visible to every member (each edits only
// their own). Email is sent to the account address; Telegram to the account connected
// in the member's profile, shown below. Delivery only happens for channels a project
// owner has configured. Save lives in the page header.

// Shared column template so the header labels line up with every event row.
const COLS = 'grid grid-cols-[1fr_5rem_5rem] items-center';

export default function NotificationPreferences({ form }: { form: NotificationPreferencesForm }) {
  const t = useTranslations('settings.notifications');
  const { emailEvents, setEmailEvents, telegramEvents, setTelegramEvents } = form;
  return (
    <div className="flex flex-col gap-10">
      <SettingsSection title={t('eventsTitle')}>
        <div className="max-w-xl">
          <div className={`${COLS} px-3 pb-1`}>
            <span />
            <ChannelHeader icon={<Mail className="size-3.5" />} label={t('email')} />
            <ChannelHeader icon={<Send className="size-3.5" />} label={t('telegram')} />
          </div>
          <div className="flex flex-col">
            {NOTIFICATION_EVENTS.map((event) => (
              <ChannelRow
                key={event}
                label={t(`events.${event}`)}
                emailChecked={emailEvents[event]}
                telegramChecked={telegramEvents[event]}
                onEmail={(v) => setEmailEvents({ ...emailEvents, [event]: v })}
                onTelegram={(v) => setTelegramEvents({ ...telegramEvents, [event]: v })}
              />
            ))}
          </div>
        </div>
      </SettingsSection>

      <NotificationTelegramAccount />
    </div>
  );
}

function ChannelHeader({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
      {icon}
      {label}
    </span>
  );
}

function ChannelRow({
  label,
  emailChecked,
  telegramChecked,
  onEmail,
  onTelegram,
}: {
  label: string;
  emailChecked: boolean;
  telegramChecked: boolean;
  onEmail: (value: boolean) => void;
  onTelegram: (value: boolean) => void;
}) {
  return (
    <div className={`${COLS} -mx-3 rounded-md px-3 py-2.5 transition-colors hover:bg-accent`}>
      <span className="text-sm">{label}</span>
      <div className="flex justify-center">
        <button
          type="button"
          role="checkbox"
          aria-checked={emailChecked}
          aria-label={`${label} — email`}
          onClick={() => onEmail(!emailChecked)}
          className="inline-flex size-8 items-center justify-center rounded-md transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span
            aria-hidden="true"
            className={cn(
              'inline-flex size-4 items-center justify-center rounded-[4px] border transition-colors',
              emailChecked
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background/60',
            )}
          >
            {emailChecked && <Check className="size-3" />}
          </span>
        </button>
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          role="checkbox"
          aria-checked={telegramChecked}
          aria-label={`${label} — Telegram`}
          onClick={() => onTelegram(!telegramChecked)}
          className="inline-flex size-8 items-center justify-center rounded-md transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span
            aria-hidden="true"
            className={cn(
              'inline-flex size-4 items-center justify-center rounded-[4px] border transition-colors',
              telegramChecked
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background/60',
            )}
          >
            {telegramChecked && <Check className="size-3" />}
          </span>
        </button>
      </div>
    </div>
  );
}
