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
          'w-full h-10 transition-all duration-200 relative',
          isCollapsed ? 'justify-center px-2' : 'justify-start px-3',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
            : cn(
                'text-sidebar-foreground',
                'hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground',
                'hover:shadow-sm'
              ),
          'group focus-visible:ring-2 focus-visible:ring-sidebar-ring'
        )}
        asChild
      >
        <Link href={item.url}>
          <Icon
            className={cn(
              'h-4 w-4 flex-shrink-0 transition-all duration-200',
              isCollapsed ? 'mx-0' : 'mr-3',
              isActive ? 'text-primary-foreground' : 'text-current'
            )}
          />
          {!isCollapsed && <span className="truncate font-medium text-sm">{item.title}</span>}
        </Link>
      </Button>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
            <TooltipContent
              side="right"
              className={cn(
                'flex flex-col gap-1 max-w-xs z-50',
                'bg-popover text-popover-foreground',
                'border border-border shadow-lg',
                'px-3 py-2 rounded-md'
              )}
              sideOffset={8}
            >
              <span className="font-medium text-sm">{item.title}</span>
              <span className="text-xs opacity-70">{item.description}</span>
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
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border sidebar-transition relative',
        collapsed ? 'w-16' : 'w-64',
        'shadow-sm',
        className
      )}
    >
      <div className="flex items-center p-4 border-b border-sidebar-border relative">
        <div
          className={cn(
            'flex items-center transition-all duration-300',
            collapsed ? 'justify-center w-full' : 'gap-2 min-w-0 flex-1'
          )}
        >
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Brain className="h-6 w-6 text-primary flex-shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="font-semibold text-lg truncate text-sidebar-foreground">
                  Modern Face API
                </h1>
              </div>
            )}
          </Link>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'h-8 w-8 p-0 flex-shrink-0 transition-colors cursor-pointer',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            'text-sidebar-foreground/70 hover:text-sidebar-foreground',
            collapsed ? 'absolute top-4 right-4' : 'ml-2'
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scroll">
        <div className={cn('space-y-6', collapsed ? 'p-2' : 'p-4')}>
          <div className="space-y-2">
            {!collapsed && (
              <h2 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider px-2 mb-3">
                Image Examples
              </h2>
            )}
            <div className="space-y-1">
              {imageExamples.map(item => (
                <NavItem key={item.title} item={item} isCollapsed={collapsed} />
              ))}
            </div>
          </div>

          {!collapsed && <Separator className="bg-sidebar-border" />}
          {collapsed && <div className="h-px bg-sidebar-border mx-2" />}

          <div className="space-y-2">
            {!collapsed && (
              <h2 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider px-2 mb-3">
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
              className={cn(
                'w-full justify-start h-8 px-2 text-xs transition-colors',
                'hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground',
                'text-sidebar-foreground/80 hover:text-sidebar-foreground'
              )}
              asChild
            >
              <Link
                href="https://github.com/SujalXplores/modern-face-api"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="truncate">View on GitHub</span>
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
