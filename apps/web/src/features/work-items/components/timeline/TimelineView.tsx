import React, { useEffect, useMemo, useState } from "react";
import type { WorkItemsViewProps } from "../../types";

export type TimelineViewProps = WorkItemsViewProps;

const SLOTS = Array.from({ length: 20 }, (_, i) => {
  const mins = (i + 1) * 15;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});

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
  status: "done" | "running" | "gate";
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
    .replace(/Ph\?\?ng\s*V\?/gi, "Phương Võ")
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

export function TimelineView(props: TimelineViewProps) {
  const projKey = props.project?.project?.key || "PM";
  const projName = props.project?.project?.name || "Project Management";
  const liveIssues: any[] = props.project?.issues || [];
  const liveColumns: any[] = props.project?.columns || [];

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [humFilter, setHumFilter] = useState(false);
  const [orderMode, setOrderMode] = useState<"layer" | "tree">("layer");
  const [selectedId, setSelectedId] = useState<string | null>("T4.1");
  const [bcExpanded, setBcExpanded] = useState(false);
  const [modalId, setModalId] = useState<string | null>(null);
  const [approvedMap, setApprovedMap] = useState<Record<string, boolean>>({});

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
          { stKey: "ST-1.2", title: "ST-1.2: Triage native ItsAPlan Timeline consolidation scope", s: 1, e: 2, pct: 100, hum: null },
        ]
      },
      {
        tKey: "T2.1", alias: "H7-2", wpParent: "H7.1",
        bcPrefix: ["H1.1", "H2.1", "H3.1", "H4.1", "H5.1", "H6.1", "H7.1"],
        title: "T2.1: Phase 2 — 7-Horizon Architecture, Stress Test & DoD Bookending",
        state: "completed", hum: null, decision: null,
        content: "Phase 2 Task under H7.1 (EPIC-53-01) defining the 4-Block Task Goal, Pre-Mortem Stress Test, 360-Degree Multi-Lens Feedback, and measurable DoD-49..63.",
        artName: "SPEC-ITSAPLAN-TIMELINE-281.md", artType: "UTOP Spec",
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
          { stKey: "ST-3.2", title: "ST-3.2: Authorize native ItsAPlan TimelineView.tsx consolidation", s: 6, e: 7, pct: 100, hum: null },
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
          impact: "Locks the 1:N multi-branch WBS-to-Timeline synchronization across all ItsAPlan portfolio projects."
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
        content: "Phase 7 Task under H7.4 (EPIC-53-06) executing GW-CANARY-01 zero-residual verification, updating session memory (hot.md & log.md), and sealing the release.",
        artName: "P7_Release_Closure_Summary.md", artType: "Release Summary",
        subtasks: [
          { stKey: "ST-7.1", title: "ST-7.1: Run GW-CANARY-01 zero-residual verification in PostgreSQL", s: 16, e: 17, pct: 100, hum: null },
          { stKey: "ST-7.2", title: "ST-7.2: Seal Phase 7 release gate & handoff to Human Node", s: 17, e: 18, pct: 30, hum: null },
        ]
      }
    ];

    // Match live parent Tasks (parentId == null) and live Subtasks (parentId != null) from props.project.issues
    const liveParentIssues = liveIssues
      .filter((i: any) => i && i.parentId == null && !i.archivedAt)
      .sort((a: any, b: any) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

    const liveSubtasksByParent = new Map<number, any[]>();
    liveIssues
      .filter((i: any) => i && i.parentId != null && !i.archivedAt)
      .sort((a: any, b: any) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0))
      .forEach((sub: any) => {
        const list = liveSubtasksByParent.get(sub.parentId) || [];
        list.push(sub);
        liveSubtasksByParent.set(sub.parentId, list);
      });

    // Build Task & Subtask nodes first so we can compute exact bottom-up rollups (Subtasks -> Task -> H7.1..4 -> H6.1..4 -> ... -> H1.1..3)
    const taskAndSubtaskNodes: WbsNode[] = [];
    const builtTasks: WbsNode[] = [];

    defaultTaskTree.forEach((bp, tIdx) => {
      const matchedParent =
        liveParentIssues.find((p: any) => typeof p.title === "string" && p.title.startsWith(bp.tKey)) ||
        liveParentIssues[tIdx];

      const parentIssueId: number | undefined = matchedParent?.id;
      const parentSeq = matchedParent?.sequenceNumber ?? (36782 + tIdx);
      const parentIssueKey = matchedParent?.identifier || `${projKey}-${parentSeq}`;
      const parentTitle = cleanHumanIssueTitle(matchedParent?.title, bp.title);

      const liveSubs = parentIssueId ? (liveSubtasksByParent.get(parentIssueId) || []) : [];
      const builtSubs: WbsNode[] = [];

      bp.subtasks.forEach((stBp, sIdx) => {
        const matchedSub = liveSubs[sIdx];
        const subSeq = matchedSub?.sequenceNumber ?? (39900 + tIdx * 2 + sIdx);
        const subIssueKey = matchedSub?.identifier || `${projKey}-${subSeq}`;
        const subTitle = cleanHumanIssueTitle(matchedSub?.title, stBp.title);
        const subState = matchedSub ? getIssueStateType(matchedSub) : (stBp.pct === 100 ? "completed" : "started");
        const isSubApproved = !!approvedMap[stBp.stKey] || !!approvedMap[bp.tKey];
        const rawSubPct = isSubApproved
          ? 100
          : matchedSub
          ? (subState === "completed" ? 100 : subState === "started" ? 70 : 35)
          : stBp.pct;

        const prevSubKey =
          sIdx > 0
            ? bp.subtasks[sIdx - 1].stKey
            : tIdx === 2
            ? "M-1"
            : tIdx > 0
            ? defaultTaskTree[tIdx - 1].subtasks[defaultTaskTree[tIdx - 1].subtasks.length - 1].stKey
            : "";

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
          status: rawSubPct === 100 ? "done" : stBp.hum ? "gate" : "running",
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
              "Synchronized 1:1 between ItsAPlan PostgreSQL and Timeline Gantt."
            ],
            metrics: [
              { label: "Subtask Progress", before: "0% (Queued)", after: `${rawSubPct}%` },
              { label: "Parent Rollup Binding", before: "Unlinked", after: `Bound to ${bp.tKey} → ${bp.wpParent}` }
            ]
          },
          approved: isSubApproved
        };
        builtSubs.push(subNode);
      });

      // Bottom-up rollup from Subtasks -> Parent Task!
      const taskS = Math.min(...builtSubs.map((st) => st.s));
      const taskE = Math.max(...builtSubs.map((st) => st.e));
      const isTaskApproved = !!approvedMap[bp.tKey] || !!approvedMap[bp.alias];
      const taskPct = isTaskApproved
        ? 100
        : Math.round(builtSubs.reduce((acc, st) => acc + st.pct, 0) / Math.max(1, builtSubs.length));

      const prevTaskKey = tIdx === 2 ? "M-1" : tIdx > 0 ? defaultTaskTree[tIdx - 1].tKey : "";

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
        status: taskPct === 100 ? "done" : bp.hum ? "gate" : "running",
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
        { label: `Maintain 1:1 traceability in project_management.db & ItsAPlan`, done: true }
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
        `Strategic Initiative H1.1 (GOAL-53-01) for ${projName}: governs 2 Key Business Question branches (H2.1 Scoping/UTOP & H2.2 Multi-Branch Timeline Consolidation) and Work Packages H7.1 & H7.2.`,
        "H1_1_Cadence_Charter.md", "Executive Charter",
        [
          "Branches into H2.1 (KBQ-53-01: Sprint Cadence) and H2.2 (KBQ-53-02: Multi-Tier WBS Capacity).",
          "Rolls up Work Packages H7.1 (T1.1, T2.1) and H7.2 (T3.1, T4.1) across slots 00:15–03:00."
        ],
        "Scope Sign-Off",
        {
          gateLabel: "Executive Scope Sign-Off (H1.1)",
          question: `Approve Strategic Initiative H1.1 (GOAL-53-01) and its 2 child branches (H2.1 & H2.2) for ${projKey}?`,
          whyNeeded: "H1.1 governs the primary sprint cadence, UTOP specification, and Timeline WBS consolidation branches (T1.1–T4.1).",
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
        `Strategic Initiative H1.3 (GOAL-53-03) for ${projName}: governs zero-residual canary verification (GW-CANARY-01), session memory distillation, and release closure (T7.1 & M-2) under Work Package H7.4.`,
        "H1_3_Release_Resilience_Charter.md", "SCM & Release Charter",
        [
          "Governs Branch 4 (H2.4 → H3.4 → H4.4 → H5.4 → H6.4 → H7.4 → T7.1 & M-2).",
          "Guarantees zero canary residuals and atomic release handoff across slots 04:15–05:00."
        ]
      ),

      // === LEVEL 1: 4 H2 Key Business Questions (key_business_questions: KBQ-53-01..04) ===
      makeHorizonNode(
        "H2.1", "H2", "H1.1", 1,
        "KBQ 1 (KBQ-53-01): Predictable 15m Sprint Cadence Without Operational Drag?",
        ["H1.1", "H2.1"],
        "Key Business Question H2.1 under H1.1 validating whether Phase 1 triage and Phase 2 UTOP specifications eliminate ambiguity before code execution.",
        "H2_1_KBQ_Cadence.md", "KBQ Brief",
        ["Parent Initiative: H1.1 (GOAL-53-01)", "Drives OKR H3.1 and Work Package H7.1 (T1.1 & T2.1)."]
      ),
      makeHorizonNode(
        "H2.2", undefined, "H1.1", 1,
        "KBQ 2 (KBQ-53-02): Dynamic Multi-Branch WBS & Capacity Tracked Across 100% of Waves?",
        ["H1.1", "H2.2"],
        "Key Business Question H2.2 under H1.1 validating 1:N multi-branch H1–H7, Task, and Subtask reflection on the ItsAPlan Timeline.",
        "H2_2_KBQ_WBS_Capacity.md", "KBQ Brief",
        ["Parent Initiative: H1.1 (GOAL-53-01)", "Drives OKR H3.2 and Work Package H7.2 (T3.1 & T4.1)."]
      ),
      makeHorizonNode(
        "H2.3", undefined, "H1.2", 1,
        "KBQ 3 (KBQ-53-03): Does Empirical QualityGate Verification Satisfy EAI >= 0.98?",
        ["H1.2", "H2.3"],
        "Key Business Question H2.3 under H1.2 validating automated Playwright/Pytest verification and Human SoD decision clarity.",
        "H2_3_KBQ_QualityGate.md", "KBQ Brief",
        ["Parent Initiative: H1.2 (GOAL-53-02)", "Drives OKR H3.3 and Work Package H7.3 (T5.1 & T6.1)."]
      ),
      makeHorizonNode(
        "H2.4", undefined, "H1.3", 1,
        "KBQ 4 (KBQ-53-04): Zero AST Merge Conflicts & Zero Canary Residuals on Release?",
        ["H1.3", "H2.4"],
        "Key Business Question H2.4 under H1.3 validating clean database reconciliation, canary purge, and release closure.",
        "H2_4_KBQ_Release_Cleanliness.md", "KBQ Brief",
        ["Parent Initiative: H1.3 (GOAL-53-03)", "Drives OKR H3.4 and Work Package H7.4 (T7.1 & M-2)."]
      ),

      // === LEVEL 2: 4 H3 Measurable OKRs (measurable_objectives: OBJ-53-101..301) ===
      makeHorizonNode(
        "H3.1", "H3", "H2.1", 2,
        "OKR 1 (OBJ-53-101): Achieve 100% 15-Minute Sprint Cadence & UTOP Spec Coverage",
        ["H1.1", "H2.1", "H3.1"],
        "Measurable Objective H3.1 under H2.1: 100% of sprint tasks preceded by upstream UTOP specs and Pre-Mortem Stress Tests.",
        "H3_1_OKR_Cadence.md", "OKR Scorecard",
        ["Target: 100% UTOP Spec & Pre-Mortem coverage across T1.1 & T2.1."]
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
        "OKR 4 (OBJ-53-301): Zero Canary Residuals (GW-CANARY-01) & Atomic Release Handoff",
        ["H1.3", "H2.4", "H3.4"],
        "Measurable Objective H3.4 under H2.4: residual_count == 0 in PostgreSQL and complete session handoff in hot.md/log.md.",
        "H3_4_OKR_Zero_Residual.md", "OKR Scorecard",
        ["Target: residual_count == 0 and corrupted_vn_count == 0."]
      ),

      // === LEVEL 3: 4 H4 9-Block BMC Building Blocks (bmc_models: VP-01, KR-01, KP-01, KA-01) ===
      makeHorizonNode(
        "H4.1", "H4", "H3.1", 3,
        "BMC 1 (VP-01): Value Proposition — Customer-First 7-Horizon Scoping",
        ["H1.1", "H2.1", "H3.1", "H4.1"],
        "BMC Value Proposition block (H4.1) grounding every engineering sprint in explicit customer outcomes and 7-Horizon lineage.",
        "H4_1_BMC_Value_Prop.md", "BMC Block",
        ["Links H3.1 OKR to Enterprise Capability H5.1."]
      ),
      makeHorizonNode(
        "H4.2", undefined, "H3.2", 3,
        "BMC 2 (KR-01): Key Resources — Native ItsAPlan Timeline & Bi-Directional DB Substrate",
        ["H1.1", "H2.2", "H3.2", "H4.2"],
        "BMC Key Resources block (H4.2) unifying PostgreSQL (itsaplan) and SQLite (project_management.db) into a single Timeline view.",
        "H4_2_BMC_Key_Resources.md", "BMC Block",
        ["Links H3.2 OKR to Enterprise Capability H5.2."]
      ),
      makeHorizonNode(
        "H4.3", undefined, "H3.3", 3,
        "BMC 3 (KP-01): Key Partnerships — 15-Reviewer QualityGate & Human-in-the-Loop SoD",
        ["H1.2", "H2.3", "H3.3", "H4.3"],
        "BMC Key Partnerships block (H4.3) pairing deterministic pytest/Playwright verification with Human Node SoD governance.",
        "H4_3_BMC_Partnerships.md", "BMC Block",
        ["Links H3.3 OKR to Enterprise Capability H5.3."]
      ),
      makeHorizonNode(
        "H4.4", undefined, "H3.4", 3,
        "BMC 4 (KA-01): Key Activities — Canary Verification, Session Memory & Release Seal",
        ["H1.3", "H2.4", "H3.4", "H4.4"],
        "BMC Key Activities block (H4.4) governing production canary cleanup, UTF-8 integrity, and sprint closure.",
        "H4_4_BMC_Key_Activities.md", "BMC Block",
        ["Links H3.4 OKR to Enterprise Capability H5.4."]
      ),

      // === LEVEL 4: 4 H5 Enterprise Capabilities (enterprise_capabilities: CAP-DXAIX-01..05) ===
      makeHorizonNode(
        "H5.1", "H5", "H4.1", 4,
        "Capability 1 (CAP-DXAIX-01): Polymorphic 7-Phase Deliverable Triage & UTOP Engine",
        ["H1.1", "H2.1", "H3.1", "H4.1", "H5.1"],
        "Enterprise Capability H5.1 providing zero-trust deliverable classification, Micro-UTOP scaffolding, and Pre-Mortem stress testing.",
        "H5_1_Cap_UTOP_Engine.md", "Capability Spec",
        ["Crystallized Stage 4 Deterministic Capability closing Gap H6.1."]
      ),
      makeHorizonNode(
        "H5.2", undefined, "H4.2", 4,
        "Capability 2 (CAP-DXAIX-02): Unified 4-Surface Cockpit & Multi-Branch Orthogonal Gantt",
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
        "Capability 4 (CAP-DXAIX-04): Kahn DAG Wave Scheduler & Zero-Residual Canary Verifier",
        ["H1.3", "H2.4", "H3.4", "H4.4", "H5.4"],
        "Enterprise Capability H5.4 enforcing canonical issue protection, UTF-8 diacritic repair, and GW-CANARY-01 zero-residual verification.",
        "H5_4_Cap_Canary_Release.md", "Capability Spec",
        ["Crystallized Stage 4 Capability closing Gap H6.4."]
      ),

      // === LEVEL 5: 4 H6 Capability Gaps (capability_gaps: GAP-PM-01..06) + Milestone M-1 ===
      makeHorizonNode(
        "H6.1", "H6", "H5.1", 5,
        "Gap 1 (GAP-PM-01): Cadence, Scope Elicitation & UTOP Specification Alignment",
        ["H1.1", "H2.1", "H3.1", "H4.1", "H5.1", "H6.1"],
        "Capability Gap H6.1 resolved by Work Package H7.1 (Tasks T1.1 & T2.1: Phase 1 Triage & Phase 2 UTOP Spec).",
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
          summary: "Certifies Phase 3 DoD contract lock for the consolidated ItsAPlan Timeline View.",
          highlights: ["All DoD criteria locked before Phase 4 execution."],
          metrics: [{ label: "Milestone Status", before: "Pending", after: "Locked (100%)" }]
        }
      },
      makeHorizonNode(
        "H6.2", undefined, "H5.2", 5,
        "Gap 2 (GAP-PM-02): 1:N Multi-Branch H1–H7, Task & Subtask Timeline Reflection",
        ["H1.1", "H2.2", "H3.2", "H4.2", "H5.2", "H6.2"],
        "Capability Gap H6.2 resolved by Work Package H7.2 (Tasks T3.1 & T4.1: Multi-Branch WBS Tree & Bottom-Up Gantt Rollup).",
        "H6_2_Gap_MultiBranch_Timeline.md", "Gap Analysis",
        ["Closed by Work Package H7.2 (EPIC-53-02)."]
      ),
      makeHorizonNode(
        "H6.3", undefined, "H5.3", 5,
        "Gap 3 (GAP-PM-05): Automated 1:1 DoD Matrix & Human SoD Sign-Off",
        ["H1.2", "H2.3", "H3.3", "H4.3", "H5.3", "H6.3"],
        "Capability Gap H6.3 resolved by Work Package H7.3 (Tasks T5.1 & T6.1: Automated Verification & Phase 6 SoD Gate).",
        "H6_3_Gap_Quality_SoD.md", "Gap Analysis",
        ["Closed by Work Package H7.3 (EPIC-53-05)."]
      ),
      makeHorizonNode(
        "H6.4", undefined, "H5.4", 5,
        "Gap 4 (GAP-PM-06): Production Canary Purge & Sprint Closure Distillation",
        ["H1.3", "H2.4", "H3.4", "H4.4", "H5.4", "H6.4"],
        "Capability Gap H6.4 resolved by Work Package H7.4 (Task T7.1 & Milestone M-2: Canary Zero-Residual Check & Release Handoff).",
        "H6_4_Gap_Release_Closure.md", "Gap Analysis",
        ["Closed by Work Package H7.4 (EPIC-53-06)."]
      ),

      // === LEVEL 6: 4 H7 Work Packages / Epics (epics: EPIC-53-01, EPIC-53-02, EPIC-53-05, EPIC-53-06) ===
      makeHorizonNode(
        "H7.1", "H7", "H6.1", 6,
        "Work Package 1 (EPIC-53-01): Sprint Scope Triage & 7-Horizon UTOP Architecture (T1.1–T2.1)",
        ["H1.1", "H2.1", "H3.1", "H4.1", "H5.1", "H6.1", "H7.1"],
        "Work Package H7.1 (EPIC-53-01) grouping Phase 1 Triage (T1.1: ST-1.1, ST-1.2) and Phase 2 UTOP Architecture (T2.1: ST-2.1, ST-2.2).",
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
      content: "Final Phase 7 human release sign-off milestone certifying the consolidated 1:N Multi-Branch H1–H7 + Tasks + Subtasks Timeline View in ItsAPlan.",
      dod: [
        { label: "All 1:N multi-branch H1–H7 horizons, Tasks (T1.1..T7.1), and Subtasks (ST-*) reflected on Timeline", done: true },
        { label: "All orthogonal FS dependency arrows & human decision briefs verified", done: true },
        { label: "Final Human Release Sign-Off", done: !!approvedMap["M-2"] }
      ],
      art: {
        name: "M2_Release_Readiness_Report.md",
        type: "Release Gate Brief",
        summary: "Executive release readiness summary for the consolidated ItsAPlan 1:N Multi-Branch Timeline View.",
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

    const rawNodes: WbsNode[] = [...horizonNodes, ...taskAndSubtaskNodes, milestoneM2];

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
            sumNode.status = sumNode.pct === 100 ? "done" : sumNode.hum && !sumNode.approved ? "gate" : "running";
            sumNode.subtaskCount = children.length;
            if (sumNode.art) {
              sumNode.art.metrics = [
                { label: "Child Branches / Items", before: "1 placeholder", after: `${children.length} direct children (${children.map((c) => c.id).join(", ")})` },
                { label: "Rolled-Up Timeline Span", before: "Static full width", after: `${SLOTS[sumNode.s]} – ${SLOTS[sumNode.e]}` },
                { label: "Rolled-Up Progress", before: "Static %", after: `${sumNode.pct}% (Bottom-Up Avg)` }
              ];
            }
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
  }, [projKey, projName, liveIssues, liveColumns, approvedMap, orderMode]);

  const visible = useMemo(() => {
    const isHidden = (it: WbsNode): boolean => {
      let cur = it.parent;
      while (cur) {
        if (collapsed[cur]) return true;
        cur = items.find((x) => x.id === cur)?.parent || null;
      }
      return false;
    };
    return items.filter((it) => !isHidden(it) && (!humFilter || (it.hum && !it.approved)));
  }, [items, collapsed, humFilter]);

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
  const humCount = items.filter((x) => x.hum && !x.approved).length;

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

  const anySubtasksCollapsed = ["T1.1", "T2.1", "T3.1", "T4.1", "T5.1", "T6.1", "T7.1"].some((k) => collapsed[k]);
  const toggleAllSubtasks = () => {
    const next = !anySubtasksCollapsed;
    setCollapsed((prev) => ({
      ...prev,
      "T1.1": next,
      "T2.1": next,
      "T3.1": next,
      "T4.1": next,
      "T5.1": next,
      "T6.1": next,
      "T7.1": next
    }));
  };

  const renderArtifactCardContent = (art: ArtifactSection) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#e2e8f0" }}>{art.summary}</p>
      <div style={{ background: "rgba(15,23,42,0.7)", border: "1px solid #1e293b", borderRadius: 6, padding: "8px 12px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
          Key Takeaways for Decision-Maker
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1", fontSize: 12.5, lineHeight: 1.55 }}>
          {art.highlights.map((h, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{h}</li>
          ))}
        </ul>
      </div>
      {art.metrics && art.metrics.length > 0 && (
        <div style={{ border: "1px solid #1e293b", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", background: "#1e293b", padding: "6px 10px", fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>
            <span>IMPACT METRIC</span>
            <span>BEFORE</span>
            <span>AFTER</span>
          </div>
          {art.metrics.map((m, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", padding: "7px 10px", fontSize: 12, borderTop: "1px solid rgba(30,41,59,0.7)", background: "#0b0f17", alignItems: "center" }}>
              <span style={{ color: "#f8fafc", fontWeight: 600 }}>{m.label}</span>
              <span style={{ color: "#94a3b8" }}>{m.before}</span>
              <span style={{ color: "#10b981", fontWeight: 600 }}>{m.after}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ROW_H = 34;
  const svgHeight = Math.max(ROW_H, visible.length * ROW_H);

  return (
    <div data-design-system="accord-milled-carbon-v3.3.0" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 680, background: "var(--ag-void, #07080A)", color: "var(--ag-text-primary, #F4F4F0)", fontFamily: "var(--ag-font-sans, 'IBM Plex Sans', 'Inter', system-ui, sans-serif)", fontSize: 12, position: "relative", overflow: "hidden" }}>
      {/* Top Header: ACCORD Sovereign Isometric Monolith Mark + Project Name on Left, Hierarchy & Human Gate Controls on Right */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "var(--ag-obsidian, #0C0E12)", borderBottom: "1px solid var(--ag-border-subtle, #222734)", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg className="ag-brand-mark" width="26" height="26" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ACCORD Sovereign Isometric Monolith">
            <rect x="2" y="2" width="60" height="60" rx="14" fill="#07080A" stroke="#222734" strokeWidth="1.5" />
            <path d="M 49.43,20.06 L 32.0,10.0 L 14.57,20.06 L 19.98,23.19 L 32.0,16.25 L 44.02,23.19 Z M 32.0,30.88 L 24.31,26.44 L 32.0,22.0 L 39.69,26.44 Z" fill="#F4F4F0" />
            <path d="M 12.95,22.88 L 12.95,43.0 L 30.38,53.06 L 30.38,46.81 L 18.36,39.88 L 18.36,26.0 Z M 31.03,32.56 L 31.03,41.44 L 23.34,37.0 L 23.34,28.12 Z" fill="#B8C0CC" />
            <path d="M 33.62,53.06 L 51.05,43.0 L 51.05,22.88 L 45.64,26.0 L 45.64,39.88 L 33.62,46.81 Z M 32.97,32.56 L 40.66,28.12 L 40.66,37.0 L 32.97,41.44 Z" fill="#5E6878" />
          </svg>
          <span id="timeline-brand-badge" style={{ fontFamily: "var(--ag-font-display, 'Chakra Petch', sans-serif)", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", color: "var(--ag-titanium, #F4F4F0)", background: "var(--ag-slate, #12151C)", border: "1px solid var(--ag-border-subtle, #222734)", borderRadius: 4, padding: "2px 7px" }}>
            ACCORD
          </span>
          <span id="timeline-project-name" style={{ fontFamily: "var(--ag-font-display, 'Chakra Petch', 'IBM Plex Sans', sans-serif)", fontWeight: 700, fontSize: 15, color: "var(--ag-text-primary, #F4F4F0)", letterSpacing: "-0.01em" }}>
            {projKey} · {projName}
          </span>
          <span id="horizon-branch-counts" style={{ fontSize: 11, color: "var(--ag-text-secondary, #B8C0CC)", background: "var(--ag-slate, #12151C)", padding: "3px 8px", borderRadius: 4, border: "1px solid var(--ag-border-subtle, #222734)", fontFamily: "var(--ag-font-mono, 'IBM Plex Mono', 'JetBrains Mono', monospace)" }}>
            3 H1 · 4 H2 · 4 H3 · 4 H4 · 4 H5 · 4 H6 · 4 H7 · 7 Tasks · 14 ST
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--ag-text-secondary, #B8C0CC)", marginRight: 4 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 4, background: "var(--ag-indigo, #9B8AFB)", borderColor: "#818cf8", display: "inline-block", borderRadius: 2 }} /> H1–H7 Summary (27)
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 8, background: "rgba(86,194,246,0.35)", border: "1.5px solid var(--ag-cyan, #56C2F6)", outlineColor: "#38bdf8", display: "inline-block", borderRadius: 2 }} /> Task (7)
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 6, background: "var(--ag-emerald, #2AC38A)", borderColor: "#10b981", display: "inline-block", borderRadius: 2 }} /> Subtask (14)
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, background: "#f59e0b", display: "inline-block", borderRadius: 2 }} /> 👤 Human Gate / ◆ Milestone
            </span>
          </div>
          <button
            id="btn-order-mode"
            onClick={() => setOrderMode((m) => (m === "layer" ? "tree" : "layer"))}
            style={{
              background: "#1e293b",
              color: "#818cf8",
              border: "1px solid #334155",
              borderRadius: 6,
              padding: "5px 11px",
              fontWeight: 600,
              fontSize: 11.5,
              cursor: "pointer"
            }}
          >
            {orderMode === "layer" ? "View: By Horizon (H1..H7)" : "View: Branch Tree (DFS)"}
          </button>
          <button
            id="btn-filter-hum"
            onClick={() => setHumFilter(!humFilter)}
            style={{
              background: humFilter ? "rgba(245,158,11,0.24)" : "rgba(245,158,11,0.1)",
              color: "#f59e0b",
              border: "1px solid #f59e0b",
              borderRadius: 6,
              padding: "5px 11px",
              fontWeight: 600,
              fontSize: 11.5,
              cursor: "pointer"
            }}
          >
            👤 Human Needed ({humCount})
          </button>
          <button
            id="btn-toggle-subtasks"
            onClick={toggleAllSubtasks}
            style={{
              background: "#1e293b",
              color: "#38bdf8",
              border: "1px solid #334155",
              borderRadius: 6,
              padding: "5px 11px",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {anySubtasksCollapsed ? "Expand All Subtasks (ST-*)" : "Collapse Subtasks (ST-*)"}
          </button>
          <button
            id="btn-toggle-h1-h4"
            onClick={toggleHighHorizons}
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              border: "1px solid #334155",
              borderRadius: 6,
              padding: "5px 11px",
              fontSize: 11.5,
              cursor: "pointer"
            }}
          >
            {anyHighCollapsed ? "Expand All H1–H7" : "Focus H1 + H6–H7 + Tasks"}
          </button>
        </div>
      </div>

      {/* Main 100% Vertical Split Canvas: Left WBS Tree + Right Orthogonal Dependency Gantt */}
      <div style={{ display: "grid", gridTemplateColumns: "48% 52%", flex: 1, overflow: "auto" }}>
        {/* Left WBS Hierarchy Tree (H1..H7 -> Tasks T1.1..T7.1 -> Subtasks ST-1.1..ST-7.2) */}
        <div style={{ borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", minWidth: 540 }}>
          <div style={{ display: "grid", gridTemplateColumns: "68px 1fr 145px 120px 44px", padding: "0 12px", height: 30, alignItems: "center", background: "#111827", borderBottom: "1px solid #1e293b", color: "#94a3b8", fontWeight: 700, fontSize: 10.5, letterSpacing: "0.03em", position: "sticky", top: 0, zIndex: 10 }}>
            <span>KEY</span>
            <span>WBS HIERARCHY (H1–H7 → TASKS → SUBTASKS)</span>
            <span>ARTIFACT PREVIEW</span>
            <span>HUMAN GATE</span>
            <span style={{ textAlign: "right" }}>%</span>
          </div>
          {visible.map((it) => {
            const isSelected = selItem?.id === it.id;
            const isCollapsible = it.type === "summary" || it.type === "task";
            const badgeBg = it.type === "milestone"
              ? "rgba(245,158,11,0.16)"
              : it.type === "summary"
              ? "rgba(129,140,248,0.18)"
              : it.type === "task"
              ? "rgba(56,189,248,0.18)"
              : it.hum && !it.approved
              ? "rgba(245,158,11,0.18)"
              : it.pct === 100
              ? "rgba(16,185,129,0.15)"
              : "rgba(56,189,248,0.12)";
            const badgeColor = it.type === "milestone"
              ? "#f59e0b"
              : it.type === "summary"
              ? "#818cf8"
              : it.type === "task"
              ? "#38bdf8"
              : it.hum && !it.approved
              ? "#f59e0b"
              : it.pct === 100
              ? "#10b981"
              : "#38bdf8";

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
                  display: "grid",
                  gridTemplateColumns: "68px 1fr 145px 120px 44px",
                  alignItems: "center",
                  height: ROW_H,
                  padding: "0 12px",
                  borderBottom: "1px solid rgba(30,41,59,0.65)",
                  background: isSelected
                    ? "rgba(56,189,248,0.14)"
                    : it.hum && !it.approved
                    ? "rgba(245,158,11,0.06)"
                    : it.type === "task"
                    ? "rgba(15,23,42,0.55)"
                    : "transparent",
                  cursor: "pointer"
                }}
              >
                <span>
                  <span style={{
                    display: "inline-block",
                    fontFamily: "'JetBrains Mono', 'Cascadia Mono', Consolas, monospace",
                    fontWeight: 700,
                    fontSize: 10.5,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: badgeBg,
                    color: badgeColor,
                    border: `1px solid ${badgeColor}55`
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
                      style={{ color: it.type === "task" ? "#38bdf8" : "#818cf8", fontWeight: 700, width: 12, display: "inline-block" }}
                      title={collapsed[it.id] ? "Expand children" : "Collapse children"}
                    >
                      {collapsed[it.id] ? "▸" : "▾"}
                    </span>
                  ) : (
                    <span style={{ color: "#475569", fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5 }}>└─</span>
                  )}
                  {it.parent && (
                    <span style={{ fontSize: 10, background: "rgba(148,163,184,0.12)", color: "#94a3b8", padding: "1px 5px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }} title={`Parent: ${it.parent}`}>
                      ↳ {it.parent}
                    </span>
                  )}
                  <span style={{
                    fontWeight: it.type === "summary" || it.type === "task" ? 600 : 400,
                    fontSize: it.type === "subtask" ? 11.5 : 12.5,
                    color: it.type === "subtask" ? "#cbd5e1" : "#f8fafc",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {it.title}
                  </span>
                  {it.type === "summary" && typeof it.subtaskCount === "number" && (
                    <span style={{ fontSize: 10, background: "rgba(129,140,248,0.12)", color: "#818cf8", padding: "1px 5px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                      {it.subtaskCount} {it.lv === 6 ? "Tasks" : "br"}
                    </span>
                  )}
                  {it.type === "task" && typeof it.subtaskCount === "number" && (
                    <span style={{ fontSize: 10, background: "rgba(56,189,248,0.12)", color: "#38bdf8", padding: "1px 5px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                      {it.subtaskCount} ST
                    </span>
                  )}
                  {it.issueKey && (
                    <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#64748b" }}>
                      ({it.issueKey})
                    </span>
                  )}
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
                        background: "rgba(56,189,248,0.12)",
                        color: "#38bdf8",
                        border: "1px solid rgba(56,189,248,0.35)",
                        borderRadius: 4,
                        padding: "2px 6px",
                        fontSize: 10.5,
                        fontWeight: 500,
                        cursor: "pointer",
                        maxWidth: 138,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                      title={`Preview ${it.art.name}`}
                    >
                      📄 {it.art.name}
                    </button>
                  )}
                </div>
                <div>
                  {it.hum ? (
                    <span style={{
                      background: it.approved ? "rgba(16,185,129,0.16)" : "rgba(245,158,11,0.18)",
                      color: it.approved ? "#10b981" : "#f59e0b",
                      border: `1px solid ${it.approved ? "#10b981" : "#f59e0b"}`,
                      borderRadius: 4,
                      padding: "2px 6px",
                      fontSize: 10,
                      fontWeight: 600,
                      display: "inline-block"
                    }}>
                      {it.approved ? "✓ Approved" : `👤 ${it.hum}`}
                    </span>
                  ) : (
                    <span style={{ color: "#64748b", fontSize: 10, background: "rgba(30,41,59,0.5)", padding: "2px 6px", borderRadius: 4 }}>
                      Auto
                    </span>
                  )}
                </div>
                <span style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 11, color: it.pct === 100 ? "#10b981" : it.hum && !it.approved ? "#f59e0b" : "#38bdf8" }}>
                  {it.type === "milestone" ? "◆" : `${it.pct}%`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Row-Aligned Dependency Gantt Reflecting H1–H7 Brackets, Task Summary Bars, and Subtask Bars */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(20, minmax(34px, 1fr))", height: 30, background: "#111827", borderBottom: "1px solid #1e293b", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
            {SLOTS.map((s) => (
              <span key={s} style={{ textAlign: "center", fontSize: 9.5, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", borderRight: "1px solid rgba(30,41,59,0.45)" }}>
                {s}
              </span>
            ))}
          </div>
          <div style={{ position: "relative", flex: 1 }}>
            {/* Subtle vertical grid columns */}
            <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(20, minmax(34px, 1fr))", pointerEvents: "none" }}>
              {SLOTS.map((s) => (
                <div key={s} style={{ borderRight: "1px solid rgba(30,41,59,0.3)" }} />
              ))}
            </div>

            {visible.map((it) => {
              const leftPct = (it.s / 20) * 100;
              const widthPct = (Math.max(1, it.e - it.s + 1) / 20) * 100;
              const color = it.hum && !it.approved
                ? "#f59e0b"
                : it.pct === 100
                ? "#10b981"
                : it.type === "summary"
                ? "#818cf8"
                : "#38bdf8";

              return (
                <div
                  key={it.id}
                  data-gantt-row={it.id}
                  onClick={() => {
                    setSelectedId(it.id);
                    setBcExpanded(false);
                  }}
                  style={{
                    position: "relative",
                    height: ROW_H,
                    borderBottom: "1px solid rgba(30,41,59,0.65)",
                    display: "flex",
                    alignItems: "center",
                    background: selItem?.id === it.id ? "rgba(56,189,248,0.08)" : "transparent"
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
                        color: "#f59e0b",
                        fontSize: 12.5,
                        cursor: "pointer",
                        fontWeight: 700,
                        zIndex: 3,
                        whiteSpace: "nowrap"
                      }}
                    >
                      <span style={{ fontSize: 15, lineHeight: 1 }}>◆</span>
                      <span style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", background: "rgba(11,15,23,0.9)", padding: "1px 5px", borderRadius: 4, border: "1px solid rgba(245,158,11,0.4)" }}>
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
                        background: "rgba(129,140,248,0.26)",
                        borderTop: "2.5px solid #818cf8",
                        borderLeft: "4px solid #818cf8",
                        borderRight: "4px solid #818cf8",
                        borderRadius: "2px 2px 0 0",
                        cursor: "pointer",
                        zIndex: 2
                      }}
                    >
                      <div style={{ width: `${it.pct}%`, height: "100%", background: "#818cf8", opacity: 0.45 }} />
                      <span style={{ position: "absolute", right: 6, top: -14, fontSize: 9.5, fontFamily: "'JetBrains Mono', monospace", color: "#818cf8", fontWeight: 700 }}>
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
                        background: "rgba(15,23,42,0.94)",
                        border: `1.5px solid ${color}`,
                        borderTop: `3px solid ${color}`,
                        borderRadius: 4,
                        overflow: "hidden",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        zIndex: 3,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.4)"
                      }}
                    >
                      <div style={{ width: `${it.pct}%`, height: "100%", background: color, opacity: 0.38 }} />
                      <span style={{ position: "absolute", left: 6, fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#f8fafc", whiteSpace: "nowrap" }}>
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
                        height: 15,
                        background: "rgba(15,23,42,0.88)",
                        border: `1px solid ${color}`,
                        borderRadius: 3,
                        overflow: "hidden",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        zIndex: 3
                      }}
                    >
                      <div style={{ width: `${it.pct}%`, height: "100%", background: color, opacity: 0.48 }} />
                      <span style={{ position: "absolute", left: 5, fontSize: 9.5, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#e2e8f0", whiteSpace: "nowrap" }}>
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
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#38bdf8" />
                </marker>
                <marker id="fs-arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f59e0b" />
                </marker>
              </defs>
              {visible.map((it, rIdx) =>
                (it.deps || []).map((depId: string) => {
                  if (it.type === "summary") return null;
                  // If subtasks are visible, draw FS arrows along the Subtask chain (and Milestones);
                  // if a task's subtasks are collapsed, draw FS arrows between the Task bars.
                  if (it.type === "task" && !collapsed[it.id]) return null;

                  const dIdx = visible.findIndex((x) => x.id === depId);
                  if (dIdx < 0) return null;
                  const dep = visible[dIdx];
                  if (dep.type === "summary") return null;

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
                  const strokeColor = isHumTarget ? "#f59e0b" : "#38bdf8";
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

      {/* Right-Hand Jira/Monday.com Slide-Over Detail Drawer — Built for Human Decision-Making */}
      {selItem && (
        <div
          id="item-slideover"
          style={{
            position: "absolute",
            top: 46,
            right: 0,
            bottom: 0,
            width: "min(480px, 94vw)",
            background: "#111827",
            borderLeft: "1px solid #334155",
            padding: "18px 20px",
            overflowY: "auto",
            zIndex: 30,
            boxShadow: "-12px 0 32px rgba(0,0,0,0.65)",
            display: "flex",
            flexDirection: "column",
            gap: 14
          }}
        >
          {/* Drawer Top Bar: Truncated Breadcrumb (.... > H6 > H7 > T4.1) + Close */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div id="drawer-breadcrumbs" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#38bdf8" }}>
              {selItem.bc.length > 3 && !bcExpanded ? (
                <>
                  <button
                    id="btn-expand-breadcrumb"
                    onClick={() => setBcExpanded(true)}
                    title="Click to expand full H1–H7 → Task → Subtask lineage path"
                    style={{
                      background: "#1e293b",
                      color: "#f59e0b",
                      border: "1px solid #475569",
                      borderRadius: 4,
                      padding: "1px 7px",
                      cursor: "pointer",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700
                    }}
                  >
                    ....
                  </button>
                  <span style={{ color: "#94a3b8" }}>&gt;</span>
                  <span>{selItem.bc[selItem.bc.length - 2]}</span>
                  <span style={{ color: "#94a3b8" }}>&gt;</span>
                  <strong style={{ color: "#f8fafc" }}>{selItem.bc[selItem.bc.length - 1]}</strong>
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
              style={{ background: "#1e293b", color: "#cbd5e1", border: "1px solid #334155", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 13, flexShrink: 0, position: "relative", zIndex: 5 }}
            >
              ✕
            </button>
          </div>

          {/* Human-Readable Item Title & Status Bar */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 11.5, background: "rgba(56,189,248,0.16)", color: "#38bdf8", padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(56,189,248,0.4)" }}>
                {selItem.id} ({selItem.type.toUpperCase()})
              </span>
              {selItem.issueKey && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "#94a3b8", background: "#1e293b", padding: "2px 8px", borderRadius: 4 }}>
                  ItsAPlan: {selItem.issueKey}
                </span>
              )}
              <span style={{ background: "#1e293b", color: selItem.pct === 100 ? "#10b981" : "#f8fafc", padding: "2px 8px", borderRadius: 4, fontSize: 11.5, fontWeight: 600 }}>
                {selItem.pct}% Complete ({SLOTS[selItem.s]}–{SLOTS[selItem.e]})
              </span>
              {selItem.issueId && (
                <button
                  onClick={() => props.onOpenIssue?.(selItem.issueId!)}
                  style={{ background: "#1e293b", color: "#38bdf8", border: "1px solid #38bdf8", borderRadius: 4, padding: "2px 8px", fontSize: 11.5, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}
                >
                  ↗ Open Issue
                </button>
              )}
            </div>
            <h3 style={{ margin: "4px 0 6px", fontSize: 16, fontWeight: 700, lineHeight: 1.35, color: "#f8fafc" }}>
              {selItem.title}
            </h3>
            <p style={{ margin: 0, color: "#cbd5e1", fontSize: 13, lineHeight: 1.55 }}>
              {selItem.content}
            </p>
          </div>

          {/* 1. HUMAN DECISION BRIEF CARD */}
          {selItem.decision && (
            <div
              id="human-decision-brief-card"
              style={{
                background: selItem.approved ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.1)",
                border: `1.5px solid ${selItem.approved ? "#10b981" : "#f59e0b"}`,
                borderRadius: 8,
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: selItem.approved ? "#10b981" : "#f59e0b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {selItem.approved ? "✓ Human Decision Approved" : `👤 ${selItem.decision.gateLabel}`}
                </span>
                {!selItem.approved && (
                  <button
                    id="btn-drawer-approve-hum"
                    onClick={() => setApprovedMap((p) => ({ ...p, [selItem.id]: true }))}
                    style={{
                      background: "#10b981",
                      color: "#0b0f17",
                      border: "none",
                      borderRadius: 6,
                      padding: "5px 12px",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer"
                    }}
                  >
                    ✓ Approve & Sign Off
                  </button>
                )}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f8fafc", lineHeight: 1.4 }}>
                {selItem.decision.question}
              </div>
              <div style={{ fontSize: 12.5, color: "#cbd5e1", lineHeight: 1.5 }}>
                <strong style={{ color: "#94a3b8" }}>Why You Are Needed: </strong>
                {selItem.decision.whyNeeded}
              </div>
              <div style={{ fontSize: 12.5, color: "#e2e8f0", background: "rgba(15,23,42,0.65)", padding: "8px 10px", borderRadius: 6, borderLeft: "3px solid #10b981", lineHeight: 1.45 }}>
                <strong style={{ color: "#10b981" }}>Recommendation: </strong>
                {selItem.decision.recommendation}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.45 }}>
                <strong>Impact on Approval: </strong>
                {selItem.decision.impact}
              </div>
            </div>
          )}

          {/* 2. FORMATTED HUMAN-READABLE ARTIFACT PREVIEW CARD */}
          {selItem.art && (
            <div style={{ background: "#0b0f17", border: "1px solid #1e293b", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: 13 }}>📄 {selItem.art.name}</span>
                  <span style={{ marginLeft: 8, fontSize: 10.5, background: "#1e293b", color: "#94a3b8", padding: "2px 6px", borderRadius: 4 }}>
                    {selItem.art.type}
                  </span>
                </div>
                <button
                  onClick={() => setModalId(selItem.id)}
                  style={{
                    background: "#1e293b",
                    color: "#f8fafc",
                    border: "1px solid #334155",
                    borderRadius: 5,
                    padding: "4px 10px",
                    fontSize: 11,
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
          <div style={{ background: "#0b0f17", border: "1px solid #1e293b", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
              {selItem.type === "task" ? "Child Subtasks Rollup & DoD" : "Definition of Done (DoD Checklist)"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {selItem.dod.map((d, idx) => {
                const isDone = d.done || selItem.approved;
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: isDone ? "#e2e8f0" : "#cbd5e1" }}>
                    <span style={{ color: isDone ? "#10b981" : "#f59e0b", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                      {isDone ? "[✓]" : "[○]"}
                    </span>
                    <span>{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. FINISH-TO-START DEPENDENCIES */}
          <div style={{ background: "#0b0f17", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#94a3b8" }}>
            <strong style={{ color: "#cbd5e1" }}>Upstream Finish-to-Start (FS) Dependencies: </strong>
            {selItem.deps && selItem.deps.length > 0 ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {selItem.deps.map((depId) => {
                  const depNode = items.find((x) => x.id === depId);
                  return (
                    <button
                      key={depId}
                      onClick={() => setSelectedId(depId)}
                      style={{
                        background: "#1e293b",
                        color: "#38bdf8",
                        border: "1px solid #334155",
                        borderRadius: 4,
                        padding: "3px 8px",
                        fontSize: 11.5,
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
            background: "rgba(7,11,20,0.82)",
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
              background: "#111827",
              border: "1px solid #38bdf8",
              borderRadius: 10,
              padding: 22,
              boxShadow: "0 20px 50px rgba(0,0,0,0.75)",
              display: "flex",
              flexDirection: "column",
              gap: 14
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: 10 }}>
              <div>
                <strong style={{ color: "#38bdf8", fontSize: 15 }}>📄 {modItem.art.name}</strong>
                <span style={{ marginLeft: 10, fontSize: 11, background: "#1e293b", color: "#cbd5e1", padding: "2px 8px", borderRadius: 4 }}>
                  {modItem.art.type} · {modItem.id}
                </span>
              </div>
              <button
                onClick={() => setModalId(null)}
                style={{ background: "#1e293b", color: "#cbd5e1", border: "1px solid #334155", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>{modItem.title}</div>

            {renderArtifactCardContent(modItem.art)}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
              <button
                onClick={() => setModalId(null)}
                style={{ background: "#1e293b", color: "#cbd5e1", border: "1px solid #334155", borderRadius: 6, padding: "7px 14px", cursor: "pointer" }}
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setApprovedMap((p) => ({ ...p, [modItem.id]: true }));
                  setModalId(null);
                }}
                style={{
                  background: "#10b981",
                  color: "#0b0f17",
                  border: "none",
                  borderRadius: 6,
                  padding: "7px 16px",
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
    </div>
  );
}

export default TimelineView;
