import React from 'react';
import { LayoutDashboard, Target, History, Settings, Moon, Plus, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';

interface NavigationProps {
  activeTab: 'today' | 'calendar' | 'calibration' | 'history' | 'settings';
  setActiveTab: (tab: 'today' | 'calendar' | 'calibration' | 'history' | 'settings') => void;
  onOpenNewTask: () => void;
  onOpenSleepLog: () => void;
  gcalConnected: boolean;
}

const NAV_ITEMS = [
  { id: 'today' as const, label: 'Today', icon: LayoutDashboard },
  { id: 'calibration' as const, label: 'Calibration', icon: Target },
  { id: 'history' as const, label: 'History', icon: History },
  { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
  { id: 'settings' as const, label: 'Settings', icon: Settings }
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTask,
  onOpenSleepLog,
  gcalConnected
}) => {
  const navigate = (tab: NavigationProps['activeTab']) => setActiveTab(tab);

  const Brand = (
    <div className="flex items-center gap-3 text-left shrink-0">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary-border bg-primary-soft text-primary shadow-card shrink-0">
        <Target className="h-5 w-5" />
      </div>
      <div className="flex flex-col justify-center">
        <span className="block text-base font-bold tracking-tight text-text-primary leading-tight">
          Personal Calibration
        </span>
        <span className="hidden text-xs font-medium text-text-muted leading-tight sm:block">
          Evidence-based behavioral mirror
        </span>
      </div>
    </div>
  );

  const NavLinks = ({ vertical = false }: { vertical?: boolean }) => (
    <nav aria-label="Main Navigation" className={`${vertical ? 'flex flex-col gap-1' : 'hidden gap-1 md:flex'}`}>
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => navigate(id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-soft text-primary-ink font-semibold'
                : 'text-text-muted hover:bg-surface-secondary hover:text-text-primary'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-text-muted'}`} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );

  const MobileHeaderActions = (
    <div className="flex items-center gap-2 sm:gap-3">
      <Button size="sm" variant="secondary" onClick={onOpenSleepLog} className="inline-flex h-9 min-h-9 px-3 items-center justify-center gap-1.5 shadow-card shrink-0">
        <Moon className="h-4 w-4 shrink-0" />
        <span className="leading-none hidden sm:inline-block">Log Sleep</span>
      </Button>
      <Button onClick={onOpenNewTask} size="sm" className="inline-flex h-9 min-h-9 px-3 sm:px-4 items-center justify-center gap-1.5 shadow-card shrink-0">
        <Plus className="h-4 w-4 shrink-0" />
        <span className="leading-none inline-block">New Prediction</span>
      </Button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
          {Brand}
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks vertical />
        </div>
        <div className="shrink-0 space-y-2 border-t border-border p-4">
          {gcalConnected && (
            <div
              title="Google Calendar connected"
              className="flex items-center gap-1.5 rounded-full border border-success-border bg-success-soft px-2.5 py-1 text-xs font-semibold text-success-ink"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
              <span className="leading-none">Calendar Connected</span>
            </div>
          )}
          <Button variant="secondary" onClick={onOpenSleepLog} className="w-full">
            <Moon className="h-4 w-4 shrink-0" />
            Log Sleep
          </Button>
          <Button onClick={onOpenNewTask} className="w-full">
            <Plus className="h-4 w-4 shrink-0" />
            New Prediction
          </Button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 text-text-primary shadow-card backdrop-blur-xs lg:hidden">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-6">
          {Brand}
          {MobileHeaderActions}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar for quick 1-thumb tab navigation */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-surface/95 px-2 py-1.5 shadow-modal backdrop-blur-xs lg:hidden"
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center py-1 text-xs font-medium transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon className={`h-5 w-5 mb-0.5 ${isActive ? 'text-primary' : 'text-text-disabled'}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
