'use client';

import React from 'react';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';
import { StatisticsCards } from '@/components/dashboard/StatisticsCards';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { SupportedBoards } from '@/components/dashboard/SupportedBoards';
import { QuickAccess } from '@/components/dashboard/QuickAccess';

export default function OverviewDashboardPage() {
  return (
    <div className="space-y-8 pb-12">
      {/* 1. Welcome Section */}
      <WelcomeSection />

      {/* 2. Statistics Cards */}
      <StatisticsCards />

      {/* 3. Recent Projects */}
      <RecentProjects />

      {/* 4. Supported Boards */}
      <SupportedBoards />

      {/* 5. Quick Access Shortcuts */}
      <QuickAccess />
    </div>
  );
}
