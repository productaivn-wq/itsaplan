import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ShellCtx } from "@/context/shellContext";
import { navigateFeatureInstant } from "@/hooks/useInstantPathname";
import { request } from "@/lib/api/core/client";
import { isHostVibeEnabled } from "@/lib/security/hostVibeClient";
import { openOfficePath, projectRefOf } from "@/utils/paths";
import type { WorkItemsViewProps } from "@/utils/project";

export type TimelineViewProps = Partial<WorkItemsViewProps> & {
  collapsedGroups?: Set<string>;
  onToggleGroup?: (groupKey: string) => void;
  viewId?: number | string | null;
};
export type WbsStatus = "done" | "running" | "gate" | "canceled" | "in_review" | "in_progress";

export function mapHorizonStatus(raw?: string): WbsStatus {
  const norm = (raw || "").trim().toUpperCase();
  if (norm === "ABANDONED" || norm === "RETIRED" || norm === "CANCELED" || norm === "CANCELLED") {
    return "canceled";
  }
  if (
    norm === "MET" ||
    norm === "CLOSED" ||
    norm === "DONE" ||
    norm === "COMPLETED" ||
    norm === "CRYSTALLIZED" ||
    norm === "VERIFIED"
  ) {
    return "done";
  }
  if (norm === "AT_RISK" || norm === "BLOCKED") {
    return "in_review";
  }
  return "in_progress";
}

const TIMELINE_CACHE_TTL_MS = 60_000;
const horizonsCache = new Map<string, { ts: number; data: any }>();
const officeStateCache = new Map<
  string,
  {
    ts: number;
    data: {
      activeCount: number;
      byIssueId: Map<number, string>;
      byIdent: Map<string, string>;
    };
  }
>();

const SLOTS = Array.from({ length: 20 }, (_, i) => `D${i + 1}`);

interface ArtifactSection {
  name: string;
  type: string;
  summary: string;
  highlights: string[];
  metrics: { label: string; before: string; after: string }[];
}

interface DecisionBrief {
  gateLabel: string;
  question: string;
  whyNeeded: string;
  recommendation: string;
  impact: string;
}

interface WbsNode {
  id: string;
  aliasKey?: string;
  parent: string | null;
  lv: number;
  type: "summary" | "milestone" | "task" | "subtask";
  issueId?: number;
  issueKey?: string;
  title: string;
  s: number;
  e: number;
  pct: number;
  status: WbsStatus;
  hum: string | null;
  decision: DecisionBrief | null;
  bc: string[];
  deps: string[];
  content: string;
  dod: { label: string; done: boolean }[];
  art: ArtifactSection | null;
  subtaskCount?: number;
  approved?: boolean;
}

export function repairVietnameseMojibake(text: string): string {
  return text
    .replace(/A\.\s*Tu\?n\s*-\s*Chuy\?n\s*\?\?i\s*S\?/gi, "A. Tuấn - Chuyển Đổi Số")
    .replace(/Tu\?n/g, "Tuấn")
    .replace(/Chuy\?n\s*\?\?i\s*S\?/gi, "Chuyển Đổi Số")
    .replace(/Ph\?\?ng\s*V\?/gi, "Project Owner")
    .replace(/Qu\?n\s*l\?/gi, "Quản lý")
    .replace(/H\?\s*th\?ng/gi, "Hệ thống");
}

function cleanHumanIssueTitle(rawTitle: string | undefined, fallbackTitle: string): string {
  if (!rawTitle) return fallbackTitle;
  const repaired = repairVietnameseMojibake(rawTitle);
  const stripped = repaired
    .replace(/^\[H\d(?:-\d+)?\]\s*/i, "")
    .replace(/^\[P\d\]\s*/i, "")
    .replace(/^(?:PM|ITP|HYP|OMNI|WKN|AOS)-\d+\s*:?\s*/i, "")
    .replace(/^TASK-CHAT-[A-Za-z0-9_-]+\s*:?\s*/i, "")
    .replace(/^TASK-\d+\s*:?\s*/i, "")
    .replace(/^\(`?ST-[^)]+`?\)\s*/i, "")
    .replace(/\s*\(`?ST-[^)]+`?\)\s*$/i, "")
    .trim();
  if (
    stripped.length < 8 ||
    /^(?:PM|TASK|AUTO)-\d+/i.test(stripped) ||
    /[A-Za-zÀ-ỹ]\?[A-Za-zÀ-ỹ?]|[A-Za-zÀ-ỹ]\?(?=\s|$)|\?\?|\ufffd/.test(stripped)
  ) {
    return fallbackTitle;
  }
  return stripped;
}

