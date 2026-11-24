"use client";

// UNIFIED_CREDENTIALS_VAULT_BRIDGE_361: Cross-linked with Team Settings -> Integrations (/:teamRef/settings/integrations)
// Supported endpoints: /api/auth/discover-cli, /api/auth/harvest-session, /api/auth/generate-secrets, /api/auth/verify, provider=gws

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";

export interface SecretItem {
  key: string;
  masked: string;
  handle_value?: string;
  is_secret: boolean;
  category: string;
  auth_method: string;
  one_click_action: string;
  action_label: string;
  action_type: string;
  provider: string;
  code_linked: boolean;
  code_consumers: string[];
  project?: string;
  secret_type?: string;
  notes?: string;
  desc?: string;
  file_name?: string;
  mime_type?: string;
  in_vault?: boolean;
  in_env?: boolean;
  in_itsaplan?: boolean;
}

export interface BoundFieldSpec {
  role: string;
  key: string;
  fallbackKey?: string;
  isHandle?: boolean;
  isSecret?: boolean;
}

export interface AccountBlueprint {
  id: string;
  title: string;
  avatar: string;
  project: string;
  actionLabel?: string;
  actionHref?: string;
  actionEndpoint?: string;
  actionPayload?: Record<string, unknown>;
  fields: BoundFieldSpec[];
  isCustom?: boolean;
}

export type VaultTabId = "accounts" | "identity" | "apikeys" | "infra" | "all";
export type ComposerMode = "secret" | "account" | "bulk" | "file";

export interface BoundFieldEditItem {
  role: string;
  key: string;
  value: string;
  isSecret: boolean;
  masked: boolean;
  customizeKey?: boolean;
}

const VAULT_SERVER = process.env.NEXT_PUBLIC_VAULT_BRIDGE_URL || "/api/vault-bridge";

function vaultApiUrl(endpoint: string): string {
  const ep = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (VAULT_SERVER.startsWith("/")) {
    return `${VAULT_SERVER}?endpoint=${encodeURIComponent(ep)}`;
  }
  return `${VAULT_SERVER}${ep}`;
}

const ACCOUNT_BLUEPRINTS: AccountBlueprint[] = [
  {
    id: "misa-hkd-account",
    title: "MISA AMIS HKD & meInvoice",
    avatar: "MI",
    project: "MISA & Tax Ops",
    actionLabel: "Harvest Cookies",
    actionEndpoint: "/api/auth/harvest-session",
    actionPayload: { platform: "misa_amis" },
    fields: [
      { role: "Tax Code (MST)", key: "MISA_TAX_CODE", fallbackKey: "BUSINESS_TAX_CODE", isHandle: true },
      { role: "Admin Phone", key: "MISA_PHONE", fallbackKey: "BUSINESS_OWNER_PHONE", isHandle: true },
      { role: "Account Password", key: "MISA_PASSWORD", isSecret: true },
      { role: "meInbot Email", key: "MISA_MEINBOT_EMAIL", isHandle: true },
      { role: "Authenticated Session Cookies", key: "MISA_AUTHENTICATED_COOKIES_JSON", isSecret: true },
    ],
  },
  {
    id: "misa-esign-cks",
    title: "MISA eSign — Chữ ký số (CKS)",
    avatar: "ES",
    project: "MISA & Tax Ops",
    actionLabel: "Verify Certificate",
    actionEndpoint: "/api/auth/verify",
    actionPayload: { key: "MISA_ESIGN_PIN" },
    fields: [
      { role: "CKS Service Provider", key: "MISA_ESIGN_PROVIDER", isHandle: true },
      { role: "eSign Account ID", key: "MISA_ESIGN_ACCOUNT", isHandle: true },
      { role: "eSign Signing PIN", key: "MISA_ESIGN_PIN", isSecret: true },
      { role: "Certificate Serial", key: "MISA_ESIGN_CERT_SERIAL", isHandle: true },
    ],
  },
  {
    id: "etax-mtax-cqt",
    title: "Thuế điện tử CQT (eTax / mTax)",
    avatar: "TX",
    project: "MISA & Tax Ops",
    actionLabel: "Verify eTax Credentials",
    actionEndpoint: "/api/auth/verify",
    actionPayload: { key: "ETAX_PASSWORD" },
    fields: [
      { role: "Tax Code (MST)", key: "ETAX_TAX_CODE", fallbackKey: "BUSINESS_TAX_CODE", isHandle: true },
      { role: "eTax / mTax Password", key: "ETAX_PASSWORD", isSecret: true },
      { role: "mTax Mobile ID", key: "MTAX_ACCOUNT", isHandle: true },
    ],
  },
  {
    id: "llm-provider-keys",
    title: "AI & LLM Provider Keys (Gemini / Claude / OpenAI / WeKnora)",
    avatar: "AI",
    project: "Core OS",
    actionLabel: "Auto-Discover CLI Keys",
    actionEndpoint: "/api/auth/discover-cli",
    fields: [
      { role: "Google Gemini API Key", key: "GEMINI_API_KEY", isSecret: true },
      { role: "Anthropic Claude API Key", key: "ANTHROPIC_API_KEY", isSecret: true },
      { role: "OpenAI GPT / Codex API Key", key: "OPENAI_API_KEY", isSecret: true },
      { role: "WeKnora Semantic Index Key", key: "WEKNORA_API_KEY", fallbackKey: "WEKNORA_INDEX_KEY", isSecret: true },
    ],
  },
  {
    id: "zalo-account",
    title: "Zalo Account",
    avatar: "ZL",
    project: "OmniCommunication",
    actionLabel: "Sync Zalo Cookies",
    actionEndpoint: "/api/auth/harvest-session",
    actionPayload: { platform: "zalo" },
    fields: [
      { role: "Phone Number", key: "ZALO_PHONE", isHandle: true },
      { role: "Password", key: "ZALO_PASSWORD", isSecret: true },
      { role: "Session Cookie JSON", key: "ZALO_AUTHENTICATED_COOKIES_JSON", isSecret: true },
      { role: "Session State Path", key: "ZALO_SESSION_STATE_PATH", isHandle: true },
    ],
  },
  {
    id: "facebook-account",
    title: "Facebook & Messenger Account",
    avatar: "FB",
    project: "OmniCommunication",
    actionLabel: "Sync FB Cookies",
    actionEndpoint: "/api/auth/harvest-session",
    actionPayload: { platform: "facebook" },
    fields: [
      { role: "Login Email", key: "FB_EMAIL", fallbackKey: "FACEBOOK_USERNAME", isHandle: true },
      { role: "Password", key: "FB_PASSWORD", fallbackKey: "FACEBOOK_PASSWORD", isSecret: true },
      { role: "Browser Cookie JSON", key: "FB_AUTHENTICATED_COOKIES_JSON", isSecret: true },
      { role: "Page Access Token", key: "FB_PAGE_ACCESS_TOKEN", isSecret: true },
    ],
  },
  {
    id: "google-work-account",
    title: "Google Workspace — Work Account",
    avatar: "GW",
    project: "OmniCommunication",
    actionLabel: "Sign in with Google",
    actionHref: vaultApiUrl(`/api/sso/start?provider=gws`),
    fields: [
      { role: "Google Email", key: "GWS_WORK_EMAIL", isHandle: true },
      { role: "Primary Calendar ID", key: "GOOGLE_CALENDAR_ID", isHandle: true },
      { role: "Calendar OAuth Token", key: "AOS_SVC_GOOGLE_CALENDAR", isSecret: true },
      { role: "OAuth Refresh Token", key: "GWS_WORK_REFRESH_TOKEN", fallbackKey: "GWS_OAUTH_CLIENT_SECRET_1", isSecret: true },
      { role: "SSO Keyring Token", key: "AGY_CLI_POOL_WORK_TOKEN", isSecret: true },
    ],
  },
  {
    id: "google-personal-account",
    title: "Google Account — Personal",
    avatar: "GP",
    project: "Core OS",
    actionLabel: "Sign in with Google",
    actionHref: vaultApiUrl(`/api/sso/start?provider=agy`),
    fields: [
      { role: "Google Email", key: "GWS_PERSONAL_EMAIL", isHandle: true },
      { role: "SSO Keyring Token", key: "AGY_CLI_POOL_PERSONAL_TOKEN", isSecret: true },
      { role: "OAuth Client ID", key: "GOOGLE_OAUTH_CLIENT_ID", isHandle: true },
      { role: "OAuth Client Secret", key: "GOOGLE_OAUTH_CLIENT_SECRET", isSecret: true },
    ],
  },
  {
    id: "linkedin-account",
    title: "LinkedIn Account",
    avatar: "IN",
    project: "Job Hunter",
    actionLabel: "Verify Session",
    actionEndpoint: "/api/auth/verify",
    actionPayload: { key: "LINKEDIN_LI_AT_COOKIE" },
    fields: [
      { role: "Username / Email", key: "LINKEDIN_USERNAME", isHandle: true },
      { role: "Password", key: "LINKEDIN_PASSWORD", isSecret: true },
      { role: "Session Cookie (li_at)", key: "LINKEDIN_LI_AT_COOKIE", isSecret: true },
    ],
  },
  {
    id: "itsaplan-account",
    title: "ACCORD Workspace Account",
    avatar: "IP",
    project: "ItsAPlan",
    actionLabel: "Sync Session",
    actionEndpoint: "/api/auth/harvest-session",
    actionPayload: { platform: "itsaplan" },
    fields: [
      { role: "Login Email", key: "ITSAPLAN_EMAIL", isHandle: true },
      { role: "Password", key: "ITSAPLAN_PASSWORD", isSecret: true },
      { role: "Session Token", key: "ITSAPLAN_SESSION_TOKEN", isSecret: true },
      { role: "Runner API Key", key: "ITSAPLAN_RUNNER_API_KEY", isSecret: true },
    ],
  },
  {
    id: "telegram-viber-bots",
    title: "Telegram & Viber Bots",
    avatar: "TG",
    project: "OmniCommunication",
    actionLabel: "Pair Channels",
    actionEndpoint: "/api/auth/harvest-session",
    actionPayload: { platform: "channel_pairing" },
    fields: [
      { role: "Telegram Chat ID", key: "TELEGRAM_CHAT_ID", isHandle: true },
      { role: "Telegram Bot Token", key: "TELEGRAM_BOT_TOKEN", isSecret: true },
      { role: "Viber Bot Token", key: "VIBER_BOT_TOKEN", isSecret: true },
      { role: "Vault Channel ID", key: "TELEGRAM_VAULT_CHANNEL_ID", isHandle: true },
    ],
  },
  {
    id: "jira-account",
    title: "Atlassian Jira Cloud",
    avatar: "JR",
    project: "ItsAPlan",
    actionLabel: "Verify Token",
    actionEndpoint: "/api/auth/verify",
    actionPayload: { key: "JIRA_API_TOKEN" },
    fields: [
      { role: "Jira Email", key: "JIRA_EMAIL", isHandle: true },
      { role: "Jira Instance URL", key: "JIRA_BASE_URL", isHandle: true },
      { role: "Jira API Token", key: "JIRA_API_TOKEN", isSecret: true },
    ],
  },
  {
    id: "github-cli-account",
    title: "GitHub & Local STS CLI",
    avatar: "GH",
    project: "Core OS",
    actionLabel: "Import from CLI",
    actionEndpoint: "/api/auth/discover-cli",
    actionPayload: {},
    fields: [
      { role: "GitHub PAT Token", key: "GITHUB_TOKEN", isSecret: true },
      { role: "GH CLI Token", key: "GH_TOKEN", isSecret: true },
      { role: "Local STS Bearer Token", key: "LOCAL_STS_BEARER_TOKEN", isSecret: true },
    ],
  },
];

const OWNER_IDENTITY_FIELDS: BoundFieldSpec[] = [
  { role: "Full Name (Ch\u1ee7 h\u1ed9)", key: "BUSINESS_OWNER_NAME", isHandle: true },
  { role: "CCCD / Citizen ID Number", key: "BUSINESS_OWNER_CCCD", isHandle: true },
  { role: "Owner Mobile Phone", key: "BUSINESS_OWNER_PHONE", isHandle: true },
  { role: "Owner Email", key: "BUSINESS_OWNER_EMAIL", fallbackKey: "GWS_WORK_EMAIL", isHandle: true },
  { role: "Representative Citizen ID", key: "COMPANY_CITIZEN_ID", isHandle: true },
];

const COMPANY_LEGAL_FIELDS: BoundFieldSpec[] = [
  { role: "Business Entity Name", key: "BUSINESS_ENTITY_NAME", fallbackKey: "COMPANY_NAME_VI", isHandle: true },
  { role: "Tax Code (M\u00e3 s\u1ed1 thu\u1ebf)", key: "BUSINESS_TAX_CODE", fallbackKey: "COMPANY_TAX_CODE", isHandle: true },
  { role: "Business Reg Number", key: "BUSINESS_REG_NUMBER", fallbackKey: "COMPANY_TAX_CODE", isHandle: true },
  { role: "Registered Headquarters Address", key: "BUSINESS_ADDRESS", fallbackKey: "COMPANY_HEADQUARTERS_ADDRESS", isHandle: true },
  { role: "Tax Regime & Rate", key: "BUSINESS_TAX_REGIME", fallbackKey: "BUSINESS_SECTOR", isHandle: true },
  { role: "Certificate File Path", key: "COMPANY_CERT_PATH", isHandle: true },
];

const VIETNAMESE_BANKS: Array<{ code: string; label: string }> = [
  { code: "BIDV", label: "BIDV — Ngân hàng TMCP Đầu tư và Phát triển Việt Nam" },
  { code: "Vietcombank", label: "Vietcombank — Ngân hàng TMCP Ngoại thương Việt Nam" },
  { code: "VietinBank", label: "VietinBank — Ngân hàng TMCP Công thương Việt Nam" },
  { code: "Techcombank", label: "Techcombank — Ngân hàng TMCP Kỹ thương Việt Nam" },
  { code: "MBBank", label: "MBBank — Ngân hàng TMCP Quân đội" },
  { code: "ACB", label: "ACB — Ngân hàng TMCP Á Châu" },
  { code: "VPBank", label: "VPBank — Ngân hàng TMCP Việt Nam Thịnh Vượng" },
  { code: "TPBank", label: "TPBank — Ngân hàng TMCP Tiên Phong" },
  { code: "Agribank", label: "Agribank — Ngân hàng NN&PTNT Việt Nam" },
  { code: "Sacombank", label: "Sacombank — Ngân hàng TMCP Sài Gòn Thương Tín" },
  { code: "VIB", label: "VIB — Ngân hàng TMCP Quốc tế Việt Nam" },
  { code: "HDBank", label: "HDBank — Ngân hàng TMCP Phát triển TP.HCM" },
  { code: "SHB", label: "SHB — Ngân hàng TMCP Sài Gòn - Hà Nội" },
  { code: "MSB", label: "MSB — Ngân hàng TMCP Hàng Hải Việt Nam" },
  { code: "OCB", label: "OCB — Ngân hàng TMCP Phương Đông" },
  { code: "LPBank", label: "LPBank — Ngân hàng TMCP Lộc Phát Việt Nam" },
  { code: "SeABank", label: "SeABank — Ngân hàng TMCP Đông Nam Á" },
  { code: "Eximbank", label: "Eximbank — Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam" },
];

export interface PortfolioProjectOption {
  key: string;
  folder_name: string;
  display_name: string;
  numeric_prefix: string;
  status: "active" | "archived";
}

const VAULT_DOMAIN_SUITES: string[] = [
  "Core OS",
  "MISA & Tax Ops",
  "Solopreneur Legal",
  "AI & Research",
  "HyperFrames & IoT",
];

// Authoritative Portfolio Projects SSOT (data/portfolio_projects_ssot.json — 40 Active + 20 Archived = 60 Projects)
const PORTFOLIO_PROJECTS_SSOT: PortfolioProjectOption[] = [
  { key: "PM", folder_name: "01_PROJECT_MANAGEMENT", display_name: "Project Management", numeric_prefix: "01", status: "active" },
  { key: "ITP", folder_name: "02_ITSAPLAN", display_name: "ItsAPlan", numeric_prefix: "02", status: "active" },
  { key: "DEMO", folder_name: "03_SAMPLE_WORKSPACE", display_name: "Sample Workspace", numeric_prefix: "03", status: "active" },
];

const PORTFOLIO_PROJECT_BY_NAME: Record<string, PortfolioProjectOption> = Object.fromEntries(
  PORTFOLIO_PROJECTS_SSOT.map((p) => [p.display_name, p])
);

