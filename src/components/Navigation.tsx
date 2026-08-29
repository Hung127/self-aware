import React, { useState } from 'react';
import { LayoutDashboard, Target, History, Settings, Moon, Plus, Calendar, Menu, X, CheckCircle2, HelpCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface NavigationProps {
  activeTab: 'today' | 'calendar' | 'calibration' | 'history' | 'settings';
  setActiveTab: (tab: 'today' | 'calendar' | 'calibration' | 'history' | 'settings') => void;
  onOpenNewTask: () => void;
  onOpenSleepLog: () => void;
  onOpenHowItWorks: () => void;
  gcalConnected: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTask,
  onOpenSleepLog,
  onOpenHowItWorks,
  gcalConnected
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const items = [
    { id: 'today' as const, label: 'Today', icon: LayoutDashboard },
    { id: 'calibration' as const, label: 'Calibration', icon: Target },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
    { id: 'settings' as const, label: 'Settings', icon: Settings }
  ];

  const navigate = (tab: NavigationProps['activeTab']) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs text-slate-900 shadow-xs">
        <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand Logo & Name */}
            <button
              type="button"
              onClick={() => navigate('today')}
              className="flex items-center gap-3 text-left focus:outline-none shrink-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shadow-xs shrink-0">
                <Target className="h-5 w-5" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="block font-bold tracking-tight text-slate-900 leading-tight text-base">
                  Personal Calibration
                </span>
                <span className="text-xs text-slate-500 font-medium leading-tight hidden sm:block">
                  Evidence-based behavioral mirror
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav aria-label="Main Navigation" className="hidden items-center gap-1 md:flex">
              {items.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => navigate(id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Header Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {gcalConnected && (
                <div
                  title="Google Calendar connected"
                  className="hidden xl:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="leading-none">Calendar Connected</span>
                </div>
              )}

              <button
                type="button"
                onClick={onOpenHowItWorks}
                aria-label="How Personal Calibration works"
                title="How it works guide"
                className="inline-flex h-9 min-h-9 px-2.5 sm:px-3 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 shrink-0"
              >
                <HelpCircle className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="leading-none hidden sm:inline-block">How it works</span>
              </button>

              <button
                type="button"
                onClick={onOpenSleepLog}
                aria-label="Log sleep record"
                title="Log sleep record"
                className="inline-flex h-9 min-h-9 px-3 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 shrink-0"
              >
                <Moon className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="leading-none hidden sm:inline-block">Log Sleep</span>
              </button>

              <Button
                onClick={onOpenNewTask}
                size="sm"
                className="inline-flex h-9 min-h-9 px-3 sm:px-4 items-center justify-center gap-1.5 rounded-lg font-semibold shadow-2xs shrink-0"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="leading-none inline-block">New Prediction</span>
              </Button>

              {/* Mobile menu toggle button */}
              <button
                type="button"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden shrink-0"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer Menu */}
          {menuOpen && (
            <nav aria-label="Mobile Navigation" className="border-t border-slate-100 py-3 md:hidden space-y-1">
              {items.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => navigate(id)}
                  aria-current={activeTab === id ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    activeTab === id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4 text-slate-500" />
                  <span>{label}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenHowItWorks();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
              >
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <span>How it works guide</span>
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar for quick 1-thumb tab navigation */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-1.5 backdrop-blur-xs md:hidden shadow-lg"
      >
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center py-1 text-2xs font-medium transition-colors ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`h-5 w-5 mb-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

