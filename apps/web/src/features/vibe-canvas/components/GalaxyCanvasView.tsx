'use client';

import * as React from 'react';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Archive,
  BookOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { VibeFile, VibeZone } from '../types';

interface GalaxyCanvasViewProps {
  zones: VibeZone[];
  activeZone: string;
  onSelectZone: (zone: string) => void;
  files: VibeFile[];
  onOpenFileInReader: (file: VibeFile) => void;
  onInspectArchive: (filePath: string) => void;
}

interface Node3D {
  id: string;
  name: string;
  path: string;
  type: VibeFile['type'];
  size: number;
  x: number;
  y: number;
  z: number;
  color: string;
  radius: number;
}

export default function GalaxyCanvasView({
  zones,
  activeZone,
  onSelectZone,
  files,
  onOpenFileInReader,
  onInspectArchive,
}: GalaxyCanvasViewProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 3D Orbit Camera State
  const [rotX, setRotX] = React.useState(0.2);
  const [rotY, setRotY] = React.useState(0.4);
  const [zoom, setZoom] = React.useState(1.0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [lastMouse, setLastMouse] = React.useState({ x: 0, y: 0 });
  const [search, setSearch] = React.useState('');
  const [selectedNode, setSelectedNode] = React.useState<Node3D | null>(null);
  const [hoveredNode, setHoveredNode] = React.useState<Node3D | null>(null);

  // Generate 3D Spherical Coordinate Layout
  const nodes = React.useMemo<Node3D[]>(() => {
    if (!files || files.length === 0) return [];
    const count = files.length;
    const radius = 220;

    return files.map((f, i) => {
      // Golden Spiral Spherical distribution
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      let color = '#38bdf8'; // sky
      if (f.type === 'code') color = '#10b981'; // emerald
      else if (f.type === 'image') color = '#a855f7'; // purple
      else if (f.type === 'archive') color = '#f59e0b'; // amber
      else if (f.type === 'data') color = '#3b82f6'; // blue

      const nodeRadius = Math.max(4, Math.min(10, Math.log10(Math.max(100, f.size)) * 1.5));

      return {
        id: f.relative_path,
        name: f.name,
        path: f.relative_path,
        type: f.type,
        size: f.size,
        x,
        y,
        z,
        color,
        radius: nodeRadius,
      };
    });
  }, [files]);

  // Handle Drag to Rotate
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      setRotY((prev) => prev + dx * 0.005);
      setRotX((prev) => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev + dy * 0.005)));
      setLastMouse({ x: e.clientX, y: e.clientY });
    } else {
      // Hit testing for hover
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      let found: Node3D | null = null;
      for (const node of nodes) {
        // Project node to screen
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);

        // Rotate around Y
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.z * cosY + node.x * sinY;
        // Rotate around X
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + node.y * sinX;

        const distance = 600;
        const fov = distance / (distance + z2);
        const sx = cx + x1 * fov * zoom;
        const sy = cy + y2 * fov * zoom;

        const dist = Math.hypot(mouseX - sx, mouseY - sy);
        if (dist <= node.radius * fov * zoom + 4) {
          found = node;
          break;
        }
      }
      setHoveredNode(found);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.max(0.4, Math.min(2.5, prev - e.deltaY * 0.001)));
  };

  const handleClick = () => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
    }
  };

  const handleResetCamera = () => {
    setRotX(0.2);
    setRotY(0.4);
    setZoom(1.0);
  };

  // Render 3D Canvas Loop
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Auto-resize
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const distance = 600;

      // Project all nodes
      const projected = nodes.map((node) => {
        // Rotate Y
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.z * cosY + node.x * sinY;
        // Rotate X
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + node.y * sinX;

        const fov = distance / (distance + z2);
        const sx = cx + x1 * fov * zoom;
        const sy = cy + y2 * fov * zoom;
        const r = Math.max(2, node.radius * fov * zoom);

        const isMatch = !search || node.name.toLowerCase().includes(search.toLowerCase());

        return {
          node,
          sx,
          sy,
          z: z2,
          r,
          fov,
          isMatch,
        };
      });

      // Sort by depth (painter's algorithm)
      projected.sort((a, b) => b.z - a.z);

      // Draw faint connections to center
      ctx.lineWidth = 0.5;
      for (const p of projected) {
        if (p.isMatch) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(p.sx, p.sy);
          ctx.strokeStyle = `${p.node.color}15`;
          ctx.stroke();
        }
      }

      // Draw nodes
      for (const p of projected) {
        const isHovered = hoveredNode?.id === p.node.id;
        const isSelected = selectedNode?.id === p.node.id;

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, isHovered || isSelected ? p.r + 3 : p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.isMatch ? p.node.color : `${p.node.color}40`;
        ctx.fill();

        if (isHovered || isSelected) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          // Draw label
          ctx.font = '11px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(p.node.name, p.sx + p.r + 5, p.sy + 3);
        }
      }

      // If rotating automatically or smoothly, loop
      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [nodes, rotX, rotY, zoom, hoveredNode, selectedNode, search]);

  return (
    <div ref={containerRef} className="relative flex h-full w-full overflow-hidden bg-background">
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        className="h-full w-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Floating Controls */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="flex rounded-lg border border-border bg-card/90 p-1 backdrop-blur-md shadow-xs">
          {zones.map((z) => (
            <button
              key={z.name}
              type="button"
              onClick={() => onSelectZone(z.name)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                z.name === activeZone
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {z.name}
            </button>
          ))}
        </div>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter nodes in galaxy..."
          className="h-8 w-48 text-xs bg-card/90 backdrop-blur-md border-border"
        />
      </div>

      {/* Camera Actions Toolbar */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          className="size-8 p-0 bg-card/80 backdrop-blur-md"
        >
          <ZoomIn className="size-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
          className="size-8 p-0 bg-card/80 backdrop-blur-md"
        >
          <ZoomOut className="size-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleResetCamera}
          className="size-8 p-0 bg-card/80 backdrop-blur-md"
          title="Reset Camera"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      {/* Node Details Inspection Card */}
      {selectedNode && (
        <Card className="absolute bottom-4 right-4 w-80 border-border bg-card/95 shadow-lg backdrop-blur-md">
          <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold truncate flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full inline-block"
                style={{ backgroundColor: selectedNode.color }}
              />
              <span className="truncate">{selectedNode.name}</span>
            </CardTitle>
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              {selectedNode.type}
            </Badge>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2 text-xs">
            <div className="font-mono text-[11px] text-muted-foreground truncate">
              {selectedNode.path}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Size: {(selectedNode.size / 1024).toFixed(1)} KB</span>
              <span>Zone: {activeZone}</span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                size="sm"
                className="flex-1 text-xs gap-1.5 h-8"
                onClick={() => {
                  const f = files.find((item) => item.relative_path === selectedNode.path);
                  if (f) onOpenFileInReader(f);
                }}
              >
                <BookOpen className="size-3.5" />
                Open in Reader
              </Button>
              {selectedNode.type === 'archive' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1.5 h-8 text-amber-500 border-amber-500/30"
                  onClick={() => onInspectArchive(selectedNode.path)}
                >
                  <Archive className="size-3.5" />
                  Inspect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orbit Navigation Hint */}
      <div className="absolute bottom-3 left-3 text-[11px] text-muted-foreground/60 select-none pointer-events-none">
        Drag to rotate · Scroll to zoom · Click node to inspect
      </div>
    </div>
  );
}
