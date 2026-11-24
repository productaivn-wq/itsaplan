'use client';

import { KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import GoogleIcon from '@/components/common/GoogleIcon';
import { useAuthConfig } from '@/services/authConfig.service';

// The sign-in methods that are not the email + password form: trimmed to 1 primary SSO button
// and folding secondary alternatives into a quiet <details> accordion (SPEC-ITSAPLAN-HARD-TRIM-W1).
export default function AuthLoginAlternatives({
  signingInWithLink,
  pending,
  onToggleMethod,
  onOidc,
  onGoogle,
  onPasskey,
}: {
  signingInWithLink: boolean;
  pending: boolean;
  onToggleMethod: () => void;
  onOidc: () => void;
  onGoogle: () => void;
  onPasskey: () => void;
}) {
  const t = useTranslations('auth.login');
  const authConfig = useAuthConfig();
  const passwordEnabled = authConfig?.emailPassword !== false;

  const hasOidc = Boolean(authConfig?.oidc);
  const hasGoogle = Boolean(authConfig?.google);
  const hasMagicLink = Boolean(authConfig?.magicLink && passwordEnabled);

  const oidcButton = (
    <Button key="oidc" type="button" variant="outline" onClick={onOidc} disabled={pending} className="w-full">
      <ShieldCheck className="size-4" />
      {authConfig?.oidcLabel || t('withSso')}
    </Button>
  );

  const googleButton = (
    <Button key="google" type="button" variant="outline" onClick={onGoogle} disabled={pending} className="w-full">
      <GoogleIcon className="size-4" />
      {t('withGoogle')}
    </Button>
  );

  const passkeyButton = (
    <Button key="passkey" type="button" variant="outline" onClick={onPasskey} disabled={pending} className="w-full">
      <KeyRound className="size-4" />
      {t('withPasskey')}
    </Button>
  );

  const magicLinkButton = (
    <Button key="magic-link" type="button" variant="outline" disabled={pending} onClick={onToggleMethod} className="w-full">
      {signingInWithLink ? <Lock className="size-4" /> : <Mail className="size-4" />}
      {signingInWithLink ? t('withPassword') : t('withLink')}
    </Button>
  );

  // Primary button: OIDC if present, else Google if present, else Passkey
  const primaryButton = hasOidc ? oidcButton : hasGoogle ? googleButton : passkeyButton;

  // Secondary buttons placed inside quiet <details>
  const secondaryButtons = [];
  if (hasOidc) {
    if (hasGoogle) secondaryButtons.push(googleButton);
    secondaryButtons.push(passkeyButton);
  } else if (hasGoogle) {
    secondaryButtons.push(passkeyButton);
  }
  if (hasMagicLink) {
    secondaryButtons.push(magicLinkButton);
  }

  return (
    <Field className="gap-2">
      {primaryButton}
      {secondaryButtons.length > 0 && (
        <details className="group text-center">
          <summary className="cursor-pointer list-none text-xs text-muted-foreground hover:text-foreground">
            More sign-in options
          </summary>
          <div className="mt-2 hidden flex-col gap-2 group-open:flex">
            {secondaryButtons}
          </div>
        </details>
      )}
    </Field>
  );
}