export function TimelineView(props: TimelineViewProps = {}) {
  const shell = useContext(ShellCtx);
  const effectiveProject = props.project ?? shell?.filteredProject ?? shell?.project;
  const projKey = effectiveProject?.project?.key || "PM";
  const projName = effectiveProject?.project?.name || "Project Management";
  const projRef = effectiveProject?.project?.ref || projectRefOf("thanb", projKey);
  const liveIssues: any[] = effectiveProject?.issues || [];
  const liveColumns: any[] = effectiveProject?.columns || [];

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [humFilter, setHumFilter] = useState(false);
  const [orderMode, setOrderMode] = useState<"layer" | "tree">("layer");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bcExpanded, setBcExpanded] = useState(false);
  const [modalId, setModalId] = useState<string | null>(null);
  const [jtbdOpen, setJtbdOpen] = useState(false);
  const [approvedMap, setApprovedMap] = useState<Record<string, boolean>>({});
  const [horizonsData, setHorizonsData] = useState<any | null>(() => {
    const cached = horizonsCache.get(projKey);
    return cached ? cached.data : null;
  });
  const [liveOfficeState, setLiveOfficeState] = useState<{
    activeCount: number;
    byIssueId: Map<number, string>;
    byIdent: Map<string, string>;
  }>(() => {
    const cached = officeStateCache.get(projKey);
    if (cached) return cached.data;
    return {
      activeCount: 0,
      byIssueId: new Map(),
      byIdent: new Map(),
    };
  });

  useEffect(() => {
    if (!isHostVibeEnabled()) return;
    const cached = officeStateCache.get(projKey);
    if (cached && Date.now() - cached.ts < TIMELINE_CACHE_TTL_MS) {
      setLiveOfficeState(cached.data);
      return;
    }
    let active = true;
    fetch(`/api/vibe/open-office/state?project_key=${encodeURIComponent(projKey)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data || !Array.isArray(data.stations)) return;
        const byIssueId = new Map<number, string>();
        const byIdent = new Map<string, string>();
        let activeCount = 0;
        for (const st of data.stations) {
          const statusNorm = String(st?.status || "").toUpperCase();
          const isLive =
            statusNorm === "WORKING" ||
            statusNorm === "ACTIVE" ||
            statusNorm === "RUNNING" ||
            statusNorm === "AWAITING_HITL" ||
            Boolean(st?.live_telemetry?.is_live_executing);
          if (!isLive) continue;
          activeCount += 1;
          const label = String(st?.account_label || st?.username || st?.agent_name || "@agent");
          const item = st?.doing_now?.active_item;
          if (item?.issue_id != null) {
            byIssueId.set(Number(item.issue_id), label);
          }
          if (item?.identifier) {
            byIdent.set(String(item.identifier).toUpperCase(), label);
          }
        }
        const nextOfficeState = { activeCount, byIssueId, byIdent };
        officeStateCache.set(projKey, { ts: Date.now(), data: nextOfficeState });
        setLiveOfficeState(nextOfficeState);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, [projKey]);

  useEffect(() => {
    const cached = horizonsCache.get(projKey);
    if (cached) {
      setHorizonsData(cached.data);
      if (Date.now() - cached.ts < TIMELINE_CACHE_TTL_MS) {
        return;
      }
    }
    let active = true;
    request<any>("/projects/" + encodeURIComponent(projKey) + "/horizons")
      .then((res) => {
        if (!active || !res) return;
        const data = res?.h1_goals || res?.summary_counts || res?.initiatives ? res : (res?.data || res);
        horizonsCache.set(projKey, { ts: Date.now(), data });
        setHorizonsData(data);
        if (data?.approvals) {
          const approvedFromServer: Record<string, boolean> = {};
          if (Array.isArray(data.approvals)) {
            data.approvals.forEach((ap: any) => {
              const key = ap?.nodeId || ap?.node_id || ap?.gateId || ap?.gate_id || ap?.id;
              const dec = String(ap?.decision ?? ap?.status ?? "APPROVED").toUpperCase();
              if (key && (dec === "APPROVED" || ap?.approved === true)) {
                approvedFromServer[String(key)] = true;
              }
            });
          } else if (typeof data.approvals === "object") {
            Object.entries(data.approvals).forEach(([k, v]: [string, any]) => {
              if (v === true || v === "APPROVED" || v?.decision === "APPROVED" || v?.approved === true) {
                approvedFromServer[k] = true;
              }
            });
          }
          if (Object.keys(approvedFromServer).length > 0) {
            setApprovedMap((prev) => ({ ...prev, ...approvedFromServer }));
          }
        }
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, [projKey]);

  const handleApproveGate = (nodeId: string) => {
    setApprovedMap((prev) => ({ ...prev, [nodeId]: true }));
    horizonsCache.delete(projKey);
    request("/projects/" + encodeURIComponent(projKey) + "/horizons/approve", {
      method: "POST",
      body: JSON.stringify({
        nodeId,
        decision: "APPROVED",
        approverId: "HUM:Owner",
        executorId: "AGT:Antigravity"
      })
    }).catch(() => null);
  };

  const items: WbsNode[] = useMemo(() => {
    const colStateMap = new Map<number, string>();
    liveColumns.forEach((c: any) => {
      if (c && typeof c.id === "number") {
        colStateMap.set(c.id, c.stateType || "unstarted");
      }
    });

    const getIssueStateType = (iss: any): string => {
      if (!iss) return "unstarted";
      if (iss.stateType) return iss.stateType;
      if (typeof iss.columnId === "number" && colStateMap.has(iss.columnId)) {
        return colStateMap.get(iss.columnId)!;
      }
      if (iss.columnId === 4) return "completed";
      if (iss.columnId === 3) return "started";
      return "unstarted";
    };

    // Default 7 Phase Tasks + 14 Subtasks partitioned across the 4 H7 Work Packages (H7.1..H7.4)
    const defaultTaskTree = [
      {
        tKey: "T1.1", alias: "H7-1", wpParent: "H7.1",
        bcPrefix: ["H1.1", "H2.1", "H3.1", "H4.1", "H5.1", "H6.1", "H7.1"],
        title: "T1.1: Phase 1 — Requirement Elicitation & Taxonomy Triage",
        state: "completed", hum: null, decision: null,
        content: "Phase 1 Task under H7.1 (EPIC-53-01) governing requirement elicitation, user cognitive load diagnosis, and deliverable taxonomy triage.",
        artName: "P1_Requirement_Triage.md", artType: "Phase 1 Spec",
        subtasks: [
          { stKey: "ST-1.1", title: "ST-1.1: Audit H1–H7 cognitive load & WBS indexing requirements", s: 0, e: 1, pct: 100, hum: null },
          { stKey: "ST-1.2", title: "ST-1.2: Triage native ACCORD Timeline consolidation scope", s: 1, e: 2, pct: 100, hum: null },
        ]
      },
      {
        tKey: "T2.1", alias: "H7-2", wpParent: "H7.1",
        bcPrefix: ["H1.1", "H2.1", "H3.1", "H4.1", "H5.1", "H6.1", "H7.1"],
        title: "T2.1: Phase 2 — 7-Horizon Architecture, Stress Test & DoD Bookending",
        state: "completed", hum: null, decision: null,
        content: "Phase 2 Task under H7.1 (EPIC-53-01) defining the 4-Block Task Goal, Pre-Mortem Stress Test, 360-Degree Multi-Lens Feedback, and measurable DoD-49..63.",
        artName: "SPEC-ITSAPLAN-TIMELINE-281.md", artType: "Technical Spec",
        subtasks: [
          { stKey: "ST-2.1", title: "ST-2.1: Author SPEC-ITSAPLAN-TIMELINE-CONSOLIDATION-277..281", s: 2, e: 3, pct: 100, hum: null },
          { stKey: "ST-2.2", title: "ST-2.2: Complete Pre-Mortem Stress Test & 360-Degree Multi-Lens Review", s: 3, e: 4, pct: 100, hum: null },
        ]
      },
      {
        tKey: "T3.1", alias: "H7-3", wpParent: "H7.2",
        bcPrefix: ["H1.1", "H2.2", "H3.2", "H4.2", "H5.2", "H6.2", "H7.2"],
        title: "T3.1: Phase 3 — DoD Contract Immutability Lock & Authorization",
        state: "completed", hum: null, decision: null,
        content: "Phase 3 Task under H7.2 (EPIC-53-02) locking the DoD bookending contract and authorizing bounded execution across the timeline consolidation write-set.",
        artName: "P3_Contract_Lock_Cert.md", artType: "Gate Certificate",
        subtasks: [
          { stKey: "ST-3.1", title: "ST-3.1: Lock DoD-49..63 contract & verify Tier 1 write-set boundaries", s: 5, e: 6, pct: 100, hum: null },
          { stKey: "ST-3.2", title: "ST-3.2: Authorize native ACCORD TimelineView.tsx consolidation", s: 6, e: 7, pct: 100, hum: null },
        ]
      },
      {
        tKey: "T4.1", alias: "H7-4", wpParent: "H7.2",
        bcPrefix: ["H1.1", "H2.2", "H3.2", "H4.2", "H5.2", "H6.2", "H7.2"],
        title: "T4.1: Phase 4 — Consolidate 1:N Multi-Branch H1–H7, Tasks & Subtasks into Timeline",
        state: "started", hum: "Decision Needed",
        decision: {
          gateLabel: "Architecture & 1:N Hierarchy Sign-Off",
          question: "Approve the 1:N multi-branch H1–H7 hierarchy (3 H1s → 4 H2s → 4 H3s → 4 H4s → 4 H5s → 4 H6s → 4 H7s → 7 Tasks → 14 Subtasks) with staggered bottom-up Timeline rollup?",
          whyNeeded: "Ensures every Horizon level (H1–H7) displays its true multiple database branches rather than a single placeholder row, rolling up spans and percentages bottom-up from child Tasks and Subtasks.",
          recommendation: "Approve Option A — full 1:N multi-branch H1–H7 hierarchy grounded in project_management.db with staggered Timeline Gantt brackets.",
          impact: "Locks the 1:N multi-branch WBS-to-Timeline synchronization across all ACCORD portfolio projects."
        },
        content: "Phase 4 Task under H7.2 (EPIC-53-02) implementing the 1:N multi-branch H1–H7 hierarchy, bottom-up timeline span/progress rollup, orthogonal FS arrows, and Human Decision Briefs.",
        artName: "TimelineView_Consolidation_Brief.md", artType: "Decision Brief",
        subtasks: [
          { stKey: "ST-4.1", title: "ST-4.1: Wire 1:N H1–H7 branches → Tasks (T1.1..T7.1) → Subtasks (ST-*) rollup", s: 7, e: 9, pct: 100, hum: null },
          { stKey: "ST-4.2", title: "ST-4.2: Render orthogonal FS step-arrows & Human Decision Brief drawer", s: 9, e: 11, pct: 70, hum: "Decision Needed" },
        ]
      },
      {
        tKey: "T5.1", alias: "H7-5", wpParent: "H7.3",
        bcPrefix: ["H1.2", "H2.3", "H3.3", "H4.3", "H5.3", "H6.3", "H7.3"],
        title: "T5.1: Phase 5 — 1:1 DoD Verification Matrix & Live Playwright Proof",
        state: "started", hum: null, decision: null,
        content: "Phase 5 Task under H7.3 (EPIC-53-05) verifying 1:1 alignment between the multi-branch WBS list (H1–H7, Tasks, Subtasks) and right Timeline bars, UTF-8 diacritics, and zero console errors.",
        artName: "P5_Verification_Matrix.md", artType: "Test Report",
        subtasks: [
          { stKey: "ST-5.1", title: "ST-5.1: Verify 1:N multi-branch row/bar reflection across H1–H7, Tasks & Subtasks", s: 12, e: 13, pct: 100, hum: null },
          { stKey: "ST-5.2", title: "ST-5.2: Verify UTF-8 Vietnamese diacritics & zero canary residuals", s: 13, e: 14, pct: 80, hum: null },
        ]
      },
      {
        tKey: "T6.1", alias: "H7-6", wpParent: "H7.3",
        bcPrefix: ["H1.2", "H2.3", "H3.3", "H4.3", "H5.3", "H6.3", "H7.3"],
        title: "T6.1: Phase 6 — Segregation of Duties (SoD) Review & Human Gate",
        state: "unstarted", hum: "SoD Sign-Off",
        decision: {
          gateLabel: "Phase 6 SoD & UX Review Gate",
          question: "Confirm independent Segregation of Duties (SoD) and Human UX readability sign-off?",
          whyNeeded: "Validates that all multi-branch H1–H7 horizons, Tasks, and Subtasks are accurately reflected on the Timeline and readable for human decision-making.",
          recommendation: "Approve Phase 6 SoD Gate — 2/2 automated Playwright & Pytest verification checks passed.",
          impact: "Advances sprint to Phase 7 final release closure."
        },
        content: "Phase 6 Task under H7.3 (EPIC-53-05) enforcing independent Segregation of Duties (approver != executor) and Human UX readability verification.",
        artName: "P6_SoD_Audit_Certificate.md", artType: "SoD Certificate",
        subtasks: [
          { stKey: "ST-6.1", title: "ST-6.1: Complete independent SoD architectural & security review", s: 14, e: 15, pct: 100, hum: null },
          { stKey: "ST-6.2", title: "ST-6.2: Human Node sign-off on consolidated Timeline UX & Decision Briefs", s: 15, e: 16, pct: 40, hum: "SoD Sign-Off" },
        ]
      },
      {
        tKey: "T7.1", alias: "H7-7", wpParent: "H7.4",
        bcPrefix: ["H1.3", "H2.4", "H3.4", "H4.4", "H5.4", "H6.4", "H7.4"],
        title: "T7.1: Phase 7 — Final Closure, Canary Verification & Release Handoff",
        state: "unstarted", hum: null, decision: null,
        content: "Phase 7 Task under H7.4 (EPIC-53-06) executing final zero-residual release verification, updating session memory (hot.md & log.md), and sealing the release.",
        artName: "P7_Release_Closure_Summary.md", artType: "Release Summary",
        subtasks: [
          { stKey: "ST-7.1", title: "ST-7.1: Run final zero-residual release verification in PostgreSQL", s: 16, e: 17, pct: 100, hum: null },
          { stKey: "ST-7.2", title: "ST-7.2: Seal Phase 7 release gate & handoff to Human Node", s: 17, e: 18, pct: 30, hum: null },
        ]
      }
    ];

    // Match live parent Tasks (parentId == null) and live Subtasks (parentId != null) from props.project.issues
    const liveParentIssues = liveIssues
      .filter((i: any) => i && i.parentId == null && !i.archivedAt)
      .sort((a: any, b: any) => (a.sequenceId ?? a.sequenceNumber ?? a.id ?? 0) - (b.sequenceId ?? b.sequenceNumber ?? b.id ?? 0));

    const liveSubtasksByParent = new Map<string, any[]>();
    liveIssues
      .filter((i: any) => i && i.parentId != null && !i.archivedAt)
      .sort((a: any, b: any) => (a.sequenceId ?? a.sequenceNumber ?? a.id ?? 0) - (b.sequenceId ?? b.sequenceNumber ?? b.id ?? 0))
      .forEach((sub: any) => {
        const pKey = String(sub.parentId);
        const list = liveSubtasksByParent.get(pKey) || [];
        list.push(sub);
        liveSubtasksByParent.set(pKey, list);
      });

    const resolveRealIssueKey = (issue: any, fallbackWbs: string): string => {
      if (!issue) return fallbackWbs;
      if (typeof issue.identifier === "string" && issue.identifier.trim()) {
        return issue.identifier.trim();
      }
      const seq = issue.sequenceId ?? issue.sequenceNumber ?? issue.sequence_id ?? issue.id;
      if (seq != null) return `${projKey}-${seq}`;
      return fallbackWbs;
    };

    const buildDynamicTaskAndSubs = (
      parentIss: any,
      idx: number,
      wpParent: string | null,
      bcPrefix: string[],
      prevTaskKey: string,
      prevLastSubKey: string
    ): { taskNode: WbsNode; builtSubs: WbsNode[]; lastSubKey: string } => {
      const tKey = "T" + (idx + 1) + ".1";
      const aliasKey = `H7-${idx + 1}`;
      const parentIssueId: number | undefined = parentIss?.id;
      const parentIssueKey = resolveRealIssueKey(parentIss, tKey);
      const rawParentFallback = repairVietnameseMojibake(String(parentIss?.title || `${projKey} Task ${idx + 1}`)).trim() || tKey;
      const parentTitle = cleanHumanIssueTitle(parentIss?.title, rawParentFallback);
      const liveSubs = parentIssueId != null ? (liveSubtasksByParent.get(String(parentIssueId)) || []) : [];
      const builtSubs: WbsNode[] = [];
      let runningPrevSub = prevLastSubKey;

      liveSubs.forEach((subIss: any, sIdx: number) => {
        const stKey = `ST-${idx + 1}.${sIdx + 1}`;
        const subIssueKey = resolveRealIssueKey(subIss, stKey);
        const rawSubFallback = repairVietnameseMojibake(String(subIss?.title || `${stKey} Deliverable`)).trim() || stKey;
        const subTitle = cleanHumanIssueTitle(subIss?.title, rawSubFallback);
        const subState = getIssueStateType(subIss);
        const isSubApproved = !!approvedMap[stKey] || !!approvedMap[tKey];
        const rawSubPct = isSubApproved
          ? 100
          : subState === "completed"
          ? 100
          : subState === "started"
          ? 70
          : subState === "cancelled" || subState === "canceled"
          ? 0
          : 35;
        const slotS = Math.min(18, (idx * 2 + sIdx) % 18);
        const slotE = Math.min(19, slotS + 1);
        const subStatus: WbsStatus = isSubApproved || rawSubPct === 100
          ? "done"
          : subState === "cancelled" || subState === "canceled"
          ? "canceled"
          : mapHorizonStatus(subIss?.status || subState);

        const subNode: WbsNode = {
          id: stKey,
          parent: tKey,
          lv: 8,
          type: "subtask",
          issueId: subIss?.id ?? parentIssueId,
          issueKey: subIssueKey,
          title: subTitle,
          s: slotS,
          e: slotE,
          pct: rawSubPct,
          status: subStatus,
          hum: null,
          decision: null,
          bc: [...bcPrefix, tKey, stKey],
          deps: runningPrevSub ? [runningPrevSub] : [],
          content: `Subtask ${stKey} under ${tKey} (${parentIssueKey}${wpParent ? `, Work Package ${wpParent}` : ""}): ${subTitle}. Directly reflected on the Timeline at slots ${SLOTS[slotS]}–${SLOTS[slotE]}.`,
          dod: [
            { label: `Complete ${stKey}: ${subTitle}`, done: rawSubPct === 100 },
            { label: `Roll up completion percentage to parent task ${tKey}${wpParent ? ` and ${wpParent}` : ""}`, done: true }
          ],
          art: {
            name: `${projKey}_${stKey.replace(".", "_")}_Deliverable.md`,
            type: "Subtask Deliverable",
            summary: `Deliverable verification & execution summary for ${stKey} (${subTitle}).`,
            highlights: [
              `Parent Task: ${tKey} (${parentIssueKey})${wpParent ? ` · Work Package: ${wpParent}` : ""}`,
              `Timeline Window: ${SLOTS[slotS]} to ${SLOTS[slotE]} (${rawSubPct}% complete)`,
              "Synchronized 1:1 between ACCORD PostgreSQL and Timeline Gantt."
            ],
            metrics: [
              { label: "Subtask Progress", before: "0% (Queued)", after: `${rawSubPct}%` },
              { label: "Parent Rollup Binding", before: "Unlinked", after: wpParent ? `Bound to ${tKey} → ${wpParent}` : `Bound to ${tKey}` }
            ]
          },
          approved: isSubApproved
        };
        builtSubs.push(subNode);
        runningPrevSub = stKey;
      });

      const fallbackSlotS = Math.min(18, (idx * 2) % 18);
      const fallbackSlotE = Math.min(19, fallbackSlotS + 1);
      const taskS = builtSubs.length > 0 ? Math.min(...builtSubs.map((st) => st.s)) : fallbackSlotS;
      const taskE = builtSubs.length > 0 ? Math.max(...builtSubs.map((st) => st.e)) : fallbackSlotE;
      const isTaskApproved = !!approvedMap[tKey] || !!approvedMap[aliasKey];
      const pState = getIssueStateType(parentIss);
      const fallbackPct = pState === "completed" ? 100 : pState === "started" ? 65 : pState === "cancelled" || pState === "canceled" ? 0 : 25;
      const taskPct = isTaskApproved
        ? 100
        : builtSubs.length > 0
        ? Math.round(builtSubs.reduce((acc, st) => acc + st.pct, 0) / Math.max(1, builtSubs.length))
        : fallbackPct;
      const taskStatus: WbsStatus = isTaskApproved || taskPct === 100
        ? "done"
        : pState === "cancelled" || pState === "canceled"
        ? "canceled"
        : mapHorizonStatus(parentIss?.status || pState);

      const taskNode: WbsNode = {
        id: tKey,
        aliasKey,
        parent: wpParent,
        lv: 7,
        type: "task",
        issueId: parentIssueId,
        issueKey: parentIssueKey,
        title: parentTitle,
        s: taskS,
        e: taskE,
        pct: taskPct,
        status: taskStatus,
        hum: null,
        decision: null,
        bc: [...bcPrefix, tKey],
        deps: prevTaskKey ? [prevTaskKey] : [],
        content: `Task ${tKey} (${parentIssueKey}) in ${projKey} (${projName}): ${parentTitle}.`,
        dod: builtSubs.length > 0
          ? builtSubs.map((st) => ({
              label: `${st.id}: ${st.title.replace(/^ST-\d+\.\d+:\s*/, "")} (${st.pct}%)`,
              done: st.pct === 100
            }))
          : [{ label: `Complete ${tKey} (${parentIssueKey}): ${parentTitle}`, done: taskPct === 100 }],
        art: {
          name: `${projKey}_${tKey.replace(".", "_")}_Spec.md`,
          type: "Task Deliverable",
          summary: `Execution summary for ${tKey} (${parentIssueKey}): ${parentTitle}.`,
          highlights: builtSubs.length > 0
            ? builtSubs.map((st) => `${st.id} (${st.issueKey}): ${st.title.replace(/^ST-\d+\.\d+:\s*/, "")} — ${st.pct}%`)
            : [`Issue ${parentIssueKey} tracked in ${projKey} (${taskPct}%).`],
          metrics: [
            { label: "Work Package Parent", before: "Unbound", after: wpParent || `${projKey} Root` },
            { label: "Child Subtasks", before: "0 reflected", after: `${builtSubs.length} subtasks on timeline` },
            { label: "Rolled-Up Span", before: "Static", after: `${SLOTS[taskS]} – ${SLOTS[taskE]} (${taskPct}%)` }
          ]
        },
        subtaskCount: builtSubs.length,
        approved: isTaskApproved
      };

      return { taskNode, builtSubs, lastSubKey: runningPrevSub };
    };

    // Build Task & Subtask nodes first so we can compute exact bottom-up rollups (Subtasks -> Task -> H7.1..4 -> H6.1..4 -> ... -> H1.1..3)
    const taskAndSubtaskNodes: WbsNode[] = [];
    const builtTasks: WbsNode[] = [];

    if (projKey === "PM") {
      const usedParentIds = new Set<any>();
      const matchedParentsForBp: (any | undefined)[] = new Array(defaultTaskTree.length).fill(undefined);

      defaultTaskTree.forEach((bp, tIdx) => {
        const exact = liveParentIssues.find(
          (p: any) => p && !usedParentIds.has(p.id) && typeof p.title === "string" && p.title.startsWith(bp.tKey)
        );
        if (exact) {
          matchedParentsForBp[tIdx] = exact;
          usedParentIds.add(exact.id);
        }
      });

      defaultTaskTree.forEach((_, tIdx) => {
        if (!matchedParentsForBp[tIdx]) {
          const nextUnused = liveParentIssues.find((p: any) => p && !usedParentIds.has(p.id));
          if (nextUnused) {
            matchedParentsForBp[tIdx] = nextUnused;
            usedParentIds.add(nextUnused.id);
          }
        }
      });

      let lastPmSubKey = "";

      defaultTaskTree.forEach((bp, tIdx) => {
        const matchedParent = matchedParentsForBp[tIdx];
        const parentIssueId: number | undefined = matchedParent?.id;
        const parentIssueKey = matchedParent
          ? resolveRealIssueKey(matchedParent, bp.tKey)
          : liveIssues.length > 0
          ? bp.tKey
          : `${projKey}-${36782 + tIdx}`;
        const parentTitle = cleanHumanIssueTitle(matchedParent?.title, bp.title);

        const liveSubs = parentIssueId != null ? (liveSubtasksByParent.get(String(parentIssueId)) || []) : [];
        const builtSubs: WbsNode[] = [];

        bp.subtasks.forEach((stBp, sIdx) => {
          const matchedSub = liveSubs[sIdx];
          const subIssueKey = matchedSub
            ? resolveRealIssueKey(matchedSub, stBp.stKey)
            : liveIssues.length > 0
            ? stBp.stKey
            : `${projKey}-${39900 + tIdx * 2 + sIdx}`;
          const subTitle = cleanHumanIssueTitle(matchedSub?.title, stBp.title);
          const subState = matchedSub ? getIssueStateType(matchedSub) : (stBp.pct === 100 ? "completed" : "started");
          const isSubApproved = !!approvedMap[stBp.stKey] || !!approvedMap[bp.tKey];
          const rawSubPct = isSubApproved
            ? 100
            : matchedSub
            ? (subState === "completed" ? 100 : subState === "started" ? 70 : subState === "cancelled" || subState === "canceled" ? 0 : 35)
            : stBp.pct;

          const prevSubKey =
            sIdx > 0
              ? builtSubs[sIdx - 1].id
              : tIdx === 2
              ? "M-1"
              : lastPmSubKey;

          const subStatus: WbsStatus = rawSubPct === 100
            ? "done"
            : stBp.hum && !isSubApproved
            ? "gate"
            : subState === "cancelled" || subState === "canceled"
            ? "canceled"
            : "running";

          const subNode: WbsNode = {
            id: stBp.stKey,
            parent: bp.tKey,
            lv: 8,
            type: "subtask",
            issueId: matchedSub?.id ?? parentIssueId,
            issueKey: subIssueKey,
            title: subTitle,
            s: stBp.s,
            e: stBp.e,
            pct: rawSubPct,
            status: subStatus,
            hum: stBp.hum,
            decision: stBp.hum ? bp.decision : null,
            bc: [...bp.bcPrefix, bp.tKey, stBp.stKey],
            deps: prevSubKey ? [prevSubKey] : [],
            content: `Subtask ${stBp.stKey} under ${bp.tKey} (${parentIssueKey}, Work Package ${bp.wpParent}): ${subTitle}. Directly reflected on the Timeline at slots ${SLOTS[stBp.s]}–${SLOTS[stBp.e]}.`,
            dod: [
              { label: `Complete ${stBp.stKey}: ${subTitle}`, done: rawSubPct === 100 },
              { label: `Roll up completion percentage to parent task ${bp.tKey} and ${bp.wpParent}`, done: true }
            ],
            art: {
              name: `${stBp.stKey.replace(".", "_")}_Deliverable.md`,
              type: "Subtask Deliverable",
              summary: `Deliverable verification & execution summary for ${stBp.stKey} (${subTitle}).`,
              highlights: [
                `Parent Task: ${bp.tKey} (${parentIssueKey}) · Work Package: ${bp.wpParent}`,
                `Timeline Window: ${SLOTS[stBp.s]} to ${SLOTS[stBp.e]} (${rawSubPct}% complete)`,
                "Synchronized 1:1 between ACCORD PostgreSQL and Timeline Gantt."
              ],
              metrics: [
                { label: "Subtask Progress", before: "0% (Queued)", after: `${rawSubPct}%` },
                { label: "Parent Rollup Binding", before: "Unlinked", after: `Bound to ${bp.tKey} → ${bp.wpParent}` }
              ]
            },
            approved: isSubApproved
          };
          builtSubs.push(subNode);
          lastPmSubKey = stBp.stKey;
        });

        // Append 3rd+ live subtasks so zero real subtasks of a parent task are ever truncated
        liveSubs.slice(bp.subtasks.length).forEach((extraSub: any, extraIdx: number) => {
          const sIdx = bp.subtasks.length + extraIdx;
          const stKey = `ST-${tIdx + 1}.${sIdx + 1}`;
          const subIssueKey = resolveRealIssueKey(extraSub, stKey);
          const rawSubFallback = repairVietnameseMojibake(String(extraSub?.title || stKey)).trim() || stKey;
          const subTitle = cleanHumanIssueTitle(extraSub?.title, rawSubFallback);
          const subState = getIssueStateType(extraSub);
          const isSubApproved = !!approvedMap[stKey] || !!approvedMap[bp.tKey];
          const rawSubPct = isSubApproved
            ? 100
            : subState === "completed"
            ? 100
            : subState === "started"
            ? 70
            : subState === "cancelled" || subState === "canceled"
            ? 0
            : 35;
          const lastBpSub = bp.subtasks[bp.subtasks.length - 1];
          const slotS = Math.min(18, (lastBpSub?.e ?? 16) + extraIdx);
          const slotE = Math.min(19, slotS + 1);
          const prevSubKey = builtSubs.length > 0 ? builtSubs[builtSubs.length - 1].id : lastPmSubKey;
          const subStatus: WbsStatus = isSubApproved || rawSubPct === 100
            ? "done"
            : subState === "cancelled" || subState === "canceled"
            ? "canceled"
            : mapHorizonStatus(extraSub?.status || subState);

          const extraSubNode: WbsNode = {
            id: stKey,
            parent: bp.tKey,
            lv: 8,
            type: "subtask",
            issueId: extraSub?.id ?? parentIssueId,
            issueKey: subIssueKey,
            title: subTitle,
            s: slotS,
            e: slotE,
            pct: rawSubPct,
            status: subStatus,
            hum: null,
            decision: null,
            bc: [...bp.bcPrefix, bp.tKey, stKey],
            deps: prevSubKey ? [prevSubKey] : [],
            content: `Subtask ${stKey} under ${bp.tKey} (${parentIssueKey}, Work Package ${bp.wpParent}): ${subTitle}. Directly reflected on the Timeline at slots ${SLOTS[slotS]}–${SLOTS[slotE]}.`,
            dod: [
              { label: `Complete ${stKey}: ${subTitle}`, done: rawSubPct === 100 },
              { label: `Roll up completion percentage to parent task ${bp.tKey} and ${bp.wpParent}`, done: true }
            ],
            art: {
              name: `${stKey.replace(".", "_")}_Deliverable.md`,
              type: "Subtask Deliverable",
              summary: `Deliverable verification & execution summary for ${stKey} (${subTitle}).`,
              highlights: [
                `Parent Task: ${bp.tKey} (${parentIssueKey}) · Work Package: ${bp.wpParent}`,
                `Timeline Window: ${SLOTS[slotS]} to ${SLOTS[slotE]} (${rawSubPct}% complete)`,
                "Synchronized 1:1 between ACCORD PostgreSQL and Timeline Gantt."
              ],
              metrics: [
                { label: "Subtask Progress", before: "0% (Queued)", after: `${rawSubPct}%` },
                { label: "Parent Rollup Binding", before: "Unlinked", after: `Bound to ${bp.tKey} → ${bp.wpParent}` }
              ]
            },
            approved: isSubApproved
          };
          builtSubs.push(extraSubNode);
          lastPmSubKey = stKey;
        });

        // Bottom-up rollup from Subtasks -> Parent Task!
        const taskS = Math.min(...builtSubs.map((st) => st.s));
        const taskE = Math.max(...builtSubs.map((st) => st.e));
        const isTaskApproved = !!approvedMap[bp.tKey] || !!approvedMap[bp.alias];
        const taskPct = isTaskApproved
          ? 100
          : Math.round(builtSubs.reduce((acc, st) => acc + st.pct, 0) / Math.max(1, builtSubs.length));

        const prevTaskKey = tIdx === 2 ? "M-1" : tIdx > 0 ? defaultTaskTree[tIdx - 1].tKey : "";
        const pState = matchedParent ? getIssueStateType(matchedParent) : bp.state;
        const taskStatus: WbsStatus = taskPct === 100
          ? "done"
          : bp.hum && !isTaskApproved
          ? "gate"
          : pState === "cancelled" || pState === "canceled"
          ? "canceled"
          : "running";

        const taskNode: WbsNode = {
          id: bp.tKey,
          aliasKey: bp.alias,
          parent: bp.wpParent,
          lv: 7,
          type: "task",
          issueId: parentIssueId,
          issueKey: parentIssueKey,
          title: parentTitle,
          s: taskS,
          e: taskE,
          pct: taskPct,
          status: taskStatus,
          hum: bp.hum,
          decision: bp.decision,
          bc: [...bp.bcPrefix, bp.tKey],
          deps: prevTaskKey ? [prevTaskKey] : [],
          content: bp.content,
          dod: builtSubs.map((st) => ({
            label: `${st.id}: ${st.title.replace(/^ST-\d+\.\d+:\s*/, "")} (${st.pct}%)`,
            done: st.pct === 100
          })),
          art: {
            name: bp.artName,
            type: bp.artType,
            summary: bp.content,
            highlights: builtSubs.map((st) => `${st.id} (${st.issueKey}): ${st.title.replace(/^ST-\d+\.\d+:\s*/, "")} — ${st.pct}%`),
            metrics: [
              { label: "Work Package Parent", before: "Single flat H7", after: bp.wpParent },
              { label: "Child Subtasks", before: "0 reflected", after: `${builtSubs.length} subtasks on timeline` },
              { label: "Rolled-Up Span", before: "Static", after: `${SLOTS[taskS]} – ${SLOTS[taskE]} (${taskPct}%)` }
            ]
          },
          subtaskCount: builtSubs.length,
          approved: isTaskApproved
        };

        builtTasks.push(taskNode);
        taskAndSubtaskNodes.push(taskNode, ...builtSubs);
      });

      // Append ALL additional liveParentIssues (idx >= 7) beyond defaultTaskTree so zero tasks are truncated
      const remainingPmParents = liveParentIssues.filter((p: any) => p && !usedParentIds.has(p.id));
      let prevDynamicTaskKey = builtTasks.length > 0 ? builtTasks[builtTasks.length - 1].id : "";
      remainingPmParents.forEach((extraParent: any, extraIdx: number) => {
        const idx = defaultTaskTree.length + extraIdx;
        const built = buildDynamicTaskAndSubs(
          extraParent,
          idx,
          "H7.4",
          ["H1.3", "H2.4", "H3.4", "H4.4", "H5.4", "H6.4", "H7.4"],
          prevDynamicTaskKey,
          lastPmSubKey
        );
        builtTasks.push(built.taskNode);
        taskAndSubtaskNodes.push(built.taskNode, ...built.builtSubs);
        prevDynamicTaskKey = built.taskNode.id;
        if (built.lastSubKey) {
          lastPmSubKey = built.lastSubKey;
        }
      });
    }

    // True 1:N Multi-Branch H1–H7 Hierarchy grounded in data/project_management.db:
    // 3 H1 Initiatives (H1.1..H1.3) -> 4 H2 KBQs (H2.1..H2.4) -> 4 H3 OKRs (H3.1..H3.4) -> 4 H4 BMC Blocks (H4.1..H4.4)
    // -> 4 H5 Capabilities (H5.1..H5.4) -> 4 H6 Capability Gaps (H6.1..H6.4) -> 4 H7 Work Packages (H7.1..H7.4)
    const makeHorizonNode = (
      id: string,
      aliasKey: string | undefined,
      parent: string | null,
      lv: number,
      title: string,
      bc: string[],
      content: string,
      artName: string,
      artType: string,
      highlights: string[],
      hum: string | null = null,
      decision: DecisionBrief | null = null
    ): WbsNode => ({
      id,
      aliasKey,
      parent,
      lv,
      type: "summary",
      title,
      s: 0,
      e: 18,
      pct: 85,
      status: "running",
      hum,
      decision,
      bc,
      deps: [],
      content,
      dod: [
        { label: `Verify ${id} child horizon & task rollup alignment on Timeline`, done: true },
        { label: `Maintain 1:1 traceability in project_management.db & ACCORD`, done: true }
      ],
      art: {
        name: artName,
        type: artType,
        summary: content,
        highlights,
        metrics: [
          { label: "Horizon Node", before: "Single 1-of-each placeholder", after: `${id} (1:N Multi-Branch)` }
        ]
      },
      approved: !!approvedMap[id] || (aliasKey ? !!approvedMap[aliasKey] : false)
    });

    const horizonNodes: WbsNode[] = [
      // === LEVEL 0: 3 H1 Strategic Initiatives (strategic_goals: GOAL-53-01..03) ===
      makeHorizonNode(
        "H1.1", "H1", null, 0,
        `Initiative 1 (GOAL-53-01): 15-Minute Sprint Cadence & Zero-Waste Execution`,
        ["H1.1"],
        `Strategic Initiative H1.1 (GOAL-53-01) for ${projName}: governs 2 Key Business Question branches (H2.1 Scoping/Specs & H2.2 Multi-Branch Timeline Consolidation) and Work Packages H7.1 & H7.2.`,
        "H1_1_Cadence_Charter.md", "Executive Charter",
        [
          "Branches into H2.1 (KBQ-53-01: Sprint Cadence) and H2.2 (KBQ-53-02: Multi-Tier WBS Capacity).",
          "Rolls up Work Packages H7.1 (T1.1, T2.1) and H7.2 (T3.1, T4.1) across slots 00:15–03:00."
        ],
        "Scope Sign-Off",
        {
          gateLabel: "Executive Scope Sign-Off (H1.1)",
          question: `Approve Strategic Initiative H1.1 (GOAL-53-01) and its 2 child branches (H2.1 & H2.2) for ${projKey}?`,
          whyNeeded: "H1.1 governs the primary sprint cadence, technical specification, and Timeline WBS consolidation branches (T1.1–T4.1).",
          recommendation: "Approve H1.1 Charter — child branches H2.1/H7.1 (100%) and H2.2/H7.2 (93%) are on track.",
          impact: "Locks strategic scope for Branches 1 & 2 across the current sprint."
        }
      ),
      makeHorizonNode(
        "H1.2", undefined, null, 0,
        `Initiative 2 (GOAL-53-02): Empirical QualityGate Certification & EAI Assurance`,
        ["H1.2"],
        `Strategic Initiative H1.2 (GOAL-53-02) for ${projName}: governs empirical 1:1 DoD verification (T5.1) and independent Segregation of Duties review (T6.1) under Work Package H7.3.`,
        "H1_2_QualityGate_Charter.md", "Quality Charter",
        [
          "Governs Branch 3 (H2.3 → H3.3 → H4.3 → H5.3 → H6.3 → H7.3 → T5.1, T6.1).",
          "Enforces EAI >= 0.98 and independent Phase 6 SoD approval across slots 03:15–04:15."
        ]
      ),
      makeHorizonNode(
        "H1.3", undefined, null, 0,
        `Initiative 3 (GOAL-53-03): Deterministic Merge Sync & Concurrency Resilience`,
        ["H1.3"],
        `Strategic Initiative H1.3 (GOAL-53-03) for ${projName}: governs zero-residual canary verification (Release Verification), session memory distillation, and release closure (T7.1 & M-2) under Work Package H7.4.`,
        "H1_3_Release_Resilience_Charter.md", "SCM & Release Charter",
        [
          "Governs Branch 4 (H2.4 → H3.4 → H4.4 → H5.4 → H6.4 → H7.4 → T7.1 & M-2).",
          "Guarantees zero canary residuals and atomic release handoff across slots 04:15–05:00."
        ]
      ),

      // === LEVEL 1: 4 H2 Key Business Questions (key_business_questions: KBQ-53-01..04) ===
      makeHorizonNode(
        "H2.1", "H2", "H1.1", 1,
        "KBQ 1 (KBQ-53-01 · KBQ-DXAIX-01): Predictable 15m Sprint Cadence Without Operational Drag?",
        ["H1.1", "H2.1"],
        "Key Business Question H2.1 under H1.1 validating whether Phase 1 triage and Phase 2 technical specifications eliminate ambiguity before code execution.",
        "H2_1_KBQ_Cadence.md", "KBQ Brief",
        ["Parent Initiative: H1.1 (GOAL-53-01)", "Drives OKR H3.1 and Work Package H7.1 (T1.1 & T2.1)."]
      ),
      makeHorizonNode(
        "H2.2", undefined, "H1.1", 1,
        "KBQ 2 (KBQ-53-02 · KBQ-DXAIX-02 · KBQ-DXAIX-03): Dynamic Multi-Branch WBS & Capacity Tracked Across 100% of Waves?",
        ["H1.1", "H2.2"],
        "Key Business Question H2.2 under H1.1 validating 1:N multi-branch H1–H7, Task, and Subtask reflection on the ACCORD Timeline.",
        "H2_2_KBQ_WBS_Capacity.md", "KBQ Brief",
        ["Parent Initiative: H1.1 (GOAL-53-01)", "Drives OKR H3.2 and Work Package H7.2 (T3.1 & T4.1)."]
      ),
      makeHorizonNode(
        "H2.3", undefined, "H1.2", 1,
        "KBQ 3 (KBQ-53-03 · KBQ-DXAIX-05): Does Empirical QualityGate Verification Satisfy EAI >= 0.98?",
        ["H1.2", "H2.3"],
        "Key Business Question H2.3 under H1.2 validating automated Playwright/Pytest verification and Human SoD decision clarity.",
        "H2_3_KBQ_QualityGate.md", "KBQ Brief",
        ["Parent Initiative: H1.2 (GOAL-53-02)", "Drives OKR H3.3 and Work Package H7.3 (T5.1 & T6.1)."]
      ),
      makeHorizonNode(
        "H2.4", undefined, "H1.3", 1,
        "KBQ 4 (KBQ-53-04 · KBQ-DXAIX-04 · KBQ-DXAIX-06): Zero AST Merge Conflicts & Zero Canary Residuals on Release?",
        ["H1.3", "H2.4"],
        "Key Business Question H2.4 under H1.3 validating clean database reconciliation, canary purge, and release closure.",
        "H2_4_KBQ_Release_Cleanliness.md", "KBQ Brief",
        ["Parent Initiative: H1.3 (GOAL-53-03)", "Drives OKR H3.4 and Work Package H7.4 (T7.1 & M-2)."]
      ),

      // === LEVEL 2: 4 H3 Measurable OKRs (measurable_objectives: OBJ-53-101..301) ===
      makeHorizonNode(
        "H3.1", "H3", "H2.1", 2,
        "OKR 1 (OBJ-53-101): Achieve 100% 15-Minute Sprint Cadence & Technical Spec Coverage",
        ["H1.1", "H2.1", "H3.1"],
        "Measurable Objective H3.1 under H2.1: 100% of sprint tasks preceded by upstream technical specs and Pre-Mortem Stress Tests.",
        "H3_1_OKR_Cadence.md", "OKR Scorecard",
        ["Target: 100% Technical Spec & Pre-Mortem coverage across T1.1 & T2.1."]
      ),
      makeHorizonNode(
        "H3.2", undefined, "H2.2", 2,
        "OKR 2 (OBJ-53-102): Maintain 100% 1:N WBS-to-Timeline Rollup Across H1–H7, Tasks & Subtasks",
        ["H1.1", "H2.2", "H3.2"],
        "Measurable Objective H3.2 under H2.2: 100% of H1–H7 branches, Tasks, and Subtasks reflected 1:1 on the Timeline with bottom-up span rollup.",
        "H3_2_OKR_Timeline_Fidelity.md", "OKR Scorecard",
        ["Target: 3 H1s, 4 H2s, 4 H3s, 4 H4s, 4 H5s, 4 H6s, 4 H7s, 7 Tasks, and 14 Subtasks reflected."]
      ),
      makeHorizonNode(
        "H3.3", undefined, "H2.3", 2,
        "OKR 3 (OBJ-53-201): Sustain QualityGate EAI >= 0.98 & Independent Human SoD Sign-Off",
        ["H1.2", "H2.3", "H3.3"],
        "Measurable Objective H3.3 under H2.3: 0 failed DoD checks in pytest/Playwright and explicit Phase 6 SoD sign-off.",
        "H3_3_OKR_QualityGate.md", "OKR Scorecard",
        ["Target: 2/2 Playwright + DB tests passing and Human SoD gate reviewed."]
      ),
      makeHorizonNode(
        "H3.4", undefined, "H2.4", 2,
        "OKR 4 (OBJ-53-301): Zero Canary Residuals (Release Verification) & Atomic Release Handoff",
        ["H1.3", "H2.4", "H3.4"],
        "Measurable Objective H3.4 under H2.4: residual_count == 0 in PostgreSQL and complete session handoff in hot.md/log.md.",
        "H3_4_OKR_Zero_Residual.md", "OKR Scorecard",
        ["Target: residual_count == 0 and corrupted_vn_count == 0."]
      ),

      // === LEVEL 3: 4 H4 9-Block BMC Clusters covering all 9 Osterwalder Blocks (BMC-CS, BMC-VP, BMC-CH, BMC-CR, BMC-RS, BMC-KR, BMC-KA, BMC-KP, BMC-CST) ===
      makeHorizonNode(
        "H4.1", "H4", "H3.1", 3,
        `BMC 1 (BMC-CS · BMC-VP · VP-01): Customer Segments & Value Propositions (${projKey})`,
        ["H1.1", "H2.1", "H3.1", "H4.1"],
        `BMC Customer Segments (BMC-CS) & Value Propositions (BMC-VP / VP-01..06) for ${projName}: grounds STRAT-GOAL-DXAIX-01..06 in Mid-Market & Regulated Enterprise outcomes.`,
        "H4_1_BMC_Value_Prop.md", "BMC Block",
        ["Covers BMC-CS (Customer Segments) & BMC-VP (VP-01..06 mapped 1:1 to STRAT-GOAL-DXAIX-01..06).", "Links H3.1 OKR (OBJ-DXAIX-101 / OBJ-53-101) to Capability H5.1."]
      ),
      makeHorizonNode(
        "H4.2", undefined, "H3.2", 3,
        `BMC 2 (BMC-CH · BMC-KR · BMC-CST · KR-01): Channels, Key Resources & Local ONNX Cost Structure (${projKey})`,
        ["H1.1", "H2.2", "H3.2", "H4.2"],
        `BMC Channels (BMC-CH: 4-Surface Cockpit), Key Resources (BMC-KR / KR-01), and Cost Structure (BMC-CST: >=82% free local ONNX deflection) for ${projName}.`,
        "H4_2_BMC_Key_Resources.md", "BMC Block",
        ["Covers BMC-CH (Channels), BMC-KR (Key Resources), and BMC-CST (Cost Structure / STRAT-GOAL-DXAIX-03).", "Links H3.2 OKR (OBJ-DXAIX-301 / OBJ-53-102) to Capability H5.2 (CAP-DXAIX-02 & CAP-DXAIX-03)."]
      ),
      makeHorizonNode(
        "H4.3", undefined, "H3.3", 3,
        `BMC 3 (BMC-CR · BMC-KP · KP-01): Delegated Customer Relationships, SoD & Key Partnerships (${projKey})`,
        ["H1.2", "H2.3", "H3.3", "H4.3"],
        `BMC Customer Relationships (BMC-CR: Delegated AI with SoD & <1s revoke) and Key Partnerships (BMC-KP / KP-01: 15-Reviewer QualityGate) for ${projName}.`,
        "H4_3_BMC_Partnerships.md", "BMC Block",
        ["Covers BMC-CR (Customer Relationships / STRAT-GOAL-DXAIX-02 & STRAT-GOAL-DXAIX-05) and BMC-KP (Key Partnerships).", "Links H3.3 OKR (OBJ-DXAIX-201 & OBJ-DXAIX-501 / OBJ-53-201) to Capability H5.3 (CAP-DXAIX-05)."]
      ),
      makeHorizonNode(
        "H4.4", undefined, "H3.4", 3,
        `BMC 4 (BMC-KA · BMC-RS · KA-01): Key Activities, Parallel Swarm & Revenue Streams (${projKey})`,
        ["H1.3", "H2.4", "H3.4", "H4.4"],
        `BMC Key Activities (BMC-KA / KA-01: Kahn DAG Waves, Canary Purge & Role-Scoped Knowledge) and Revenue Streams (BMC-RS: 89%-91% GM) for ${projName}.`,
        "H4_4_BMC_Key_Activities.md", "BMC Block",
        ["Covers BMC-KA (Key Activities / STRAT-GOAL-DXAIX-04 & STRAT-GOAL-DXAIX-06) and BMC-RS (Revenue Streams).", "Links H3.4 OKR (OBJ-DXAIX-401 & OBJ-DXAIX-601 / OBJ-53-301) to Capability H5.4 (CAP-DXAIX-04 & CAP-DXAIX-06)."]
      ),

      // === LEVEL 4: 4 H5 Enterprise Capabilities (enterprise_capabilities: CAP-DXAIX-01..05) ===
      makeHorizonNode(
        "H5.1", "H5", "H4.1", 4,
        "Capability 1 (CAP-DXAIX-01): Polymorphic 7-Phase Deliverable Triage & Workflow Engine",
        ["H1.1", "H2.1", "H3.1", "H4.1", "H5.1"],
        "Enterprise Capability H5.1 providing zero-trust deliverable classification, Structured Spec scaffolding, and Pre-Mortem stress testing.",
        "H5_1_Cap_UTOP_Engine.md", "Capability Spec",
        ["Crystallized Stage 4 Deterministic Capability closing Gap H6.1."]
      ),
      makeHorizonNode(
        "H5.2", undefined, "H4.2", 4,
        "Capability 2 (CAP-DXAIX-02 · CAP-DXAIX-03): Unified 4-Surface Cockpit, Orthogonal Gantt & BPE Token FinOps Router",
        ["H1.1", "H2.2", "H3.2", "H4.2", "H5.2"],
        "Enterprise Capability H5.2 rendering the 1:N multi-branch H1–H7 tree, Task summary bars, Subtask leaf bars, and orthogonal FS arrows.",
        "H5_2_Cap_Timeline_Gantt.md", "Capability Spec",
        ["Crystallized Stage 4 Capability closing Gap H6.2."]
      ),
      makeHorizonNode(
        "H5.3", undefined, "H4.3", 4,
        "Capability 3 (CAP-DXAIX-05): Delegated Human Authorization Matrix & SoD Audit Ledger",
        ["H1.2", "H2.3", "H3.3", "H4.3", "H5.3"],
        "Enterprise Capability H5.3 surfacing plain-English Human Decision Briefs, formatted Executive Artifact Previews, and SoD gates.",
        "H5_3_Cap_Human_SoD.md", "Capability Spec",
        ["Crystallized Stage 4 Capability closing Gap H6.3."]
      ),
      makeHorizonNode(
        "H5.4", undefined, "H4.4", 4,
        "Capability 4 (CAP-DXAIX-04 · CAP-DXAIX-06): Kahn DAG Wave Scheduler, Role-Scoped WeKnora & Canary Verifier",
        ["H1.3", "H2.4", "H3.4", "H4.4", "H5.4"],
        "Enterprise Capability H5.4 enforcing canonical issue protection, UTF-8 diacritic repair, and final zero-residual release verification.",
        "H5_4_Cap_Canary_Release.md", "Capability Spec",
        ["Crystallized Stage 4 Capability closing Gap H6.4."]
      ),

      // === LEVEL 5: 4 H6 Capability Gaps (capability_gaps: GAP-PM-01..06) + Milestone M-1 ===
      makeHorizonNode(
        "H6.1", "H6", "H5.1", 5,
        "Gap 1 (GAP-PM-01 · GAP-DXAIX-01 · WSJF 14.5): Cadence, Scope Elicitation & Structured Spec Gate",
        ["H1.1", "H2.1", "H3.1", "H4.1", "H5.1", "H6.1"],
        "Capability Gap H6.1 resolved by Work Package H7.1 (Tasks T1.1 & T2.1: Phase 1 Triage & Phase 2 Technical Spec).",
        "H6_1_Gap_Cadence.md", "Gap Analysis",
        ["Closed by Work Package H7.1 (EPIC-53-01)."]
      ),
      {
        id: "M-1", parent: "H5.1", lv: 5, type: "milestone",
        title: "[Milestone] Phase 3 DoD Contract Immutability Lock",
        s: 4, e: 4, pct: 100, status: "done", hum: null, decision: null,
        bc: ["H1.1", "H2.1", "H3.1", "H4.1", "H5.1", "M-1"], deps: ["ST-2.2"],
        content: "Phase 3 lock milestone between Work Package H7.1 (T1.1/T2.1 Planning) and Work Package H7.2 (T3.1/T4.1 Execution).",
        dod: [
          { label: "Lock DoD-49..63 contract prior to Phase 4 execution", done: true }
        ],
        art: {
          name: "M1_Baseline_Lock_Cert.md",
          type: "Milestone Certificate",
          summary: "Certifies Phase 3 DoD contract lock for the consolidated ACCORD Timeline View.",
          highlights: ["All DoD criteria locked before Phase 4 execution."],
          metrics: [{ label: "Milestone Status", before: "Pending", after: "Locked (100%)" }]
        }
      },
      makeHorizonNode(
        "H6.2", undefined, "H5.2", 5,
        "Gap 2 (GAP-PM-02 · GAP-DXAIX-02 · GAP-DXAIX-04 · WSJF 13.5): 1:N Multi-Branch H1–H7 Timeline & Local ONNX Router",
        ["H1.1", "H2.2", "H3.2", "H4.2", "H5.2", "H6.2"],
        "Capability Gap H6.2 resolved by Work Package H7.2 (Tasks T3.1 & T4.1: Multi-Branch WBS Tree & Bottom-Up Gantt Rollup).",
        "H6_2_Gap_MultiBranch_Timeline.md", "Gap Analysis",
        ["Closed by Work Package H7.2 (EPIC-53-02)."]
      ),
      makeHorizonNode(
        "H6.3", undefined, "H5.3", 5,
        "Gap 3 (GAP-PM-05 · GAP-DXAIX-05 · WSJF 11.5): Automated 1:1 DoD Matrix, Delegated Authz & Human SoD Sign-Off",
        ["H1.2", "H2.3", "H3.3", "H4.3", "H5.3", "H6.3"],
        "Capability Gap H6.3 resolved by Work Package H7.3 (Tasks T5.1 & T6.1: Automated Verification & Phase 6 SoD Gate).",
        "H6_3_Gap_Quality_SoD.md", "Gap Analysis",
        ["Closed by Work Package H7.3 (EPIC-53-05)."]
      ),
      makeHorizonNode(
        "H6.4", undefined, "H5.4", 5,
        "Gap 4 (GAP-PM-06 · GAP-DXAIX-03 · GAP-DXAIX-06 · WSJF 13.0): Parallel Swarm, WeKnora Role Isolation & Canary Purge",
        ["H1.3", "H2.4", "H3.4", "H4.4", "H5.4", "H6.4"],
        "Capability Gap H6.4 resolved by Work Package H7.4 (Task T7.1 & Milestone M-2: Canary Zero-Residual Check & Release Handoff).",
        "H6_4_Gap_Release_Closure.md", "Gap Analysis",
        ["Closed by Work Package H7.4 (EPIC-53-06)."]
      ),

      // === LEVEL 6: 4 H7 Work Packages / Epics (epics: EPIC-53-01, EPIC-53-02, EPIC-53-05, EPIC-53-06) ===
      makeHorizonNode(
        "H7.1", "H7", "H6.1", 6,
        "Work Package 1 (EPIC-53-01): Sprint Scope Triage & 7-Horizon Architecture Spec (T1.1–T2.1)",
        ["H1.1", "H2.1", "H3.1", "H4.1", "H5.1", "H6.1", "H7.1"],
        "Work Package H7.1 (EPIC-53-01) grouping Phase 1 Triage (T1.1: ST-1.1, ST-1.2) and Phase 2 Architecture Spec (T2.1: ST-2.1, ST-2.2).",
        "H7_1_WP_Scoping_UTOP.md", "Work Package Rollup",
        ["Owns Tasks T1.1 and T2.1 (4 Subtasks: ST-1.1..ST-2.2).", "Timeline Window: 00:15 – 01:00 (100% Complete)."]
      ),
      makeHorizonNode(
        "H7.2", undefined, "H6.2", 6,
        "Work Package 2 (EPIC-53-02): DoD Baseline Lock & Timeline WBS Consolidation (T3.1–T4.1)",
        ["H1.1", "H2.2", "H3.2", "H4.2", "H5.2", "H6.2", "H7.2"],
        "Work Package H7.2 (EPIC-53-02) grouping Phase 3 DoD Lock (T3.1: ST-3.1, ST-3.2) and Phase 4 Multi-Branch Timeline Consolidation (T4.1: ST-4.1, ST-4.2).",
        "H7_2_WP_Timeline_Build.md", "Work Package Rollup",
        ["Owns Tasks T3.1 and T4.1 (4 Subtasks: ST-3.1..ST-4.2).", "Timeline Window: 01:30 – 03:00 (Active Execution & Architecture Gate)."]
      ),
      makeHorizonNode(
        "H7.3", undefined, "H6.3", 6,
        "Work Package 3 (EPIC-53-05): 15-Reviewer QualityGate & Human SoD Sign-Off (T5.1–T6.1)",
        ["H1.2", "H2.3", "H3.3", "H4.3", "H5.3", "H6.3", "H7.3"],
        "Work Package H7.3 (EPIC-53-05) grouping Phase 5 Verification Matrix (T5.1: ST-5.1, ST-5.2) and Phase 6 SoD Review (T6.1: ST-6.1, ST-6.2).",
        "H7_3_WP_Verification_SoD.md", "Work Package Rollup",
        ["Owns Tasks T5.1 and T6.1 (4 Subtasks: ST-5.1..ST-6.2).", "Timeline Window: 03:15 – 04:15 (Verification & SoD Gate)."]
      ),
      makeHorizonNode(
        "H7.4", undefined, "H6.4", 6,
        "Work Package 4 (EPIC-53-06): Canary Verification & Sprint Release Closure (T7.1)",
        ["H1.3", "H2.4", "H3.4", "H4.4", "H5.4", "H6.4", "H7.4"],
        "Work Package H7.4 (EPIC-53-06) grouping Phase 7 Final Closure & Canary Verification (T7.1: ST-7.1, ST-7.2).",
        "H7_4_WP_Release_Closure.md", "Work Package Rollup",
        ["Owns Task T7.1 (2 Subtasks: ST-7.1, ST-7.2).", "Timeline Window: 04:15 – 04:45 (Release Closure)."]
      ),
    ];

    const milestoneM2: WbsNode = {
      id: "M-2", parent: "H6.4", lv: 6, type: "milestone",
      title: "[Milestone] Phase 7 Production Release Gate",
      s: 19, e: 19, pct: approvedMap["M-2"] ? 100 : 0, status: approvedMap["M-2"] ? "done" : "gate", hum: "Release Gate",
      decision: {
        gateLabel: "Final Production Release Sign-Off",
        question: `Certify and release the consolidated ${projKey} 1:N Multi-Branch H1–H7 + Tasks + Subtasks Timeline View?`,
        whyNeeded: "Final human verification gate confirming that all 3 H1s, 4 H2s, 4 H3s, 4 H4s, 4 H5s, 4 H6s, 4 H7s, 7 Tasks, and 14 Subtasks are accurately reflected on the Timeline.",
        recommendation: "Approve Release Gate once T4.1 and T6.1 gates are signed off.",
        impact: "Marks the sprint milestone 100% complete and seals Phase 7."
      },
      bc: ["H1.3", "H2.4", "H3.4", "H4.4", "H5.4", "H6.4", "M-2"],
      deps: ["ST-7.2"],
      content: "Final Phase 7 human release sign-off milestone certifying the consolidated 1:N Multi-Branch H1–H7 + Tasks + Subtasks Timeline View in ACCORD.",
      dod: [
        { label: "All 1:N multi-branch H1–H7 horizons, Tasks (T1.1..T7.1), and Subtasks (ST-*) reflected on Timeline", done: true },
        { label: "All orthogonal FS dependency arrows & human decision briefs verified", done: true },
        { label: "Final Human Release Sign-Off", done: !!approvedMap["M-2"] }
      ],
      art: {
        name: "M2_Release_Readiness_Report.md",
        type: "Release Gate Brief",
        summary: "Executive release readiness summary for the consolidated ACCORD 1:N Multi-Branch Timeline View.",
        highlights: [
          "Full 1:N multi-branch WBS hierarchy: 3 H1s → 4 H2s → 4 H3s → 4 H4s → 4 H5s → 4 H6s → 4 H7s → 7 Tasks → 14 Subtasks.",
          "100% recursive bottom-up timeline span and completion % rollup across every branch.",
          "Zero diagonal dotted lines; 100% solid orthogonal Finish-to-Start step arrows."
        ],
        metrics: [
          { label: "Total Reflected WBS Rows", before: "Single 1-of-each H1–H7", after: "50 rows (27 H1–H7 nodes + 7 Tasks + 14 Subtasks + 2 Milestones)" },
          { label: "Release Readiness", before: "Pending Review", after: "Ready for Sign-Off" }
        ]
      },
      approved: !!approvedMap["M-2"]
    };

    const getRowCode = (row: any, prefix: string, idx: number): string => {
      const raw =
        row?.goal_id ??
        row?.kbq_id ??
        row?.objective_id ??
        row?.okr_id ??
        row?.bmc_id ??
        row?.block_id ??
        row?.block_code ??
        row?.capability_id ??
        row?.cap_id ??
        row?.gap_id ??
        row?.epic_id ??
        row?.milestone_id ??
        row?.code ??
        row?.key ??
        row?.identifier ??
        row?.id;
      return raw != null && String(raw).trim() !== "" ? String(raw).trim() : `${prefix}-${idx + 1}`;
    };

    const getRowTitle = (row: any, fallback: string): string => {
      const raw =
        row?.title ??
        row?.name ??
        row?.question ??
        row?.question_text ??
        row?.goal_statement ??
        row?.objective ??
        row?.objective_statement ??
        row?.capability_name ??
        row?.gap_title ??
        row?.block_name ??
        row?.epic_name ??
        row?.summary ??
        row?.description;
      return raw != null && String(raw).trim() !== ""
        ? repairVietnameseMojibake(String(raw).trim())
        : fallback;
    };

    const getRowStatus = (row: any, fallback = "ACTIVE"): string => {
      const raw = row?.status ?? row?.state ?? row?.lifecycle_status ?? row?.maturity_status ?? row?.stage;
      return raw != null && String(raw).trim() !== "" ? String(raw).trim().toUpperCase() : fallback;
    };

    const formatHorizonDisplayTitle = (rowStatus: string, code: string, rowTitle: string): string => {
      const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const cleaned = rowTitle
        .replace(new RegExp(`^\\[${rowStatus}\\]\\s*`, "i"), "")
        .replace(new RegExp(`^${escapedCode}\\s*:?\\s*`, "i"), "")
        .trim();
      return `[${rowStatus}] ${code}: ${cleaned || rowTitle}`;
    };

    const dedupHorizonRows = (rows: any[], prefix: string): any[] => {
      const seen = new Set<string>();
      const out: any[] = [];
      (Array.isArray(rows) ? rows : []).forEach((r, idx) => {
        if (!r) return;
        const code = getRowCode(r, prefix, idx);
        const title = getRowTitle(r, code);
        const sig = `${code.toUpperCase()}::${title.toUpperCase()}`;
        if (!seen.has(sig)) {
          seen.add(sig);
          out.push(r);
        }
      });
      return out;
    };

    const rowsByLv: any[][] = [
      dedupHorizonRows([...(horizonsData?.h1_goals || []), ...(horizonsData?.initiatives || [])], `${projKey}-H1`),
      dedupHorizonRows(horizonsData?.h2_kbqs || [], `${projKey}-H2`),
      dedupHorizonRows(horizonsData?.h3_objectives || [], `${projKey}-H3`),
      dedupHorizonRows(horizonsData?.h4_bmc || [], `${projKey}-H4`),
      dedupHorizonRows(horizonsData?.h5_capabilities || [], `${projKey}-H5`),
      dedupHorizonRows(horizonsData?.h6_gaps || [], `${projKey}-H6`),
      dedupHorizonRows([...(horizonsData?.h7_epics || []), ...(horizonsData?.cycles || [])], `${projKey}-H7`)
    ];
    const milestoneRows: any[] = Array.isArray(horizonsData?.milestones) ? horizonsData.milestones : [];
    const dbStatusByNodeId = new Map<string, WbsStatus>();

    let rawNodes: WbsNode[] = [];

    if (projKey === "PM") {
      const levelBuckets: WbsNode[][] = [0, 1, 2, 3, 4, 5, 6].map((lv) =>
        horizonNodes.filter((n) => n.lv === lv)
      );

      rowsByLv.forEach((rows, lv) => {
        const hNum = lv + 1;
        const staticSummariesAtLv = levelBuckets[lv].filter((n) => n.type === "summary");
        const matchedStaticIds = new Set<string>();
        let nextSubIdx = staticSummariesAtLv.length + 1;

        rows.forEach((row: any, rIdx: number) => {
          const code = getRowCode(row, `H${hNum}-PM`, rIdx);
          const rowTitle = getRowTitle(row, code);
          const rowStatus = getRowStatus(row, "ACTIVE");
          const mappedStatus = mapHorizonStatus(rowStatus);

          const matchedStatic = staticSummariesAtLv.find(
            (sn) => !matchedStaticIds.has(sn.id) && sn.title.toUpperCase().includes(code.toUpperCase())
          );

          if (matchedStatic) {
            matchedStaticIds.add(matchedStatic.id);
            dbStatusByNodeId.set(matchedStatic.id, mappedStatus);
            matchedStatic.status = mappedStatus;
            if (!matchedStatic.title.toUpperCase().includes(`[${rowStatus}]`)) {
              matchedStatic.title = `[${rowStatus}] ${matchedStatic.title}`;
            }
          } else {
            const nodeId = `H${hNum}.${nextSubIdx++}`;
            const parentCandidates = lv > 0 ? levelBuckets[lv - 1].filter((n) => n.type === "summary") : [];
            const fkVal = String(
              row?.goal_id ?? row?.kbq_id ?? row?.objective_id ?? row?.capability_id ?? row?.gap_id ?? row?.parent_id ?? ""
            ).trim();
            const parentNode =
              lv === 0
                ? null
                : (fkVal
                    ? parentCandidates.find((p) => p.title.toUpperCase().includes(fkVal.toUpperCase()))
                    : undefined) || parentCandidates[rIdx % Math.max(1, parentCandidates.length)] || null;
            const bc = parentNode ? [...parentNode.bc, nodeId] : [nodeId];
            const dynNode = makeHorizonNode(
              nodeId,
              undefined,
              parentNode ? parentNode.id : null,
              lv,
              formatHorizonDisplayTitle(rowStatus, code, rowTitle),
              bc,
              `SQLite Ground-Truth Horizon H${hNum} record (${code}) with status [${rowStatus}]: ${rowTitle}.`,
              `${nodeId.replace(".", "_")}_${code.replace(/[^A-Za-z0-9_-]/g, "_")}.md`,
              `H${hNum} Ground-Truth Record`,
              [
                `Identifier: ${code} · Database Status: [${rowStatus}]`,
                `Mapped Timeline Status: ${mappedStatus}`
              ]
            );
            const isDynApproved = !!approvedMap[nodeId];
            dynNode.pct = isDynApproved
              ? 100
              : mappedStatus === "done"
              ? 100
              : mappedStatus === "canceled"
              ? 0
              : mappedStatus === "in_review"
              ? 45
              : 75;
            dynNode.status = isDynApproved ? "done" : mappedStatus;
            dynNode.s = Math.min(17, (rIdx * 2) % 16);
            dynNode.e = Math.min(19, dynNode.s + 2);
            dbStatusByNodeId.set(nodeId, mappedStatus);
            levelBuckets[lv].push(dynNode);
          }
        });
      });

      const extraPmMilestones: WbsNode[] = [];
      milestoneRows.forEach((mRow: any, mIdx: number) => {
        const mTitle = getRowTitle(mRow, `Milestone ${mIdx + 3}`);
        if (
          horizonNodes.some((n) => n.type === "milestone" && n.title.toUpperCase().includes(mTitle.toUpperCase())) ||
          milestoneM2.title.toUpperCase().includes(mTitle.toUpperCase())
        ) {
          return;
        }
        const mId = `M-${mIdx + 3}`;
        const mStatus = getRowStatus(mRow, "ACTIVE");
        const mappedMStatus = mapHorizonStatus(mStatus);
        const isMApproved = !!approvedMap[mId];
        extraPmMilestones.push({
          id: mId,
          parent: "H6.4",
          lv: 6,
          type: "milestone",
          title: `[Milestone] [${mStatus}] ${mTitle}`,
          s: Math.min(19, 8 + mIdx * 3),
          e: Math.min(19, 8 + mIdx * 3),
          pct: isMApproved || mappedMStatus === "done" ? 100 : 0,
          status: isMApproved || mappedMStatus === "done" ? "done" : mappedMStatus,
          hum: null,
          decision: null,
          bc: ["H1.3", "H2.4", "H3.4", "H4.4", "H5.4", "H6.4", mId],
          deps: [],
          content: `Milestone ${mId} (${mStatus}): ${mTitle}.`,
          dod: [{ label: `Verify milestone ${mId}: ${mTitle}`, done: isMApproved || mappedMStatus === "done" }],
          art: {
            name: `${mId}_Milestone.md`,
            type: "Milestone Record",
            summary: `Milestone ${mId}: ${mTitle} (${mStatus}).`,
            highlights: [`Status: ${mStatus}`],
            metrics: [{ label: "Milestone Status", before: "Tracked", after: mStatus }]
          },
          approved: isMApproved
        });
      });

      rawNodes = [...levelBuckets.flat(), ...taskAndSubtaskNodes, milestoneM2, ...extraPmMilestones];
    } else {
      // Non-PM Project Isolation: ZERO 53_PM / GOAL-53 / DXAIX nodes emitted!
      const nonPmByLv: WbsNode[][] = [[], [], [], [], [], [], []];

      const findNearestNonPmParentCandidates = (lv: number): WbsNode[] => {
        for (let anc = lv - 1; anc >= 0; anc--) {
          if (nonPmByLv[anc].length > 0) return nonPmByLv[anc];
        }
        return [];
      };

      rowsByLv.forEach((rows, lv) => {
        const hNum = lv + 1;
        const parentCandidates = findNearestNonPmParentCandidates(lv);
        let validIdx = 0;

        rows.forEach((row: any, rIdx: number) => {
          const code = getRowCode(row, `${projKey}-H${hNum}`, rIdx);
          const rowTitle = getRowTitle(row, `${projName} H${hNum} Item ${rIdx + 1}`);
          if (/(?:GOAL-53|KBQ-53|OBJ-53|EPIC-53|GAP-PM-|DXAIX)/i.test(`${code} ${rowTitle}`)) {
            return;
          }
          validIdx += 1;
          const nodeId = `H${hNum}.${validIdx}`;
          const aliasKey = validIdx === 1 ? `H${hNum}` : undefined;
          const rowStatus = getRowStatus(row, "ACTIVE");
          const mappedStatus = mapHorizonStatus(rowStatus);
          const fkVal = String(
            row?.goal_id ?? row?.kbq_id ?? row?.objective_id ?? row?.capability_id ?? row?.gap_id ?? row?.parent_id ?? ""
          ).trim();
          const parentNode =
            parentCandidates.length === 0
              ? null
              : (fkVal
                  ? parentCandidates.find((p) => p.title.toUpperCase().includes(fkVal.toUpperCase()))
                  : undefined) || parentCandidates[(validIdx - 1) % parentCandidates.length];
          const bc = parentNode ? [...parentNode.bc, nodeId] : [nodeId];
          const node = makeHorizonNode(
            nodeId,
            aliasKey,
            parentNode ? parentNode.id : null,
            lv,
            formatHorizonDisplayTitle(rowStatus, code, rowTitle),
            bc,
            `Project ${projKey} (${projName}) Horizon H${hNum} (${code}): ${rowTitle}. Status: ${rowStatus}.`,
            `${projKey}_${nodeId.replace(".", "_")}_Brief.md`,
            `H${hNum} Project Horizon`,
            [
              `Project: ${projKey} (${projName}) · Identifier: ${code}`,
              `Status: [${rowStatus}] (${mappedStatus})`
            ]
          );
          const isNodeApproved = !!approvedMap[nodeId] || (aliasKey ? !!approvedMap[aliasKey] : false);
          node.pct = isNodeApproved
            ? 100
            : mappedStatus === "done"
            ? 100
            : mappedStatus === "canceled"
            ? 0
            : mappedStatus === "in_review"
            ? 45
            : 75;
          node.status = isNodeApproved ? "done" : mappedStatus;
          node.s = Math.min(17, ((validIdx - 1) * 2) % 16);
          node.e = Math.min(19, node.s + 2);
          dbStatusByNodeId.set(nodeId, mappedStatus);
          nonPmByLv[lv].push(node);
        });
      });

      const deepestSummaryCandidates = (() => {
        for (let lv = 6; lv >= 0; lv--) {
          if (nonPmByLv[lv].length > 0) return nonPmByLv[lv];
        }
        return [];
      })();

      let prevNonPmTaskKey = "";
      let prevNonPmSubKey = "";
      liveParentIssues.forEach((parentIss: any, tIdx: number) => {
        const parentSummary =
          deepestSummaryCandidates.length > 0
            ? deepestSummaryCandidates[tIdx % deepestSummaryCandidates.length]
            : null;
        const built = buildDynamicTaskAndSubs(
          parentIss,
          tIdx,
          parentSummary ? parentSummary.id : null,
          parentSummary ? parentSummary.bc : [],
          prevNonPmTaskKey,
          prevNonPmSubKey
        );
        builtTasks.push(built.taskNode);
        taskAndSubtaskNodes.push(built.taskNode, ...built.builtSubs);
        prevNonPmTaskKey = built.taskNode.id;
        if (built.lastSubKey) {
          prevNonPmSubKey = built.lastSubKey;
        }
      });

      const nonPmMilestones: WbsNode[] = [];
      milestoneRows.forEach((mRow: any, mIdx: number) => {
        const mTitle = getRowTitle(mRow, `${projKey} Milestone ${mIdx + 1}`);
        if (/(?:GOAL-53|KBQ-53|OBJ-53|EPIC-53|GAP-PM-|DXAIX)/i.test(mTitle)) {
          return;
        }
        const mId = `M-${mIdx + 1}`;
        const mStatus = getRowStatus(mRow, "ACTIVE");
        const mappedMStatus = mapHorizonStatus(mStatus);
        const isMApproved = !!approvedMap[mId];
        const parentSum = deepestSummaryCandidates[0] || null;
        nonPmMilestones.push({
          id: mId,
          parent: parentSum ? parentSum.id : null,
          lv: 6,
          type: "milestone",
          title: `[Milestone] [${mStatus}] ${mTitle}`,
          s: Math.min(19, 6 + mIdx * 4),
          e: Math.min(19, 6 + mIdx * 4),
          pct: isMApproved || mappedMStatus === "done" ? 100 : 0,
          status: isMApproved || mappedMStatus === "done" ? "done" : mappedMStatus,
          hum: "Release Gate",
          decision: {
            gateLabel: `${projKey} Milestone Sign-Off (${mId})`,
            question: `Approve milestone ${mId} (${mTitle}) for ${projKey}?`,
            whyNeeded: `Confirms ${projKey} milestone deliverable readiness prior to release progression.`,
            recommendation: `Approve ${mId} once linked ${projKey} tasks pass verification.`,
            impact: `Marks ${mId} 100% approved in ${projKey}.`
          },
          bc: parentSum ? [...parentSum.bc, mId] : [mId],
          deps: prevNonPmSubKey ? [prevNonPmSubKey] : prevNonPmTaskKey ? [prevNonPmTaskKey] : [],
          content: `Project ${projKey} (${projName}) Milestone ${mId}: ${mTitle} (${mStatus}).`,
          dod: [{ label: `Complete & verify ${mId}: ${mTitle}`, done: isMApproved || mappedMStatus === "done" }],
          art: {
            name: `${projKey}_${mId}_Milestone.md`,
            type: "Milestone Gate",
            summary: `Milestone summary for ${projKey} ${mId}: ${mTitle}.`,
            highlights: [`Project: ${projKey} · Status: ${mStatus}`],
            metrics: [{ label: "Milestone Status", before: "Pending", after: isMApproved ? "Approved (100%)" : mStatus }]
          },
          approved: isMApproved
        });
      });

      rawNodes = [...nonPmByLv.flat(), ...taskAndSubtaskNodes, ...nonPmMilestones];
    }

    // Recursive Bottom-Up Rollup from Tasks (lv 7) -> H7.1..4 (lv 6) -> H6.1..4 (lv 5) -> ... -> H1.1..3 (lv 0)
    for (let depth = 6; depth >= 0; depth--) {
      rawNodes
        .filter((n) => n.type === "summary" && n.lv === depth)
        .forEach((sumNode) => {
          const children = rawNodes.filter((c) => c.parent === sumNode.id && c.type !== "milestone");
          if (children.length > 0) {
            sumNode.s = Math.min(...children.map((c) => c.s));
            sumNode.e = Math.max(...children.map((c) => c.e));
            const isApproved = !!approvedMap[sumNode.id] || (sumNode.aliasKey ? !!approvedMap[sumNode.aliasKey] : false);
            sumNode.pct = isApproved
              ? 100
              : Math.round(children.reduce((acc, c) => acc + c.pct, 0) / children.length);
            const explicitDbStatus = dbStatusByNodeId.get(sumNode.id);
            sumNode.status = isApproved
              ? "done"
              : explicitDbStatus === "canceled" || explicitDbStatus === "in_review"
              ? explicitDbStatus
              : sumNode.pct === 100
              ? "done"
              : sumNode.hum && !sumNode.approved
              ? "gate"
              : explicitDbStatus || "running";
            sumNode.subtaskCount = children.length;
            if (sumNode.art) {
              sumNode.art.metrics = [
                { label: "Child Branches / Items", before: "1 placeholder", after: `${children.length} direct children (${children.map((c) => c.id).join(", ")})` },
                { label: "Rolled-Up Timeline Span", before: "Static full width", after: `${SLOTS[sumNode.s]} – ${SLOTS[sumNode.e]}` },
                { label: "Rolled-Up Progress", before: "Static %", after: `${sumNode.pct}% (Bottom-Up Avg)` }
              ];
            }
          } else if (approvedMap[sumNode.id] || (sumNode.aliasKey && approvedMap[sumNode.aliasKey])) {
            sumNode.approved = true;
            sumNode.pct = 100;
            sumNode.status = "done";
          }
        });
    }

    if (orderMode === "tree") {
      const ordered: WbsNode[] = [];
      const visit = (parentId: string | null) => {
        rawNodes
          .filter((n) => n.parent === parentId)
          .forEach((child) => {
            ordered.push(child);
            visit(child.id);
          });
      };
      visit(null);
      return ordered;
    }

    return rawNodes;
  }, [projKey, projName, liveIssues, liveColumns, approvedMap, orderMode, horizonsData]);

  const visible = useMemo(() => {
    const itemById = new Map(items.map((x) => [x.id, x]));
    const isHidden = (it: WbsNode): boolean => {
      let cur = it.parent;
      while (cur) {
        if (collapsed[cur]) return true;
        cur = itemById.get(cur)?.parent || null;
      }
      return false;
    };
    return items.filter((it) => !isHidden(it) && (!humFilter || (it.hum && !it.approved)));
  }, [items, collapsed, humFilter]);

  const visibleIndexById = useMemo(
    () => new Map(visible.map((x, idx) => [x.id, idx])),
    [visible],
  );

  const selItem = selectedId
    ? items.find((x) => x.id === selectedId || x.aliasKey === selectedId) || null
    : null;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (modalId) {
          setModalId(null);
        } else {
          setSelectedId(null);
          setBcExpanded(false);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalId]);
  const modItem = items.find((x) => x.id === modalId || x.aliasKey === modalId) || null;
  const humCount = useMemo(
    () => items.filter((x) => x.hum && !x.approved).length,
    [items],
  );

  const highHorizonIds = [
    "H2.1", "H2.2", "H2.3", "H2.4",
    "H3.1", "H3.2", "H3.3", "H3.4",
    "H4.1", "H4.2", "H4.3", "H4.4",
    "H5.1", "H5.2", "H5.3", "H5.4"
  ];
  const anyHighCollapsed = highHorizonIds.some((k) => collapsed[k]);
  const toggleHighHorizons = () => {
    const next = !anyHighCollapsed;
    setCollapsed((prev) => {
      const updated = { ...prev };
      highHorizonIds.forEach((k) => {
        updated[k] = next;
      });
      return updated;
    });
  };

  const renderArtifactCardContent = (art: ArtifactSection) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: "var(--muted-foreground)" }}>{art.summary}</p>
      <div style={{ background: "var(--card)", borderRadius: 12, padding: "10px 12px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
          Key Takeaways for Decision-Maker
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted-foreground)", fontSize: 12, lineHeight: 1.55 }}>
          {art.highlights.map((h, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{h}</li>
          ))}
        </ul>
      </div>
      {art.metrics && art.metrics.length > 0 && (
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", background: "var(--muted)", padding: "6px 10px", fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)" }}>
            <span>IMPACT METRIC</span>
            <span>BEFORE</span>
            <span>AFTER</span>
          </div>
          {art.metrics.map((m, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", padding: "7px 10px", fontSize: 12, borderTop: "1px solid var(--border)", background: "var(--card)", alignItems: "center", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ color: "var(--foreground)", fontWeight: 600 }}>{m.label}</span>
              <span style={{ color: "var(--muted-foreground)" }}>{m.before}</span>
              <span style={{ color: "var(--studio-emerald)", fontWeight: 600 }}>{m.after}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ROW_H = 36;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_H,
    overscan: 12,
    initialRect: { width: 1200, height: 800 },
  });
  const virtualItems = rowVirtualizer.getVirtualItems();
  const effectiveVirtualItems =
    virtualItems.length > 0
      ? virtualItems
      : visible.slice(0, 25).map((_, idx) => ({ index: idx, start: idx * ROW_H }));
  const minVisIdx = effectiveVirtualItems.length > 0 ? effectiveVirtualItems[0]!.index : 0;
  const maxVisIdx =
    effectiveVirtualItems.length > 0
      ? effectiveVirtualItems[effectiveVirtualItems.length - 1]!.index
      : 0;
  const totalRowsHeight = Math.max(ROW_H, visible.length * ROW_H);
  const svgHeight = totalRowsHeight;
  const { summaryCount, taskCount } = useMemo(
    () => ({
      summaryCount: items.filter((n) => n.type === "summary").length,
      taskCount: items.filter((n) => n.type === "task").length,
    }),
    [items],
  );
  const liveCycles: any[] = Array.isArray(horizonsData?.cycles) ? horizonsData.cycles : [];
  const liveInitiatives: any[] = Array.isArray(horizonsData?.initiatives)
    ? horizonsData.initiatives
    : [];
  const activeHorizonCycle =
    liveCycles.find((c: any) => {
      if (c?.completedAt || c?.completed_at) return false;
      const nowMs = Date.now();
      const sMs = new Date(c?.startDate || c?.start_date || 0).getTime();
      const eMs = new Date(c?.endDate || c?.end_date || 0).getTime();
      return sMs <= nowMs && nowMs <= eMs;
    }) ||
    liveCycles.find((c: any) => !c?.completedAt && !c?.completed_at) ||
    liveCycles[liveCycles.length - 1] ||
    null;

  return (
    <div data-testid="timeline-view-root" data-design-system="warm-open-office-studio-v3.3.22" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 680, background: "var(--background, var(--ag-void))", color: "var(--foreground)", fontFamily: "var(--ag-font-sans, 'IBM Plex Sans', system-ui, sans-serif)", fontSize: 12, position: "relative", overflow: "hidden" }}>
      {/* Single Compact 44px Studio Gantt Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 44, padding: "6px 16px", background: "var(--card)", borderBottom: "1px solid var(--border)", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <svg className="ag-brand-mark" width="20" height="20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ACCORD Sovereign Isometric Monolith">
            <rect x="2" y="2" width="60" height="60" rx="14" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
            <path d="M 49.43,20.06 L 32.0,10.0 L 14.57,20.06 L 19.98,23.19 L 32.0,16.25 L 44.02,23.19 Z M 32.0,30.88 L 24.31,26.44 L 32.0,22.0 L 39.69,26.44 Z" fill="var(--foreground)" />
            <path d="M 12.95,22.88 L 12.95,43.0 L 30.38,53.06 L 30.38,46.81 L 18.36,39.88 L 18.36,26.0 Z M 31.03,32.56 L 31.03,41.44 L 23.34,37.0 L 23.34,28.12 Z" fill="var(--muted-foreground)" />
            <path d="M 33.62,53.06 L 51.05,43.0 L 51.05,22.88 L 45.64,26.0 L 45.64,39.88 L 33.62,46.81 Z M 32.97,32.56 L 40.66,28.12 L 40.66,37.0 L 32.97,41.44 Z" fill="var(--muted-foreground)" />
          </svg>
          <span id="timeline-project-name" style={{ fontFamily: "var(--ag-font-display, 'Chakra Petch', sans-serif)", fontWeight: 700, fontSize: 14, color: "var(--foreground)" }}>
            {projKey}
          </span>
          <span id="horizon-branch-counts" style={{ fontSize: 12, color: "var(--muted-foreground)", fontFamily: "var(--ag-font-mono, 'IBM Plex Mono', monospace)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
            7 Horizons · {summaryCount} WBS · <span style={{ color: "var(--studio-emerald)", fontWeight: 600 }}>{taskCount} Tasks</span>
          </span>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 9999, border: "1px solid var(--border)", background: "var(--studio-pill-track, var(--muted))", padding: 3 }}>
          <button
            id="btn-filter-hum"
            onClick={() => setHumFilter(!humFilter)}
            style={{
              background: humFilter ? "var(--foreground)" : "transparent",
              color: humFilter ? "var(--background)" : "var(--studio-amber)",
              border: "none",
              borderRadius: 9999,
              minHeight: 34,
              padding: "6px 14px",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer"
            }}
          >
            Human Gate ({humCount})
          </button>
          <button
            id="btn-toggle-h1-h4"
            onClick={toggleHighHorizons}
            style={{
              background: anyHighCollapsed ? "var(--foreground)" : "transparent",
              color: anyHighCollapsed ? "var(--background)" : "var(--foreground)",
              border: "none",
              borderRadius: 9999,
              minHeight: 34,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            {anyHighCollapsed ? "All Horizons" : "Focus Active"}
          </button>
          <button
            id="btn-order-mode"
            onClick={() => setOrderMode((m) => (m === "layer" ? "tree" : "layer"))}
            style={{
              background: "transparent",
              color: "var(--muted-foreground)",
              border: "none",
              borderRadius: 9999,
              minHeight: 34,
              padding: "6px 14px",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer"
            }}
          >
            {orderMode === "layer" ? "By Horizon" : "Tree View"}
          </button>
        </div>
      </div>

      {/* Live Cycle, Initiative & Open Office Spine Sync Strip */}
      <div
        data-testid="timeline-cycle-initiative-sync-strip"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "5px 16px",
          background: "color-mix(in oklab, var(--card) 75%, transparent)",
          borderBottom: "1px solid var(--border)",
          fontSize: 12,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--muted-foreground)" }}>
            Cycle:{" "}
            <strong style={{ color: "var(--foreground)" }}>
              {activeHorizonCycle?.name || "Active Cadence"}
            </strong>
            {activeHorizonCycle?.startDate || activeHorizonCycle?.start_date
              ? ` (${String(activeHorizonCycle.startDate || activeHorizonCycle.start_date).slice(0, 10)} → ${String(activeHorizonCycle.endDate || activeHorizonCycle.end_date || "").slice(0, 10)})`
              : ""}
          </span>
          <span style={{ color: "var(--muted-foreground)" }}>·</span>
          <span style={{ color: "var(--muted-foreground)" }}>
            Initiatives:{" "}
            <strong style={{ color: "var(--foreground)" }}>{liveInitiatives.length}</strong>
          </span>
          <span style={{ color: "var(--muted-foreground)" }}>·</span>
          <span style={{ color: "var(--studio-emerald)", fontWeight: 600 }}>
            Open Office: {liveOfficeState.activeCount} active
          </span>
        </div>
      </div>

      {/* Main Studio Sheet: Left WBS Tree + Right Orthogonal Dependency Gantt */}
      <div ref={scrollContainerRef} style={{ margin: 12, borderRadius: 16, border: "1px solid var(--border)", background: "var(--card)", boxShadow: "var(--studio-card-shadow)", display: "grid", gridTemplateColumns: "minmax(640px, 54%) 46%", flex: 1, overflow: "auto", paddingBottom: 24 }}>
        {/* Left WBS Hierarchy Tree (H1..H7 -> Tasks T1.1..T7.1 -> Subtasks ST-1.1..ST-7.2) */}
        <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", minWidth: 640 }}>
          <div style={{ display: "grid", gridTemplateColumns: "56px minmax(260px, 1fr) 92px 124px 44px", padding: "0 12px", height: 34, alignItems: "center", background: "var(--card)", borderBottom: "1px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 700, fontSize: 12, letterSpacing: "0.03em", position: "sticky", top: 0, zIndex: 10 }}>
            <span style={{ whiteSpace: "nowrap" }}>KEY</span>
            <span style={{ whiteSpace: "nowrap" }}>WBS HIERARCHY</span>
            <span style={{ whiteSpace: "nowrap" }}>ARTIFACT</span>
            <span style={{ whiteSpace: "nowrap" }}>HUMAN GATE</span>
            <span style={{ textAlign: "right", whiteSpace: "nowrap" }}>%</span>
          </div>
          <div style={{ position: "relative", height: totalRowsHeight }}>
          {effectiveVirtualItems.map((vi) => {
            const it = visible[vi.index];
            if (!it) return null;
            const isSelected = selItem?.id === it.id;
            const isCollapsible = it.type === "summary" || it.type === "task";
            const badgeBg = it.type === "milestone"
              ? "var(--studio-amber-soft)"
              : it.type === "summary"
              ? "color-mix(in oklab, var(--chart-4) 15%, transparent)"
              : it.type === "task"
              ? "var(--studio-periwinkle-soft)"
              : it.hum && !it.approved
              ? "var(--studio-amber-soft)"
              : it.pct === 100
              ? "var(--studio-emerald-soft)"
              : "var(--studio-periwinkle-soft)";
            const badgeColor = it.type === "milestone"
              ? "var(--studio-amber)"
              : it.type === "summary"
              ? "var(--chart-4)"
              : it.type === "task"
              ? "var(--studio-periwinkle)"
              : it.hum && !it.approved
              ? "var(--studio-amber)"
              : it.pct === 100
              ? "var(--studio-emerald)"
              : "var(--studio-periwinkle)";

            return (
              <div
                key={it.id}
                data-wbs-key={it.aliasKey || it.id}
                data-node-id={it.id}
                data-node-type={it.type}
                onClick={() => {
                  setSelectedId(it.id);
                  setBcExpanded(false);
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${vi.start}px)`,
                  display: "grid",
                  gridTemplateColumns: "56px minmax(260px, 1fr) 92px 124px 44px",
                  alignItems: "center",
                  height: ROW_H,
                  padding: "0 12px",
                  borderBottom: "1px solid color-mix(in oklab, var(--border) 65%, transparent)",
                  background: isSelected
                    ? "var(--studio-periwinkle-soft)"
                    : it.hum && !it.approved
                    ? "var(--studio-amber-soft)"
                    : it.type === "task"
                    ? "color-mix(in oklab, var(--muted) 45%, transparent)"
                    : "transparent",
                  cursor: "pointer"
                }}
              >
                <span>
                  <span style={{
                    display: "inline-block",
                    fontFamily: "'IBM Plex Mono', Consolas, monospace",
                    fontWeight: 700,
                    fontSize: 12,
                    padding: "2px 7px",
                    borderRadius: 9999,
                    background: badgeBg,
                    color: badgeColor,
                  }}>
                    {it.id}
                  </span>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: Math.min(72, it.lv * 9), overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", paddingRight: 8 }}>
                  {isCollapsible ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setCollapsed((p) => ({ ...p, [it.id]: !p[it.id] }));
                      }}
                      style={{ color: it.type === "task" ? "var(--studio-periwinkle)" : "var(--chart-4)", fontWeight: 700, width: 12, display: "inline-block" }}
                      title={collapsed[it.id] ? "Expand children" : "Collapse children"}
                    >
                      {collapsed[it.id] ? "▸" : "▾"}
                    </span>
                  ) : (
                    <span style={{ color: "var(--muted-foreground)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>└─</span>
                  )}
                  {it.parent && (
                    <span style={{ fontSize: 12, background: "var(--muted)", color: "var(--muted-foreground)", padding: "1px 6px", borderRadius: 9999, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }} title={`Parent: ${it.parent}`}>
                      ↳ {it.parent}
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 9999,
                      flexShrink: 0,
                      background:
                        it.status === "canceled"
                          ? "var(--muted-foreground)"
                          : it.status === "done"
                            ? "var(--studio-emerald)"
                            : it.hum && !it.approved
                              ? "var(--studio-amber)"
                              : "var(--studio-periwinkle)",
                    }}
                  />
                  <span
                    data-testid={`timeline-wbs-title-${it.id}`}
                    style={{
                      fontWeight: it.type === "summary" || it.type === "task" ? 600 : 400,
                      fontSize: it.type === "subtask" ? 12 : 14,
                      color: it.type === "subtask" ? "var(--muted-foreground)" : "var(--foreground)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      minWidth: 0,
                      flex: 1,
                    }}
                    title={it.title}
                  >
                    {it.title.replace(/^\[(?:ACTIVE|ABANDONED|RETIRED|MET|CLOSED)\]\s*/i, "")}
                  </span>
                  {it.type === "summary" && typeof it.subtaskCount === "number" && (
                    <span style={{ fontSize: 12, background: "color-mix(in oklab, var(--chart-4) 15%, transparent)", color: "var(--chart-4)", padding: "1px 6px", borderRadius: 9999, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>
                      {it.subtaskCount} {it.lv === 6 ? "Tasks" : "br"}
                    </span>
                  )}
                  {it.type === "task" && typeof it.subtaskCount === "number" && (
                    <span style={{ fontSize: 12, background: "var(--studio-periwinkle-soft)", color: "var(--studio-periwinkle)", padding: "1px 6px", borderRadius: 9999, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>
                      {it.subtaskCount} ST
                    </span>
                  )}
                  {it.issueKey && (
                    <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: "var(--muted-foreground)" }}>
                      ({it.issueKey})
                    </span>
                  )}
                  {(() => {
                    const liveAgent =
                      (it.issueId != null ? liveOfficeState.byIssueId.get(Number(it.issueId)) : undefined) ||
                      (it.issueKey ? liveOfficeState.byIdent.get(String(it.issueKey).toUpperCase()) : undefined);
                    if (!liveAgent) return null;
                    return (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateFeatureInstant(openOfficePath(projRef));
                        }}
                        style={{
                          fontSize: 12,
                          background: "var(--studio-emerald-soft)",
                          color: "var(--studio-emerald)",
                          border: "1px solid color-mix(in oklab, var(--studio-emerald) 35%, transparent)",
                          borderRadius: 9999,
                          padding: "1px 8px",
                          fontWeight: 600,
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                        title={`Live in Open Office: ${liveAgent}`}
                      >
                        {liveAgent} · LIVE
                      </button>
                    );
                  })()}
                </div>
                <div>
                  {it.art && (
                    <button
                      className="artifact-chip"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(it.id);
                        setModalId(it.id);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        minHeight: 32,
                        background: "var(--studio-periwinkle-soft)",
                        color: "var(--studio-periwinkle)",
                        border: "1px solid color-mix(in oklab, var(--studio-periwinkle) 30%, transparent)",
                        borderRadius: 9999,
                        padding: "4px 12px",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                      title={`Preview ${it.art.name}`}
                    >
                      📄 Preview
                    </button>
                  )}
                </div>
                <div>
                  {it.hum ? (
                    <span style={{
                      background: it.approved ? "var(--studio-emerald-soft)" : "var(--studio-amber-soft)",
                      color: it.approved ? "var(--studio-emerald)" : "var(--studio-amber)",
                      border: `1px solid color-mix(in oklab, ${it.approved ? "var(--studio-emerald)" : "var(--studio-amber)"} 40%, transparent)`,
                      borderRadius: 9999,
                      padding: "2px 8px",
                      fontSize: 12,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      whiteSpace: "nowrap"
                    }}>
                      {it.approved ? "✓ Approved" : `👤 ${it.hum}`}
                    </span>
                  ) : (
                    <span style={{ color: "var(--muted-foreground)", fontSize: 12, background: "var(--muted)", padding: "2px 8px", borderRadius: 9999, display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
                      Auto
                    </span>
                  )}
                </div>
                <span style={{ textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 12, fontVariantNumeric: "tabular-nums", color: it.pct === 100 ? "var(--studio-emerald)" : it.hum && !it.approved ? "var(--studio-amber)" : "var(--studio-periwinkle)" }}>
                  {it.type === "milestone" ? "◆" : `${it.pct}%`}
                </span>
              </div>
            );
          })}
          </div>
        </div>

        {/* Right Row-Aligned Dependency Gantt Reflecting H1–H7 Brackets, Task Summary Bars, and Subtask Bars */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", overflowX: "auto" }}>
          <div style={{ minWidth: SLOTS.length * 48, display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(20, minmax(48px, 1fr))", height: 34, background: "var(--card)", borderBottom: "1px solid var(--border)", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
              {SLOTS.map((s) => (
                <span key={s} style={{ textAlign: "center", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", padding: "0 2px", color: "var(--muted-foreground)", borderRight: "1px solid color-mix(in oklab, var(--border) 65%, transparent)" }}>
                  {s}
                </span>
              ))}
            </div>
            <div style={{ position: "relative", flex: 1, height: totalRowsHeight }}>
              {/* Subtle vertical grid columns */}
              <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(20, minmax(48px, 1fr))", pointerEvents: "none" }}>
                {SLOTS.map((s) => (
                  <div key={s} style={{ borderRight: "1px solid color-mix(in oklab, var(--border) 45%, transparent)" }} />
                ))}
              </div>

              {effectiveVirtualItems.map((vi) => {
                const it = visible[vi.index];
                if (!it) return null;
                const leftPct = (it.s / 20) * 100;
                const widthPct = (Math.max(1, it.e - it.s + 1) / 20) * 100;
                const color = it.hum && !it.approved
                  ? "var(--studio-amber)"
                  : it.pct === 100
                  ? "var(--studio-emerald)"
                  : it.type === "summary"
                  ? "var(--chart-4)"
                  : "var(--studio-periwinkle)";

                return (
                  <div
                    key={it.id}
                    data-gantt-row={it.id}
                    onClick={() => {
                      setSelectedId(it.id);
                      setBcExpanded(false);
                    }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      transform: `translateY(${vi.start}px)`,
                      height: ROW_H,
                      borderBottom: "1px solid color-mix(in oklab, var(--border) 65%, transparent)",
                      display: "flex",
                      alignItems: "center",
                      background: selItem?.id === it.id ? "color-mix(in oklab, var(--studio-periwinkle) 10%, transparent)" : "transparent"
                    }}
                  >
                    {it.type === "milestone" ? (
                      <div
                        title={it.title}
                        style={{
                          position: "absolute",
                          left: `calc(${leftPct}% + 10px)`,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          color: "var(--studio-amber)",
                          fontSize: 12,
                          cursor: "pointer",
                          fontWeight: 700,
                          zIndex: 3,
                          whiteSpace: "nowrap"
                        }}
                      >
                        <span style={{ fontSize: 14, lineHeight: 1 }}>◆</span>
                        <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", background: "var(--card)", padding: "1px 7px", borderRadius: 9999, border: "1px solid color-mix(in oklab, var(--studio-amber) 45%, transparent)" }}>
                          [{it.id}] {it.title.replace("[Milestone] ", "")}
                        </span>
                      </div>
                    ) : it.type === "summary" ? (
                      /* Tier 1: H1–H7 Horizon Summary Bracket (┏━━━━━┓) */
                      <div
                        style={{
                          position: "absolute",
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          height: 8,
                          background: "color-mix(in oklab, var(--chart-4) 15%, transparent)",
                          borderTop: "2.5px solid var(--chart-4)",
                          borderLeft: "4px solid var(--chart-4)",
                          borderRight: "4px solid var(--chart-4)",
                          borderRadius: "2px 2px 0 0",
                          cursor: "pointer",
                          zIndex: 2
                        }}
                      >
                        <div style={{ width: `${it.pct}%`, height: "100%", background: "var(--chart-4)", opacity: 0.45 }} />
                        <span style={{ position: "absolute", right: 6, top: -14, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: "var(--chart-4)", fontWeight: 700 }}>
                          [{it.id}] {it.pct}%
                        </span>
                      </div>
                    ) : it.type === "task" ? (
                      /* Tier 2: Parent Task Summary Bar + Bracket (T1.1..T7.1) */
                      <div
                        style={{
                          position: "absolute",
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          height: 20,
                          background: "var(--card)",
                          border: `1.5px solid ${color}`,
                          borderTop: `3px solid ${color}`,
                          borderRadius: 6,
                          overflow: "hidden",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          zIndex: 3,
                          boxShadow: "0 1px 4px color-mix(in oklab, var(--foreground) 12%, transparent)"
                        }}
                      >
                        <div style={{ width: `${it.pct}%`, height: "100%", background: color, opacity: 0.25 }} />
                        <span style={{ position: "absolute", left: 6, fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: "var(--foreground)", whiteSpace: "nowrap" }}>
                          {it.id} ({it.subtaskCount} ST) · {it.pct}%
                        </span>
                      </div>
                    ) : (
                      /* Tier 3: Child Subtask Bar (ST-1.1..ST-7.2) */
                      <div
                        style={{
                          position: "absolute",
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          height: 16,
                          background: "var(--card)",
                          border: `1px solid ${color}`,
                          borderRadius: 5,
                          overflow: "hidden",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          zIndex: 3
                        }}
                      >
                        <div style={{ width: `${it.pct}%`, height: "100%", background: color, opacity: 0.28 }} />
                        <span style={{ position: "absolute", left: 5, fontSize: 12, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", color: "var(--foreground)", whiteSpace: "nowrap" }}>
                          {it.id} · {it.pct}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Crisp Solid Orthogonal Finish-to-Start (FS) Step-Arrows */}
              <svg
                id="dep-svg-overlay"
                viewBox={`0 0 1000 ${svgHeight}`}
                preserveAspectRatio="none"
                style={{ position: "absolute", inset: 0, width: "100%", height: svgHeight, pointerEvents: "none", zIndex: 4 }}
              >
                <defs>
                  <marker id="fs-arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--studio-periwinkle)" />
                  </marker>
                  <marker id="fs-arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--studio-amber)" />
                  </marker>
                </defs>
                {visible.map((it, rIdx) =>
                  (it.deps || []).map((depId: string) => {
                    if (it.type === "summary") return null;
                    if (it.type === "task" && !collapsed[it.id]) return null;

                    const dIdx = visibleIndexById.get(depId);
                    if (dIdx === undefined || dIdx < 0) return null;
                    if (
                      (rIdx < minVisIdx - 5 || rIdx > maxVisIdx + 5) &&
                      (dIdx < minVisIdx - 5 || dIdx > maxVisIdx + 5)
                    ) {
                      return null;
                    }
                    const dep = visible[dIdx];
                    if (!dep || dep.type === "summary") return null;

                    const x1 = dep.type === "milestone"
                      ? dep.s * 50 + 18
                      : (dep.e + 1) * 50;
                    const y1 = dIdx * ROW_H + ROW_H / 2;

                    const x2 = it.type === "milestone"
                      ? it.s * 50 + 8
                      : it.s * 50;
                    const y2 = rIdx * ROW_H + ROW_H / 2;

                    const midX = Math.max(x1 + 6, Math.round((x1 + x2) / 2));
                    const isHumTarget = !!(it.hum && !it.approved);
                    const strokeColor = isHumTarget ? "var(--studio-amber)" : "var(--studio-periwinkle)";
                    const markerUrl = isHumTarget ? "url(#fs-arrow-amber)" : "url(#fs-arrow-cyan)";
                    const pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

                    return (
                      <g key={`${depId}->${it.id}`}>
                        <circle cx={x1} cy={y1} r={2.5} fill={strokeColor} />
                        <path
                          d={pathD}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={1.6}
                          strokeLinejoin="round"
                          markerEnd={markerUrl}
                        />
                      </g>
                    );
                  })
                )}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Right-Hand Studio Slide-Over Detail Drawer */}
      {selItem && (
        <div
          id="item-slideover"
          role="dialog"
          aria-modal="true"
          data-overlay="true"
          aria-label={selItem.title}
          style={{
            position: "absolute",
            top: 46,
            right: 0,
            bottom: 0,
            width: "min(480px, 94vw)",
            background: "var(--card)",
            borderLeft: "1px solid var(--border)",
            padding: "18px 20px",
            overflowY: "auto",
            zIndex: 30,
            boxShadow: "var(--side-panel-shadow)",
            display: "flex",
            flexDirection: "column",
            gap: 14
          }}
        >
          {/* Drawer Top Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div id="drawer-breadcrumbs" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: "var(--studio-periwinkle)" }}>
              {selItem.bc.length > 3 && !bcExpanded ? (
                <>
                  <button
                    id="btn-expand-breadcrumb"
                    onClick={() => setBcExpanded(true)}
                    title="Click to expand full H1–H7 → Task → Subtask lineage path"
                    style={{
                      background: "var(--muted)",
                      color: "var(--studio-amber)",
                      border: "1px solid var(--border)",
                      borderRadius: 9999,
                      padding: "1px 8px",
                      cursor: "pointer",
                      fontWeight: 700
                    }}
                  >
                    ....
                  </button>
                  <span style={{ color: "var(--muted-foreground)" }}>&gt;</span>
                  <span>{selItem.bc[selItem.bc.length - 2]}</span>
                  <span style={{ color: "var(--muted-foreground)" }}>&gt;</span>
                  <strong style={{ color: "var(--foreground)" }}>{selItem.bc[selItem.bc.length - 1]}</strong>
                </>
              ) : (
                <span>{selItem.bc.join(" > ")}</span>
              )}
            </div>
            <button
              id="btn-close-drawer"
              type="button"
              aria-label="Close detail drawer"
              title="Close detail drawer (Esc)"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedId(null);
                setBcExpanded(false);
              }}
              style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)", borderRadius: 9999, padding: "4px 10px", cursor: "pointer", fontSize: 12, flexShrink: 0, position: "relative", zIndex: 5 }}
            >
              ✕
            </button>
          </div>

          {/* Human-Readable Item Title & Status Bar */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 12, background: "var(--studio-periwinkle-soft)", color: "var(--studio-periwinkle)", padding: "2px 8px", borderRadius: 9999 }}>
                {selItem.id} ({selItem.type.toUpperCase()})
              </span>
              {selItem.issueKey && (
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--muted-foreground)", background: "var(--muted)", padding: "2px 8px", borderRadius: 9999 }}>
                  ACCORD: {selItem.issueKey}
                </span>
              )}
              <span style={{ background: "var(--muted)", color: selItem.pct === 100 ? "var(--studio-emerald)" : "var(--foreground)", padding: "2px 8px", borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
                {selItem.pct}% Complete ({SLOTS[selItem.s]}–{SLOTS[selItem.e]})
              </span>
              {selItem.issueId && (
                <button
                  onClick={() => props.onOpenIssue?.(selItem.issueId!)}
                  style={{ background: "var(--studio-periwinkle-soft)", color: "var(--studio-periwinkle)", border: "1px solid color-mix(in oklab, var(--studio-periwinkle) 35%, transparent)", borderRadius: 9999, padding: "2px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}
                >
                  ↗ Open Issue
                </button>
              )}
            </div>
            <h3 style={{ margin: "4px 0 6px", fontSize: 16, fontWeight: 700, lineHeight: 1.35, color: "var(--foreground)" }}>
              {selItem.title}
            </h3>
            <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: 12, lineHeight: 1.55 }}>
              {selItem.content}
            </p>
          </div>

          {/* 1. HUMAN DECISION BRIEF CARD */}
          {selItem.decision && (
            <div
              id="human-decision-brief-card"
              style={{
                background: selItem.approved ? "var(--studio-emerald-soft)" : "var(--studio-amber-soft)",
                border: `1px solid ${selItem.approved ? "var(--studio-emerald)" : "var(--studio-amber)"}`,
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: selItem.approved ? "var(--studio-emerald)" : "var(--studio-amber)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {selItem.approved ? "✓ Human Decision Approved" : `👤 ${selItem.decision.gateLabel}`}
                </span>
                {!selItem.approved && (
                  <button
                    id="btn-drawer-approve-hum"
                    onClick={() => handleApproveGate(selItem.id)}
                    style={{
                      background: "var(--studio-emerald)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 9999,
                      padding: "5px 14px",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer"
                    }}
                  >
                    ✓ Approve & Sign Off
                  </button>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.4 }}>
                {selItem.decision.question}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--foreground)" }}>Why You Are Needed: </strong>
                {selItem.decision.whyNeeded}
              </div>
              <div style={{ fontSize: 12, color: "var(--foreground)", background: "var(--card)", padding: "8px 10px", borderRadius: 8, borderLeft: "3px solid var(--studio-emerald)", lineHeight: 1.45 }}>
                <strong style={{ color: "var(--studio-emerald)" }}>Recommendation: </strong>
                {selItem.decision.recommendation}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.45 }}>
                <strong>Impact on Approval: </strong>
                {selItem.decision.impact}
              </div>
            </div>
          )}

          {/* 2. FORMATTED HUMAN-READABLE ARTIFACT PREVIEW CARD */}
          {selItem.art && (
            <div style={{ background: "var(--muted)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <span style={{ color: "var(--studio-periwinkle)", fontWeight: 700, fontSize: 12 }}>📄 {selItem.art.name}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, background: "var(--card)", color: "var(--muted-foreground)", padding: "2px 8px", borderRadius: 9999 }}>
                    {selItem.art.type}
                  </span>
                </div>
                <button
                  onClick={() => setModalId(selItem.id)}
                  style={{
                    background: "var(--card)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: 9999,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  ⤢ Expand Full Preview
                </button>
              </div>
              {renderArtifactCardContent(selItem.art)}
            </div>
          )}

          {/* 3. DEFINITION OF DONE (DoD) / CHILD ROLLUP CHECKLIST */}
          <div style={{ background: "var(--muted)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
              {selItem.type === "task" ? "Child Subtasks Rollup & DoD" : "Definition of Done (DoD Checklist)"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {selItem.dod.map((d, idx) => {
                const isDone = d.done || selItem.approved;
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: isDone ? "var(--foreground)" : "var(--muted-foreground)" }}>
                    <span style={{ color: isDone ? "var(--studio-emerald)" : "var(--studio-amber)", fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {isDone ? "[✓]" : "[○]"}
                    </span>
                    <span>{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. FINISH-TO-START DEPENDENCIES */}
          <div style={{ background: "var(--muted)", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "var(--muted-foreground)" }}>
            <strong style={{ color: "var(--foreground)" }}>Upstream Finish-to-Start (FS) Dependencies: </strong>
            {selItem.deps && selItem.deps.length > 0 ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {selItem.deps.map((depId) => {
                  const depNode = items.find((x) => x.id === depId);
                  return (
                    <button
                      key={depId}
                      onClick={() => setSelectedId(depId)}
                      style={{
                        background: "var(--card)",
                        color: "var(--studio-periwinkle)",
                        border: "1px solid var(--border)",
                        borderRadius: 9999,
                        padding: "3px 10px",
                        fontSize: 12,
                        cursor: "pointer"
                      }}
                    >
                      ← {depId}: {depNode ? depNode.title : ""}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span>Governed by Parent WBS Hierarchy ({selItem.parent || "Root H1"})</span>
            )}
          </div>
        </div>
      )}

      {/* Full-Screen Human-Readable Artifact Preview Modal Lightbox */}
      {modItem && modItem.art && (
        <div
          id="artifact-modal-backdrop"
          onClick={() => setModalId(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 24
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(680px, 95vw)",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 22,
              boxShadow: "var(--modal-shadow)",
              display: "flex",
              flexDirection: "column",
              gap: 14
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
              <div>
                <strong style={{ color: "var(--studio-periwinkle)", fontSize: 14 }}>📄 {modItem.art.name}</strong>
                <span style={{ marginLeft: 10, fontSize: 12, background: "var(--muted)", color: "var(--muted-foreground)", padding: "2px 8px", borderRadius: 9999 }}>
                  {modItem.art.type} · {modItem.id}
                </span>
              </div>
              <button
                onClick={() => setModalId(null)}
                style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)", borderRadius: 9999, padding: "4px 12px", cursor: "pointer" }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>{modItem.title}</div>

            {renderArtifactCardContent(modItem.art)}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
              <button
                onClick={() => setModalId(null)}
                style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: 9999, padding: "7px 16px", cursor: "pointer" }}
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  handleApproveGate(modItem.id);
                  setModalId(null);
                }}
                style={{
                  background: "var(--studio-emerald)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 9999,
                  padding: "7px 18px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ✓ Approve & Sign Off
              </button>
            </div>
          </div>
        </div>
      )}
      {jtbdOpen && (
        <div
          id="jtbd-playbook-modal"
          onClick={() => setJtbdOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(3px)",
            zIndex: 95,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 720,
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 22,
              boxShadow: "var(--modal-shadow)",
              display: "flex",
              flexDirection: "column",
              gap: 14
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--studio-emerald)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Operating Playbook & Execution Governance
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginTop: 2 }}>
                  4-Step Effortless JTBD Workflow in ACCORD ({projKey})
                </div>
              </div>
              <button
                onClick={() => setJtbdOpen(false)}
                style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)", borderRadius: 9999, padding: "4px 12px", cursor: "pointer" }}
              >
                ✕ Close
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "var(--muted)", borderRadius: 12, padding: 12 }}>
                <div style={{ fontWeight: 700, color: "var(--studio-periwinkle)", fontSize: 12, marginBottom: 4 }}>1. Capture JTBD Intent (+ New issue / AI Chat)</div>
                <div style={{ color: "var(--muted-foreground)", fontSize: 12, lineHeight: 1.5 }}>
                  Click <b>+ New issue</b> in the workspace header or message <code>@orchestrator</code> in <b>AI Chat</b> with your goal. ACCORD creates the work item directly without manual H1–H7 form entry.
                </div>
              </div>
              <div style={{ background: "var(--muted)", borderRadius: 12, padding: 12 }}>
                <div style={{ fontWeight: 700, color: "var(--chart-4)", fontSize: 12, marginBottom: 4 }}>2. Auto 7H Cascade & Open Office Dispatch</div>
                <div style={{ color: "var(--muted-foreground)", fontSize: 12, lineHeight: 1.5 }}>
                  <b>Open Office Dispatch</b> auto-classifies the job, embeds the 4-Block Goal + Pre-Mortem + DoD checklist, and links Tasks &amp; Subtasks to Sprint Cycles &amp; H1 Initiatives.
                </div>
              </div>
              <div style={{ background: "var(--muted)", borderRadius: 12, padding: 12 }}>
                <div style={{ fontWeight: 700, color: "var(--studio-emerald)", fontSize: 12, marginBottom: 4 }}>3. Progressive Disclosure & Workflow Guide (?)</div>
                <div style={{ color: "var(--muted-foreground)", fontSize: 12, lineHeight: 1.5 }}>
                  Toggle <b>Focus Active</b> vs. <b>All Horizons</b> for daily execution or BOD review, and open the <b>Workflow Guide (?)</b> anytime for contextual instructions and grounded citations.
                </div>
              </div>
              <div style={{ background: "var(--muted)", borderRadius: 12, padding: 12 }}>
                <div style={{ fontWeight: 700, color: "var(--studio-amber)", fontSize: 12, marginBottom: 4 }}>4. Manage by Exception (Human Gate)</div>
                <div style={{ color: "var(--muted-foreground)", fontSize: 12, lineHeight: 1.5 }}>
                  Click <b>Human Gate ({humCount})</b> to filter only rows requiring your decision, inspect the plain-English Decision Brief, and click <b>✓ Approve &amp; Sign Off</b>.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimelineView;
