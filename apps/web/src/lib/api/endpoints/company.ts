import { request } from '@/lib/api/core/client';

export type AutonomyTier = 'TIER_0' | 'TIER_1' | 'TIER_2';

export interface CompanySettings {
  companyName: string;
  legalName: string;
  slug: string;
  domain: string;
  industry: string;
  timezone: string;
  defaultLocale: string;
  defaultAutonomyTier: AutonomyTier;
  requireSodApproval: boolean;
  allowAgentTeamBootstrap: boolean;
  onboardingCompleted: boolean;
  updatedByUserId?: string | null;
  updatedAt?: string | null;
}

export type UpdateCompanySettingsPatch = Partial<
  Omit<CompanySettings, 'updatedByUserId' | 'updatedAt'>
>;

export const getCompanySettings = () => request<CompanySettings>('/settings/company');

export const updateCompanySettings = (body: UpdateCompanySettingsPatch) =>
  request<CompanySettings>('/settings/company', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
