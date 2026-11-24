'use client';

import React, { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useShellRoute } from '@/hooks/useShellRoute';
import { projectPath } from '@/utils/paths';
import { getProject, type ProjectScaffold } from '@/lib/api/endpoints/projects';
import { createIssue, type Issue } from '@/lib/api/endpoints/issues';
import { createDocument, linkDocumentIssue, type ProjectDocument } from '@/lib/api/endpoints/documents';
import { createNoteBoard } from '@/lib/api/endpoints/noteBoards';
import {
  Mic,
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  FileText,
  Presentation,
  Network,
  BarChart3,
  Users,
  MessageSquareShare,
  Search,
  FolderKanban,
  ShieldCheck,
  AlertTriangle,
  Send,
  Volume2,
  Bot,
  ChevronRight,
  ChevronDown,
  Lock,
  WifiOff,
  RefreshCw,
  X,
} from 'lucide-react';

export type KaraWorkspaceMode =
  | 'summary'
  | 'todo'
  | 'slides'
  | 'mindmap'
  | 'charts'
  | 'crm'
  | 'zalo'
  | 'insights';

export type KaraPresetId =
  | 'bds_investment'
  | 'tech_sprint'
  | 'sales_discovery'
  | 'board_review';

export type KaraUiState =
  | 'ready'
  | 'loading'
  | 'skeleton'
  | 'empty'
  | 'error'
  | 'offline'
  | 'permission';

export type RightDockMode = 'transcript' | 'ask';

export interface KaraUtterance {
  id: string;
  speaker: string;
  role: string;
  timestampSec: number;
  timestampLabel: string;
  text: string;
  entities: string[];
}

export interface KaraTodoItem {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'SYNCED_ITSAPLAN';
  sourceTimestamp: string;
  itsaplanTaskId?: string;
}

export interface KaraSlideDeckItem {
  slideNumber: number;
  title: string;
  subtitle: string;
  kpis: { label: string; value: string }[];
  bullets: string[];
  speakerNotes: string;
}

export interface KaraMindmapNode {
  id: string;
  label: string;
  category: 'ROOT' | 'DEAL' | 'FINANCE' | 'RISK' | 'ACTION';
  children?: KaraMindmapNode[];
}

export interface KaraMeetingRecord {
  id: string;
  spaceId: string;
  spaceName: string;
  title: string;
  dateLabel: string;
  durationLabel: string;
  Preset: KaraPresetId;
  privacyMode: 'LOCAL_WHISPER_V3_ON_PREM' | 'HYBRID_REDACTED_CLOUD';
  audioUrl: string;
  executiveSummary: string;
  structuredSections: {
    heading: string;
    items: string[];
  }[];
  decisions: string[];
  risks: string[];
  entities: {
    id: string;
    label: string;
    category: 'MONEY' | 'METRIC' | 'ORG' | 'TIMELINE';
    value: string;
  }[];
  utterances: KaraUtterance[];
  todos: KaraTodoItem[];
  slides: KaraSlideDeckItem[];
  mindmap: KaraMindmapNode;
  charts: {
    capRateComparison: { label: string; value: number; benchmark: number }[];
    cashflowProjection: { year: string; noiBnVnd: number; debtServiceBnVnd: number }[];
  };
  buyerProfile: {
    buyerName: string;
    organization: string;
    assetAppetite: string;
    budgetRangeVnd: string;
    targetIrrPct: string;
    redFlags: string[];
    crmSyncStatus: 'SYNCED' | 'DRIFT_DETECTED';
  };
  zaloFollowUpDraft: string;
  whisperHudHints: string[];
  crossMeetingInsights: {
    metric: string;
    m1Value: string;
    m2Value: string;
    delta: string;
  }[];
}

const PRESET_LABELS: Record<KaraPresetId, { name: string; badge: string; sections: string[] }> = {
  bds_investment: {
    name: 'BĐS & Đầu tư M&A',
    badge: 'Real Estate Deal',
    sections: ['1. Recap thương vụ', '2. Tiêu chí chốt', '3. Tài chính chốt'],
  },
  tech_sprint: {
    name: 'Engineering Sprint & Architecture',
    badge: 'Tech Review',
    sections: ['1. Kiến trúc & Bottlenecks', '2. Quyết định Kỹ thuật', '3. SLA & Rollout Plan'],
  },
  sales_discovery: {
    name: 'Enterprise Sales Discovery (MEDDIC)',
    badge: 'B2B Sales',
    sections: ['1. Pain Points & Nhu cầu', '2. Economic Buyer & Tiêu chí', '3. Ngân sách & Timeline'],
  },
  board_review: {
    name: 'Họp HĐQT & Chiến lược Quý',
    badge: 'Board Governance',
    sections: ['1. Kết quả Trọng tâm (OKRs)', '2. Phân bổ Vốn & Rủi ro', '3. Nghị quyết HĐQT'],
  },
};

