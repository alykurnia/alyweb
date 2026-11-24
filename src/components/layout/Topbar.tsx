'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { WORKSPACES, NOTIFICATIONS } from '@/lib/mock-data';
import { Button } from '@/components/ui/Button';
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  Plus,
  Check,
  Keyboard,
  BookOpen,
  LogOut,
  User,
  ShieldCheck,
  FolderDot,
  Sparkles,
  Command,
} from 'lucide-react';
import Link from 'next/link';

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    setMobileSidebarOpen,
    openCreateModalWithBoard,
    activeWorkspaceId,
    setActiveWorkspaceId,
    globalSearchQuery,
    setGlobalSearchQuery,
  } = useAppStore();

  const [isWorkspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isHelpOpen, setHelpOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(NOTIFICATIONS);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setWorkspaceMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setHelpOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeWorkspace =
    WORKSPACES.find((w) => w.id === activeWorkspaceId) || WORKSPACES[0];

  const unreadCount = unreadNotifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setUnreadNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  // Derive breadcrumb based on pathname
  const getBreadcrumb = () => {
    if (pathname === '/') return { section: 'Workspace', page: 'Overview' };
    if (pathname === '/projects') return { section: 'Workspace', page: 'My Projects' };
    if (pathname === '/simulator') return { section: 'Workspace', page: 'Circuit Simulator' };
    if (pathname === '/circuit-builder') return { section: 'Workspace', page: 'Circuit Builder' };
    if (pathname === '/code-editor') return { section: 'Workspace', page: 'Code Editor' };
    if (pathname === '/serial-monitor') return { section: 'Workspace', page: 'Serial Monitor' };
    if (pathname === '/component-library') return { section: 'Learning', page: 'Component Library' };
    if (pathname === '/tutorials') return { section: 'Learning', page: 'Tutorials' };
    if (pathname === '/documentation') return { section: 'Learning', page: 'Documentation' };
    if (pathname === '/preferences') return { section: 'Settings', page: 'Preferences' };
    if (pathname === '/settings') return { section: 'Settings', page: 'Account Settings' };

    const formatted = pathname.replace('/', '').replace(/-/g, ' ');
    return { section: 'Workspace', page: formatted.charAt(0).toUpperCase() + formatted.slice(1) };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200/90 shadow-2xs px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Breadcrumbs & Workspace */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Workspace Selector */}
        <div className="relative" ref={workspaceRef}>
          <button
            onClick={() => setWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
              {activeWorkspace.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
                {activeWorkspace.name}
              </span>
              <span className="block text-[10px] text-slate-500 leading-tight">
                {activeWorkspace.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Workspace Dropdown */}
          {isWorkspaceMenuOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Workspaces
              </div>
              <div className="py-1">
                {WORKSPACES.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspaceId(ws.id);
                      setWorkspaceMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                        {ws.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{ws.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {ws.role} • {ws.projectsCount} projects
                        </div>
                      </div>
                    </div>
                    {ws.id === activeWorkspaceId && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <div className="p-1.5 border-t border-slate-100">
                <button
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    alert('Workspace creation will be unlocked with Team accounts in Sprint 2.');
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1.5 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Team Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden md:block h-5 w-px bg-slate-200" />

        {/* Breadcrumb Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs" aria-label="Breadcrumb">
          <span className="text-slate-400 font-medium">{breadcrumb.section}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-semibold">{breadcrumb.page}</span>
        </nav>
      </div>

      {/* Center: Search Field */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects, boards, sensors, HAL APIs..."
            value={globalSearchQuery}
            onChange={(e) => {
              setGlobalSearchQuery(e.target.value);
              if (pathname !== '/projects' && e.target.value.length > 0) {
                router.push('/projects');
              }
            }}
            className="w-full pl-9 pr-16 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none text-[10px] text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Notifications, Help, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick New Project Button */}
        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => openCreateModalWithBoard()}
          className="hidden xs:inline-flex"
        >
          New Project
        </Button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">Notifications</h4>
                  <span className="text-[10px] text-slate-400">
                    {unreadCount} unread system update{unreadCount === 1 ? '' : 's'}
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-blue-600 hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {unreadNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 text-xs hover:bg-slate-50 transition-colors ${
                      notif.unread ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-800">{notif.title}</span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      {notif.description}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-center">
                <span className="text-[10px] text-slate-400 font-mono">
                  Telemetry Channel: Connected (WebSocket)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Help Dropdown */}
        <div className="relative" ref={helpRef}>
          <button
            onClick={() => setHelpOpen(!isHelpOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Help and resources"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {isHelpOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Support & Resources
              </div>
              <div className="py-1">
                <Link
                  href="/documentation"
                  onClick={() => setHelpOpen(false)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-xs text-slate-700"
                >
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>Documentation Guide</span>
                </Link>
                <Link
                  href="/tutorials"
                  onClick={() => setHelpOpen(false)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-xs text-slate-700"
                >
                  <Sparkles className="w-4 h-4 text-slate-400" />
                  <span>Starter Labs & Tutorials</span>
                </Link>
                <button
                  onClick={() => {
                    setHelpOpen(false);
                    alert('Keyboard Shortcuts:\n• Ctrl+K: Global search\n• Ctrl+N: New Project\n• Esc: Close dialogs');
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-xs text-slate-700"
                >
                  <Keyboard className="w-4 h-4 text-slate-400" />
                  <span>Keyboard Shortcuts</span>
                </button>
              </div>
              <div className="p-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500">
                IoT Lab v1.0.4 • Sprint 1 UI Foundation
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-blue-500/20">
              AM
            </div>
            <div className="hidden xl:block text-left pr-1">
              <span className="block text-xs font-semibold text-slate-800 leading-none">
                Alex Morgan
              </span>
              <span className="block text-[10px] text-slate-400 leading-tight mt-0.5">
                Lead Engineer
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                    AM
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Alex Morgan</h4>
                    <p className="text-[11px] text-slate-400 truncate">alex.morgan@iotlab.dev</p>
                  </div>
                </div>
                <div className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Hardware Developer
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-xs text-slate-700"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Profile Settings</span>
                </Link>
                <Link
                  href="/preferences"
                  onClick={() => setProfileOpen(false)}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-xs text-slate-700"
                >
                  <FolderDot className="w-4 h-4 text-slate-400" />
                  <span>Workbench Preferences</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    alert('Session active. Logout capability will connect to authentication provider.');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 text-xs font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
