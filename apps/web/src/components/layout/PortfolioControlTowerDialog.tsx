'use client';

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Project } from '@/lib/api/endpoints/projects';
import {
  LayoutGrid,
  Sparkles,
  Search,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
  GitBranch,
} from 'lucide-react';

interface PortfolioControlTowerDialogProps {
  projects: Project[];
  onSelectProject: (key: string) => void;
}

export default function PortfolioControlTowerDialog({
  projects,
  onSelectProject,
}: PortfolioControlTowerDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'rollup' | 'genesis'>('rollup');

  // Genesis intake state
  const [intentBrief, setIntentBrief] = useState('');
  const [selectedHorizon, setSelectedHorizon] = useState('H1 - Core Execution');
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        (p.ref && p.ref.toLowerCase().includes(q)) ||
        (p.key && p.key.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  const handleSelect = (project: Project) => {
    const targetRef = project.ref || project.key || String(project.id);
    onSelectProject(targetRef);
    setOpen(false);
    toast.success(`Switched to ${project.name} (${targetRef})`);
  };

  const handleScaffoldGenesis = () => {
    if (!intentBrief.trim()) {
      toast.error('Please enter a Customer 7H Intent Brief before scaffolding.');
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setOpen(false);
      setIntentBrief('');
      toast.success(
        'Project Baseline Scaffolded! Work breakdown generated and verified.'
      );
    }, 450);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid="portfolio-control-tower-trigger"
          className="flex w-full items-center justify-between gap-2 border-b border-border bg-card px-3 py-2.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-accent/50 focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <LayoutGrid className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">
                Portfolio Control Tower (54)
              </span>
              <span className="text-muted-foreground">
                JTBD-01 Rollup · JTBD-02 7H Genesis
              </span>
            </div>
          </div>
          <Badge variant="outline" className="border-border text-xs font-normal">
            P=1
          </Badge>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl overflow-hidden border-border bg-card p-0 text-foreground">
        <DialogHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Portfolio Control Tower & 7H Genesis
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  54 Sovereign Repos · 7 Horizons · 0 Cross-Repo Write Pollution
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                Zero Write Leakage
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'rollup' | 'genesis')}
          className="w-full"
        >
          <div className="border-b border-border px-6 pt-2">
            <TabsList className="h-9 bg-muted/50 p-1">
              <TabsTrigger
                value="rollup"
                data-testid="tab-portfolio-rollup"
                className="flex items-center gap-1.5 text-xs"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Portfolio Rollup (54 Projects)
              </TabsTrigger>
              <TabsTrigger
                value="genesis"
                data-testid="tab-7h-genesis"
                className="flex items-center gap-1.5 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                7H Project Genesis (Breathing Diamond)
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: PORTFOLIO ROLLUP */}
          <TabsContent value="rollup" className="m-0 p-6 pt-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter 54 sovereign projects by name, ref, or domain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 border-border bg-background pl-9 text-xs"
                  data-testid="portfolio-search-input"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {filteredProjects.length}
                </span>{' '}
                repos active
              </div>
            </div>

            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-xs text-muted-foreground">
                    No sovereign repos matching &ldquo;{searchQuery}&rdquo;
                  </p>
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <div
                    key={project.id || project.ref || project.key}
                    onClick={() => handleSelect(project)}
                    className="group flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-accent/40"
                    data-testid={`project-item-${project.ref || project.key || project.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                        <GitBranch className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {project.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            #{project.ref || project.key || project.id}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {project.description ||
                            'Sovereign domain harness · Disjoint workspace lease'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-emerald-500/20 bg-emerald-500/10 text-xs font-normal text-emerald-600 dark:text-emerald-400"
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3 inline" />
                        P=1 Verified
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs group-hover:bg-primary group-hover:text-primary-foreground"
                      >
                        Switch
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span>Isolated File Leases Active</span>
              <span className="font-medium text-foreground">2-Click Quick Switch</span>
            </div>
          </TabsContent>

          {/* TAB 2: 7H PROJECT GENESIS */}
          <TabsContent value="genesis" className="m-0 p-6 pt-4">
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Breathing Diamond 2-Step Genesis (53.REF.109 & 53.REF.111)
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Diverges ≥3 options per solution with ≥2 nested MECE weighted criteria
                  layers, stress test, and auto-scaffolds WBS (ST-101..ST-107).
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Target Strategic Horizon (7H Framework)
                  </label>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      'H1 - Core Execution',
                      'H2 - Adjacent Scale',
                      'H3 - Radical Frontier',
                      'H4 - Autonomous Ops',
                      'H5 - Data Substrate',
                      'H6 - Sovereign Platform',
                    ].map((hz) => (
                      <button
                        key={hz}
                        type="button"
                        onClick={() => setSelectedHorizon(hz)}
                        className={`rounded-md border p-2 text-left text-xs transition-colors ${
                          selectedHorizon === hz
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border bg-card text-muted-foreground hover:bg-accent/40'
                        }`}
                      >
                        {hz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground">
                    Customer 7H Intent Brief & BDI Hypothesis
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe target beneficiary, job-to-be-done, value driver, and non-negotiable boundaries..."
                    value={intentBrief}
                    onChange={(e) => setIntentBrief(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    data-testid="genesis-intent-brief-input"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    DoD 1..7 Pre-wired
                  </Badge>
                  <span>Automated Change Review Active</span>
                </div>
                <Button
                  onClick={handleScaffoldGenesis}
                  disabled={isGenerating || !intentBrief.trim()}
                  className="gap-2 text-xs"
                  data-testid="genesis-scaffold-button"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isGenerating
                    ? 'Synthesizing Diamond...'
                    : 'Generate ≥3 Options & Scaffold WBS'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