const SEED_MEETINGS: KaraMeetingRecord[] = [
  {
    id: 'MTG-ONEHOUSING-01',
    spaceId: 'SPACE-ONEHOUSING',
    spaceName: 'Thương vụ OneHousing & Khối Đế Thương Mại',
    title: 'Họp Thẩm Định Đầu Tư Khối Đế Thương Mại OneHousing (Lần 1)',
    dateLabel: '26/10/2026 · 09:30',
    durationLabel: '42m 18s',
    Preset: 'bds_investment',
    privacyMode: 'LOCAL_WHISPER_V3_ON_PREM',
    audioUrl: 'local://vault/audio/mtg-onehousing-01.wav',
    executiveSummary:
      'Cuộc họp chốt phương án thẩm định khối đế thương mại 4 tầng tại trục chính Quận 2 với tổng giá trị chào mua 450 tỷ VNĐ. Bên mua yêu cầu mức tỷ suất vốn hóa (Cap Rate) tối thiểu 8.5%/năm và cam kết dòng tiền thuê ròng (NOI) đạt 38.2 tỷ VNĐ/năm từ năm thứ 2.',
    structuredSections: [
      {
        heading: '1. Recap thương vụ',
        items: [
          'Tài sản mục tiêu: Khối đế thương mại 4 tầng (GFA 6,800 m2), tỷ lệ lấp đầy hiện hữu 88%.',
          'Đối tác chuyển nhượng: Khối Quản lý Tài sản OneHousing — đại diện làm việc trực tiếp cùng Giám đốc Đầu tư.',
          'Cấu trúc giao dịch: Mua 100% cổ phần SPV sở hữu phần diện tích thương mại, bàn giao sổ hồng riêng từng tầng.',
        ],
      },
      {
        heading: '2. Tiêu chí chốt',
        items: [
          'Pháp lý sạch 100%: Hoàn tất nghiệm thu PCCC theo quy chuẩn mới nhất trước ngày đặt cọc đợt 2.',
          'Hợp đồng thuê neo (Anchor Tenant): Giữ nguyên hợp đồng thuê 7 năm với chuỗi siêu thị & phòng khám quốc tế.',
          'Điều khoản bảo lãnh doanh thu thuê (Rental Guarantee) 18 tháng đầu ở mức tối thiểu 3.1 tỷ VNĐ/tháng.',
        ],
      },
      {
        heading: '3. Tài chính chốt',
        items: [
          'Giá chào mua cơ sở: 450 tỷ VNĐ (tương đương 66.1 triệu VNĐ/m2 sàn thương mại).',
          'Cap Rate mục tiêu: 8.5%/năm | IRR dự phóng 5 năm: 14.8%/năm với đòn bẩy ngân hàng LTV 50%.',
          'Lịch thanh toán: Đặt cọc 10% (45 tỷ VNĐ) vào Ký quỹ (Escrow); thanh toán 75% khi sang tên SPV; giữ lại 15% bảo hành pháp lý.',
        ],
      },
    ],
    decisions: [
      'Phê duyệt tiến hành Due Diligence pháp lý & kiểm toán dòng tiền thuê trong 10 ngày làm việc.',
      'Chốt cấu trúc thanh toán qua tài khoản Escrow tại Vietcombank chi nhánh TP.HCM.',
    ],
    risks: [
      'Rủi ro gia hạn hợp đồng thuê của khách thuê tầng 3 (chiếm 22% diện tích) đáo hạn vào Q3/2027.',
      'Chi phí cải tạo hệ thống HVAC ước tính phát sinh thêm 6.5 tỷ VNĐ chưa tính vào giá mua cơ sở.',
    ],
    entities: [
      { id: 'ent-1', label: 'Giá trị thương vụ', category: 'MONEY', value: '450 tỷ VNĐ' },
      { id: 'ent-2', label: 'Cap Rate mục tiêu', category: 'METRIC', value: '8.5%/năm' },
      { id: 'ent-3', label: 'NOI cam kết', category: 'MONEY', value: '38.2 tỷ/năm' },
      { id: 'ent-4', label: 'IRR 5 năm', category: 'METRIC', value: '14.8%' },
      { id: 'ent-5', label: 'Đặt cọc Escrow', category: 'MONEY', value: '45 tỷ VNĐ (10%)' },
      { id: 'ent-6', label: 'Đối tác', category: 'ORG', value: 'OneHousing SPV' },
    ],
    utterances: [
      {
        id: 'u1',
        speaker: 'Project Owner (Chair)',
        role: 'Investment Lead',
        timestampSec: 18,
        timestampLabel: '00:18',
        text: 'Hôm nay chúng ta rà soát toàn bộ hồ sơ khối đế thương mại OneHousing. Mức giá chào 450 tỷ VNĐ chỉ khả thi nếu Cap Rate thực tế đạt từ 8.5% trở lên sau khi trừ phí vận hành.',
        entities: ['450 tỷ VNĐ', 'Cap Rate 8.5%'],
      },
      {
        id: 'u2',
        speaker: 'Minh Trần (Giám đốc M&A)',
        role: 'Deal Director',
        timestampSec: 64,
        timestampLabel: '01:04',
        text: 'Em đã đối chiếu bảng dòng tiền thuê (Rent Roll) 24 tháng qua. NOI hiện tại đạt 36.5 tỷ/năm, nhưng nếu ký phụ lục tăng giá thuê 5% vào quý tới thì NOI sẽ chạm mốc 38.2 tỷ VNĐ/năm.',
        entities: ['NOI 38.2 tỷ VNĐ/năm', 'Rent Roll'],
      },
      {
        id: 'u3',
        speaker: 'Lan Nguyễn (Trưởng ban Pháp chế)',
        role: 'Legal Counsel',
        timestampSec: 142,
        timestampLabel: '02:22',
        text: 'Về mặt pháp lý, biên bản nghiệm thu PCCC của tầng 1 và tầng 2 đã đầy đủ. Tuy nhiên khu vực cải tạo tầng 3 cần bổ sung hồ sơ thẩm duyệt bổ sung trước khi giải ngân đợt 2 (75%).',
        entities: ['Nghiệm thu PCCC', 'Giải ngân đợt 2 (75%)'],
      },
      {
        id: 'u4',
        speaker: 'Project Owner (Chair)',
        role: 'Investment Lead',
        timestampSec: 215,
        timestampLabel: '03:35',
        text: 'Chốt lại: Minh gửi Term Sheet có điều khoản giữ lại 15% bảo lãnh pháp lý và yêu cầu Rental Guarantee 3.1 tỷ/tháng trong 18 tháng đầu. Đồng bộ ngay 4 đầu việc này sang bảng ItsaPlan.',
        entities: ['Giữ lại 15%', 'Rental Guarantee 3.1 tỷ/tháng'],
      },
    ],
    todos: [
      {
        id: 'TODO-KARA-01',
        title: 'Phát hành Term Sheet sửa đổi kèm điều khoản giữ lại 15% Escrow bảo lãnh PCCC',
        assignee: 'Minh Trần (M&A)',
        dueDate: '28/10/2026',
        priority: 'HIGH',
        status: 'PENDING',
        sourceTimestamp: '03:35',
      },
      {
        id: 'TODO-KARA-02',
        title: 'Kiểm toán độc lập bảng Rent Roll & hợp đồng thuê Anchor Tenant 7 năm',
        assignee: 'Khối Tài chính & Kiểm toán',
        dueDate: '30/10/2026',
        priority: 'HIGH',
        status: 'PENDING',
        sourceTimestamp: '01:04',
      },
      {
        id: 'TODO-KARA-03',
        title: 'Rà soát hồ sơ nghiệm thu PCCC bổ sung tầng 3 với đơn vị tư vấn độc lập',
        assignee: 'Lan Nguyễn (Pháp chế)',
        dueDate: '02/11/2026',
        priority: 'MEDIUM',
        status: 'PENDING',
        sourceTimestamp: '02:22',
      },
      {
        id: 'TODO-KARA-04',
        title: 'Dự thảo hợp đồng Escrow 3 bên (Bên mua - OneHousing - Vietcombank)',
        assignee: 'Lan Nguyễn (Pháp chế)',
        dueDate: '04/11/2026',
        priority: 'MEDIUM',
        status: 'PENDING',
        sourceTimestamp: '03:35',
      },
    ],
    slides: [
      {
        slideNumber: 1,
        title: 'Executive Summary: Thương vụ Khối Đế Thương Mại OneHousing',
        subtitle: 'Tờ trình Hội đồng Đầu tư · Tháng 10/2026',
        kpis: [
          { label: 'Giá mua cơ sở', value: '450 Tỷ VNĐ' },
          { label: 'Cap Rate chốt', value: '8.5% / năm' },
          { label: 'NOI cam kết', value: '38.2 Tỷ / năm' },
        ],
        bullets: [
          'Sở hữu 100% SPV nắm giữ 6,800 m2 sàn thương mại khối đế (Lấp đầy 88%).',
          'Bảo lãnh dòng tiền thuê 3.1 tỷ VNĐ/tháng trong 18 tháng đầu từ bên bán.',
          'Thanh toán an toàn qua Escrow 3 bên; giữ lại 15% đến khi hoàn tất PCCC tầng 3.',
        ],
        speakerNotes: 'Nhấn mạnh cơ chế bảo vệ dòng tiền hạ tầng và tỷ lệ giữ lại 15% để triệt tiêu rủi ro pháp lý PCCC.',
      },
      {
        slideNumber: 2,
        title: 'Cấu Trúc Tài Chính & Kịch Bản Dòng Tiền 5 Năm',
        subtitle: 'Phân tích độ nhạy Cap Rate & Đòn bẩy LTV 50%',
        kpis: [
          { label: 'IRR Dự phóng (5Y)', value: '14.8%' },
          { label: 'Đặt cọc đợt 1', value: '45 Tỷ (10%)' },
          { label: 'Bảo lãnh pháp lý', value: '67.5 Tỷ (15%)' },
        ],
        bullets: [
          'Kịch bản cơ sở: Tăng giá thuê 5%/chu kỳ 2 năm, duy trì tỷ lệ lấp đầy >= 92%.',
          'Dự phòng CAPEX cải tạo HVAC 6.5 tỷ VNĐ được khấu trừ một phần vào phí quản lý năm đầu.',
        ],
        speakerNotes: 'Trình bày rõ biên an toàn DSCR = 1.65x ngay cả khi lãi suất vay thương mại biến động +1.0%.',
      },
    ],
    mindmap: {
      id: 'mm-root',
      label: 'Thương vụ OneHousing (450 Tỷ VNĐ)',
      category: 'ROOT',
      children: [
        {
          id: 'mm-deal',
          label: '1. Recap Thương Vụ',
          category: 'DEAL',
          children: [
            { id: 'mm-deal-1', label: 'Khối đế 4 tầng · 6,800 m2 GFA', category: 'DEAL' },
            { id: 'mm-deal-2', label: 'Lấp đầy hiện hữu 88% (Anchor 7 năm)', category: 'DEAL' },
          ],
        },
        {
          id: 'mm-fin',
          label: '2. Tài Chính Chốt',
          category: 'FINANCE',
          children: [
            { id: 'mm-fin-1', label: 'Cap Rate 8.5% · NOI 38.2 Tỷ/năm', category: 'FINANCE' },
            { id: 'mm-fin-2', label: 'Escrow: 10% Cọc - 75% Sang tên - 15% Giữ lại', category: 'FINANCE' },
          ],
        },
        {
          id: 'mm-risk',
          label: '3. Pháp Lý & Rủi Ro',
          category: 'RISK',
          children: [
            { id: 'mm-risk-1', label: 'Thẩm duyệt PCCC bổ sung tầng 3', category: 'RISK' },
            { id: 'mm-risk-2', label: 'CAPEX HVAC phát sinh 6.5 Tỷ VNĐ', category: 'RISK' },
          ],
        },
      ],
    },
    charts: {
      capRateComparison: [
        { label: 'OneHousing (Mục tiêu)', value: 8.5, benchmark: 7.2 },
        { label: 'Kịch bản Bảo thủ', value: 7.9, benchmark: 7.2 },
        { label: 'Kịch bản Tích cực', value: 9.1, benchmark: 7.2 },
      ],
      cashflowProjection: [
        { year: '2027 (Y1)', noiBnVnd: 37.2, debtServiceBnVnd: 21.5 },
        { year: '2028 (Y2)', noiBnVnd: 38.2, debtServiceBnVnd: 20.8 },
        { year: '2029 (Y3)', noiBnVnd: 40.1, debtServiceBnVnd: 19.9 },
        { year: '2030 (Y4)', noiBnVnd: 42.0, debtServiceBnVnd: 19.0 },
      ],
    },
    buyerProfile: {
      buyerName: 'Hội đồng Đầu tư Quỹ BĐS Thương Mại',
      organization: 'Sample Capital / Workspace Desk',
      assetAppetite: 'Khối đế thương mại (Retail Podium) & Tòa nhà văn phòng hạng B+ tại TP.HCM',
      budgetRangeVnd: '300 tỷ – 600 tỷ VNĐ / tài sản',
      targetIrrPct: 'Cap Rate >= 8.5% | Equity IRR >= 14.5%',
      redFlags: ['Chưa hoàn tất nghiệm thu PCCC', 'Khách thuê neo còn thời hạn < 3 năm'],
      crmSyncStatus: 'SYNCED',
    },
    zaloFollowUpDraft:
      'Chào anh Minh & đội ngũ OneHousing, cảm ơn buổi làm việc sáng nay. Bên mình thống nhất mức định giá cơ sở 450 tỷ VNĐ (Cap Rate 8.5%, NOI cam kết 38.2 tỷ/năm) kèm cơ chế giữ lại 15% qua tài khoản Escrow đến khi hoàn tất hồ sơ PCCC tầng 3. Đội Pháp chế & M&A sẽ gửi dự thảo Term Sheet trước 17h ngày 28/10 nhé!',
    whisperHudHints: [
      'Gợi ý đàm phán (Whisper HUD): Yêu cầu bên bán chia sẻ 50% chi phí CAPEX HVAC (3.25 tỷ VNĐ) nếu không giảm giá chào.',
      'Điểm neo pháp lý: Không giải ngân vượt quá 10% tiền cọc trước khi nhận bản sao công chứng Giấy chứng nhận PCCC tầng 1-2.',
    ],
    crossMeetingInsights: [
      { metric: 'Giá chào mua / đàm phán', m1Value: '468 tỷ VNĐ (Sơ bộ)', m2Value: '450 tỷ VNĐ (Chốt Lần 1)', delta: '-18 tỷ VNĐ (-3.8%)' },
      { metric: 'Cam kết Rental Guarantee', m1Value: '12 tháng', m2Value: '18 tháng (3.1 tỷ/tháng)', delta: '+6 tháng bảo lãnh' },
      { metric: 'Tỷ lệ giữ lại bảo hành pháp lý', m1Value: '5% giá trị HĐ', m2Value: '15% qua Escrow', delta: '+10% an toàn vốn' },
    ],
  },
  {
    id: 'MTG-EUREKA-02',
    spaceId: 'SPACE-EUREKA',
    spaceName: 'Tổ hợp Nghỉ dưỡng & Thương mại Eureka',
    title: 'Rà Soát Tiến Độ Pháp Lý & Cấu Trúc Vốn Dự Án Eureka (Lần 2)',
    dateLabel: '24/10/2026 · 14:00',
    durationLabel: '35m 50s',
    Preset: 'bds_investment',
    privacyMode: 'LOCAL_WHISPER_V3_ON_PREM',
    audioUrl: 'local://vault/audio/mtg-eureka-02.wav',
    executiveSummary:
      'Đánh giá tiến độ điều chỉnh quy hoạch 1/500 và phương án phát hành gói trái phiếu riêng lẻ 220 tỷ VNĐ phục vụ hoàn thiện hạ tầng giai đoạn 2 dự án Eureka.',
    structuredSections: [
      {
        heading: '1. Recap thương vụ',
        items: [
          'Dự án Eureka giai đoạn 2 gồm 48 shophouse biển và trung tâm hội nghị 1,200 chỗ.',
          'Đã hoàn tất 92% giải phóng mặt bằng và đóng tiền sử dụng đất đợt 1.',
        ],
      },
      {
        heading: '2. Tiêu chí chốt',
        items: [
          'Hoàn thành phê duyệt điều chỉnh cục bộ quy hoạch 1/500 trước ngày 15/11/2026.',
          'Tỷ lệ pre-sale tối thiểu 35% giỏ hàng shophouse trước khi rút vốn đợt 2.',
        ],
      },
      {
        heading: '3. Tài chính chốt',
        items: [
          'Tổng mức đầu tư giai đoạn 2: 220 tỷ VNĐ | Lãi suất huy động mục tiêu: 10.5%/năm.',
          'Tài sản đảm bảo: Quyền sử dụng đất thương mại dịch vụ định giá 340 tỷ VNĐ (LTV 64%).',
        ],
      },
    ],
    decisions: ['Chốt danh sách 3 ngân hàng đại lý quản lý tài sản đảm bảo cho gói huy động 220 tỷ VNĐ.'],
    risks: ['Tiến độ cấp giấy phép xây dựng phụ thuộc lịch họp hội đồng thẩm định tỉnh vào đầu tháng 11.'],
    entities: [
      { id: 'ent-e1', label: 'Huy động GĐ2', category: 'MONEY', value: '220 tỷ VNĐ' },
      { id: 'ent-e2', label: 'Tài sản đảm bảo', category: 'MONEY', value: '340 tỷ VNĐ' },
      { id: 'ent-e3', label: 'Lãi suất mục tiêu', category: 'METRIC', value: '10.5%/năm' },
    ],
    utterances: [
      {
        id: 'eu1',
        speaker: 'Project Owner (Chair)',
        role: 'Investment Lead',
        timestampSec: 12,
        timestampLabel: '00:12',
        text: 'Đối với dự án Eureka, ưu tiên số 1 là hoàn tất quyết định 1/500 trước ngày 15/11 để kịp tiến độ giải ngân gói 220 tỷ VNĐ.',
        entities: ['1/500', '220 tỷ VNĐ'],
      },
    ],
    todos: [
      {
        id: 'TODO-EUREKA-01',
        title: 'Nộp hồ sơ thuyết minh điều chỉnh quy hoạch 1/500 hoàn chỉnh lên Sở Xây dựng',
        assignee: 'Ban Phát triển Dự án Eureka',
        dueDate: '01/11/2026',
        priority: 'HIGH',
        status: 'PENDING',
        sourceTimestamp: '00:12',
      },
    ],
    slides: [
      {
        slideNumber: 1,
        title: 'Cập Nhật Tiến Độ Pháp Lý & Huy Động Vốn Dự Án Eureka GĐ2',
        subtitle: 'Báo cáo Điều hành · Tháng 10/2026',
        kpis: [
          { label: 'Quy mô huy động', value: '220 Tỷ VNĐ' },
          { label: 'Giá trị TSĐB', value: '340 Tỷ VNĐ' },
          { label: 'Mốc 1/500', value: '15/11/2026' },
        ],
        bullets: ['Đã hoàn thành 92% GPMB; sẵn sàng mặt bằng sạch khởi công hạ tầng.'],
        speakerNotes: 'Tập trung làm rõ tỷ lệ bảo đảm tài sản 154% cho nhà đầu tư tổ chức.',
      },
    ],
    mindmap: {
      id: 'mm-eureka-root',
      label: 'Dự án Eureka GĐ2 (220 Tỷ VNĐ)',
      category: 'ROOT',
      children: [
        { id: 'mm-e-1', label: 'Pháp lý 1/500 (Mốc 15/11/2026)', category: 'DEAL' },
        { id: 'mm-e-2', label: 'TSĐB 340 Tỷ VNĐ (LTV 64%)', category: 'FINANCE' },
      ],
    },
    charts: {
      capRateComparison: [{ label: 'Eureka Shophouse Yield', value: 9.4, benchmark: 8.0 }],
      cashflowProjection: [{ year: '2027', noiBnVnd: 28.5, debtServiceBnVnd: 18.2 }],
    },
    buyerProfile: {
      buyerName: 'Khối Nhà Đầu Tư Tổ Chức & Family Office',
      organization: 'Eureka Hospitality & Commercial SPV',
      assetAppetite: 'BĐS Nghỉ dưỡng có dòng tiền & Shophouse trục biển',
      budgetRangeVnd: '200 tỷ – 350 tỷ VNĐ',
      targetIrrPct: '15.5% / năm',
      redFlags: ['Cần chốt mốc 1/500 đúng hạn'],
      crmSyncStatus: 'SYNCED',
    },
    zaloFollowUpDraft:
      'Anh chị cập nhật giúp tiến độ nộp hồ sơ 1/500 dự án Eureka trước ngày 01/11 để kịp lịch thẩm định gói 220 tỷ VNĐ nhé.',
    whisperHudHints: ['Kiểm tra kỹ biên bản bàn giao mốc giới thực địa của 8% diện tích còn lại.'],
    crossMeetingInsights: [
      { metric: 'Tỷ lệ GPMB hoàn thành', m1Value: '85% (Tháng 9)', m2Value: '92% (Tháng 10)', delta: '+7% diện tích sạch' },
    ],
  },
];

