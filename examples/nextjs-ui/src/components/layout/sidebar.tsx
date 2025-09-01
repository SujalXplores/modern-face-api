'use client';

import {
  Brain,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Github,
  Layers,
  Smile,
  Target,
  Users,
  Video,
  Webcam,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const imageExamples = [
  {
    title: 'Face Detection',
    url: '/face-detection',
    icon: Target,
    description: 'Detect faces in images',
  },
  {
    title: 'Face Landmarks',
    url: '/face-landmarks',
    icon: Eye,
    description: '68-point facial landmarks',
  },
  {
    title: 'Face Expressions',
    url: '/face-expressions',
    icon: Smile,
    description: 'Emotion recognition',
  },
  {
    title: 'Age & Gender',
    url: '/age-gender',
    icon: Users,
    description: 'Age and gender prediction',
  },
  {
    title: 'Face Recognition',
    url: '/face-recognition',
    icon: Brain,
    description: 'Facial recognition',
  },
  {
    title: 'Batch Landmarks',
    url: '/batch-landmarks',
    icon: Layers,
    description: 'Process multiple images',
  },
  {
    title: 'Batch Recognition',
    url: '/batch-recognition',
    icon: Brain,
    description: 'Batch face recognition',
  },
];

const videoExamples = [
  {
    title: 'Webcam Detection',
    url: '/webcam-detection',
    icon: Webcam,
    description: 'Real-time face detection',
  },
  {
    title: 'Webcam Landmarks',
    url: '/webcam-landmarks',
    icon: Eye,
    description: 'Live landmark tracking',
  },
  {
    title: 'Webcam Age & Gender',
    url: '/webcam-age-gender',
    icon: Calendar,
    description: 'Live age & gender detection',
  },
  {
    title: 'Webcam Expressions',
    url: '/webcam-expressions',
    icon: Smile,
    description: 'Live emotion recognition',
  },
  {
    title: 'Video Face Tracking',
    url: '/video-tracking',
    icon: Video,
    description: 'Video face tracking',
  },
];

interface SidebarProps {
  className?: string;
}

export function AppSidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const NavItem = ({
    item,
    isCollapsed,
  }: {
    item: (typeof imageExamples)[0];
    isCollapsed: boolean;
  }) => {
    const isActive = pathname === item.url;
    const Icon = item.icon;

    const buttonContent = (
      <Button
        variant={isActive ? 'default' : 'ghost'}
        className={cn(
          'w-full justify-start h-10 px-3 transition-all duration-200',
          isCollapsed ? 'px-2' : 'px-3',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground',
          'group'
        )}
        asChild
      >
        <Link href={item.url}>
          <Icon className={cn('h-4 w-4 flex-shrink-0', isCollapsed ? 'mx-auto' : 'mr-3')} />
          {!isCollapsed && <span className="truncate font-medium">{item.title}</span>}
        </Link>
      </Button>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
            <TooltipContent side="right" className="flex flex-col gap-1">
              <span className="font-medium">{item.title}</span>
              <span className="text-xs text-muted-foreground">{item.description}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return buttonContent;
  };

  return (
    <div
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border sidebar-transition',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="font-semibold text-lg truncate text-sidebar-foreground">
                  Modern Face API
                </h1>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center w-full">
            <Brain className="h-6 w-6 text-primary" />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0 hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-4">
          <div className="space-y-2">
            {!collapsed && (
              <h2 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider px-2">
                Image Examples
              </h2>
            )}
            <div className="space-y-1">
              {imageExamples.map(item => (
                <NavItem key={item.title} item={item} isCollapsed={collapsed} />
              ))}
            </div>
          </div>

          <Separator className="bg-sidebar-border" />

          <div className="space-y-2">
            {!collapsed && (
              <h2 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider px-2">
                Real-time Examples
              </h2>
            )}
            <div className="space-y-1">
              {videoExamples.map(item => (
                <NavItem key={item.title} item={item} isCollapsed={collapsed} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="border-t border-sidebar-border p-4">
          <div className="space-y-3">
            <div className="text-xs text-sidebar-foreground/60">Built with Next.js & shadcn/ui</div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 px-2 text-xs hover:bg-sidebar-accent"
              asChild
            >
              <Link
                href="https://github.com/SujalXplores/modern-face-api"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-3 w-3 mr-2" />
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