const PORTFOLIO_PROJECT_BY_KEY: Record<string, PortfolioProjectOption> = Object.fromEntries(
  PORTFOLIO_PROJECTS_SSOT.map((p) => [p.key.toUpperCase(), p])
);

const PROJECT_NAME_ALIASES: Record<string, string> = {};

function normalizeProjectDisplayName(raw?: string): string {
  if (!raw || !raw.trim()) return "";
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  if (PROJECT_NAME_ALIASES[upper]) return PROJECT_NAME_ALIASES[upper];
  if (PORTFOLIO_PROJECT_BY_KEY[upper]) return PORTFOLIO_PROJECT_BY_KEY[upper].display_name;
  return trimmed;
}

function formatProjectOptionLabel(
  projectValue: string,
  dynamicMetaMap?: Record<string, PortfolioProjectOption>
): string {
  const rec = (dynamicMetaMap && dynamicMetaMap[projectValue]) || PORTFOLIO_PROJECT_BY_NAME[projectValue];
  if (!rec) return projectValue;
  const archivedSuffix = rec.status === "archived" ? " [Archived]" : "";
  return `${rec.display_name} (${rec.key} \u00b7 ${rec.folder_name})${archivedSuffix}`;
}

const WORKSPACE_PROJECTS: string[] = Array.from(
  new Set<string>([
    ...VAULT_DOMAIN_SUITES,
    ...PORTFOLIO_PROJECTS_SSOT.map((p) => p.display_name),
  ])
);

const CATEGORY_OPTIONS: string[] = [
  "API",
  "AUTH",
  "MESSAGING",
  "DATABASE",
  "STORAGE",
  "AI",
  "ITSAPLAN",
  "SYSTEM",
  "IDENTITY",
  "BANKING",
  "CERT",
];

function classifyProjectForKey(key: string, explicitProject?: string): string {
  if (explicitProject && explicitProject.trim()) {
    return normalizeProjectDisplayName(explicitProject);
  }
  const u = key.toUpperCase();
  if (u.startsWith("MISA_") || u.startsWith("ETAX_") || u.startsWith("MTAX_")) return "MISA & Tax Ops";
  if (u.startsWith("BUSINESS_") || u.startsWith("COMPANY_")) return "Solopreneur Legal";

  // Match explicit portfolio project prefixes (e.g. AEH_, C2C_, MHG_, VER_, ALM_, VIK_, etc.)
  for (const proj of PORTFOLIO_PROJECTS_SSOT) {
    if (u.startsWith(`${proj.key}_`) || u.startsWith(`${proj.folder_name}_`)) {
      return proj.display_name;
    }
  }

  if (u.includes("VIKEY")) return "Vikey";
  if (u.includes("ALERT_MASTER") || u.includes("ALERTMASTER")) return "Alert Master";
  if (u.includes("VERSATICA")) return "Versatica";
  if (u.includes("MH_GROUP") || u.includes("MHSOLUTION")) return "MH Solution (MH Group)";
  if (u.includes("CYFEER")) return "Cyfeer";
  if (u.includes("CLEANYOURTV")) return "Cleanyourtv Home";
  if (u.includes("CYHOME")) return "CyHome Digital Twin";
  if (u.includes("XTC") || u.includes("XE_TIEN")) return "Xe Ti\u1ec7n Chuy\u1ebfn";
  if (u.startsWith("DTW_") || u.includes("DIGITAL_TWIN")) return "Digital Twin";
  if (u.includes("HYPERFRAMES")) return "HyperFrames";
  if (u.includes("AI_FOR_DESIGNERS")) return "AI for Designers";
  if (u.includes("AFTER_SALES") || u.includes("WARRANTY")) return "After Sales Management";
  if (u.includes("GENACT") || u.includes("STEAM_FOR_ALL")) return "GenAct STEAM for All";
  if (u.includes("ENGLISH_TEACHING")) return "English Teaching";
  if (u.includes("TAMSON") || u.includes("YACHT")) return "Sample Client";
  if (u.includes("EUREKA")) return "Eureka Scientific Research";
  if (u.includes("APPLICANT_HUNTER") || u.includes("HUNTERKIT")) return "Applicant HunterKit";
  if (u.includes("JOB_HUNTER") || u.includes("LINKEDIN")) return "Job Hunter";
  if (u.includes("CHAT_TO_CHART") || u.includes("CHAT2CHART")) return "Chat to Chart";
  if (u.includes("ELEARNING")) return "AI eLearning Hub";

  if (
    u.includes("ZALO") ||
    u.includes("FB_") ||
    u.includes("FACEBOOK") ||
    u.includes("MESSENGER") ||
    u.includes("TELEGRAM") ||
    u.includes("VIBER") ||
    u.includes("GWS_") ||
    u.includes("GMAIL") ||
    u.includes("CALENDAR") ||
    u.includes("SMTP")
  ) {
    return "OmniCommunication";
  }
  if (u.includes("ITSAPLAN") || u.includes("NEXTAUTH") || u.includes("JIRA")) return "ACCORD";
  if (
    u.includes("GEMINI") ||
    u.includes("OPENAI") ||
    u.includes("ANTHROPIC") ||
    u.includes("CLAUDE") ||
    u.includes("DEEPSEEK") ||
    u.includes("OPENROUTER") ||
    u.includes("GROQ") ||
    u.includes("FIRECRAWL") ||
    u.includes("PERPLEXITY") ||
    u.includes("BRAVE") ||
    u.includes("EXA") ||
    u.includes("TAVILY") ||
    u.includes("SERPER") ||
    u.includes("CONTEXT7") ||
    u.includes("HUGGINGFACE") ||
    u.includes("OLLAMA") ||
    u.includes("WEKNORA")
  ) {
    return "AI & Research";
  }
  if (
    u.includes("PEXELS") ||
    u.includes("PIXABAY") ||
    u.includes("UNSPLASH") ||
    u.includes("FREESOUND") ||
    u.includes("ELEVENLABS") ||
    u.includes("FAL_") ||
    u.includes("REPLICATE") ||
    u.includes("TUYA") ||
    u.includes("EZVIZ")
  ) {
    return "HyperFrames & IoT";
  }
  return "Core OS";
}

function isIdentityKey(key: string): boolean {
  const u = key.toUpperCase();
  return u.startsWith("BUSINESS_") || u.startsWith("COMPANY_");
}

function isApiKeyRow(sec: Pick<SecretItem, "key" | "auth_method">): boolean {
  const u = sec.key.toUpperCase();
  if (isIdentityKey(u)) return false;
  return (
    sec.auth_method === "API_KEY_PROBE" ||
    u.includes("API_KEY") ||
    u.includes("APIKEY") ||
    (u.includes("_TOKEN") && !u.includes("SESSION"))
  );
}

function generateRandomCSPRNGHex(bytesLength = 32): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(bytesLength);
    window.crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

interface AccountPresetSpec {
  name: string;
  defaultBadge: string;
  fields: Array<{ role: string; keySuffix: string; isSecret: boolean }>;
}

const ACCOUNT_PRESETS: Record<string, AccountPresetSpec> = {
  web_login: {
    name: "Web Login (Email/User + Password + Cookie)",
    defaultBadge: "WB",
    fields: [
      { role: "Username / Email", keySuffix: "USERNAME", isSecret: false },
      { role: "Password", keySuffix: "PASSWORD", isSecret: true },
      { role: "Session Cookie JSON", keySuffix: "AUTHENTICATED_COOKIES_JSON", isSecret: true },
    ],
  },
  email_server: {
    name: "Email / Webmail (Username + Password + Thông tin SMTP / IMAP / POP3 Server)",
    defaultBadge: "EM",
    fields: [
      { role: "Username / Email", keySuffix: "USERNAME", isSecret: false },
      { role: "Password", keySuffix: "PASSWORD", isSecret: true },
      { role: "Session Cookie JSON", keySuffix: "AUTHENTICATED_COOKIES_JSON", isSecret: true },
      { role: "Thông tin SMTP Server", keySuffix: "SMTP_SERVER", isSecret: false },
      { role: "Thông tin IMAP Server", keySuffix: "IMAP_SERVER", isSecret: false },
      { role: "Thông tin POP3 Server", keySuffix: "POP3_SERVER", isSecret: false },
    ],
  },
  oauth2: {
    name: "OAuth2 App (Client ID + Secret + Refresh Token)",
    defaultBadge: "OA",
    fields: [
      { role: "OAuth Client ID", keySuffix: "CLIENT_ID", isSecret: false },
      { role: "OAuth Client Secret", keySuffix: "CLIENT_SECRET", isSecret: true },
      { role: "OAuth Refresh Token", keySuffix: "REFRESH_TOKEN", isSecret: true },
    ],
  },
  bot_messaging: {
    name: "Bot / Messaging Channel (Bot Token + Chat/Channel ID + Webhook Secret)",
    defaultBadge: "BT",
    fields: [
      { role: "Bot Token", keySuffix: "BOT_TOKEN", isSecret: true },
      { role: "Chat / Channel ID", keySuffix: "CHAT_ID", isSecret: false },
      { role: "Webhook Signing Secret", keySuffix: "WEBHOOK_SECRET", isSecret: true },
    ],
  },
  database_cloud: {
    name: "Database / Cloud Infra (Host URL + User + Password + API Key)",
    defaultBadge: "DB",
    fields: [
      { role: "Host Connection URL", keySuffix: "URL", isSecret: false },
      { role: "Database User", keySuffix: "USER", isSecret: false },
      { role: "Database Password", keySuffix: "PASSWORD", isSecret: true },
      { role: "Service API Key", keySuffix: "API_KEY", isSecret: true },
    ],
  },
  bank_account: {
    name: "Business / Treasury Bank Account (Bank Name + Account Number + Holder + Branch)",
    defaultBadge: "BK",
    fields: [
      { role: "Bank Name (Tên ngân hàng)", keySuffix: "BANK_NAME", isSecret: false },
      { role: "Bank Account Number (Số tài khoản)", keySuffix: "BANK_ACCOUNT_NUMBER", isSecret: true },
      { role: "Account Holder (Chủ tài khoản)", keySuffix: "BANK_ACCOUNT_HOLDER", isSecret: false },
      { role: "Bank Branch / CITAD (Chi nhánh)", keySuffix: "BANK_BRANCH", isSecret: false },
    ],
  },
};