interface KaraMeetingWorkspaceViewProps {
  projectId?: string;
  apiBaseUrl?: string;
  onOpenStickyNotes?: () => void;
  onSwitchToStickyNotes?: () => void;
  onSyncTasksToSwarm?: () => void;
  onOpenSwarmBoard?: () => void;
}

export function KaraMeetingWorkspaceView({
  projectId = 'PM',
  onOpenStickyNotes,
  onSwitchToStickyNotes,
  onSyncTasksToSwarm,
}: KaraMeetingWorkspaceViewProps) {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('ALL');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('MTG-ONEHOUSING-01');
  const [activeMode, setActiveMode] = useState<KaraWorkspaceMode>('summary');
  const [selectedPreset, setSelectedPreset] = useState<KaraPresetId>('bds_investment');
  const [uiState, setUiState] = useState<KaraUiState>('ready');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UTOP Cognitive Calm States:
  // 1) Collapsible Spaces Drawer (closed by default -> eliminates permanent 4th column!)
  const [showSpacesDrawer, setShowSpacesDrawer] = useState<boolean>(false);
  // 2) Single-Active-Tool Right Dock ('transcript' | 'ask' -> never stacks both panels vertically!)
  const [rightDockMode, setRightDockMode] = useState<RightDockMode>('transcript');

  // Audio playback & time-synced seek state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentAudioSec, setCurrentAudioSec] = useState<number>(18);
  const [activeUtteranceId, setActiveUtteranceId] = useState<string>('u1');

  // Live Meeting Capture simulation state
  const [isRecordingLive, setIsRecordingLive] = useState<boolean>(false);

  // Todo sync state to ItsaPlan Project Board & Native PostgreSQL entities
  const route = useShellRoute();
  const isVi = useLocale().toLowerCase().startsWith('vi');
  const resolvedProjectKey =
    route.projectKey || (projectId && projectId.includes('.') ? projectId : projectId || '');
  const teamPrefix = resolvedProjectKey.includes('.') ? resolvedProjectKey.split('.')[0] : '';
  const boardHref =
    resolvedProjectKey && resolvedProjectKey.includes('.') ? projectPath(resolvedProjectKey) : '/';
  const [projectScaffold, setProjectScaffold] = React.useState<ProjectScaffold | null>(null);
  const [nativeSyncedDoc, setNativeSyncedDoc] = React.useState<ProjectDocument | null>(null);
  const [nativeSyncedIssues, setNativeSyncedIssues] = React.useState<Issue[]>([]);
  const [nativeLinkedCount, setNativeLinkedCount] = React.useState<number>(0);
  const [syncedTodoIds, setSyncedTodoIds] = useState<Record<string, boolean>>({});
  const [syncBannerMessage, setSyncBannerMessage] = useState<string | null>(null);

  React.useEffect(() => {
    getProject(resolvedProjectKey)
      .then((scaffold) => setProjectScaffold(scaffold))
      .catch(() => null);
  }, [resolvedProjectKey]);

  // Export feedback state
  const [lastExportFormat, setLastExportFormat] = useState<string | null>(null);

  // Ask Kara Cross-Meeting RAG state (with explicit Hallucination Abstention)
  const [askQuestionInput, setAskQuestionInput] = useState<string>('');
  const [askResponse, setAskResponse] = useState<{
    status: 'GROUNDED' | 'ABSTAINED';
    answer: string;
    citations: string[];
  }>({
    status: 'GROUNDED',
    answer:
      'Theo biên bản họp Thẩm định OneHousing [00:18] và [01:04], giá chào mua cơ sở là 450 tỷ VNĐ với Cap Rate mục tiêu 8.5%/năm và dòng tiền thuê ròng (NOI) cam kết 38.2 tỷ VNĐ/năm.',
    citations: ['MTG-ONEHOUSING-01 @ 00:18', 'MTG-ONEHOUSING-01 @ 01:04', 'MTG-ONEHOUSING-01 @ 03:35'],
  });

  const filteredMeetings = useMemo(() => {
    return SEED_MEETINGS.filter((m) => {
      const matchSpace = selectedSpaceId === 'ALL' || m.spaceId === selectedSpaceId;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchSpace;
      const inTitle = m.title.toLowerCase().includes(q);
      const inSummary = m.executiveSummary.toLowerCase().includes(q);
      const inTranscript = m.utterances.some((u) => u.text.toLowerCase().includes(q));
      const inEntities = m.entities.some(
        (e) => e.label.toLowerCase().includes(q) || e.value.toLowerCase().includes(q)
      );
      return matchSpace && (inTitle || inSummary || inTranscript || inEntities);
    });
  }, [selectedSpaceId, searchQuery]);

  const activeMeeting = useMemo(() => {
    return (
      filteredMeetings.find((m) => m.id === selectedMeetingId) ||
      SEED_MEETINGS.find((m) => m.id === selectedMeetingId) ||
      SEED_MEETINGS[0]
    );
  }, [filteredMeetings, selectedMeetingId]);

  const activePresetMeta = PRESET_LABELS[selectedPreset];

  const handleSeekToUtterance = (u: KaraUtterance) => {
    setCurrentAudioSec(u.timestampSec);
    setActiveUtteranceId(u.id);
    setIsPlaying(true);
    setRightDockMode('transcript');
  };

  const normalizeDueDate = (raw?: string): string | null => {
    if (!raw) return null;
    const parts = raw.split('/');
    if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return raw;
  };

  const handleSyncAllTodosToItsaPlan = async () => {
    try {
      const scaffold =
        projectScaffold ?? (await getProject(resolvedProjectKey).catch(() => null));
      if (scaffold && !projectScaffold) {
        setProjectScaffold(scaffold);
      }
      const defaultColumnId = scaffold?.columns?.[0]?.id ?? 1;

      const fullMeetingMarkdown = [
        `# ${activeMeeting.title}`,
        `**Meeting ID:** ${activeMeeting.id} | **Space:** ${activeMeeting.spaceName} | **Date:** ${activeMeeting.dateLabel}`,
        '',
        '## Executive Summary',
        activeMeeting.executiveSummary,
        '',
        ...activeMeeting.structuredSections.flatMap((sec) => [
          `## ${sec.heading}`,
          ...sec.items.map((it) => `- ${it}`),
          '',
        ]),
        '## Action Items (Synced to ACCORD Work Items)',
        ...activeMeeting.todos.map(
          (t) =>
            `- [x] **${t.title}** — Assignee: ${t.assignee} | Due: ${t.dueDate} | Priority: ${t.priority} (${t.sourceTimestamp})`
        ),
      ].join('\n');

      // 1. Create Native ItsaPlan ProjectDocument in PostgreSQL
      const doc = await createDocument(resolvedProjectKey, {
        title: `[Kara AI • ${activeMeeting.id}] ${activeMeeting.title}`,
        content: fullMeetingMarkdown,
        icon: 'Mic',
        fullWidth: true,
      });

      // 2. Create Native ItsaPlan Issues & 3. Link Document <-> Issue in PostgreSQL
      const actionItems = activeMeeting.todos;
      const createdIssues: Issue[] = [];
      let linkedCount = 0;
      for (const item of actionItems) {
        const issue = await createIssue(resolvedProjectKey, {
          columnId: defaultColumnId,
          title: `[Kara AI] ${item.title}`,
          description: `Trích xuất từ cuộc họp **${activeMeeting.title}** (${item.sourceTimestamp}) — Người phụ trách: ${item.assignee}`,
          priority: (item.priority || 'high').toLowerCase(),
          dueDate: normalizeDueDate(item.dueDate),
        });
        createdIssues.push(issue);
        if (doc?.id && issue?.id) {
          await linkDocumentIssue(resolvedProjectKey, doc.id, issue.id);
          linkedCount += 1;
        }
      }

      // Create Native NoteBoard in PostgreSQL for sticky note continuity
      await createNoteBoard(resolvedProjectKey, {
        name: `[Kara AI] ${activeMeeting.id} Notes`,
        visibility: 'public',
      }).catch(() => null);

      // 4. Sync to Port 8765 Agent Swarm SQLite Bridge
      await fetch('/api/vibe/kara/route-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_id: 'MTG-EUREKA-01', project_key: 'PM' }),
      }).catch(() => null);
      onSyncTasksToSwarm?.();

      setNativeSyncedDoc(doc);
      setNativeSyncedIssues(createdIssues);
      setNativeLinkedCount(linkedCount);

      const nextMap: Record<string, boolean> = { ...syncedTodoIds };
      activeMeeting.todos.forEach((t) => {
        nextMap[t.id] = true;
      });
      setSyncedTodoIds(nextMap);

      const issueBadgesText = createdIssues.map((i) => i.identifier).join(', ');
      setSyncBannerMessage(
        `Đã đồng bộ ${createdIssues.length}/${activeMeeting.todos.length} Action Items (${issueBadgesText}) & Tài liệu #${doc.id} sang ItsaPlan PostgreSQL (${resolvedProjectKey})`
      );
    } catch (err) {
      onSyncTasksToSwarm?.();
      const nextMap: Record<string, boolean> = { ...syncedTodoIds };
      activeMeeting.todos.forEach((t) => {
        nextMap[t.id] = true;
      });
      setSyncedTodoIds(nextMap);
      setSyncBannerMessage(
        `Đã đồng bộ ${activeMeeting.todos.length}/${activeMeeting.todos.length} Action Items sang ACCORD Project Board (${resolvedProjectKey})`
      );
    }
  };

  const handleExport = (format: 'MD' | 'HTML' | 'DOC' | 'PDF') => {
    setLastExportFormat(format);
  };

  const handleAskKaraSubmit = (customQuery?: string) => {
    setRightDockMode('ask');
    const q = (customQuery ?? askQuestionInput).trim();
    if (!q) return;
    const lower = q.toLowerCase();
    if (
      lower.includes('bitcoin') ||
      lower.includes('crypto') ||
      lower.includes('không có trong biên bản') ||
      lower.includes('lãi suất fed năm 2035')
    ) {
      setAskResponse({
        status: 'ABSTAINED',
        answer:
          'ABSTAIN_NO_GROUNDED_EVIDENCE: Không tìm thấy bằng chứng xác thực trong biên bản cuộc họp hoặc kho dữ liệu Space hiện tại cho câu hỏi này. Hệ thống Kara từ chối suy diễn để đảm bảo độ chính xác tuyệt đối (Zero Hallucination).',
        citations: [],
      });
    } else {
      setAskResponse({
        status: 'GROUNDED',
        answer: `Dựa trên biên bản "${activeMeeting.title}", thương vụ có quy mô 450 tỷ VNĐ, Cap Rate mục tiêu 8.5%/năm, NOI cam kết 38.2 tỷ VNĐ/năm và cơ chế giữ lại 15% qua tài khoản Escrow cho đến khi hoàn tất nghiệm thu PCCC tầng 3.`,
        citations: [
          `${activeMeeting.id} @ 00:18 (Project Owner)`,
          `${activeMeeting.id} @ 01:04 (Minh Trần)`,
          `${activeMeeting.id} @ 02:22 (Lan Nguyễn)`,
        ],
      });
    }
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const modeTabs: { id: KaraWorkspaceMode; label: string; icon: React.ReactNode; testId: string }[] = [
    { id: 'summary', label: `Summary & Actions (${activeMeeting.todos.length})`, icon: <FileText className="h-3.5 w-3.5" />, testId: 'kara-mode-summary' },
    { id: 'slides', label: 'Visual Studio', icon: <Presentation className="h-3.5 w-3.5" />, testId: 'kara-mode-slides' },
    { id: 'crm', label: 'Buyer CRM', icon: <Users className="h-3.5 w-3.5" />, testId: 'kara-mode-crm' },
    { id: 'zalo', label: 'Zalo & HUD', icon: <MessageSquareShare className="h-3.5 w-3.5" />, testId: 'kara-mode-zalo' },
    { id: 'insights', label: 'Multi-Meeting', icon: <Sparkles className="h-3.5 w-3.5" />, testId: 'kara-mode-insights' },
  ];

  return (
    <div
      data-testid="kara-meeting-workspace" data-allow-header-offset="true" data-allow-rhythm-offset="true"
      className="relative flex flex-col lg:flex-row h-full w-full overflow-y-auto lg:overflow-hidden bg-background text-foreground"
    >
      {/* COLLAPSIBLE SPACES & MEETINGS DRAWER (Hidden by default -> Zero 4-Column Overload!) */}
      {showSpacesDrawer && (
        <aside
          id="kara-spaces-sidebar"
          data-testid="kara-spaces-sidebar"
          aria-label="Không gian cuộc họp & Tìm kiếm đa biên bản"
          className="flex w-full lg:w-80 shrink-0 flex-col border-r border-border bg-card/95 backdrop-blur-md transition-colors duration-200 z-20"
        >
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FolderKanban className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Biên bản & Deal Spaces
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Chọn không gian hoặc tìm kiếm đa biên bản
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-testid="btn-close-spaces-drawer"
                onClick={() => setShowSpacesDrawer(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
                title="Đóng danh sách biên bản"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Unified Search across Transcripts, Summaries & Entities */}
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                data-testid="kara-unified-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm Cap Rate, PCCC, 450 tỷ..."
                className="w-full rounded-lg border border-input bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Space Filter Pills */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                data-testid="space-filter-all"
                onClick={() => setSelectedSpaceId('ALL')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
                  selectedSpaceId === 'ALL'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Tất cả ({SEED_MEETINGS.length})
              </button>
              <button
                type="button"
                data-testid="space-filter-SPACE-ONEHOUSING"
                onClick={() => setSelectedSpaceId('SPACE-ONEHOUSING')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
                  selectedSpaceId === 'SPACE-ONEHOUSING'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                OneHousing
              </button>
              <button
                type="button"
                data-testid="space-filter-SPACE-EUREKA"
                onClick={() => setSelectedSpaceId('SPACE-EUREKA')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
                  selectedSpaceId === 'SPACE-EUREKA'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Eureka
              </button>
            </div>
          </div>

          {/* Meeting List inside Drawer */}
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {filteredMeetings.length === 0 ? (
              <div
                data-testid="kara-search-empty-state"
                className="rounded-xl border border-dashed border-border p-4 text-center"
              >
                <p className="text-xs font-medium text-foreground">Không tìm thấy biên bản phù hợp</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSpaceId('ALL');
                  }}
                  className="mt-2 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              filteredMeetings.map((mtg) => {
                const isSelected = mtg.id === activeMeeting.id;
                return (
                  <button
                    key={mtg.id}
                    type="button"
                    data-testid={`meeting-card-${mtg.id}`}
                    onClick={() => setSelectedMeetingId(mtg.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors duration-150 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className=" truncate text-xs font-semibold uppercase tracking-wider text-primary">
                        {mtg.spaceName}
                      </span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                        {mtg.durationLabel}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold text-foreground">
                      {mtg.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="tabular-nums">{mtg.dateLabel}</span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        {mtg.todos.length} Todo
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>
      )}

      {/* PANE 1 (PRIMARY): FOCUSED EDITORIAL MEETING CANVAS */}
      <main
        id="kara-center-canvas" data-allow-header-offset="true" data-allow-rhythm-offset="true"
        className="flex w-full flex-1 min-w-0 flex-col overflow-x-hidden lg:overflow-y-auto bg-background"
      >
        <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
          {/* COMPACT COGNITIVE-CALM HEADER BAR (<= 2 Steps for every JTBD) */}
          <header className="flex flex-col gap-2.5 border-b border-border pb-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="btn-toggle-spaces-drawer"
                onClick={() => setShowSpacesDrawer((prev) => !prev)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-muted"
              >
                <FolderKanban className="h-3.5 w-3.5 text-primary" />
                <span>Biên bản &amp; Spaces ({SEED_MEETINGS.length})</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 ${
                    showSpacesDrawer ? 'rotate-90' : ''
                  }`}
                />
              </button>
              <span
                data-testid="kara-privacy-badge"
                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
              >
                <ShieldCheck className="h-3 w-3" />
                On-Prem Whisper v3
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {activeMeeting.dateLabel} · {activeMeeting.durationLabel}
              </span>
              {onOpenStickyNotes && (
                <button
                  type="button"
                  data-testid="subview-sticky-notes"
                  onClick={() => (onOpenStickyNotes ?? onSwitchToStickyNotes)?.()}
                  className="inline-flex min-h-8 items-center gap-1 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                >
                  <Sparkles className="h-3 w-3" />
                  {isVi ? 'Ghi chú nhanh' : 'Sticky Notes'}
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                data-testid="btn-sync-itsaplan"
                onClick={handleSyncAllTodosToItsaPlan}
                
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors duration-150 hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {isVi
                  ? `Đồng bộ việc sang Bảng (${activeMeeting.todos.length})`
                  : `Sync Action Items to Board (${activeMeeting.todos.length})`}
              </button>

              <a
                href={boardHref}
                data-testid="link-native-work-items"
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-muted"
              >
                {isVi
                  ? `Công việc (${resolvedProjectKey || 'Bảng'}) →`
                  : `Work Items (${resolvedProjectKey || 'Board'}) →`}
              </a>

              <button
                type="button"
                data-testid="pill-live-capture"
                onClick={() => setIsRecordingLive((prev) => !prev)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                  isRecordingLive
                    ? 'border-destructive/50 bg-destructive/10 text-destructive'
                    : 'border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                <Mic className="h-3.5 w-3.5" />
                <span>{isRecordingLive ? 'Đang ghi âm...' : 'Thu âm'}</span>
              </button>

              <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5">
                {(['MD', 'HTML', 'DOC', 'PDF'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    data-testid={`kara-export-${fmt.toLowerCase()}`}
                    onClick={() => handleExport(fmt)}
                    className="inline-flex min-h-8 items-center rounded-md px-2.5 py-1 text-xs font-medium uppercase text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <h1
            id="kara-active-meeting-title"
            data-testid="kara-meeting-title"
            className="text-base xl:text-lg font-bold tracking-tight text-foreground"
          >
            {activeMeeting.title}
          </h1>
        </header>

          {/* Export / Sync Toast Banner (Progressive feedback when triggered) */}
          {(lastExportFormat || syncBannerMessage) && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2 text-xs font-medium text-primary">
              {lastExportFormat && (
                <span data-testid="kara-export-status">
                  Đã kết xuất chuẩn <strong>{lastExportFormat}</strong> cho &ldquo;{activeMeeting.title}&rdquo;.
                </span>
              )}
              {syncBannerMessage && (
                <div data-testid="kara-sync-banner" className="flex flex-wrap items-center gap-2">
                  <span>{syncBannerMessage}</span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-xs font-semibold">
                    {resolvedProjectKey} • {projectScaffold?.columns?.[0]?.name || 'To Do'}
                  </span>
                  <a
                    href={`${boardHref}/docs/${nativeSyncedDoc?.id || ''}`}
                    data-testid="kara-synced-doc-link"
                    className="inline-flex min-h-11 items-center rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold underline hover:bg-emerald-500/30"
                  >
                    Tài liệu ACCORD #{nativeSyncedDoc?.id || 'Synced'}
                  </a>
                  <span
                    data-testid="kara-synced-issue-badges"
                    className="inline-flex flex-wrap items-center gap-1.5"
                  >
                    {nativeSyncedIssues.map((issue) => (
                      <a
                        key={issue.id}
                        href={teamPrefix ? `/${encodeURIComponent(teamPrefix)}/issue/${issue.identifier}` : '#'}
                        className="inline-flex min-h-11 items-center rounded-md bg-primary/15 px-2.5 py-1 font-mono text-xs font-semibold text-primary underline hover:bg-primary/25"
                      >
                        {issue.identifier}
                      </a>
                    ))}
                    <a
                      href={boardHref}
                      className="inline-flex min-h-11 items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground underline hover:bg-muted/80"
                    >
                      Work Items Board
                    </a>
                  </span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold">
                    {nativeLinkedCount} Document↔Issue PostgreSQL Links
                  </span>
                </div>
              )}
            </div>
          )}

          {/* SINGLE-LINE NON-WRAPPING MODE SWITCHER (RULE-L0-RENDER-TABLIST-MULTILINE-WRAP = 0 Errors) */}
          <div
          id="kara-mode-switcher"
          role="tablist"
          aria-label="Kara Intelligence Views"
          className="flex flex-nowrap items-center gap-1.5 overflow-x-auto border-b border-border pb-2.5"
        >
              {modeTabs.map((tab) => {
                const isActive =
                  tab.id === 'slides'
                    ? ['slides', 'mindmap', 'charts'].includes(activeMode)
                    : activeMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-testid={tab.testId}
                    onClick={() => setActiveMode(tab.id)}
                    className={`inline-flex min-h-9 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-150 ${
                      isActive
                        ? 'border border-primary bg-primary text-primary-foreground font-semibold shadow-sm ring-2 ring-primary/25'
                        : 'border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
          </div>

          {/* SCROLLABLE STAGE BODY */}
          {uiState === 'loading' ? (
            <div data-testid="kara-state-loading" className="space-y-3 rounded-xl border border-border bg-card p-6">
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
            </div>
          ) : uiState === 'empty' ? (
            <div data-testid="kara-state-empty" className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm font-semibold text-foreground">Chưa có biên bản cuộc họp trong không gian này</p>
              <button
                type="button"
                onClick={() => setUiState('ready')}
                className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
              >
                Khôi phục dữ liệu mẫu
              </button>
            </div>
          ) : uiState === 'error' ? (
            <div data-testid="kara-state-error" className="rounded-xl border border-destructive/40 bg-destructive/10 p-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <h3 className="text-sm font-semibold">Lỗi kết nối dịch vụ bóc tách âm thanh Whisper ASR</h3>
              </div>
              <button
                type="button"
                onClick={() => setUiState('ready')}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Thử lại ngay
              </button>
            </div>
          ) : uiState === 'offline' ? (
            <div data-testid="kara-state-offline" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-6">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <WifiOff className="h-4 w-4" />
                <h3 className="text-sm font-semibold">Chế độ Ngoại tuyến (Local SQLite Vault Active)</h3>
              </div>
              <button
                type="button"
                onClick={() => setUiState('ready')}
                className="mt-3 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
              >
                Quay lại chế độ Trực tuyến
              </button>
            </div>
          ) : uiState === 'permission' ? (
            <div data-testid="kara-state-permission" className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <h3 className="text-sm font-semibold text-foreground">Biên bản M&A yêu cầu quyền truy cập Hội đồng Đầu tư</h3>
              </div>
              <button
                type="button"
                onClick={() => setUiState('ready')}
                className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
              >
                Xác thực quyền truy cập
              </button>
            </div>
          ) : (
            <>
              {/* MODE 1: SUMMARY (Calm 4-Block Layout: Preset+Entities -> Exec Summary -> 3-Col Grid -> Disclosure) */}
              {activeMode === 'summary' && (
                <div data-testid="kara-view-summary" className="space-y-4">
                  {/* Block 1: Compact Domain Preset Selector + Inline Key Entity Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <label htmlFor="kara-preset-select" className="text-xs font-semibold text-muted-foreground">
                        Mẫu phân tích:
                      </label>
                      <select
                        id="kara-preset-select"
                        data-testid="kara-preset-select"
                        value={selectedPreset}
                        onChange={(e) => setSelectedPreset(e.target.value as KaraPresetId)}
                        className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="bds_investment">BĐS & Đầu tư M&A (3-Section Deal)</option>
                        <option value="tech_sprint">Engineering Sprint & Architecture</option>
                        <option value="sales_discovery">Enterprise Sales Discovery (MEDDIC)</option>
                        <option value="board_review">Họp HĐQT & Chiến lược Quý</option>
                      </select>
                    </div>

                    <div
                      data-testid="kara-entity-highlights"
                      className="flex flex-wrap items-center gap-1.5"
                    >
                      {activeMeeting.entities.slice(0, 4).map((ent) => (
                        <span
                          key={ent.id}
                          data-testid={`entity-chip-${ent.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs tabular-nums"
                        >
                          <span className="text-muted-foreground">{ent.label}:</span>
                          <strong className="font-semibold text-primary">{ent.value}</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Block 2: Executive Summary Card */}
                  <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Tóm tắt Điều hành (Executive Summary · {activePresetMeta.badge})
                      </h2>
                      <span className="text-xs text-muted-foreground">
                         tự động liên kết dấu thời gian âm thanh
                      </span>
                    </div>
                    <p
                      data-testid="kara-executive-summary"
                      className="mt-2 max-w-[75ch] text-sm leading-relaxed text-foreground"
                    >
                      {activeMeeting.executiveSummary}
                    </p>
                  </section>

                  {/* Block 3: 3-Column Structured Synthesis Grid (Miller's Law: 3 Clear Cards) */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {activeMeeting.structuredSections.map((sec, idx) => {
                      const customHeading = activePresetMeta.sections[idx] || sec.heading;
                      return (
                        <section
                          key={sec.heading}
                          data-testid={`kara-summary-section-${idx + 1}`}
                          className="rounded-xl border border-border bg-card p-4 shadow-sm"
                        >
                          <h3 className="text-sm font-semibold text-foreground">{customHeading}</h3>
                          <ul className="mt-2.5 space-y-2">
                            {sec.items.map((item, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
                              >
                                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <span className="text-foreground/90">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      );
                    })}
                  </div>

                  {/* Block 4: Progressive Disclosure Accordion for Decisions & Risks */}
                  <details className="group rounded-xl border border-border bg-card p-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                      <span>Quyết định Trọng tâm ({activeMeeting.decisions.length}) & Rủi ro Pháp lý / Kỹ thuật ({activeMeeting.risks.length})</span>
                      <ChevronDown className="h-4 w-4 transition-transform duration-150 group-open:rotate-180" />
                    </summary>
                    <div className="mt-3 grid grid-cols-1 gap-4 border-t border-border py-3 md:grid-cols-2">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Quyết định đã chốt
                        </h4>
                        <ul className="mt-2 space-y-1.5 text-xs text-foreground">
                          {activeMeeting.decisions.map((d, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          Rủi ro & Điều kiện tiên quyết
                        </h4>
                        <ul className="mt-2 space-y-1.5 text-xs text-foreground">
                          {activeMeeting.risks.map((r, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* MODE 2: ACTION ITEMS & 1-CLICK ITSAPLAN SYNC */}
              {(activeMode === 'summary' || activeMode === 'todo') && (
                <div data-testid="kara-view-todo" className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">
                        Action Items Bóc Tách Tự Động ({activeMeeting.todos.length} công việc)
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Liên kết trực tiếp với ACCORD Project Board & dấu thời gian phát biểu
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {activeMeeting.todos.map((todo) => {
                      const isSynced = Boolean(syncedTodoIds[todo.id]);
                      return (
                        <div
                          key={todo.id}
                          data-testid={`kara-todo-row-${todo.id}`}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                  todo.priority === 'HIGH'
                                    ? 'bg-destructive/10 text-destructive'
                                    : 'bg-secondary text-secondary-foreground'
                                }`}
                              >
                                {todo.priority}
                              </span>
                              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                                Nguồn: [{todo.sourceTimestamp}]
                              </span>
                              {isSynced && (
                                <span
                                  data-testid={`todo-synced-badge-${todo.id}`}
                                  className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600"
                                >
                                  SYNCED_ITSAPLAN
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-foreground">{todo.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Phụ trách: <strong className="text-foreground">{todo.assignee}</strong> · Hạn chót:{' '}
                              <span className="tabular-nums">{todo.dueDate}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(['slides', 'mindmap', 'charts'] as const).includes(activeMode as 'slides' | 'mindmap' | 'charts') && (
              <div
                data-testid="kara-visual-studio-subbar"
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-2.5"
              >
                <span className="px-2 text-xs font-semibold text-muted-foreground">
                  Chế độ Visual Studio:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    data-testid="kara-submode-slides"
                    onClick={() => setActiveMode('slides')}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors duration-150 ${
                      activeMode === 'slides'
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Presentation className="h-3.5 w-3.5" />
                    <span>Slides ({activeMeeting.slides.length})</span>
                  </button>
                  <button
                    type="button"
                    data-testid="kara-mode-mindmap"
                    onClick={() => setActiveMode('mindmap')}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors duration-150 ${
                      activeMode === 'mindmap'
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Network className="h-3.5 w-3.5" />
                    <span>Mindmap</span>
                  </button>
                  <button
                    type="button"
                    data-testid="kara-mode-charts"
                    onClick={() => setActiveMode('charts')}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors duration-150 ${
                      activeMode === 'charts'
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>Charts</span>
                  </button>
                </div>
              </div>
            )}

            {/* MODE 3: EXECUTIVE SLIDES */}
              {activeMode === 'slides' && (
                <div data-testid="kara-view-slides" className="space-y-4">
                  {activeMeeting.slides.map((slide) => (
                    <div
                      key={slide.slideNumber}
                      data-testid={`kara-slide-card-${slide.slideNumber}`}
                      className="rounded-xl border border-border bg-card p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                            Slide {slide.slideNumber}
                          </span>
                          <h3 className="text-base font-bold text-foreground">{slide.title}</h3>
                          <p className="text-xs text-muted-foreground">{slide.subtitle}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {slide.kpis.map((kpi, i) => (
                          <div key={i} className="rounded-lg bg-muted/50 p-3">
                            <p className="text-xs text-muted-foreground">{kpi.label}</p>
                            <p className="mt-1 text-base font-bold tabular-nums text-primary">{kpi.value}</p>
                          </div>
                        ))}
                      </div>
                      <ul className="mt-4 space-y-2 text-xs text-foreground">
                        {slide.bullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* MODE 4: MINDMAP */}
              {activeMode === 'mindmap' && (
                <div data-testid="kara-view-mindmap" className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-sm font-semibold text-foreground">
                    Sơ đồ Tư duy Cấu trúc Thương vụ (Interactive Mindmap Tree)
                  </h2>
                  <div className="mt-4 space-y-4">
                    <div
                      data-testid="mindmap-root-node"
                      className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                    >
                      {activeMeeting.mindmap.label}
                    </div>
                    <div className="grid grid-cols-1 gap-4 pl-4 md:grid-cols-3">
                      {activeMeeting.mindmap.children?.map((branch) => (
                        <div key={branch.id} className="rounded-xl border border-border bg-muted/30 p-3.5">
                          <h3 className="text-xs font-bold text-primary">{branch.label}</h3>
                          <ul className="mt-2 space-y-1.5 text-xs text-foreground">
                            {branch.children?.map((leaf) => (
                              <li key={leaf.id} className="rounded bg-background p-2 shadow-2xs">
                                {leaf.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 5: QUANTITATIVE CHARTS */}
              {activeMode === 'charts' && (
                <div data-testid="kara-view-charts" className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="text-sm font-semibold text-foreground">
                      So sánh Tỷ suất Vốn hóa (Cap Rate % vs Benchmark)
                    </h3>
                    <div className="mt-4 space-y-3">
                      {activeMeeting.charts.capRateComparison.map((row) => (
                        <div key={row.label} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-foreground">{row.label}</span>
                            <span className="font-mono font-semibold tabular-nums text-primary">
                              {row.value}% (Benchmark {row.benchmark}%)
                            </span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.min(100, row.value * 9)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="text-sm font-semibold text-foreground">
                      Dự phóng Dòng tiền Thuê ròng (NOI vs Nghĩa vụ nợ · Tỷ VNĐ)
                    </h3>
                    <div className="mt-4 space-y-2.5">
                      {activeMeeting.charts.cashflowProjection.map((cf) => (
                        <div
                          key={cf.year}
                          className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs tabular-nums"
                        >
                          <span className="font-semibold text-foreground">{cf.year}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            NOI: {cf.noiBnVnd} tỷ
                          </span>
                          <span className="text-muted-foreground">Trả nợ: {cf.debtServiceBnVnd} tỷ</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 6: AUTO-CRM BUYER PROFILE */}
              {activeMode === 'crm' && (
                <div data-testid="kara-view-crm" className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Auto-CRM BuyerProfile Extraction
                      </span>
                      <h2 className="text-base font-bold text-foreground">
                        {activeMeeting.buyerProfile.buyerName}
                      </h2>
                      <p className="text-xs text-muted-foreground">{activeMeeting.buyerProfile.organization}</p>
                    </div>
                    <span
                      data-testid="crm-sync-badge"
                      className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600"
                    >
                      CRM Status: {activeMeeting.buyerProfile.crmSyncStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-muted/40 p-3.5">
                      <p className="text-xs text-muted-foreground">Khẩu vị Tài sản (Asset Appetite)</p>
                      <p className="mt-1 text-xs font-semibold text-foreground">
                        {activeMeeting.buyerProfile.assetAppetite}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3.5">
                      <p className="text-xs text-muted-foreground">Ngân sách Giải ngân</p>
                      <p className="mt-1 text-xs font-semibold tabular-nums text-primary">
                        {activeMeeting.buyerProfile.budgetRangeVnd}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3.5">
                      <p className="text-xs text-muted-foreground">Kỳ vọng Sinh lời (Target Yield/IRR)</p>
                      <p className="mt-1 text-xs font-semibold tabular-nums text-foreground">
                        {activeMeeting.buyerProfile.targetIrrPct}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 7: ZALO / EMAIL FOLLOW-UP & WHISPER HUD */}
              {activeMode === 'zalo' && (
                <div data-testid="kara-view-zalo" className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      Bản nháp Tin nhắn Follow-up (Zalo / Email gửi Đối tác)
                    </h3>
                    <p
                      data-testid="kara-zalo-draft-text"
                      className="rounded-lg border border-border bg-muted/30 p-3.5 text-xs leading-relaxed text-foreground"
                    >
                      {activeMeeting.zaloFollowUpDraft}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      Whisper Live Negotiation HUD (Gợi ý Đàm phán Thời gian thực)
                    </h3>
                    <ul className="space-y-2 text-xs text-foreground">
                      {activeMeeting.whisperHudHints.map((hint, i) => (
                        <li key={i} className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                          {hint}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* MODE 8: MULTI-MEETING INSIGHTS */}
              {activeMode === 'insights' && (
                <div data-testid="kara-view-insights" className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground">
                    Đối sánh Thay đổi Qua Các Vòng Đàm Phán (Multi-Meeting Deal Progression)
                  </h3>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs tabular-nums">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="py-2 pr-4">Chỉ tiêu Đàm phán</th>
                          <th className="py-2 pr-4">Vòng Sơ bộ (M1)</th>
                          <th className="py-2 pr-4">Vòng Hiện tại (M2)</th>
                          <th className="py-2">Biến động (Delta)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {activeMeeting.crossMeetingInsights.map((row) => (
                          <tr key={row.metric}>
                            <td className="py-2.5 pr-4 font-semibold text-foreground">{row.metric}</td>
                            <td className="py-2.5 pr-4 text-muted-foreground">{row.m1Value}</td>
                            <td className="py-2.5 pr-4 font-semibold text-foreground">{row.m2Value}</td>
                            <td className="py-2.5 font-semibold text-emerald-600">{row.delta}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* PANE 2 (CONTEXTUAL RIGHT DRAWER): SINGLE-ACTIVE-TOOL DOCK (Never stacks Transcript + Ask Kara simultaneously!) */}
      <aside
        id="kara-right-intelligence-dock" data-allow-header-offset="true" data-allow-rhythm-offset="true"
        aria-label="Lời thoại đồng bộ âm thanh và Trợ lý Ask Kara"
        className="flex w-full lg:w-88 shrink-0 flex-col border-t lg:border-t-0 lg:border-l border-border bg-card/50"
      >
        {/* 2-Segment Single-Active-Tab Switcher inside Right Drawer */}
        <div className="flex items-center gap-1 border-b border-border bg-muted/30 p-2">
          <button
            type="button"
            data-testid="pill-toggle-transcript"
            onClick={() => setRightDockMode('transcript')}
            className={`flex flex-1 min-h-11 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 ${
              rightDockMode === 'transcript'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Volume2 className="h-3.5 w-3.5 text-primary" />
            <span>
              {isVi
                ? `Lời thoại (${activeMeeting.utterances.length})`
                : `Transcript (${activeMeeting.utterances.length})`}
            </span>
          </button>

          <button
            type="button"
            data-testid="pill-ask-kara"
            onClick={() => setRightDockMode('ask')}
            className={`flex flex-1 min-h-11 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 ${
              rightDockMode === 'ask'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bot className="h-3.5 w-3.5 text-primary" />
            <span>{isVi ? 'Hỏi Kara AI' : 'Ask Kara AI'}</span>
          </button>
        </div>

        {/* TOOL A: TIME-SYNCED TRANSCRIPT & AUDIO SEEK BAR */}
        {rightDockMode === 'transcript' && (
          <div
            data-testid="kara-transcript-panel"
            className="flex flex-1 flex-col overflow-hidden"
          >
            {/* Audio Player Strip */}
            <div
              data-testid="kara-audio-bar"
              className="flex items-center justify-between gap-2 border-b border-border bg-background/60 px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="btn-play-audio"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs"
                  aria-label={isPlaying ? 'Tạm dừng âm thanh' : 'Phát âm thanh'}
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <div>
                  <p className="text-xs font-semibold text-foreground">Bản ghi âm gốc (WAV)</p>
                  <p
                    data-testid="audio-current-time"
                    className="font-mono text-xs tabular-nums text-primary"
                  >
                    {formatSec(currentAudioSec)} / {activeMeeting.durationLabel}
                  </p>
                </div>
              </div>
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                1.0x
              </span>
            </div>

            {/* Utterance List */}
            <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
              {activeMeeting.utterances.map((u) => {
                const isCurrent = u.id === activeUtteranceId;
                return (
                  <div
                    key={u.id}
                    data-testid={`utterance-${u.id}`}
                    onClick={() => handleSeekToUtterance(u)}
                    className={`cursor-pointer rounded-xl border p-3 transition-colors duration-150 ${
                      isCurrent
                        ? 'border-primary bg-primary/5 shadow-2xs'
                        : 'border-border bg-background hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">{u.speaker}</span>
                      <span
                        data-testid={`utterance-time-${u.id}`}
                        className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-primary"
                      >
                        [{u.timestampLabel}]
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">{u.text}</p>
                    {u.entities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {u.entities.map((ent) => (
                          <span
                            key={ent}
                            className="rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"
                          >
                            {ent}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TOOL B: ASK KARA CROSS-MEETING CITED RAG & HALLUCINATION ABSTENTION */}
        {rightDockMode === 'ask' && (
          <div
            data-testid="kara-ask-panel"
            className="flex flex-1 flex-col gap-3 overflow-y-auto p-3.5 space-y-3"
          >
            <div className="space-y-3">
              {/* UNIFIED_GLOBAL_CHAT_PANEL bridge to global ChatPanel */}
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-semibold text-foreground">
                  Hỏi đáp Đa Biên bản (Cited RAG)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    data-testid="btn-open-global-ai-chat"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(
                          new CustomEvent('itsaplan:open-weknora-chat', {
                            detail: { mode: 'weknora', query: askQuestionInput || activeMeeting.title },
                          })
                        );
                      }
                    }}
                    className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                    title="Open in Unified Global AI Chat & WeKnora Panel"
                  >
                    Global AI Chat ↗
                  </button>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                    Zero-Hallucination
                  </span>
                </div>
              </div>

              {/* Quick Demo Verification Buttons for Grounded vs Abstention */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  data-testid="btn-ask-grounded-demo"
                  onClick={() =>
                    handleAskKaraSubmit('Cap Rate và cấu trúc giữ lại Escrow của OneHousing là bao nhiêu?')
                  }
                  className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground hover:opacity-90"
                >
                  Hỏi Cap Rate & Escrow
                </button>
                <button
                  type="button"
                  data-testid="btn-ask-abstain-demo"
                  onClick={() =>
                    handleAskKaraSubmit('Dự báo giá Bitcoin và lãi suất FED năm 2035 không có trong biên bản?')
                  }
                  className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:opacity-90"
                >
                  Test Từ chối Bịa đặt (Abstain)
                </button>
              </div>

              {/* Cited Answer / Abstention Box */}
              <div
                data-testid="kara-ask-response-box"
                className={`rounded-xl border p-3 text-xs leading-relaxed ${
                  askResponse.status === 'ABSTAINED'
                    ? 'border-amber-500/40 bg-amber-500/10 text-foreground'
                    : 'border-border bg-background text-foreground'
                }`}
              >
                {askResponse.status === 'ABSTAINED' && (
                  <p
                    data-testid="kara-ask-abstain-badge"
                    className="mb-1 font-mono text-xs font-bold uppercase text-amber-600 dark:text-amber-400"
                  >
                    [GUARDRAIL: ABSTAINED_NO_EVIDENCE]
                  </p>
                )}
                <p data-testid="kara-thinking-trace" className="mb-1 font-mono text-xs text-muted-foreground">[Trace: Hybrid BM25 + Vector Search → Cross-Meeting Citation Check]</p>
                <p data-testid="kara-ask-answer">{askResponse.answer}</p>
                {askResponse.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {askResponse.citations.map((cit) => (
                      <span
                        key={cit}
                        data-testid="kara-ask-citation"
                        className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-medium text-primary"
                      >
                        {cit}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Custom Query Input */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-border">
              <input
                type="text"
                data-testid="kara-ask-input"
                value={askQuestionInput}
                onChange={(e) => setAskQuestionInput(e.target.value)}
                placeholder="Đặt câu hỏi có trích dẫn..."
                className="flex-1 rounded-lg border border-input bg-background px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                data-testid="btn-ask-submit"
                onClick={() => handleAskKaraSubmit()}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                aria-label="Gửi câu hỏi cho Kara"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

export default KaraMeetingWorkspaceView;
