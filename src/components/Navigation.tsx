import React, { useState } from 'react';
import { LayoutDashboard, Target, History, Settings, Moon, Plus, Calendar, Menu, X } from 'lucide-react';

interface NavigationProps {
  activeTab: 'today' | 'calendar' | 'calibration' | 'history' | 'settings';
  setActiveTab: (tab: 'today' | 'calendar' | 'calibration' | 'history' | 'settings') => void;
  onOpenNewTask: () => void;
  onOpenSleepLog: () => void;
  gcalConnected: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTask,
  onOpenSleepLog,
  gcalConnected
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const items = [
    { id: 'today' as const, label: 'Today', icon: LayoutDashboard },
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
    { id: 'calibration' as const, label: 'Calibration', icon: Target },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'settings' as const, label: 'Settings', icon: Settings }
  ];

  const navigate = (tab: NavigationProps['activeTab']) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
              <Target className="w-5 h-5" />
            </div>
            <div>
                <span className="block font-bold tracking-tight text-slate-900 leading-tight">
                Calibration
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Evidence-based self-knowledge mirror
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden items-center gap-1 lg:flex">
            {items.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => navigate(id)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeTab === id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Icon className="h-[18px] w-[18px]" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Header Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {gcalConnected && (
              <span className="hidden md:flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <Calendar className="h-3.5 w-3.5" />
                <span>Calendar connected</span>
              </span>
            )}

            <button
              onClick={onOpenSleepLog}
              aria-label="Log sleep"
              className="rounded-lg border border-slate-300 p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <Moon className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenNewTask}
              className="hidden items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:flex"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Prediction</span>
            </button>
          </div>
        </div>
        <button aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} onClick={() => setMenuOpen(!menuOpen)} className="absolute right-4 top-4 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        {menuOpen && (
          <nav className="border-t border-slate-100 py-2 lg:hidden">
            {items.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => navigate(id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium ${activeTab === id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Icon className="h-[18px] w-[18px]" />{label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};