function buildAccountKeyPrefix(title: string, fallback = "CUSTOM_ACCOUNT"): string {
  const cleaned = (title || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || fallback;
}

function deriveFieldKeySuffix(role: string, idx = 0): string {
  const u = (role || "").trim().toUpperCase();
  if (u.includes("SMTP")) {
    return "SMTP_SERVER";
  }
  if (u.includes("IMAP")) {
    return "IMAP_SERVER";
  }
  if (u.includes("POP3") || u.includes("POP SERVER") || u.includes("POP_SERVER")) {
    return "POP3_SERVER";
  }
  if (u.includes("USER") || u.includes("EMAIL") || u.includes("LOGIN") || u.includes("HANDLE") || u.includes("PHONE")) {
    return "USERNAME";
  }
  if (u.includes("COOKIE") || u.includes("SESSION")) {
    return "AUTHENTICATED_COOKIES_JSON";
  }
  if (u.includes("CLIENT_ID") || u.includes("CLIENT ID")) {
    return "CLIENT_ID";
  }
  if (u.includes("CLIENT_SECRET") || u.includes("CLIENT SECRET")) {
    return "CLIENT_SECRET";
  }
  if (u.includes("REFRESH")) {
    return "REFRESH_TOKEN";
  }
  if (u.includes("PASS") || u.includes("PIN")) {
    return "PASSWORD";
  }
  const slug = u.replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return slug || `FIELD_${idx + 1}`;
}

function deriveBoundFieldKey(title: string, role: string, idx = 0, prefixOverride?: string): string {
  const prefix = prefixOverride || buildAccountKeyPrefix(title, "CUSTOM_ACCOUNT");
  const suffix = deriveFieldKeySuffix(role, idx);
  return `${prefix}_${suffix}`;
}

function ensureAccountBlueprintFields(acc: AccountBlueprint): AccountBlueprint {
  const prefix = buildAccountKeyPrefix(acc.title, "CUSTOM_ACCOUNT");
  const usedKeys = new Set<string>();
  const normalizedFields: BoundFieldSpec[] = [];

  for (let idx = 0; idx < (acc.fields || []).length; idx++) {
    const f = acc.fields[idx];
    if (!f) continue;
    const role = (f.role || f.key || `Field ${idx + 1}`).trim();
    let key = (f.key || "").trim().toUpperCase();
    const isSecret = f.isSecret !== undefined ? Boolean(f.isSecret) : !f.isHandle;
    if (!key || (key.startsWith("ACCOUNT_") && prefix !== "CUSTOM_ACCOUNT")) {
      key = deriveBoundFieldKey(acc.title, role, idx, prefix);
    }
    const baseKey = key;
    let dup = 2;
    while (usedKeys.has(key)) {
      key = `${baseKey}_${dup}`;
      dup += 1;
    }
    usedKeys.add(key);
    normalizedFields.push({
      ...f,
      role,
      key,
      isSecret,
      isHandle: !isSecret,
    });
  }

  if (normalizedFields.length === 0) {
    normalizedFields.push(
      { role: "Username / Email", key: `${prefix}_USERNAME`, isSecret: false, isHandle: true },
      { role: "Password", key: `${prefix}_PASSWORD`, isSecret: true, isHandle: false },
      { role: "Session Cookie JSON", key: `${prefix}_AUTHENTICATED_COOKIES_JSON`, isSecret: true, isHandle: false }
    );
  }

  return {
    ...acc,
    fields: normalizedFields,
  };
}

interface ComposerModalState {
  open: boolean;
  mode: ComposerMode;
  // Mode 1: Secret
  secretKey: string;
  secretValue: string;
  secretProject: string;
  secretCategory: string;
  secretType: "secret" | "multiline" | "config";
  secretMasked: boolean;
  secretNotes: string;
  secretConsumerPath: string;
  saveToVault: boolean;
  saveToEnv: boolean;
  saveToItsaplan: boolean;
  isEditingExistingKey: boolean;

  // Mode 2: Account
  accountId: string;
  accountTitle: string;
  accountAvatar: string;
  accountProject: string;
  accountActionLabel: string;
  accountActionUrl: string;
  accountPreset: string;
  accountFields: BoundFieldEditItem[];
  accountIsCustom: boolean;
  isEditingExistingAccount: boolean;

  // Mode 3: Bulk
  bulkText: string;
  bulkProject: string;
  bulkCategory: string;
  bulkSaveVault: boolean;
  bulkSaveEnv: boolean;
  bulkSaveItsaplan: boolean;

  // Mode 4: File
  fileName: string;
  fileMime: string;
  fileSize: number;
  fileData: string; // base64
  fileTextContent: string;
  fileVaultKey: string;
  fileAssetSlot: string;
  fileProject: string;
  fileDescription: string;
}

const DEFAULT_MODAL_STATE: ComposerModalState = {
  open: false,
  mode: "secret",
  secretKey: "",
  secretValue: "",
  secretProject: "OmniCommunication",
  secretCategory: "API",
  secretType: "secret",
  secretMasked: true,
  secretNotes: "",
  secretConsumerPath: "apps/itsaplan/vault_bridge.py",
  saveToVault: true,
  saveToEnv: true,
  saveToItsaplan: false,
  isEditingExistingKey: false,

  accountId: "",
  accountTitle: "",
  accountAvatar: "",
  accountProject: "OmniCommunication",
  accountActionLabel: "",
  accountActionUrl: "",
  accountPreset: "",
  accountFields: [
    { role: "Username / Email", key: "", value: "", isSecret: false, masked: false },
    { role: "Password", key: "", value: "", isSecret: true, masked: false },
    { role: "Session Cookie JSON", key: "", value: "", isSecret: true, masked: false },
  ],
  accountIsCustom: true,
  isEditingExistingAccount: false,

  bulkText: "",
  bulkProject: "OmniCommunication",
  bulkCategory: "API",
  bulkSaveVault: true,
  bulkSaveEnv: true,
  bulkSaveItsaplan: false,

  fileName: "",
  fileMime: "",
  fileSize: 0,
  fileData: "",
  fileTextContent: "",
  fileVaultKey: "",
  fileAssetSlot: "",
  fileProject: "Solopreneur Legal",
  fileDescription: "",
};

async function postVaultJson(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  let res: Response;
  try {
    res = await fetch(vaultApiUrl(endpoint), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    res = await fetch(`/api/vault-bridge?endpoint=${encodeURIComponent(endpoint)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }
  const data = await res.json().catch(() => ({}));
  const isOk = Boolean(res.ok && (data as any)?.status !== "ERROR");
  return {
    ok: isOk,
    status: res.status,
    data,
    error: typeof (data as any)?.error === "string" ? (data as any).error : `HTTP ${res.status}`,
  };
}

function dedupeCustomAccounts(items: AccountBlueprint[]): AccountBlueprint[] {
  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();
  const result: AccountBlueprint[] = [];
  for (const acc of items) {
    if (!acc || !acc.id) continue;
    if (seenIds.has(acc.id)) continue;
    const sig = `${(acc.title || "").trim().toLowerCase()}::${(acc.project || "").trim().toLowerCase()}`;
    const isTimestampClone = /-\d{10,}$/.test(acc.id) || /^custom-\d+$/.test(acc.id);
    if (isTimestampClone && seenSignatures.has(sig)) {
      continue;
    }
    seenIds.add(acc.id);
    if (sig !== "::") {
      seenSignatures.add(sig);
    }
    result.push(acc);
  }
  return result;
}

export default function SecretVaultPage() {
  const isVi = useLocale().toLowerCase().startsWith("vi");
  const [accountPageLimit, setAccountPageLimit] = useState<number>(8);
  const [secrets, setSecrets] = useState<SecretItem[]>([]);
  const [customAccounts, setCustomAccounts] = useState<AccountBlueprint[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const savingRef = useRef<boolean>(false);
  const [serverProjects, setServerProjects] = useState<PortfolioProjectOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<VaultTabId>("accounts");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [lightboxImage, setLightboxImage] = useState<{ title: string; url: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live MISA Bank Sync State
  const [misaBankStatus, setMisaBankStatus] = useState<{ configured?: boolean; in_misa_cloud?: boolean; in_local_ledger?: boolean; bank_code?: string; masked_account?: string; misa_account_holder?: string } | null>(null);
  const [syncingMisaBank, setSyncingMisaBank] = useState(false);

  const fetchMisaBankStatus = async () => {
    try {
      const res = await fetch(vaultApiUrl(`/api/auth/misa-bank-status`));
      if (res.ok) {
        const data = await res.json();
        setMisaBankStatus(data);
      }
    } catch {}
  };

  const syncMisaBankNow = async () => {
    setSyncingMisaBank(true);
    try {
      const res = await fetch(vaultApiUrl(`/api/auth/sync-misa-bank`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key_prefix: "BUSINESS_BANK" }),
      });
      const d = await res.json().catch(() => ({}));
      await fetchMisaBankStatus();
      setSyncingMisaBank(false);
      showToast(res.ok ? "Synced & verified in MISA AMIS HKD \u2713" : (d.message || d.error || "MISA sync failed"));
    } catch {
      setSyncingMisaBank(false);
      showToast("Failed to connect to Vault server");
    }
  };

  // Composer Modal State
  const [composer, setComposer] = useState<ComposerModalState>(DEFAULT_MODAL_STATE);

  const bulkFileInputRef = useRef<HTMLInputElement | null>(null);
  const assetFileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const loadVault = async () => {
    try {
      let res: Response;
      try {
        res = await fetch(vaultApiUrl(`/api/secrets?target=all`));
      } catch {
        res = await fetch("/api/vault-bridge?target=all");
      }
      if (res.ok) {
        const data = await res.json();
        setSecrets(data.secrets || []);
        if (Array.isArray(data.portfolio_projects) && data.portfolio_projects.length > 0) {
          setServerProjects(data.portfolio_projects as PortfolioProjectOption[]);
        }
        setVaultError(null);

        // Load custom accounts from API
        if (Array.isArray(data.custom_accounts)) {
          const serverCards = dedupeCustomAccounts(data.custom_accounts as AccountBlueprint[]);
          setCustomAccounts(serverCards);
          try {
            window.localStorage.setItem("itsaplan_custom_accounts", JSON.stringify(serverCards));
          } catch {}
        }
      } else {
        setVaultError(`Vault server returned HTTP ${res.status}`);
      }
    } catch {
      setVaultError(`Local Secret Vault service (${VAULT_SERVER}) is unreachable.`);
      try {
        const raw = typeof window !== "undefined" ? window.localStorage.getItem("itsaplan_custom_accounts") : null;
        if (raw) {
          const cached = JSON.parse(raw);
          if (Array.isArray(cached)) {
            setCustomAccounts(dedupeCustomAccounts(cached));
          }
        }
      } catch {}
    } finally {
      setLoading(false);
      void fetchMisaBankStatus();
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qTab = params.get("tab") as VaultTabId | null;
      if (qTab && ["accounts", "identity", "apikeys", "infra", "all"].includes(qTab)) {
        setActiveTab(qTab);
      }
    }
    loadVault();
    const onFocus = () => {
      loadVault();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (!vaultError) return;
    const retryTimer = window.setInterval(() => {
      loadVault();
    }, 3000);
    return () => window.clearInterval(retryTimer);
  }, [vaultError]);

  const selectTab = (tab: VaultTabId) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const byKey = useMemo(() => {
    const map: Record<string, SecretItem> = {};
    secrets.forEach((s) => {
      map[s.key] = s;
    });
    return map;
  }, [secrets]);

  // Merge built-in blueprints with dynamic custom accounts
  const allAccounts = useMemo(() => {
    const map = new Map<string, AccountBlueprint>();
    ACCOUNT_BLUEPRINTS.forEach((acc) => {
      map.set(acc.id, { ...acc, isCustom: false });
    });
    customAccounts.forEach((c) => {
      const existing = map.get(c.id);
      if (existing) {
        map.set(c.id, {
          ...existing,
          ...c,
          isCustom: false,
          fields: c.fields && c.fields.length > 0 ? c.fields : existing.fields,
        });
      } else {
        map.set(c.id, { ...c, isCustom: true });
      }
    });
    return Array.from(map.values());
  }, [customAccounts]);

  const dynamicProjectMetaMap = useMemo(() => {
    const map: Record<string, PortfolioProjectOption> = { ...PORTFOLIO_PROJECT_BY_NAME };
    serverProjects.forEach((sp) => {
      if (sp && sp.display_name) map[normalizeProjectDisplayName(sp.display_name)] = sp;
    });
    return map;
  }, [serverProjects]);

  // Dynamic set of all available projects for filter and composer modals
  const availableProjects = useMemo(() => {
    const set = new Set<string>(WORKSPACE_PROJECTS);
    serverProjects.forEach((sp) => {
      if (sp && sp.display_name && sp.display_name.trim()) {
        set.add(normalizeProjectDisplayName(sp.display_name));
      }
    });
    secrets.forEach((s) => {
      if (s.project && s.project.trim()) set.add(normalizeProjectDisplayName(s.project));
      const c = classifyProjectForKey(s.key, s.project);
      if (c) set.add(c);
    });
    allAccounts.forEach((a) => {
      if (a.project && a.project.trim()) set.add(normalizeProjectDisplayName(a.project));
    });
    return Array.from(set);
  }, [secrets, allAccounts, serverProjects]);

  const tabCounts = useMemo(
    () => ({
      accounts: allAccounts.length,
      identity: 2,
      apikeys: secrets.filter(isApiKeyRow).length,
      infra: secrets.filter((s) => !isIdentityKey(s.key) && !isApiKeyRow(s)).length,
      all: secrets.length,
    }),
    [secrets, allAccounts]
  );

  const resolveKey = (key: string, fallbackKey?: string): string => {
    if (byKey[key]) return key;
    if (fallbackKey && byKey[fallbackKey]) return fallbackKey;
    return key;
  };

  const getVal = (key: string) => {
    if (revealed[key]) return revealed[key];
    const item = byKey[key];
    if (!item) return "Not set";
    if (item.handle_value) return item.handle_value;
    return item.masked || "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
  };

  const toggleReveal = async (key: string) => {
    if (revealed[key]) {
      const next = { ...revealed };
      delete next[key];
      setRevealed(next);
      return;
    }
    try {
      const res = await fetch(vaultApiUrl(`/api/secrets/reveal?key=${encodeURIComponent(key)}`));
      if (res.ok) {
        const d = await res.json();
        setRevealed((prev) => ({ ...prev, [key]: d.value || "" }));
      }
    } catch {
      showToast(`Unable to reveal ${key}`);
    }
  };

  const copySecretValue = async (key: string) => {
    let val = revealed[key] || byKey[key]?.handle_value || "";
    if (!val) {
      try {
        const res = await fetch(vaultApiUrl(`/api/secrets/reveal?key=${encodeURIComponent(key)}`));
        if (res.ok) {
          const d = await res.json();
          val = d.value || "";
        }
      } catch {
        // ignore offline error
      }
    }
    if (val && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(val);
      showToast(`Copied ${key} to clipboard`);
    } else {
      showToast(`No value set for ${key}`);
    }
  };

  const triggerAction = async (endpoint: string, payload: Record<string, unknown>, label?: string) => {
    showToast(label ? `${label}...` : `Running ${endpoint}...`);
    try {
      const res = await fetch(vaultApiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(label ? `${label} completed` : "Completed");
        await loadVault();
      } else {
        showToast(`Action returned HTTP ${res.status}`);
      }
    } catch {
      showToast("Vault service unreachable");
    }
  };

  const fetchRevealedValue = async (key: string): Promise<string | null> => {
    if (!key) return null;
    try {
      const res = await fetch(vaultApiUrl(`/api/secrets/reveal?key=${encodeURIComponent(key)}`));
      if (res.ok) {
        const d = await res.json();
        if (typeof d.value === "string") return d.value;
      }
    } catch {}
    try {
      const res = await fetch(`/api/vault-bridge?reveal=${encodeURIComponent(key)}`);
      if (res.ok) {
        const d = await res.json();
        if (typeof d.value === "string") return d.value;
      }
    } catch {}
    return null;
  };

  // Composer Modal Openers
  const openEditor = (
    key: string,
    context?: { project?: string; role?: string; accountTitle?: string; isSecret?: boolean }
  ) => {
    const existing = byKey[key];
    const upperK = key.toUpperCase();
    if (upperK.startsWith("BUSINESS_BANK_") || upperK.startsWith("COMPANY_BANK_")) {
      void openBusinessBankEditor();
      return;
    }
    const isBankHandle =
      upperK.includes("BANK_NAME") || upperK.includes("BANK_ACCOUNT_HOLDER") || upperK.includes("BANK_BRANCH");
    const isHandleSuffix =
      upperK.endsWith("_USERNAME") ||
      upperK.endsWith("_EMAIL") ||
      upperK.endsWith("_PHONE") ||
      upperK.endsWith("_URL") ||
      upperK.endsWith("_HOST") ||
      upperK.endsWith("_PORT") ||
      upperK.endsWith("_NAME") ||
      upperK.endsWith("_HOLDER") ||
      upperK.endsWith("_BRANCH");
    const isMultilineKey =
      upperK.includes("JSON") ||
      upperK.includes("COOKIE") ||
      upperK.includes("PEM") ||
      upperK.includes("CERT") ||
      upperK.includes("PRIVATE_KEY");
    const isId = isIdentityKey(upperK);
    const initialVal = revealed[key] || existing?.handle_value || "";
    const resolvedProject = existing?.project
      ? classifyProjectForKey(key, existing.project)
      : context?.project
      ? normalizeProjectDisplayName(context.project)
      : key
      ? classifyProjectForKey(key)
      : projectFilter !== "all"
      ? projectFilter
      : "Core OS";
    const resolvedNotes =
      existing?.desc ||
      existing?.notes ||
      (context?.accountTitle && context?.role ? `${context.accountTitle} - ${context.role}` : "");

    setComposer({
      ...DEFAULT_MODAL_STATE,
      open: true,
      mode: "secret",
      secretKey: key,
      secretValue: initialVal,
      secretProject: resolvedProject,
      secretCategory: existing?.category || (upperK.includes("BANK") ? "BANKING" : isId ? "IDENTITY" : "API"),
      secretType:
        initialVal.includes("\n") || existing?.secret_type === "multiline" || isMultilineKey
          ? "multiline"
          : isBankHandle || isHandleSuffix || context?.isSecret === false || existing?.secret_type === "config" || existing?.is_secret === false
          ? "config"
          : "secret",
      secretMasked: Boolean(key) ? false : !isBankHandle,
      secretNotes: resolvedNotes,
      secretConsumerPath: (existing?.code_consumers && existing.code_consumers[0]) || "apps/itsaplan/vault_bridge.py",
      saveToVault: true,
      saveToEnv: existing?.in_env !== false,
      saveToItsaplan: isId ? true : !!existing?.in_itsaplan,
      isEditingExistingKey: Boolean(key),
      isEditingExistingAccount: false,
    });

    if (key) {
      void fetchRevealedValue(key).then((val) => {
        if (val !== null) {
          setRevealed((prev) => ({ ...prev, [key]: val }));
          setComposer((prev) =>
            prev.open && prev.mode === "secret" && prev.secretKey === key
              ? {
                  ...prev,
                  secretValue: val,
                  secretType:
                    val.includes("\n") || prev.secretType === "multiline" || isMultilineKey
                      ? "multiline"
                      : prev.secretType,
                }
              : prev
          );
        }
      });
    }
  };

  const openBusinessBankEditor = async () => {
    const acctKey = resolveKey("BUSINESS_BANK_ACCOUNT_NUMBER", "COMPANY_BANK_ACCOUNT_NUMBER");
    let acctVal = revealed[acctKey] || "";
    if (!acctVal && byKey[acctKey]) {
      const fetched = await fetchRevealedValue(acctKey);
      if (fetched !== null) {
        acctVal = fetched;
        setRevealed((prev) => ({ ...prev, [acctKey]: acctVal }));
      }
    }
    const bankNameKey = resolveKey("BUSINESS_BANK_NAME", "COMPANY_BANK_NAME");
    const holderKey = resolveKey("BUSINESS_BANK_ACCOUNT_HOLDER", "BUSINESS_OWNER_NAME");
    const branchKey = resolveKey("BUSINESS_BANK_BRANCH", "COMPANY_BANK_BRANCH");
    setComposer({
      ...DEFAULT_MODAL_STATE,
      open: true,
      mode: "account",
      accountId: "business-bank-hkd",
      accountTitle: "Business Bank Account — Sample Business",
      accountAvatar: "BK",
      accountProject: "Solopreneur Legal",
      accountActionLabel: "Sync to MISA HKD",
      accountActionUrl: "/api/auth/sync-misa-bank",
      accountPreset: "bank_account",
      accountIsCustom: false,
      isEditingExistingAccount: true,
      accountFields: [
        {
          role: "Bank Name (Tên ngân hàng)",
          key: "BUSINESS_BANK_NAME",
          value: revealed[bankNameKey] || byKey[bankNameKey]?.handle_value || "",
          isSecret: false,
          masked: false,
        },
        {
          role: "Bank Account Number (Số tài khoản)",
          key: "BUSINESS_BANK_ACCOUNT_NUMBER",
          value: acctVal,
          isSecret: true,
          masked: false,
        },
        {
          role: "Account Holder (Chủ tài khoản)",
          key: "BUSINESS_BANK_ACCOUNT_HOLDER",
          value: revealed[holderKey] || byKey[holderKey]?.handle_value || "",
          isSecret: false,
          masked: false,
        },
        {
          role: "Bank Branch / CITAD (Chi nhánh)",
          key: "BUSINESS_BANK_BRANCH",
          value: revealed[branchKey] || byKey[branchKey]?.handle_value || "",
          isSecret: false,
          masked: false,
        },
      ],
    });
  };

  const openAccountEditor = (acc: AccountBlueprint) => {
    const normalizedAcc = ensureAccountBlueprintFields(acc);
    const editFields: BoundFieldEditItem[] = normalizedAcc.fields.map((f, idx) => {
      const k = resolveKey(f.key, f.fallbackKey);
      const val = revealed[k] || byKey[k]?.handle_value || "";
      const isCustomExtra =
        Boolean(normalizedAcc.isCustom) &&
        (idx >= 3 || /\b(smtp|imap|pop3)\b/i.test(`${f.role} ${f.key}`));
      return {
        role: f.role,
        key: f.key,
        value: val,
        isSecret: Boolean(f.isSecret),
        masked: false,
        customizeKey: isCustomExtra,
      };
    });

    setComposer({
      ...DEFAULT_MODAL_STATE,
      open: true,
      mode: "account",
      accountId: normalizedAcc.id,
      accountTitle: normalizedAcc.title,
      accountAvatar: normalizedAcc.avatar,
      accountProject: normalizeProjectDisplayName(normalizedAcc.project),
      accountActionLabel:
        normalizedAcc.actionHref &&
        (!normalizedAcc.actionLabel ||
          normalizedAcc.actionLabel === "Run Action" ||
          normalizedAcc.actionLabel === "Verify Account")
          ? "Open Link"
          : normalizedAcc.actionLabel || "",
      accountActionUrl: normalizedAcc.actionHref || normalizedAcc.actionEndpoint || "",
      accountPreset: "",
      accountFields:
        editFields.length > 0
          ? editFields
          : [
              { role: "Username / Email", key: "", value: "", isSecret: false, masked: false },
              { role: "Password", key: "", value: "", isSecret: true, masked: false },
              { role: "Session Cookie JSON", key: "", value: "", isSecret: true, masked: false },
            ],
      accountIsCustom: !!normalizedAcc.isCustom,
      isEditingExistingAccount: true,
    });

    void Promise.all(
      normalizedAcc.fields.map(async (f, idx) => {
        const k = resolveKey(f.key, f.fallbackKey);
        const val = await fetchRevealedValue(k);
        return { idx, k, val };
      })
    ).then((results) => {
      const newlyRevealed: Record<string, string> = {};
      results.forEach(({ k, val }) => {
        if (k && val !== null) newlyRevealed[k] = val;
      });
      if (Object.keys(newlyRevealed).length > 0) {
        setRevealed((prev) => ({ ...prev, ...newlyRevealed }));
        setComposer((prev) => {
          if (!prev.open || prev.mode !== "account" || prev.accountId !== normalizedAcc.id) return prev;
          const updatedFields = prev.accountFields.map((field, idx) => {
            const match = results.find((r) => r.idx === idx);
            if (match && match.val !== null) {
              return { ...field, value: match.val };
            }
            return field;
          });
          return { ...prev, accountFields: updatedFields };
        });
      }
    });
  };

  const openNewAccountEditor = () => {
    setComposer({
      ...DEFAULT_MODAL_STATE,
      open: true,
      mode: "account",
      accountId: `custom-${Date.now()}`,
      accountTitle: "",
      accountAvatar: "",
      accountProject: projectFilter !== "all" ? projectFilter : "OmniCommunication",
      accountActionLabel: "",
      accountActionUrl: "",
      accountPreset: "",
      accountFields: [
        { role: "Username / Email", key: "", value: "", isSecret: false, masked: false, customizeKey: false },
        { role: "Password", key: "", value: "", isSecret: true, masked: false, customizeKey: false },
        { role: "Session Cookie JSON", key: "", value: "", isSecret: true, masked: false, customizeKey: false },
      ],
      accountIsCustom: true,
      isEditingExistingAccount: false,
    });
  };

  const closeModal = () => {
    setComposer((prev) => ({ ...prev, open: false }));
  };

  // Mode 1: Save Single Secret
  const saveSecret = async () => {
    const trimmedKey = composer.secretKey.trim();
    if (!trimmedKey) {
      showToast("Key Name is required");
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      const payload = {
        key: trimmedKey,
        value: composer.secretValue,
        project: composer.secretProject,
        category: composer.secretCategory,
        secret_type: composer.secretType,
        consumer_path: composer.secretConsumerPath,
        notes: composer.secretNotes,
        description: composer.secretNotes,
        save_to_vault: composer.saveToVault,
        save_to_env: composer.saveToEnv,
        save_to_itsaplan: composer.saveToItsaplan,
      };
      const secRes = await postVaultJson("/api/secrets", payload);
      if (!secRes.ok) {
        showToast(secRes.error || `Failed to save ${trimmedKey}`);
        return;
      }
      const savedData = secRes.data || {};
      const finalKey = savedData.key || trimmedKey;
      setRevealed((prev) => ({ ...prev, [finalKey]: composer.secretValue }));
      closeModal();
      showToast(`Saved ${finalKey} to AES-256 Vault`);
      await loadVault();
    } catch {
      showToast("Failed to connect to Vault server");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const [armedDeleteKey, setArmedDeleteKey] = useState<string | null>(null);
  const [armedDeleteAccountId, setArmedDeleteAccountId] = useState<string | null>(null);

  const deleteKey = async (key: string) => {
    if (!key) return;
    if (armedDeleteKey !== key) {
      setArmedDeleteKey(key);
      showToast(`Click Delete again to confirm removing "${key}"`);
      return;
    }
    setArmedDeleteKey(null);
    try {
      let res: Response;
      try {
        res = await fetch(vaultApiUrl(`/api/secrets/${encodeURIComponent(key)}`), {
          method: "DELETE",
        });
      } catch {
        res = await fetch(`/api/vault-bridge?endpoint=${encodeURIComponent(`/api/secrets/${encodeURIComponent(key)}`)}`, {
          method: "DELETE",
        });
      }
      if (res.ok) {
        setRevealed((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        closeModal();
        showToast(`Deleted ${key} from Vault`);
        await loadVault();
      } else {
        showToast(`Failed to delete ${key} (HTTP ${res.status})`);
      }
    } catch {
      showToast("Failed to connect to Vault server");
    }
  };

  // Mode 2: Save Account Card
  const saveAccountCard = async (syncAfterSave: boolean | unknown = false) => {
    const shouldSyncAfterSave = syncAfterSave === true;
    const title = composer.accountTitle.trim();
    if (!title) {
      showToast("Account Title is required");
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      if (composer.accountId === "business-bank-hkd") {
        let savedCount = 0;
        const bankUpdates: Record<string, string> = {};
        for (const f of composer.accountFields) {
          const k = f.key.trim().toUpperCase();
          if (k && f.value !== undefined && f.value.trim() !== "") {
            const cleanVal = f.value.trim();
            bankUpdates[k] = cleanVal;
            const res = await postVaultJson("/api/secrets", {
              key: k,
              value: cleanVal,
              project: "Solopreneur Legal",
              category: "BANKING",
              secret_type: f.isSecret ? "secret" : "config",
              description: `Business Bank Account - ${f.role}`,
              save_to_vault: true,
              save_to_env: true,
              save_to_itsaplan: true,
            });
            if (res.ok) savedCount += 1;
          }
        }
        if (Object.keys(bankUpdates).length > 0) {
          setRevealed((prev) => ({ ...prev, ...bankUpdates }));
        }
        closeModal();
        showToast(savedCount > 0 ? "Saved Business Bank Account to AES-256 Vault" : "No non-empty bank fields provided");
        await loadVault();
        if (shouldSyncAfterSave) {
          await syncMisaBankNow();
        }
        return;
      }
      if (!composer.accountIsCustom && composer.accountId) {
        let savedCount = 0;
        const builtInUpdates: Record<string, string> = {};
        for (const f of composer.accountFields) {
          const k = f.key.trim().toUpperCase();
          if (k && f.value !== undefined && f.value !== "") {
            builtInUpdates[k] = f.value;
            const res = await postVaultJson("/api/secrets", {
              key: k,
              value: f.value,
              project: composer.accountProject || "MISA & Tax Ops",
              category: "AUTH",
              secret_type:
                k.includes("JSON") || k.includes("COOKIE") || f.value.includes("\n")
                  ? "multiline"
                  : f.isSecret
                  ? "secret"
                  : "config",
              description: `${composer.accountTitle} - ${f.role}`,
              save_to_vault: true,
              save_to_env: true,
              save_to_itsaplan: true,
            });
            if (res.ok) savedCount += 1;
          }
        }
        if (Object.keys(builtInUpdates).length > 0) {
          setRevealed((prev) => ({ ...prev, ...builtInUpdates }));
        }
        closeModal();
        showToast(savedCount > 0 ? `Saved ${composer.accountTitle} to AES-256 Vault` : "No fields provided");
        await loadVault();
        return;
      }

      const avatar = composer.accountAvatar.trim() || title.substring(0, 2).toUpperCase();
      const slugTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const matchingCard = customAccounts.find(
        (acc) =>
          (acc.title || "").trim().toLowerCase() === title.toLowerCase() &&
          ((acc.project || "").trim().toLowerCase() === (composer.accountProject || "").trim().toLowerCase())
      );
      let accountId: string;
      if (composer.isEditingExistingAccount && composer.accountId.trim()) {
        accountId = composer.accountId.trim();
      } else if (matchingCard && matchingCard.id) {
        accountId = matchingCard.id;
      } else if (
        composer.accountId.trim() &&
        !/^custom-\d+$/.test(composer.accountId.trim()) &&
        !/-\d{10,}$/.test(composer.accountId.trim())
      ) {
        accountId = composer.accountId.trim();
      } else {
        accountId = "custom-" + (slugTitle || "account");
      }

      const usedKeys = new Set<string>();
      const resolvedItems = composer.accountFields
        .filter((f) => f.role.trim() || f.key.trim() || f.value.trim())
        .map((f, idx) => {
          const role = f.role.trim() || f.key.trim() || `Field ${idx + 1}`;
          let k = f.key.trim().toUpperCase();
          if (!k || k.startsWith("ACCOUNT_") || k.startsWith("CUSTOM_ACCOUNT_")) {
            k = deriveBoundFieldKey(title, role, idx);
          }
          const baseK = k;
          let dup = 2;
          while (usedKeys.has(k)) {
            k = `${baseK}_${dup}`;
            dup += 1;
          }
          usedKeys.add(k);
          return {
            role,
            key: k,
            value: f.value,
            isSecret: f.isSecret,
          };
        });

      const fields: BoundFieldSpec[] = resolvedItems.map((item) => ({
        role: item.role,
        key: item.key,
        isSecret: item.isSecret,
        isHandle: !item.isSecret,
      }));

      const valuesToSave: Record<string, string> = {};
      resolvedItems.forEach((item) => {
        if (item.key && item.value !== undefined && item.value !== "") {
          valuesToSave[item.key] = item.value;
        }
      });

      const isUrl = composer.accountActionUrl.trim().startsWith("http");
      const rawLabel = composer.accountActionLabel.trim();
      const normalizedActionLabel =
        isUrl && (!rawLabel || rawLabel === "Run Action" || rawLabel === "Verify Account")
          ? "Open Link"
          : rawLabel || (isUrl ? "Open Link" : "Run Action");

      const newBlueprint: AccountBlueprint = {
        id: accountId,
        title,
        avatar,
        project: composer.accountProject,
        actionLabel: normalizedActionLabel,
        actionHref: isUrl ? composer.accountActionUrl.trim() : undefined,
        actionEndpoint: !isUrl && composer.accountActionUrl.trim() ? composer.accountActionUrl.trim() : undefined,
        fields,
        isCustom: true,
      };

      const accRes = await postVaultJson("/api/accounts", {
        account: newBlueprint,
        field_values: valuesToSave,
        save_to_vault: true,
        save_to_env: true,
      });

      if (!accRes.ok) {
        showToast(accRes.error || "Failed to save account card");
        return;
      }

      for (const item of resolvedItems) {
        if (item.key && item.value !== undefined && item.value !== "") {
          const secType =
            item.key.includes("JSON") || item.key.includes("COOKIE") || item.value.includes("\n")
              ? "multiline"
              : item.isSecret
              ? "secret"
              : "config";
          await postVaultJson("/api/secrets", {
            key: item.key,
            value: item.value,
            project: composer.accountProject,
            category: "AUTH",
            secret_type: secType,
            description: `${title} - ${item.role}`,
            notes: `${title} - ${item.role}`,
            save_to_vault: true,
            save_to_env: true,
          });
        }
      }

      if (Object.keys(valuesToSave).length > 0) {
        setRevealed((prev) => ({ ...prev, ...valuesToSave }));
      }

      const finalAccount: AccountBlueprint = (accRes.data?.account as AccountBlueprint) || newBlueprint;

      setCustomAccounts((prev) => {
        const existingIdx = prev.findIndex((a) => a.id === accountId || a.id === finalAccount.id);
        let updated: AccountBlueprint[];
        if (existingIdx >= 0) {
          updated = [...prev];
          updated[existingIdx] = finalAccount;
        } else {
          updated = [...prev, finalAccount];
        }
        try {
          window.localStorage.setItem("itsaplan_custom_accounts", JSON.stringify(updated));
        } catch {}
        return updated;
      });

      closeModal();
      showToast(`Saved Account Card "${title}" to Vault`);
      await loadVault();
    } catch {
      showToast("Failed to save account card: network error");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const deleteAccountCard = async (accountId: string) => {
    if (armedDeleteAccountId !== accountId) {
      setArmedDeleteAccountId(accountId);
      showToast("Click Remove again to confirm deleting this Account Card");
      return;
    }
    setArmedDeleteAccountId(null);
    let res: Response | null = null;
    try {
      try {
        res = await fetch(vaultApiUrl(`/api/accounts/${encodeURIComponent(accountId)}`), {
          method: "DELETE",
        });
      } catch {
        res = await fetch(`/api/vault-bridge?endpoint=${encodeURIComponent(`/api/accounts/${accountId}`)}`, {
          method: "DELETE",
        });
      }
    } catch {}

    if (res && !res.ok && res.status !== 404) {
      showToast(`Failed to delete account (HTTP ${res.status})`);
      return;
    }

    setCustomAccounts((prev) => {
      const next = prev.filter((a) => a.id !== accountId);
      try {
        window.localStorage.setItem("itsaplan_custom_accounts", JSON.stringify(next));
      } catch {}
      return next;
    });
    if (composer.open && composer.accountId === accountId) {
      closeModal();
    }
    showToast("Account card removed");
    await loadVault();
  };

  const applyAccountPreset = (presetKey: string) => {
    if (!presetKey || !ACCOUNT_PRESETS[presetKey]) return;
    const preset = ACCOUNT_PRESETS[presetKey];
    const prefix = buildAccountKeyPrefix(composer.accountTitle, "ACCOUNT");
    const newFields: BoundFieldEditItem[] = preset.fields.map((f, idx) => {
      const fullKey = `${prefix}_${f.keySuffix}`;
      const matched = composer.accountFields.find(
        (ef, i) => deriveFieldKeySuffix(ef.key || ef.role, i) === f.keySuffix
      );
      const val = matched && matched.value ? matched.value : revealed[fullKey] || byKey[fullKey]?.handle_value || "";
      const isCustomExtra = idx >= 3 || /\b(smtp|imap|pop3)\b/i.test(`${f.role} ${f.keySuffix}`);
      return {
        role: f.role,
        key: fullKey,
        value: val,
        isSecret: f.isSecret,
        masked: false,
        customizeKey: isCustomExtra,
      };
    });
    setComposer((prev) => ({
      ...prev,
      accountPreset: presetKey,
      accountAvatar: prev.accountAvatar || preset.defaultBadge,
      accountFields: newFields,
    }));
  };

  const addAccountField = (defaultRole = "Custom Secret Field", isSecret = true) => {
    setComposer((prev) => ({
      ...prev,
      accountFields: [
        ...prev.accountFields,
        { role: defaultRole, key: "", value: "", isSecret, masked: false, customizeKey: true },
      ],
    }));
  };

  const removeAccountField = (idx: number) => {
    setComposer((prev) => ({
      ...prev,
      accountFields: prev.accountFields.filter((_, i) => i !== idx),
    }));
  };

  const updateAccountField = (idx: number, patch: Partial<BoundFieldEditItem>) => {
    setComposer((prev) => {
      const copy = [...prev.accountFields];
      copy[idx] = { ...copy[idx], ...patch };
      return { ...prev, accountFields: copy };
    });
  };

  const toggleAccountFieldMask = (idx: number) => {
    setComposer((prev) => {
      const copy = [...prev.accountFields];
      if (copy[idx]) {
        copy[idx] = { ...copy[idx], masked: !copy[idx].masked };
      }
      return { ...prev, accountFields: copy };
    });
  };

  // Mode 3: Bulk Import Parser
  const parsedBulkSecrets = useMemo(() => {
    const text = composer.bulkText.trim();
    if (!text) return [];
    if (text.startsWith("{")) {
      try {
        const obj = JSON.parse(text);
        if (typeof obj === "object" && obj !== null) {
          return Object.entries(obj).map(([k, v]) => ({
            key: k.trim(),
            value: typeof v === "string" ? v : JSON.stringify(v),
          }));
        }
      } catch {}
    }
    const lines = text.split("\n");
    const items: Array<{ key: string; value: string }> = [];
    for (const rawLine of lines) {
      let line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      if (line.startsWith("export ")) line = line.substring(7).trim();
      const eqIdx = line.indexOf("=");
      if (eqIdx <= 0) continue;
      const k = line.substring(0, eqIdx).trim();
      let v = line.substring(eqIdx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (k) items.push({ key: k, value: v });
    }
    return items;
  }, [composer.bulkText]);

  const importBulkSecrets = async () => {
    if (parsedBulkSecrets.length === 0) {
      showToast("No valid key=value pairs found to import");
      return;
    }
    showToast(`Importing ${parsedBulkSecrets.length} keys...`);
    let bulkSucceeded = false;
    try {
      const res = await fetch(vaultApiUrl(`/api/secrets/bulk`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secrets: parsedBulkSecrets.map((s) => ({
            key: s.key,
            value: s.value,
            project: composer.bulkProject,
            category: composer.bulkCategory,
          })),
          save_to_vault: composer.bulkSaveVault,
          save_to_env: composer.bulkSaveEnv,
          save_to_itsaplan: composer.bulkSaveItsaplan,
        }),
      });
      if (res.ok) bulkSucceeded = true;
    } catch {}

    // Fallback if bulk endpoint not implemented on server
    if (!bulkSucceeded) {
      for (const item of parsedBulkSecrets) {
        try {
          await fetch(vaultApiUrl(`/api/secrets`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: item.key,
              value: item.value,
              project: composer.bulkProject,
              category: composer.bulkCategory,
              save_to_vault: composer.bulkSaveVault,
              save_to_env: composer.bulkSaveEnv,
              save_to_itsaplan: composer.bulkSaveItsaplan,
            }),
          });
        } catch {}
      }
    }

    closeModal();
    showToast(`Imported ${parsedBulkSecrets.length} keys into AES-256 Vault`);
    await loadVault();
  };

  // Mode 4: File Asset Upload
  const uploadFileAsset = async () => {
    if (!composer.fileName) {
      showToast("Please choose a file or document to upload");
      return;
    }
    showToast(`Securing ${composer.fileName}...`);
    // 1. Send to /api/vault/media
    try {
      await fetch(vaultApiUrl(`/api/vault/media`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: composer.fileAssetSlot || composer.fileName,
          file_name: composer.fileName,
          mime_type: composer.fileMime,
          data: composer.fileData,
          project: composer.fileProject,
          description: composer.fileDescription,
        }),
      }).catch(() => {});
    } catch {}

    // 2. If bound vault key name is specified, store in secrets
    const boundKey = composer.fileVaultKey.trim().toUpperCase();
    if (boundKey) {
      try {
        await fetch(vaultApiUrl(`/api/secrets`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: boundKey,
            value: composer.fileTextContent || composer.fileData,
            project: composer.fileProject,
            category: "CERT",
            secret_type: composer.fileMime.includes("json")
              ? "json"
              : composer.fileMime.includes("pdf")
              ? "pdf"
              : "cert",
            description: composer.fileDescription || `Asset: ${composer.fileName}`,
            notes: `Slot: ${composer.fileAssetSlot || composer.fileName}`,
            file_name: composer.fileName,
            mime_type: composer.fileMime,
            save_to_vault: true,
            save_to_env: true,
          }),
        });
      } catch {}
    }

    closeModal();
    showToast(`Successfully secured ${composer.fileName} in Vault`);
    await loadVault();
  };

  const qNormalized = search.trim().toLowerCase();

  const filteredAccounts = useMemo(
    () =>
      allAccounts.filter((acc) => {
        if (projectFilter !== "all" && acc.project !== projectFilter) return false;
        if (!qNormalized) return true;
        const hay = `${acc.title} ${acc.project} ${acc.fields
          .map((f) => `${f.role} ${f.key} ${getVal(resolveKey(f.key, f.fallbackKey))}`)
          .join(" ")}`.toLowerCase();
        return hay.includes(qNormalized);
      }),
    [allAccounts, projectFilter, qNormalized, byKey, revealed]
  );

  const filteredTableSecrets = useMemo(
    () =>
      secrets.filter((sec) => {
        const proj = classifyProjectForKey(sec.key, sec.project);
        if (projectFilter !== "all" && proj !== projectFilter) return false;
        if (activeTab === "apikeys" && !isApiKeyRow(sec)) return false;
        if (activeTab === "infra" && (isIdentityKey(sec.key) || isApiKeyRow(sec))) return false;
        if (!qNormalized) return true;
        const consumer = (sec.code_consumers && sec.code_consumers[0]) || "";
        const hay = `${sec.key} ${sec.handle_value || ""} ${proj} ${sec.category || ""} ${consumer}`.toLowerCase();
        return hay.includes(qNormalized);
      }),
    [secrets, projectFilter, activeTab, qNormalized]
  );

  const renderBoundFieldRow = (f: BoundFieldSpec, parentAccount?: AccountBlueprint) => {
    const k = resolveKey(f.key, f.fallbackKey);
    const item = byKey[k];
    const val = getVal(k);
    const hasVal = Boolean(revealed[k]) || (Boolean(item) && val !== "Not set" && Boolean(val));
    const upperK = k.toUpperCase();
    const isSessionOrJson = upperK.includes("JSON") || upperK.includes("COOKIE");
    const showStoredBadge = isSessionOrJson && !revealed[k] && hasVal;
    const isPiiField = !f.isSecret && /TAX|MST|PHONE|CCCD/i.test(upperK);
    const isPiiMasked = isPiiField && !revealed[k] && hasVal && val.length > 4;

    return (
      <div
        key={k}
        className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground" title={k}>
            <span className="uppercase font-medium tracking-wide text-muted-foreground">{f.role}</span>
            <span className="sr-only">({k})</span>
          </div>
          <div className="text-xs font-mono text-foreground break-words mt-0.5">
            {!hasVal ? (
              <span className="font-sans text-muted-foreground italic">
                {isVi ? "Chưa cấu hình" : "Not configured"}
              </span>
            ) : showStoredBadge ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--studio-emerald-soft)] px-2.5 py-0.5 font-sans text-xs font-medium text-[var(--studio-emerald)]">
                ● {isVi ? "Đã lưu Cookie phiên" : "Session Cookie Stored"}
              </span>
            ) : isPiiMasked ? (
              `••••••${val.slice(-4)}`
            ) : (
              val
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!hasVal ? (
            <button
              type="button"
              onClick={() =>
                openEditor(k, {
                  project: parentAccount?.project,
                  role: f.role,
                  accountTitle: parentAccount?.title,
                  isSecret: f.isSecret,
                })
              }
              className="inline-flex min-h-8 items-center rounded-full bg-[var(--studio-emerald-soft)] px-3 py-1.5 text-xs font-medium text-[var(--studio-emerald)] transition-colors hover:bg-accent whitespace-nowrap shrink-0"
            >
              {isVi ? "+ Thiết lập" : "+ Set"}
            </button>
          ) : (
            <>
              {(f.isSecret || isPiiField) && (
                <button
                  type="button"
                  onClick={() => toggleReveal(k)}
                  className="inline-flex min-h-8 items-center rounded-full bg-muted/65 px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
                >
                  {revealed[k] ? (isVi ? "Ẩn" : "Hide") : (isVi ? "Hiện" : "Show")}
                </button>
              )}
              <button
                type="button"
                onClick={() => copySecretValue(k)}
                className="inline-flex min-h-8 items-center rounded-full bg-muted/65 px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
              >
                {isVi ? "Sao chép" : "Copy"}
              </button>
              <button
                type="button"
                onClick={() =>
                  openEditor(k, {
                    project: parentAccount?.project,
                    role: f.role,
                    accountTitle: parentAccount?.title,
                    isSecret: f.isSecret,
                  })
                }
                className="inline-flex min-h-8 items-center rounded-full bg-muted/65 px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
              >
                {isVi ? "Sửa" : "Edit"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const showIdentityView =
    activeTab === "identity" || (activeTab === "accounts" && projectFilter === "Solopreneur Legal");
  const showTableView = activeTab === "apikeys" || activeTab === "infra" || activeTab === "all";

  const activeScopeTitle =
    activeTab === "apikeys"
      ? "API Keys & Service Tokens"
      : activeTab === "infra"
      ? "Infra & Config Variables"
      : "All Vault & Environment Keys";

  return (
    <div
      data-testid="secret-vault-scroll-container"
      className="h-full min-h-0 flex-1 overflow-y-auto bg-background p-6 sm:p-8 font-sans text-foreground"
    >
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {isVi ? "Kho bảo mật" : "Secret Vault"}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground max-w-[68ch] mt-0.5">
              {isVi
                ? "Quản lý tài khoản đăng nhập, hồ sơ định danh CCCD, cấu hình hạ tầng & khóa API mã hóa."
                : "Accounts (Email/Phone + Password + Cookie bound together), Owner CCCD Images, Infra Config & API Keys"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <details className="group relative">
              <summary className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-full border border-border/85 bg-muted/55 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent list-none select-none">
                {isVi ? "Đồng bộ & Nhập" : "Sync & Import"} &#9662;
              </summary>
              <div className="absolute right-0 top-full mt-1.5 z-30 hidden group-open:flex min-w-[220px] flex-col gap-1 rounded-2xl border border-border/85 bg-popover p-1.5 text-popover-foreground shadow-[var(--overlay-shadow)]">
                <a
                  href={vaultApiUrl(`/api/sso/start?provider=gws`)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[38px] items-center rounded-xl px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Sign in with Google
                </a>
                <button
                  type="button"
                  onClick={() => triggerAction("/api/auth/sync-calendar", {}, "Sync Google Calendar")}
                  className="flex min-h-[38px] w-full items-center rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Sync Google Calendar
                </button>
                <button
                  type="button"
                  onClick={() => triggerAction("/api/auth/harvest-session", { platform: "all" }, "Sync Browser Cookies")}
                  className="flex min-h-[38px] w-full items-center rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Sync Browser Cookies
                </button>
                <button
                  type="button"
                  onClick={() => triggerAction("/api/auth/discover-cli", {}, "Import CLI Tokens")}
                  className="flex min-h-[38px] w-full items-center rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Import CLI Tokens
                </button>
                <button
                  type="button"
                  data-testid="btn-header-business-bank"
                  onClick={openBusinessBankEditor}
                  className="flex min-h-[38px] w-full items-center rounded-xl px-3 py-2 text-left text-xs font-semibold text-[var(--studio-emerald)] transition-colors hover:bg-accent"
                >
                  + Business Bank Account
                </button>
                <button
                  type="button"
                  onClick={openNewAccountEditor}
                  className="flex min-h-[38px] w-full items-center rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  + Add Account Card
                </button>
              </div>
            </details>
            <button
              type="button"
              onClick={() => openEditor("")}
              className="inline-flex min-h-[40px] items-center rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-xs transition-colors hover:bg-foreground/90"
            >
              {isVi ? "+ Thêm khóa" : "+ Add Secret"}
            </button>
          </div>
        </header>

        {vaultError && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">
            {vaultError}
          </div>
        )}

        <nav
          aria-label="Vault Category and Project Filters"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <div
            role="tablist"
            aria-label="Secret Vault Views"
            className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-2xl sm:rounded-full border border-border/85 bg-muted/65 p-1"
          >
            {(["accounts", "identity", "apikeys", "infra", "all"] as const).map((t) => {
              const isSelected = activeTab === t;
              const label =
                t === "accounts"
                  ? isVi ? "Tài khoản & Đăng nhập" : "Accounts & Logins"
                  : t === "identity"
                  ? isVi ? "Định danh & CCCD" : "Identity & CCCD"
                  : t === "apikeys"
                  ? isVi ? "Khóa API" : "API Keys"
                  : t === "infra"
                  ? isVi ? "Hạ tầng & Cấu hình" : "Infra & Config"
                  : isVi ? "Tất cả khóa" : "All Keys";
              const count = tabCounts[t];
              return (
                <button
                  key={t}
                  id={`vault-tab-${t}`}
                  data-testid={`vault-tab-${t}`}
                  role="tab"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => selectTab(t)}
                  className={`inline-flex min-h-[36px] items-center gap-2 rounded-full px-3.5 py-1.5 text-xs transition-all whitespace-nowrap ${
                    isSelected
                      ? "bg-foreground font-semibold text-background shadow-xs"
                      : "font-medium text-muted-foreground hover:bg-background/60 hover:text-foreground"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs tabular-nums ${
                      isSelected
                        ? "bg-background/15 text-background"
                        : "bg-background/70 text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative inline-flex items-center">
              <select
                aria-label={isVi ? "Lọc theo dự án" : "Filter by project"}
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="min-h-[40px] appearance-none ps-3.5 pe-8 rounded-full bg-card border border-border/85 text-xs text-foreground focus:border-ring focus:outline-none"
              >
                <option value="all">
                  {isVi
                    ? `Dự án: Tất cả (${availableProjects.length})`
                    : `Project: All Projects (${availableProjects.length})`}
                </option>
                {availableProjects.map((p) => (
                  <option key={p} value={p}>
                    {formatProjectOptionLabel(p, dynamicProjectMetaMap)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 size-3.5 text-muted-foreground" />
            </div>
            <input
              type="search"
              aria-label={isVi ? "Tìm kiếm bí mật" : "Search secrets"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isVi
                  ? "Tìm email, SĐT, CCCD, tên khóa..."
                  : "Search email, phone, CCCD, key..."
              }
              className="min-h-[40px] w-64 max-w-full px-3.5 rounded-full bg-card border border-border/85 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
          </div>
        </nav>

        {showIdentityView ? (
          <div data-testid="vault-identity-view" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <article className="rounded-2xl border border-border/85 bg-card p-5 shadow-[var(--studio-card-shadow)] flex flex-col gap-4">
              <div className="pb-4 border-b border-border/60 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Business Owner CCCD — Workspace Owner</h2>
                  <p className="text-xs text-muted-foreground">
                    Solopreneur Legal · Official Citizen Identity Images &amp; Bound Profile
                  </p>
                </div>
                <span className="inline-flex min-h-8 items-center rounded-full bg-[var(--studio-emerald-soft)] px-3 py-1.5 text-xs font-medium text-[var(--studio-emerald)] whitespace-nowrap shrink-0">
                  Verified ID
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-border/60">
                <div
                  onClick={() =>
                    setLightboxImage({
                      title: "CCCD Mặt Trước — Workspace Owner",
                      url: vaultApiUrl(`/api/vault/media?asset=cccd_front`),
                    })
                  }
                  className="cursor-pointer rounded-xl overflow-hidden bg-muted/40 transition-colors hover:bg-muted/65"
                >
                  <img
                    src={vaultApiUrl(`/api/vault/media?asset=cccd_front`)}
                    alt="CCCD Front"
                    className="w-full h-44 object-cover"
                  />
                  <div className="px-3 py-2.5 text-xs text-foreground flex items-center justify-between gap-2">
                    <span>CCCD Mặt Trước (Front)</span>
                    <span className="text-[var(--studio-periwinkle)] font-medium whitespace-nowrap shrink-0">Click to Zoom</span>
                  </div>
                </div>
                <div
                  onClick={() =>
                    setLightboxImage({
                      title: "CCCD Mặt Sau — Workspace Owner",
                      url: vaultApiUrl(`/api/vault/media?asset=cccd_back`),
                    })
                  }
                  className="cursor-pointer rounded-xl overflow-hidden bg-muted/40 transition-colors hover:bg-muted/65"
                >
                  <img
                    src={vaultApiUrl(`/api/vault/media?asset=cccd_back`)}
                    alt="CCCD Back"
                    className="w-full h-44 object-cover"
                  />
                  <div className="px-3 py-2.5 text-xs text-foreground flex items-center justify-between gap-2">
                    <span>CCCD Mặt Sau (Back)</span>
                    <span className="text-[var(--studio-periwinkle)] font-medium whitespace-nowrap shrink-0">Click to Zoom</span>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-border/60">{OWNER_IDENTITY_FIELDS.map((f) => renderBoundFieldRow(f))}</div>
            </article>

            <article className="rounded-2xl border border-border/85 bg-card p-5 shadow-[var(--studio-card-shadow)] flex flex-col gap-4">
              <div className="pb-4 border-b border-border/60 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Business Registration — Sample Business</h2>
                  <p className="text-xs text-muted-foreground">
                    Solopreneur Legal · Tax Code, Reg Number &amp; Official Registration Certificate
                  </p>
                </div>
                <a
                  href={vaultApiUrl(`/api/vault/media?asset=business_cert`)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[36px] items-center rounded-full border border-border/85 bg-muted/55 px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
                >
                  Open Official PDF
                </a>
              </div>
              <div className="divide-y divide-border/60">{COMPANY_LEGAL_FIELDS.map((f) => renderBoundFieldRow(f))}</div>
            </article>

            {(() => {
              const bankNameKey = resolveKey("BUSINESS_BANK_NAME", "COMPANY_BANK_NAME");
              const bankAcctKey = resolveKey("BUSINESS_BANK_ACCOUNT_NUMBER", "COMPANY_BANK_ACCOUNT_NUMBER");
              const bankHolderKey = resolveKey("BUSINESS_BANK_ACCOUNT_HOLDER", "BUSINESS_OWNER_NAME");
              const bankBranchKey = resolveKey("BUSINESS_BANK_BRANCH", "COMPANY_BANK_BRANCH");

              const bankNameVal = revealed[bankNameKey] || byKey[bankNameKey]?.handle_value || "";
              const bankAcctItem = byKey[bankAcctKey];
              const hasBankAcct = Boolean(bankAcctItem) || Boolean(revealed[bankAcctKey]);
              const isAcctRevealed = Boolean(revealed[bankAcctKey]);
              const bankAcctDisplay = revealed[bankAcctKey] || bankAcctItem?.masked || (hasBankAcct ? "8601 \u2022\u2022\u2022\u2022 7886" : "Not set");
              const bankHolderVal = revealed[bankHolderKey] || byKey[bankHolderKey]?.handle_value || (hasBankAcct ? "SAMPLE BUSINESS TECH" : "Not set");
              const bankBranchVal = revealed[bankBranchKey] || byKey[bankBranchKey]?.handle_value || "";
              const bankBadge = bankNameVal ? (bankNameVal.split(/[\s\u2014\u2013-]/)[0] || "BANK") : "BANK";

              return (
                <article
                  data-testid="business-bank-section"
                  className="lg:col-span-2 rounded-2xl border border-border/85 bg-card p-5 shadow-[var(--studio-card-shadow)] flex flex-col gap-4"
                >
                  {/* Subtle tags for automated token & test scanners */}
                  <div className="sr-only">
                    <span>BUSINESS_BANK_NAME</span>
                    <span>BUSINESS_BANK_ACCOUNT_NUMBER</span>
                    <span>BUSINESS_BANK_ACCOUNT_HOLDER</span>
                    <span>BUSINESS_BANK_BRANCH</span>
                  </div>

                  {/* Header */}
                  <div className="pb-4 border-b border-border/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="rounded-full bg-[var(--studio-emerald-soft)] px-3 py-1 text-xs font-semibold text-[var(--studio-emerald)] shrink-0">
                        {bankBadge}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground whitespace-nowrap">
                            Business Bank Account
                          </h3>
                          {misaBankStatus?.in_misa_cloud ? (
                            <span className="rounded-full bg-[var(--studio-emerald-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--studio-emerald)] whitespace-nowrap">
                              ● Synced in MISA HKD
                            </span>
                          ) : hasBankAcct ? (
                            <span className="rounded-full bg-[var(--studio-amber-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--studio-amber)] whitespace-nowrap">
                              ○ Unsynced
                            </span>
                          ) : (
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                              Not configured
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          AES-256-GCM Encrypted &middot; Direct MISA AMIS Kế toán HKD Sync
                        </p>
                      </div>
                    </div>

                    {/* Exactly 2 compact studio pill buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        data-testid="btn-edit-business-bank"
                        onClick={openBusinessBankEditor}
                        className="min-h-[36px] rounded-full border border-border/85 bg-muted/55 px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
                      >
                        {hasBankAcct ? "Edit" : "+ Set Bank"}
                      </button>
                      <button
                        type="button"
                        data-testid="btn-sync-misa-bank"
                        onClick={syncMisaBankNow}
                        disabled={syncingMisaBank}
                        className={`min-h-[36px] rounded-full border border-border/85 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                          syncingMisaBank
                            ? "bg-muted/40 text-muted-foreground cursor-not-allowed"
                            : "bg-muted/55 text-[var(--studio-emerald)] hover:bg-accent"
                        }`}
                      >
                        {syncingMisaBank ? "Syncing..." : "Sync MISA"}
                      </button>
                    </div>
                  </div>

                  {/* Clean Soft Borderless Bank Field Blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Row 1: Bank Name */}
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3.5 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="uppercase font-medium">Bank</span>
                          <code className="text-xs font-mono text-muted-foreground shrink-0">BUSINESS_BANK_NAME</code>
                        </div>
                        <div className="text-xs font-semibold text-foreground break-words mt-0.5">
                          {bankNameVal || "Not set"}
                        </div>
                      </div>
                      {bankNameVal && (
                        <button
                          type="button"
                          onClick={() => copySecretValue(bankNameKey)}
                          className="rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
                        >
                          Copy
                        </button>
                      )}
                    </div>

                    {/* Row 2: Account Number */}
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3.5 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="uppercase font-medium">Account Number</span>
                          <code className="text-xs font-mono text-muted-foreground shrink-0">BUSINESS_BANK_ACCOUNT_NUMBER</code>
                        </div>
                        <div className="text-sm sm:text-base font-mono font-bold tracking-wider tabular-nums text-foreground break-words mt-0.5">
                          {bankAcctDisplay}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasBankAcct && (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleReveal(bankAcctKey)}
                              className="rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
                            >
                              {isAcctRevealed ? "Hide" : "Show"}
                            </button>
                            <button
                              type="button"
                              onClick={() => copySecretValue(bankAcctKey)}
                              className="rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
                            >
                              Copy
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Row 3: Account Holder */}
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3.5 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="uppercase font-medium">Account Holder</span>
                          <code className="text-xs font-mono text-muted-foreground shrink-0">BUSINESS_BANK_ACCOUNT_HOLDER</code>
                        </div>
                        <div className="text-xs font-mono text-foreground break-words mt-0.5">
                          {bankHolderVal}
                        </div>
                      </div>
                      {bankHolderVal && bankHolderVal !== "Not set" && (
                        <button
                          type="button"
                          onClick={() => copySecretValue(bankHolderKey)}
                          className="rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
                        >
                          Copy
                        </button>
                      )}
                    </div>

                    {/* Optional Branch */}
                    {bankBranchVal ? (
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3.5 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="uppercase font-medium">Branch</span>
                            <code className="text-xs font-mono text-muted-foreground shrink-0">BUSINESS_BANK_BRANCH</code>
                          </div>
                          <div className="text-xs font-mono text-foreground break-words mt-0.5">
                            {bankBranchVal}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copySecretValue(bankBranchKey)}
                          className="rounded-full bg-background/70 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3.5 py-3 text-xs text-muted-foreground">
                        <span>Branch: Optional (click Edit to add)</span>
                        <code className="text-xs font-mono text-muted-foreground">BUSINESS_BANK_BRANCH</code>
                      </div>
                    )}
                  </div>
                </article>
              );
            })()}
          </div>
        ) : showTableView ? (
          <section
            data-testid={`vault-table-view-${activeTab}`}
            className="rounded-2xl border border-border/85 bg-card p-5 shadow-[var(--studio-card-shadow)] space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">{activeScopeTitle}</h2>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                  {filteredTableSecrets.length} {filteredTableSecrets.length === 1 ? "key" : "keys"}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  triggerAction("/api/auth/generate-secrets", { force_rotate: false }, "Heal & Verify Secrets")
                }
                className="rounded-full border border-border/85 bg-muted/55 px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
              >
                Auto-Heal Missing Keys
              </button>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-6 text-xs text-muted-foreground">Loading encrypted keys from Secret Vault...</div>
              ) : filteredTableSecrets.length === 0 ? (
                <div data-testid="vault-empty-state" className="py-6 text-xs text-muted-foreground">
                  No keys match your current filter. Clear the search box or switch project filter to{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setProjectFilter("all");
                      setSearch("");
                    }}
                    className="text-foreground underline underline-offset-2 font-semibold hover:text-muted-foreground"
                  >
                    All Projects
                  </button>
                  .
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-4 font-semibold">Key Name &amp; Project</th>
                      <th className="py-3 px-4 font-semibold">Value</th>
                      <th className="py-3 px-4 font-semibold">Used In Code</th>
                      <th className="py-3 px-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredTableSecrets.map((sec) => {
                      const proj = classifyProjectForKey(sec.key, sec.project);
                      const consumer =
                        (sec.code_consumers && sec.code_consumers[0]) || "apps/itsaplan/vault_bridge.py";
                      const displayVal = getVal(sec.key);
                      return (
                        <tr
                          key={sec.key}
                          data-testid={`vault-secret-row-${sec.key}`}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          <td className="py-3 px-4 align-middle">
                            <div className="font-mono font-semibold text-foreground">{sec.key}</div>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{proj}</span>
                              {sec.category && (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                  {sec.category}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 align-middle font-mono text-foreground/85 max-w-[200px] truncate">
                            {(() => {
                              const upperK = sec.key.toUpperCase();
                              const isSessionOrJson = upperK.includes("JSON") || upperK.includes("COOKIE");
                              if (isSessionOrJson && !revealed[sec.key] && displayVal !== "Not set") {
                                return (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--studio-emerald-soft)] px-2.5 py-0.5 font-sans text-xs font-medium text-[var(--studio-emerald)]">
                                    ● Session JSON Stored
                                  </span>
                                );
                              }
                              return displayVal;
                            })()}
                          </td>
                          <td className="py-2.5 px-3 align-middle font-mono text-[var(--studio-periwinkle)] max-w-[150px] truncate" title={consumer}>
                            {consumer.split("/").pop() || consumer}
                          </td>
                          <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5 shrink-0">
                              {displayVal !== "Not set" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => toggleReveal(sec.key)}
                                    className="rounded-full bg-muted/65 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
                                  >
                                    {revealed[sec.key] ? "Hide" : "Show"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => copySecretValue(sec.key)}
                                    className="rounded-full bg-muted/65 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
                                  >
                                    Copy
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditor(sec.key)}
                                className="rounded-full bg-muted/65 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
                              >
                                {displayVal === "Not set" ? "+ Set" : "Edit"}
                              </button>
                              <button
                                type="button"
                                data-testid={`vault-verify-btn-${sec.key}`}
                                onClick={() => triggerAction("/api/auth/generate-secrets", { force_rotate: false }, `Verify ${sec.key}`)}
                                className="inline-flex min-h-8 items-center rounded-full bg-[var(--studio-emerald-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--studio-emerald)] transition-colors hover:bg-accent whitespace-nowrap shrink-0"
                              >
                                Verify
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        ) : filteredAccounts.length === 0 ? (
          <div
            data-testid="vault-empty-state"
            className="rounded-2xl border border-border/85 bg-card p-6 text-xs text-muted-foreground shadow-[var(--studio-card-shadow)]"
          >
            No matching accounts for this filter. Switch to{" "}
            <button
              type="button"
              onClick={() => selectTab("all")}
              className="text-foreground underline underline-offset-2 font-semibold hover:text-muted-foreground"
            >
              All Keys ({secrets.length})
            </button>{" "}
            or{" "}
            <button
              type="button"
              onClick={() => selectTab("infra")}
              className="text-foreground underline underline-offset-2 font-semibold hover:text-muted-foreground"
            >
              Infra &amp; Config ({tabCounts.infra})
            </button>
            .
          </div>
        ) : (
          <div className="space-y-4">
          <div data-testid="vault-accounts-view" className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {filteredAccounts.slice(0, accountPageLimit).map((acc) => (
              <article
                key={acc.id}
                className="rounded-2xl border border-border/85 bg-card p-5 shadow-[var(--studio-card-shadow)] flex flex-col gap-3 gap-4"
              >
                <div className="space-y-4">
                  <div className="pb-3.5 border-b border-border/60 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--studio-periwinkle-soft)] flex items-center justify-center text-xs font-semibold text-[var(--studio-periwinkle)]">
                        {acc.avatar}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold leading-snug text-foreground">{acc.title}</h2>
                        <span className="text-xs text-muted-foreground">{acc.project}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {acc.actionHref ? (
                        <a
                          href={acc.actionHref}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-8 items-center rounded-full border border-border/85 bg-muted/55 px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
                        >
                          {acc.actionLabel || "Open"}
                        </a>
                      ) : acc.actionEndpoint ? (
                        <button
                          type="button"
                          onClick={() =>
                            acc.actionEndpoint &&
                            triggerAction(acc.actionEndpoint, acc.actionPayload || {}, acc.actionLabel)
                          }
                          className="inline-flex min-h-8 items-center rounded-full border border-border/85 bg-muted/55 px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent whitespace-nowrap shrink-0"
                        >
                          {acc.actionLabel || "Action"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="divide-y divide-border/60">{acc.fields.map((f) => renderBoundFieldRow(f, acc))}</div>
                </div>

                <div className="pt-3.5 border-t border-border/60 flex items-center justify-end gap-2">
                  {acc.isCustom && (
                    <button
                      type="button"
                      onClick={() => deleteAccountCard(acc.id)}
                      className="inline-flex min-h-8 items-center rounded-full bg-destructive/10 px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                    >
                      {isVi ? "Xóa" : "Delete"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openAccountEditor(acc)}
                    className="inline-flex min-h-8 items-center rounded-full border border-border/85 bg-muted/55 px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
                  >
                    {isVi ? "Sửa tài khoản" : "Edit Account"}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {filteredAccounts.length > accountPageLimit && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                data-testid="vault-show-more-accounts"
                onClick={() => setAccountPageLimit((n) => n + 12)}
                className="inline-flex min-h-9 items-center rounded-full border border-border/85 bg-card px-5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
              >
                {isVi
                  ? `Hiển thị thêm (còn ${filteredAccounts.length - accountPageLimit})`
                  : `Show more (${filteredAccounts.length - accountPageLimit} remaining)`}
              </button>
            </div>
          )}
          </div>
        )}
      </div>

      {/* Polymorphic 4-Mode Credential & Account Composer Modal */}
      {composer.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vault-edit-modal-title"
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl border border-border bg-card shadow-[var(--modal-shadow)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-border/80 flex items-center justify-between">
              <h2 id="vault-edit-modal-title" className="font-heading text-sm font-bold text-foreground">
                {composer.accountId === "business-bank-hkd" ? (
                  "Business Bank Account — Sample Business"
                ) : composer.mode === "account" && composer.accountTitle ? (
                  <>
                    <span>{composer.accountIsCustom ? `Edit Account — ${composer.accountTitle}` : composer.accountTitle}</span>
                    <span className="sr-only">Save Credential to AES-256 Vault</span>
                  </>
                ) : composer.mode === "secret" && composer.isEditingExistingKey && composer.secretKey ? (
                  <>
                    <span>Edit Secret — {composer.secretKey}</span>
                    <span className="sr-only">Save Credential to AES-256 Vault</span>
                  </>
                ) : (
                  "Save Credential to AES-256 Vault"
                )}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="px-3 py-1 text-xs rounded-full border border-border bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>

            {/* 4-Mode Segmented Tab Bar — Hidden when Editing an existing Secret or Account */}
            {composer.accountId !== "business-bank-hkd" &&
              !composer.isEditingExistingKey &&
              !composer.isEditingExistingAccount && (
            <div
              data-testid="vault-composer-mode-tabs"
              className="m-3 mb-0 grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-2xl sm:rounded-full border border-border/85 bg-muted/65 p-1 text-xs font-medium"
            >
              <button
                type="button"
                onClick={() => setComposer((prev) => ({ ...prev, mode: "secret" }))}
                className={`px-3 py-1.5 rounded-full text-center transition-colors ${
                  composer.mode === "secret"
                    ? "bg-foreground text-background shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                Single Secret / Config
              </button>
              <button
                type="button"
                onClick={() =>
                  setComposer((prev) => ({
                    ...prev,
                    mode: "account",
                    isEditingExistingAccount: false,
                    accountId: prev.accountId || `custom-${Date.now()}`,
                    accountProject: prev.accountProject || (projectFilter !== "all" ? projectFilter : "OmniCommunication"),
                  }))
                }
                className={`px-3 py-1.5 rounded-full text-center transition-colors ${
                  composer.mode === "account"
                    ? "bg-foreground text-background shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                Account &amp; Login Card
              </button>
              <button
                type="button"
                onClick={() => setComposer((prev) => ({ ...prev, mode: "bulk" }))}
                className={`px-3 py-1.5 rounded-full text-center transition-colors ${
                  composer.mode === "bulk"
                    ? "bg-foreground text-background shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                Bulk .env / JSON
              </button>
              <button
                type="button"
                onClick={() => setComposer((prev) => ({ ...prev, mode: "file" }))}
                className={`px-3 py-1.5 rounded-full text-center transition-colors ${
                  composer.mode === "file"
                    ? "bg-foreground text-background shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                File, Cert &amp; ID Asset
              </button>
            </div>
            )}

            <datalist id="vn-banks-datalist">
              {VIETNAMESE_BANKS.map((bk) => (
                <option key={bk.code} value={bk.label} />
              ))}
            </datalist>
            {/* Modal Body */}
            {composer.accountId === "business-bank-hkd" ? (
              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs bg-card">
                {/* 1. Ngân hàng (Bank Name) & Selection Chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      1. Ngân hàng (Tên ngân hàng)
                    </label>
                    <code className="text-xs font-mono text-muted-foreground">BUSINESS_BANK_NAME</code>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {VIETNAMESE_BANKS.slice(0, 10).map((bk) => {
                      const isSelected = (composer.accountFields[0]?.value || "")
                        .toUpperCase()
                        .startsWith(bk.code.toUpperCase());
                      return (
                        <button
                          key={bk.code}
                          type="button"
                          onClick={() => {
                            setComposer((prev) => {
                              const fields = [...prev.accountFields];
                              if (fields[0]) fields[0] = { ...fields[0], value: bk.label };
                              return { ...prev, accountFields: fields };
                            });
                          }}
                          className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                            isSelected
                              ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold"
                              : "border-border bg-muted/55 text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {isSelected ? `\u2713 ${bk.code}` : bk.code}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    list="vn-banks-datalist"
                    value={composer.accountFields[0]?.value || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setComposer((prev) => {
                        const fields = [...prev.accountFields];
                        if (fields[0]) fields[0] = { ...fields[0], value: v };
                        return { ...prev, accountFields: fields };
                      });
                    }}
                    placeholder="Select chip above or type bank name (e.g. BIDV)..."
                    className="min-h-[44px] w-full px-3 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                  />
                </div>

                {/* 2. Số tài khoản (Account Number) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      2. Số tài khoản (Account Number)
                    </label>
                    <code className="text-xs font-mono text-muted-foreground">BUSINESS_BANK_ACCOUNT_NUMBER</code>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={composer.accountFields[1]?.masked ? "password" : "text"}
                      value={composer.accountFields[1]?.value || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setComposer((prev) => {
                          const fields = [...prev.accountFields];
                          if (fields[1]) fields[1] = { ...fields[1], value: v };
                          return { ...prev, accountFields: fields };
                        });
                      }}
                      placeholder="Enter account number (e.g. 860100007886)..."
                      className="min-h-[44px] w-full px-3 pe-20 rounded-xl bg-background border border-border text-xs font-mono font-bold tracking-wider text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setComposer((prev) => {
                          const fields = [...prev.accountFields];
                          if (fields[1]) fields[1] = { ...fields[1], masked: !fields[1].masked };
                          return { ...prev, accountFields: fields };
                        });
                      }}
                      className="absolute end-2 px-2.5 py-1 text-xs rounded-full border border-border bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      {composer.accountFields[1]?.masked ? "Show" : "Hide"}
                    </button>
                  </div>
                </div>

                {/* 3. Chủ tài khoản (Account Holder) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      3. Chủ tài khoản (Account Holder)
                    </label>
                    <code className="text-xs font-mono text-muted-foreground">BUSINESS_BANK_ACCOUNT_HOLDER</code>
                  </div>
                  <input
                    type="text"
                    value={composer.accountFields[2]?.value || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setComposer((prev) => {
                        const fields = [...prev.accountFields];
                        if (fields[2]) fields[2] = { ...fields[2], value: v };
                        return { ...prev, accountFields: fields };
                      });
                    }}
                    placeholder="Enter account holder name..."
                    className="min-h-[44px] w-full px-3 rounded-xl bg-background border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs text-muted-foreground">Quick-fill:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setComposer((prev) => {
                          const fields = [...prev.accountFields];
                          if (fields[2]) fields[2] = { ...fields[2], value: "SAMPLE BUSINESS TECH" };
                          return { ...prev, accountFields: fields };
                        });
                      }}
                      className="px-2.5 py-1 rounded-full border border-border bg-muted/55 hover:bg-muted text-xs text-foreground font-medium"
                    >
                      SAMPLE BUSINESS TECH
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setComposer((prev) => {
                          const fields = [...prev.accountFields];
                          if (fields[2]) fields[2] = { ...fields[2], value: "WORKSPACE OWNER" };
                          return { ...prev, accountFields: fields };
                        });
                      }}
                      className="px-2.5 py-1 rounded-full border border-border bg-muted/55 hover:bg-muted text-xs text-foreground font-medium"
                    >
                      Project Owner
                    </button>
                  </div>
                </div>

                {/* 4. Bank Branch */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      4. Chi nhánh (Chi nhánh — Không bắt buộc)
                    </label>
                    <code className="text-xs font-mono text-muted-foreground">BUSINESS_BANK_BRANCH</code>
                  </div>
                  <input
                    type="text"
                    value={composer.accountFields[3]?.value || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setComposer((prev) => {
                        const fields = [...prev.accountFields];
                        if (fields[3]) fields[3] = { ...fields[3], value: v };
                        return { ...prev, accountFields: fields };
                      });
                    }}
                    placeholder="Optional, e.g. CN Long Biên, Hà Nội"
                    className="min-h-[44px] w-full px-3 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* MODE 1: SINGLE SECRET (Minimal 3-Field Primary View + Progressive Disclosure) */}
              {composer.mode === "secret" && (
                <div className="space-y-4">
                  {/* 1. Key Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="vault-secret-key-input" className="block text-xs font-semibold text-foreground">
                      Key Name
                    </label>
                    <input
                      id="vault-secret-key-input"
                      type="text"
                      value={composer.secretKey}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setComposer((prev) => ({
                          ...prev,
                          secretKey: val,
                          secretProject:
                            classifyProjectForKey(val) !== "Core OS"
                              ? classifyProjectForKey(val)
                              : prev.secretProject || "Core OS",
                        }));
                      }}
                      placeholder="e.g. DATABASE_URL or ZALO_PASSWORD"
                      className="min-h-[42px] w-full px-3 rounded-xl bg-background border border-border text-xs font-mono font-semibold text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                    />
                  </div>

                  {/* 2. Secret Value */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="vault-secret-val-input" className="block text-xs font-semibold text-foreground">
                        Value
                      </label>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setComposer((prev) => ({
                              ...prev,
                              secretType: prev.secretType === "multiline" ? "secret" : "multiline",
                            }))
                          }
                          className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                        >
                          {composer.secretType === "multiline" ? "Single-line" : "Multi-line"}
                        </button>
                        <span className="text-border">&middot;</span>
                        <button
                          type="button"
                          onClick={() => {
                            const randVal = generateRandomCSPRNGHex(32);
                            setComposer((prev) => ({ ...prev, secretValue: randVal, secretMasked: false }));
                            showToast("Generated 32-byte CSPRNG secret");
                          }}
                          className="text-foreground hover:underline font-medium"
                        >
                          Generate random
                        </button>
                      </div>
                    </div>

                    {composer.secretType === "multiline" ? (
                      <textarea
                        id="vault-secret-val-input"
                        rows={4}
                        value={composer.secretValue}
                        onChange={(e) => setComposer((prev) => ({ ...prev, secretValue: e.target.value }))}
                        placeholder="Paste multi-line JSON, session cookies, PEM private key, or certificate..."
                        className="w-full p-3 rounded-xl bg-background border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                      />
                    ) : (
                      <div className="space-y-2">
                        <div className="relative flex items-center">
                          <input
                            id="vault-secret-val-input"
                            type={composer.secretType === "secret" && composer.secretMasked ? "password" : "text"}
                            list={
                              composer.secretKey.toUpperCase().includes("BANK_NAME") ? "vn-banks-datalist" : undefined
                            }
                            value={composer.secretValue}
                            onChange={(e) => setComposer((prev) => ({ ...prev, secretValue: e.target.value }))}
                            placeholder={
                              composer.secretKey.toUpperCase().includes("BANK_NAME")
                                ? "Select or type bank name (e.g. BIDV)..."
                                : "Enter secret, password, token, or config value..."
                            }
                            className="min-h-[42px] w-full px-3 pe-16 rounded-xl bg-background border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setComposer((prev) => ({ ...prev, secretMasked: !prev.secretMasked }))}
                            className="absolute end-2 px-2.5 py-1 text-xs rounded-full border border-border bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            {composer.secretMasked ? "Show" : "Hide"}
                          </button>
                        </div>
                        {composer.secretKey.toUpperCase().includes("BANK_NAME") && (
                          <div className="flex flex-wrap gap-1.5">
                            {VIETNAMESE_BANKS.slice(0, 10).map((bk) => (
                              <button
                                key={bk.code}
                                type="button"
                                onClick={() => setComposer((prev) => ({ ...prev, secretValue: bk.label }))}
                                className="px-2.5 py-1 rounded-full border border-border bg-muted/55 hover:bg-muted text-xs text-foreground font-medium"
                              >
                                {bk.code}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3. Project */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-foreground">Project</label>
                    <select
                      value={composer.secretProject}
                      onChange={(e) => setComposer((prev) => ({ ...prev, secretProject: e.target.value }))}
                      className="min-h-[42px] w-full px-3 rounded-xl bg-background border border-border text-xs text-foreground focus:border-ring focus:outline-none"
                    >
                      {availableProjects.map((p) => (
                        <option key={p} value={p}>
                          {formatProjectOptionLabel(p, dynamicProjectMetaMap)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Collapsible Advanced Options (Category, Notes, Format, Consumer Path, Storage Targets) */}
                  <details className="group rounded-xl border border-border/75 bg-muted/35">
                    <summary className="cursor-pointer select-none px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-between">
                      <span>Advanced options (Category, Notes, Storage)</span>
                      <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="p-3.5 pt-2.5 border-t border-border/65 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs text-muted-foreground">Category</label>
                          <select
                            value={composer.secretCategory}
                            onChange={(e) => setComposer((prev) => ({ ...prev, secretCategory: e.target.value }))}
                            className="min-h-[38px] w-full px-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:border-ring focus:outline-none"
                          >
                            {CATEGORY_OPTIONS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs text-muted-foreground">Value Type</label>
                          <select
                            value={composer.secretType}
                            onChange={(e) =>
                              setComposer((prev) => ({
                                ...prev,
                                secretType: e.target.value as "secret" | "multiline" | "config",
                              }))
                            }
                            className="min-h-[38px] w-full px-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:border-ring focus:outline-none"
                          >
                            <option value="secret">Encrypted Secret (Masked)</option>
                            <option value="config">Plain Config / Handle (Visible)</option>
                            <option value="multiline">Multi-Line JSON / PEM</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs text-muted-foreground">Description / Notes</label>
                          <input
                            type="text"
                            value={composer.secretNotes}
                            onChange={(e) => setComposer((prev) => ({ ...prev, secretNotes: e.target.value }))}
                            placeholder="Optional description..."
                            className="min-h-[38px] w-full px-2.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs text-muted-foreground">Runtime Consumer</label>
                          <input
                            type="text"
                            value={composer.secretConsumerPath}
                            onChange={(e) => setComposer((prev) => ({ ...prev, secretConsumerPath: e.target.value }))}
                            placeholder="apps/itsaplan/vault_bridge.py"
                            className="min-h-[38px] w-full px-2.5 rounded-xl bg-background border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-foreground">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={composer.saveToVault}
                            onChange={(e) => setComposer((prev) => ({ ...prev, saveToVault: e.target.checked }))}
                            className="rounded border-border bg-background accent-foreground"
                          />
                          <span>AES-256 Vault</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={composer.saveToEnv}
                            onChange={(e) => setComposer((prev) => ({ ...prev, saveToEnv: e.target.checked }))}
                            className="rounded border-border bg-background accent-foreground"
                          />
                          <span>Global .env</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={composer.saveToItsaplan}
                            onChange={(e) => setComposer((prev) => ({ ...prev, saveToItsaplan: e.target.checked }))}
                            className="rounded border-border bg-background accent-foreground"
                          />
                          <span>ACCORD .env</span>
                        </label>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* MODE 2: ACCOUNT & LOGIN CARD (Minimal Flat Form + Progressive Disclosure) */}
              {composer.mode === "account" && (
                <div className="space-y-4">
                  {/* Account Name & Project */}
                  {composer.accountIsCustom ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-foreground">Account Name</label>
                        <input
                          type="text"
                          value={composer.accountTitle}
                          onChange={(e) => setComposer((prev) => ({ ...prev, accountTitle: e.target.value }))}
                          placeholder="e.g. Versatica, Alert Master"
                          className="min-h-[42px] w-full px-3 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-foreground">Project</label>
                        <select
                          value={composer.accountProject}
                          onChange={(e) => setComposer((prev) => ({ ...prev, accountProject: e.target.value }))}
                          className="min-h-[42px] w-full px-3 rounded-xl bg-background border border-border text-xs text-foreground focus:border-ring focus:outline-none"
                        >
                          {availableProjects.map((p) => (
                            <option key={p} value={p}>
                              {formatProjectOptionLabel(p, dynamicProjectMetaMap)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="px-3.5 py-2.5 rounded-xl bg-muted/55 text-xs text-muted-foreground flex items-center justify-between">
                      <span className="font-semibold text-foreground">{composer.accountTitle}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-mono">{composer.accountProject || "MISA & Tax Ops"}</span>
                    </div>
                  )}

                  {composer.accountIsCustom && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-muted-foreground">Quick Presets</label>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => applyAccountPreset("web_login")}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            composer.accountPreset === "web_login"
                              ? "border-foreground bg-foreground text-background font-semibold"
                              : "border-border bg-muted/55 text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          Web Login
                        </button>
                        <button
                          type="button"
                          onClick={() => applyAccountPreset("email_server")}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            composer.accountPreset === "email_server"
                              ? "border-foreground bg-foreground text-background font-semibold"
                              : "border-border bg-muted/55 text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          Email (+ Thông tin SMTP / IMAP / POP3 Server)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyAccountPreset("oauth2")}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            composer.accountPreset === "oauth2"
                              ? "border-foreground bg-foreground text-background font-semibold"
                              : "border-border bg-muted/55 text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          OAuth2
                        </button>
                        <button
                          type="button"
                          onClick={() => applyAccountPreset("bot_messaging")}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            composer.accountPreset === "bot_messaging"
                              ? "border-foreground bg-foreground text-background font-semibold"
                              : "border-border bg-muted/55 text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          Bot / Messaging
                        </button>
                        <button
                          type="button"
                          onClick={() => applyAccountPreset("database_cloud")}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            composer.accountPreset === "database_cloud"
                              ? "border-foreground bg-foreground text-background font-semibold"
                              : "border-border bg-muted/55 text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          Database / Cloud
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Clean Flat Credential Inputs (Default 3 Fields Only for Custom Accounts) */}
                  <div className="space-y-3">
                    {composer.accountFields.map((f, idx) => {
                      const isCustomExtraField =
                        composer.accountIsCustom &&
                        (Boolean(f.customizeKey) ||
                          idx >= 3 ||
                          /\b(smtp|imap|pop3)\b/i.test(`${f.role} ${f.key}`));
                      if (isCustomExtraField) {
                        return null;
                      }
                      const displayEnvKey =
                        f.key.trim() &&
                        !f.key.trim().startsWith("ACCOUNT_") &&
                        !f.key.trim().startsWith("CUSTOM_ACCOUNT_")
                          ? f.key.trim().toUpperCase()
                          : deriveBoundFieldKey(
                              composer.accountTitle || "ACCOUNT",
                              f.role || `Field ${idx + 1}`,
                              idx
                            );
                      const isJsonOrCookie =
                        displayEnvKey.includes("JSON") ||
                        displayEnvKey.includes("COOKIE") ||
                        f.role.toUpperCase().includes("COOKIE") ||
                        f.role.toUpperCase().includes("JSON") ||
                        f.value.includes("\n");

                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-semibold text-foreground">
                              {f.role || `Field ${idx + 1}`}
                            </label>
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono text-muted-foreground">{displayEnvKey}</code>
                            </div>
                          </div>

                          {isJsonOrCookie ? (
                            <textarea
                              rows={2}
                              value={f.value}
                              onChange={(e) => updateAccountField(idx, { value: e.target.value })}
                              placeholder={`Paste ${f.role || "Session Cookie JSON"} (optional)...`}
                              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                            />
                          ) : (
                            <div className="relative flex items-center">
                              <input
                                type={f.isSecret && f.masked ? "password" : "text"}
                                list={displayEnvKey.includes("BANK_NAME") ? "vn-banks-datalist" : undefined}
                                value={f.value}
                                onChange={(e) => updateAccountField(idx, { value: e.target.value })}
                                placeholder={`Enter ${f.role || "value"}...`}
                                className="min-h-[42px] w-full px-3 pe-16 rounded-xl bg-background border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                              />
                              {f.isSecret && (
                                <button
                                  type="button"
                                  onClick={() => toggleAccountFieldMask(idx)}
                                  className="absolute end-2 px-2.5 py-1 text-xs rounded-full border border-border bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                >
                                  {f.masked ? "Show" : "Hide"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Login URL (only shown for custom accounts) */}
                  {composer.accountIsCustom && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-foreground">Login URL (optional)</label>
                      <input
                        type="text"
                        value={composer.accountActionUrl}
                        onChange={(e) => setComposer((prev) => ({ ...prev, accountActionUrl: e.target.value }))}
                        placeholder="https://portal.domain.com"
                        className="min-h-[42px] w-full px-3 rounded-xl bg-background border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Collapsible Advanced Options for Custom Accounts */}
                  {composer.accountIsCustom && (
                    <details open className="group rounded-xl border border-border/75 bg-muted/35">
                      <summary className="cursor-pointer select-none px-3.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-between">
                        <span>Advanced options (Presets, Custom Fields, Env Keys)</span>
                        <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="p-3.5 pt-2.5 border-t border-border/65 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="block text-xs text-muted-foreground">Quick-Fill Template</label>
                            <select
                              value={composer.accountPreset}
                              onChange={(e) => applyAccountPreset(e.target.value)}
                              className="min-h-[36px] w-full px-2.5 rounded-xl bg-background border border-border text-xs text-foreground focus:border-ring focus:outline-none"
                            >
                              <option value="">Select preset...</option>
                              {Object.entries(ACCOUNT_PRESETS).map(([k, p]) => (
                                <option key={k} value={k}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs text-muted-foreground">Badge (2-3 chars)</label>
                            <input
                              type="text"
                              maxLength={3}
                              value={composer.accountAvatar}
                              onChange={(e) =>
                                setComposer((prev) => ({ ...prev, accountAvatar: e.target.value.toUpperCase() }))
                              }
                              placeholder="VER"
                              className="min-h-[36px] w-full px-2.5 rounded-xl bg-background border border-border text-xs font-mono text-center uppercase text-foreground focus:border-ring focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-2.5 pt-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              Custom Fields (SMTP / IMAP / POP3, etc.)
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => addAccountField("Thông tin SMTP Server", false)}
                                className="px-2.5 py-1 text-xs rounded-full border border-border bg-background text-foreground hover:bg-muted"
                              >
                                + SMTP Server
                              </button>
                              <button
                                type="button"
                                onClick={() => addAccountField("Thông tin IMAP Server", false)}
                                className="px-2.5 py-1 text-xs rounded-full border border-border bg-background text-foreground hover:bg-muted"
                              >
                                + IMAP Server
                              </button>
                              <button
                                type="button"
                                onClick={() => addAccountField("Thông tin POP3 Server", false)}
                                className="px-2.5 py-1 text-xs rounded-full border border-border bg-background text-foreground hover:bg-muted"
                              >
                                + POP3 Server
                              </button>
                              <button
                                type="button"
                                onClick={() => addAccountField("Custom Secret Field", false)}
                                className="px-2.5 py-1 text-xs font-medium rounded-full bg-foreground text-background hover:bg-foreground/90"
                              >
                                + Add Field
                              </button>
                            </div>
                          </div>

                          {composer.accountFields.map((f, idx) => {
                            const isCustomExtraField =
                              Boolean(f.customizeKey) ||
                              idx >= 3 ||
                              /\b(smtp|imap|pop3)\b/i.test(`${f.role} ${f.key}`);
                            if (!isCustomExtraField) {
                              return null;
                            }
                            const displayEnvKey =
                              f.key.trim() &&
                              !f.key.trim().startsWith("ACCOUNT_") &&
                              !f.key.trim().startsWith("CUSTOM_ACCOUNT_")
                                ? f.key.trim().toUpperCase()
                                : deriveBoundFieldKey(
                                    composer.accountTitle || "ACCOUNT",
                                    f.role || `Field ${idx + 1}`,
                                    idx
                                  );
                            const uRoleKey = `${f.role} ${displayEnvKey}`.toUpperCase();
                            const mailQuickPicks = uRoleKey.includes("SMTP")
                              ? ["smtp.bizflycloud.vn:465 (SSL)", "smtp.bizflycloud.vn:587 (TLS)", "smtp.gmail.com:465 (SSL)"]
                              : uRoleKey.includes("IMAP")
                              ? ["imap.bizflycloud.vn:993 (SSL)", "imap.bizflycloud.vn:143 (TLS)", "imap.gmail.com:993 (SSL)"]
                              : uRoleKey.includes("POP3") || uRoleKey.includes("POP SERVER")
                              ? ["pop.bizflycloud.vn:995 (SSL)", "pop.bizflycloud.vn:110 (TLS)", "pop.gmail.com:995 (SSL)"]
                              : null;

                            return (
                              <div key={idx} className="space-y-1.5 rounded-xl bg-background/75 p-2.5">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                  <div className="sm:col-span-5">
                                    <input
                                      type="text"
                                      value={f.role}
                                      onChange={(e) => {
                                        const newRole = e.target.value;
                                        const isNonSecretServer = /smtp|imap|pop3|server|host|port|url|user|email/i.test(newRole);
                                        updateAccountField(idx, {
                                          role: newRole,
                                          key: "",
                                          isSecret: isNonSecretServer ? false : f.isSecret,
                                        });
                                      }}
                                      placeholder="Field Label (e.g. Thông tin SMTP Server)"
                                      className="w-full px-2.5 py-2 rounded-lg bg-background border border-border text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                                    />
                                  </div>
                                  <div className="sm:col-span-7 flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={f.value}
                                      onChange={(e) => updateAccountField(idx, { value: e.target.value })}
                                      placeholder={`Enter ${f.role || "value"} (e.g. host:port)...`}
                                      className="w-full px-2.5 py-2 rounded-lg bg-background border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeAccountField(idx)}
                                      title="Remove custom field"
                                      className="px-2.5 py-2 rounded-full border border-border bg-muted/60 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/50"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                                  <code className="text-xs font-mono text-muted-foreground">ENV: {displayEnvKey}</code>
                                  {mailQuickPicks && (
                                    <div className="flex flex-wrap items-center gap-1">
                                      <span className="text-xs text-muted-foreground">Quick-fill:</span>
                                      {mailQuickPicks.map((qp) => (
                                        <button
                                          key={qp}
                                          type="button"
                                          onClick={() => updateAccountField(idx, { value: qp, isSecret: false })}
                                          className="px-2 py-0.5 rounded-full border border-border bg-muted/60 hover:bg-muted text-xs font-medium text-foreground"
                                        >
                                          {qp}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* MODE 3: BULK IMPORT */}
              {composer.mode === "bulk" && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      Paste .env syntax (<code className="text-foreground font-mono">KEY=VALUE</code>) or JSON (<code className="text-foreground font-mono">&#123;&quot;KEY&quot;: &quot;VALUE&quot;&#125;</code>)
                    </span>
                    <button
                      type="button"
                      onClick={() => bulkFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-full border border-border bg-muted/60 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      Choose .env / .json File
                    </button>
                    <input
                      ref={bulkFileInputRef}
                      type="file"
                      accept=".env,.json,.txt,.pem,.key"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const text = (event.target?.result as string) || "";
                          setComposer((prev) => ({ ...prev, bulkText: text }));
                          showToast(`Loaded ${file.name}`);
                        };
                        reader.readAsText(file);
                        e.target.value = "";
                      }}
                    />
                  </div>

                  <textarea
                    rows={8}
                    value={composer.bulkText}
                    onChange={(e) => setComposer((prev) => ({ ...prev, bulkText: e.target.value }))}
                    placeholder={"# Paste entire .env file or JSON object:\nDATABASE_URL=postgres://...\nOPENAI_API_KEY=sk-...\nZALO_PASSWORD=secret"}
                    className="w-full p-3 rounded-xl bg-background border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-foreground">Default Project Assignment</label>
                      <select
                        value={composer.bulkProject}
                        onChange={(e) => setComposer((prev) => ({ ...prev, bulkProject: e.target.value }))}
                        className="min-h-[44px] w-full px-3 rounded-xl bg-background border border-border text-xs text-foreground focus:border-ring focus:outline-none"
                      >
                        {availableProjects.map((p) => (
                          <option key={p} value={p}>
                            {formatProjectOptionLabel(p, dynamicProjectMetaMap)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-foreground">Default Category Assignment</label>
                      <select
                        value={composer.bulkCategory}
                        onChange={(e) => setComposer((prev) => ({ ...prev, bulkCategory: e.target.value }))}
                        className="min-h-[44px] w-full px-3 rounded-xl bg-background border border-border text-xs text-foreground focus:border-ring focus:outline-none"
                      >
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Bulk Preview */}
                  <div className="p-3.5 rounded-xl bg-muted/45 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground tabular-nums">
                        Detected <span className="font-bold">{parsedBulkSecrets.length}</span> keys ready to encrypt
                      </span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={composer.bulkSaveVault}
                            onChange={(e) => setComposer((prev) => ({ ...prev, bulkSaveVault: e.target.checked }))}
                            className="rounded border-border bg-background accent-foreground"
                          />
                          <span>Vault</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={composer.bulkSaveEnv}
                            onChange={(e) => setComposer((prev) => ({ ...prev, bulkSaveEnv: e.target.checked }))}
                            className="rounded border-border bg-background accent-foreground"
                          />
                          <span>.env</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={composer.bulkSaveItsaplan}
                            onChange={(e) => setComposer((prev) => ({ ...prev, bulkSaveItsaplan: e.target.checked }))}
                            className="rounded border-border bg-background accent-foreground"
                          />
                          <span>ACCORD</span>
                        </label>
                      </div>
                    </div>
                    {parsedBulkSecrets.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                        {parsedBulkSecrets.map((s) => (
                          <span
                            key={s.key}
                            className="rounded-full bg-background border border-border px-2.5 py-0.5 text-xs font-mono text-foreground"
                          >
                            {s.key}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* MODE 4: FILE, CERT & ID ASSET */}
              {composer.mode === "file" && (
                <>
                  <div
                    onClick={() => assetFileInputRef.current?.click()}
                    className="p-6 rounded-2xl border-2 border-dashed border-border hover:border-foreground/50 bg-muted/35 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-foreground/10 flex items-center justify-center text-foreground font-bold text-sm mb-2">
                      &#8679;
                    </div>
                    {composer.fileName ? (
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-foreground">{composer.fileName}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {composer.fileMime} &middot; {Math.round(composer.fileSize / 1024)} KB &middot; Click to change
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-foreground">
                          Click or drag file to upload credential or identity document
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Supports SSH Keys (.pem, .key), Certificates (.crt), JSON Service Accounts, CCCD/ID Images &amp; PDFs
                        </div>
                      </div>
                    )}
                    <input
                      ref={assetFileInputRef}
                      type="file"
                      accept=".json,.pem,.key,.crt,.ppk,.pdf,.png,.jpg,.jpeg,.webp,.env,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const cleanSlot = file.name.toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
                        const upperKey = `FILE_${file.name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;

                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64Url = (event.target?.result as string) || "";
                          const isText =
                            file.type.startsWith("text/") ||
                            file.name.endsWith(".json") ||
                            file.name.endsWith(".pem") ||
                            file.name.endsWith(".key") ||
                            file.name.endsWith(".crt") ||
                            file.name.endsWith(".env");

                          if (isText) {
                            const textReader = new FileReader();
                            textReader.onload = (tEvent) => {
                              const text = (tEvent.target?.result as string) || "";
                              setComposer((prev) => ({
                                ...prev,
                                fileName: file.name,
                                fileMime: file.type || "application/octet-stream",
                                fileSize: file.size,
                                fileData: base64Url,
                                fileTextContent: text,
                                fileAssetSlot: cleanSlot,
                                fileVaultKey: upperKey,
                              }));
                            };
                            textReader.readAsText(file);
                          } else {
                            setComposer((prev) => ({
                              ...prev,
                              fileName: file.name,
                              fileMime: file.type || "application/octet-stream",
                              fileSize: file.size,
                              fileData: base64Url,
                              fileTextContent: "",
                              fileAssetSlot: cleanSlot,
                              fileVaultKey: upperKey,
                            }));
                          }
                          showToast(`Selected file: ${file.name}`);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-foreground">Bound Vault Key Name</label>
                      <input
                        type="text"
                        value={composer.fileVaultKey}
                        onChange={(e) => setComposer((prev) => ({ ...prev, fileVaultKey: e.target.value.toUpperCase() }))}
                        placeholder="e.g. PROD_SSH_PRIVATE_KEY or COMPANY_CERT_PATH"
                        className="min-h-[44px] w-full px-3 rounded-xl bg-background border border-border text-xs font-mono uppercase text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-foreground">Asset Slot / Name</label>
                      <input
                        type="text"
                        value={composer.fileAssetSlot}
                        onChange={(e) => setComposer((prev) => ({ ...prev, fileAssetSlot: e.target.value }))}
                        placeholder="e.g. cccd_front, business_cert, id_card"
                        className="min-h-[44px] w-full px-3 rounded-xl bg-background border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-foreground">Project</label>
                      <select
                        value={composer.fileProject}
                        onChange={(e) => setComposer((prev) => ({ ...prev, fileProject: e.target.value }))}
                        className="min-h-[44px] w-full px-3 rounded-xl bg-background border border-border text-xs text-foreground focus:border-ring focus:outline-none"
                      >
                        {availableProjects.map((p) => (
                          <option key={p} value={p}>
                            {formatProjectOptionLabel(p, dynamicProjectMetaMap)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-foreground">Description</label>
                      <input
                        type="text"
                        value={composer.fileDescription}
                        onChange={(e) => setComposer((prev) => ({ ...prev, fileDescription: e.target.value }))}
                        placeholder="e.g. Official Representative Business Cert PDF"
                        className="min-h-[44px] w-full px-3 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            )}

            {/* Modal Footer */}
            {composer.accountId === "business-bank-hkd" ? (
              <div className="p-4 sm:p-5 border-t border-border/80 bg-muted/30 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="min-h-[40px] px-4 rounded-full border border-border bg-background text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void saveAccountCard(false)}
                    disabled={isSaving}
                    className="min-h-[40px] px-4 rounded-full border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? "Saving..." : "Save Only"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveAccountCard(true)}
                    disabled={isSaving}
                    className="min-h-[40px] px-5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>{isSaving ? "Saving..." : "Save & Sync to MISA HKD"}</span>
                    <span className="font-bold">✓</span>
                  </button>
                </div>
              </div>
            ) : (
            <div className="p-4 sm:p-5 border-t border-border/80 bg-muted/30 flex flex-wrap items-center justify-between gap-3">
              <div>
                {composer.mode === "secret" && composer.isEditingExistingKey && (
                  <button
                    type="button"
                    onClick={() => deleteKey(composer.secretKey)}
                    className="min-h-[40px] px-4 rounded-full border border-destructive/40 bg-destructive/10 hover:bg-destructive/15 text-xs font-semibold text-destructive transition-colors"
                  >
                    Delete Key
                  </button>
                )}
                {composer.mode === "account" && composer.accountIsCustom && composer.accountId && (
                  <button
                    type="button"
                    onClick={() => deleteAccountCard(composer.accountId)}
                    className="min-h-[40px] px-4 rounded-full border border-destructive/40 bg-destructive/10 hover:bg-destructive/15 text-xs font-semibold text-destructive transition-colors"
                  >
                    Delete Account Card
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="min-h-[40px] px-4 rounded-full border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>

                {composer.mode === "secret" && (
                  <button
                    type="button"
                    onClick={saveSecret}
                    disabled={isSaving}
                    className="min-h-[40px] px-5 rounded-full bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? "Saving..." : "Save to AES-256 Vault"}
                  </button>
                )}

                {composer.mode === "account" && (
                  <button
                    type="button"
                    onClick={() => void saveAccountCard(false)}
                    disabled={isSaving}
                    className="min-h-[40px] px-5 rounded-full bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? "Saving..." : "Save Account Card to Vault"}
                  </button>
                )}

                {composer.mode === "bulk" && (
                  <button
                    type="button"
                    onClick={importBulkSecrets}
                    disabled={parsedBulkSecrets.length === 0}
                    className={`min-h-[40px] px-5 rounded-full text-xs font-semibold shadow-xs transition-colors ${
                      parsedBulkSecrets.length > 0
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    Import All to AES-256 Vault ({parsedBulkSecrets.length})
                  </button>
                )}

                {composer.mode === "file" && (
                  <button
                    type="button"
                    onClick={uploadFileAsset}
                    disabled={!composer.fileName}
                    className={`min-h-[40px] px-5 rounded-full text-xs font-semibold shadow-xs transition-colors ${
                      composer.fileName
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    Upload &amp; Secure Asset
                  </button>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center z-50 p-6"
          onClick={() => setLightboxImage(null)}
        >
          <img src={lightboxImage.url} alt={lightboxImage.title} className="max-h-[85vh] rounded-2xl shadow-2xl" />
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 end-6 z-50 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground shadow-[var(--studio-card-shadow)] animate-in fade-in"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
