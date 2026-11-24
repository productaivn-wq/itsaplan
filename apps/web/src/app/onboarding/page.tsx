'use client';

import React, { Suspense } from 'react';
import OnboardingWizardPage from '../[teamRef]/(shell)/[projectKey]/onboarding/page';

export default function StandaloneOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background text-muted-foreground text-xs">
          Loading AI Workspace setup...
        </div>
      }
    >
      <div className="min-h-screen w-full bg-background text-foreground">
        <OnboardingWizardPage />
      </div>
    </Suspense>
  );
}
