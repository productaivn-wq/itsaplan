import type { ShellRoute } from '@/hooks/useShellRoute';
import {
  aiAgentsPath,
  documentsPath,
  inboxPath,
  openOfficePath,
  projectPath,
  vaultPath,
} from '@/utils/paths';

export type JtbdStepId = 'triage' | 'deliver' | 'knowledge' | 'supervise' | 'configure' | 'govern';

export type JtbdStage = 'daily' | 'ai' | 'trust';

export type JtbdStep = {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  id: JtbdStepId;
  stage: JtbdStage;
  surface: { en: string; vi: string };
  title: { en: string; vi: string };
  description: { en: string; vi: string };
  shortcut: string;
  href: (projectKey: string) => string;
};

export const JTBD_STEPS: readonly JtbdStep[] = [
  {
    step: 1,
    id: 'triage',
    stage: 'daily',
    surface: { en: 'Inbox', vi: 'Hộp thư' },
    title: { en: '1. Triage & Decide', vi: '1. Phân loại & Quyết định' },
    description: {
      en: 'Review unread mentions, agent handoffs, and items awaiting your approval before acting.',
      vi: 'Xem đề cập mới, bàn giao từ trợ lý AI và các mục đang chờ bạn duyệt trước khi xử lý.',
    },
    shortcut: '⌘K → Inbox',
    href: inboxPath,
  },
  {
    step: 2,
    id: 'deliver',
    stage: 'daily',
    surface: { en: 'Operations', vi: 'Điều hành' },
    title: { en: '2. Plan & Operate Delivery', vi: '2. Lập kế hoạch & Điều hành' },
    description: {
      en: 'Coordinate execution across Work List, Cycles, 7-Horizon Timeline, Initiatives, Dashboards, and opt-in Live Floor.',
      vi: 'Điều phối thực thi trên Danh sách công việc, Chu kỳ, Dòng thời gian 7-Horizon, Sáng kiến, Bảng điều khiển và Văn phòng trực tiếp.',
    },
    shortcut: '1–4 / N',
    href: projectPath,
  },
  {
    step: 3,
    id: 'knowledge',
    stage: 'daily',
    surface: { en: 'Docs & Knowledge Hub', vi: 'Tài liệu & Tri thức' },
    title: { en: '3. Author Specs & Evidence', vi: '3. Soạn tài liệu & Bằng chứng' },
    description: {
      en: 'Write specifications, sticky notes, browse workspace files, read documents, and explore Knowledge Galaxy.',
      vi: 'Soạn tài liệu, ghi chú nhanh, duyệt tệp dự án, đọc hồ sơ và khám phá Bản đồ tri thức.',
    },
    shortcut: '⌘K → Docs',
    href: documentsPath,
  },
  {
    step: 4,
    id: 'supervise',
    stage: 'ai',
    surface: { en: 'Open Office', vi: 'Văn phòng mở' },
    title: { en: '4. Supervise AI Operations', vi: '4. Giám sát Vận hành AI' },
    description: {
      en: 'Monitor live departments, agent activity, active work streams, and pending approval queues.',
      vi: 'Theo dõi phòng ban trực tiếp, trạng thái trợ lý AI, luồng việc và hàng đợi chờ duyệt.',
    },
    shortcut: '⌘K → Open Office',
    href: openOfficePath,
  },
  {
    step: 5,
    id: 'configure',
    stage: 'ai',
    surface: { en: 'AI Agents', vi: 'Trợ lý AI' },
    title: { en: '5. Configure Agents & Schedules', vi: '5. Cấu hình Trợ lý & Lịch trình' },
    description: {
      en: 'Manage agent rosters, tool skills, recurring schedules, connected tool servers, and API references.',
      vi: 'Quản lý danh sách trợ lý AI, kỹ năng, lịch chạy định kỳ, máy chủ công cụ và tài liệu API.',
    },
    shortcut: '⌘K → AI Agents',
    href: aiAgentsPath,
  },
  {
    step: 6,
    id: 'govern',
    stage: 'trust',
    surface: { en: 'Secret Vault', vi: 'Kho bảo mật' },
    title: { en: '6. Govern Custody & Organization', vi: '6. Quản trị Bảo mật & Tổ chức' },
    description: {
      en: 'Protect API keys, hardware-bound secrets, member roles, and notification channels.',
      vi: 'Bảo vệ khóa API, thông tin bí mật gắn phần cứng, phân quyền thành viên và kênh thông báo.',
    },
    shortcut: '⌘K → Secret Vault',
    href: vaultPath,
  },
];

export function resolveActiveJtbdStepId(route: ShellRoute): JtbdStepId {
  if (
    route.routeIssueSeq != null ||
    route.routeInitiativeId != null ||
    route.routeCycleId != null
  ) {
    return 'deliver';
  }
  if (route.section) return 'govern';
  if (route.aiTeamSection) return 'configure';

  switch (route.sub) {
    case 'inbox':
      return 'triage';
    case 'timeline':
    case 'cycles':
    case 'initiatives':
    case 'dashboards':
    case 'view':
      return 'deliver';
    case 'docs':
    case 'notes':
    case 'vibe':
      return 'knowledge';
    case 'open-office':
      return 'supervise';
    case 'agents':
    case 'mcp':
    case 'api':
      return 'configure';
    case 'vault':
    case 'members':
    case 'notifications':
      return 'govern';
    default:
      return 'deliver';
  }
}

