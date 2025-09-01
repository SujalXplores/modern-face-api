'use client';

import { Brain, Calendar, Eye, Layers, Smile, Target, Users, Video, Webcam } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const imageExamples = [
  {
    title: 'Face Detection',
    url: '/face-detection',
    icon: Target,
  },
  {
    title: 'Face Landmarks',
    url: '/face-landmarks',
    icon: Eye,
  },
  {
    title: 'Face Expressions',
    url: '/face-expressions',
    icon: Smile,
  },
  {
    title: 'Age & Gender',
    url: '/age-gender',
    icon: Users,
  },
  {
    title: 'Face Recognition',
    url: '/face-recognition',
    icon: Brain,
  },
  {
    title: 'Batch Landmarks',
    url: '/batch-landmarks',
    icon: Layers,
  },
  {
    title: 'Batch Recognition',
    url: '/batch-recognition',
    icon: Brain,
  },
];

const videoExamples = [
  {
    title: 'Webcam Detection',
    url: '/webcam-detection',
    icon: Webcam,
  },
  {
    title: 'Webcam Landmarks',
    url: '/webcam-landmarks',
    icon: Eye,
  },
  {
    title: 'Webcam Age & Gender',
    url: '/webcam-age-gender',
    icon: Calendar,
  },
  {
    title: 'Webcam Expressions',
    url: '/webcam-expressions',
    icon: Smile,
  },
  {
    title: 'Video Face Tracking',
    url: '/video-tracking',
    icon: Video,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Modern Face API</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Image Examples</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {imageExamples.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Real-time Examples</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {videoExamples.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Built with Next.js & shadcn/ui</span>
          </div>
          <div className="mt-2">
            <Link
              href="https://github.com/SujalXplores/modern-face-api"
              target="_blank"
              className="text-xs text-primary hover:underline"
            >
              View on GitHub
            </Link>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