export function isRouteMatchingStep(route: ShellRoute, stepId: JtbdStepId): boolean {
  return resolveActiveJtbdStepId(route) === stepId;
}

export function resolveRouteJtbdHint(route: ShellRoute, locale: string): string {
  const isVi = locale.toLowerCase().startsWith('vi');

  if (route.routeIssueSeq != null) {
    return isVi
      ? 'Bước 2/6 · Chi tiết công việc: cập nhật trạng thái, người phụ trách và bằng chứng'
      : 'Step 2/6 · Work Item Detail: update status, ownership, and linked evidence';
  }
  if (route.routeInitiativeId != null) {
    return isVi
      ? 'Bước 2/6 · Chi tiết sáng kiến: theo dõi tiến độ chiến lược và hạng mục liên kết'
      : 'Step 2/6 · Initiative Detail: track strategic progress and scoped deliverables';
  }
  if (route.routeCycleId != null) {
    return isVi
      ? 'Bước 2/6 · Chi tiết chu kỳ: rà soát phạm vi sprint và nhịp độ hoàn thành'
      : 'Step 2/6 · Cycle Detail: review sprint scope and completion velocity';
  }

  const { sub, section, aiTeamSection } = route;

  if (section) {
    return isVi
      ? 'Bước 6/6 · Cài đặt dự án: cấu hình quy tắc luồng việc và thuộc tính dự án'
      : 'Step 6/6 · Project Settings: configure workflow rules and project metadata';
  }
  if (aiTeamSection === 'chat') {
    return isVi
      ? 'Không gian làm việc AI: trò chuyện, phân tích tệp đính kèm và duyệt tác vụ trực tiếp'
      : 'AI Workspace: collaborate with cloud agents, analyze files, and approve high-impact actions';
  }
  if (aiTeamSection) {
    return isVi
      ? 'Bước 5/6 · Đội ngũ AI: cấu hình trợ lý AI, kỹ năng và lịch vận hành tự động'
      : 'Step 5/6 · AI Team: configure agents, skills, and automated schedules';
  }

  switch (sub) {
    case 'inbox':
      return isVi
        ? 'Bước 1/6 · Xem đề cập mới, bàn giao và mục chờ bạn duyệt'
        : 'Step 1/6 · Review unread mentions, handoffs, and items awaiting your approval';
    case 'timeline':
      return isVi
        ? 'Bước 2/6 · Theo dõi tiến độ Gantt, phụ thuộc và mốc bàn giao'
        : 'Step 2/6 · Track Gantt schedules, dependencies, and delivery milestones';
    case 'cycles':
      return isVi
        ? 'Bước 2/6 · Lập kế hoạch sprint và cân bằng năng lực bàn giao'
        : 'Step 2/6 · Plan sprint cycles and balance delivery capacity';
    case 'initiatives':
      return isVi
        ? 'Bước 2/6 · Điều phối sáng kiến chiến lược theo các luồng công việc'
        : 'Step 2/6 · Align strategic initiatives across delivery streams';
    case 'dashboards':
      return isVi
        ? 'Bước 2/6 · Theo dõi chỉ số vận hành và sức khỏe danh mục'
        : 'Step 2/6 · Monitor delivery KPIs and portfolio health';
    case 'docs':
    case 'notes':
    case 'vibe':
      return isVi
        ? 'Bước 3/6 · Soạn tài liệu, ghi chú, duyệt tệp và khám phá bản đồ tri thức'
        : 'Step 3/6 · Author specs, sticky notes, files, reader, and Knowledge Galaxy';
    case 'open-office':
      return isVi
        ? 'Bước 4/6 · Giám sát phòng ban AI, nhịp hoạt động và hàng đợi trực tiếp'
        : 'Step 4/6 · Supervise live AI departments, activity, and work queues';
    case 'agents':
      return isVi
        ? 'Bước 5/6 · Cấu hình trợ lý AI, kỹ năng và lịch trình vận hành'
        : 'Step 5/6 · Configure AI agents, skills, and execution schedules';
    case 'mcp':
      return isVi
        ? 'Bước 5/6 · Kiểm tra máy chủ công cụ và các kết nối giao thức'
        : 'Step 5/6 · Inspect connected tool servers and protocol bindings';
    case 'api':
      return isVi
        ? 'Bước 5/6 · Tra cứu tài liệu API và hợp đồng tích hợp hệ thống'
        : 'Step 5/6 · Explore REST API endpoints and integration contracts';
    case 'vault':
      return isVi
        ? 'Bước 6/6 · Quản trị thông tin bí mật gắn phần cứng và lưu ký khóa API'
        : 'Step 6/6 · Govern hardware-bound secrets and credential custody';
    case 'members':
      return isVi
        ? 'Bước 6/6 · Quản lý thành viên, vai trò và ranh giới phân quyền'
        : 'Step 6/6 · Manage team members, roles, and access boundaries';
    case 'notifications':
      return isVi
        ? 'Bước 6/6 · Cấu hình kênh cảnh báo và thông báo cá nhân'
        : 'Step 6/6 · Configure personal notification channels and alerts';
    default:
      return isVi
        ? 'Bước 2/6 · Điều phối danh sách công việc, phân công và bàn giao sản phẩm'
        : 'Step 2/6 · Manage work list, task ownership, and delivery';
  }
}
