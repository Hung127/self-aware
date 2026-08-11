import React from 'react';
import { LayoutDashboard, Target, History, Settings, Moon, Plus, Calendar } from 'lucide-react';

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
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shadow-2xs">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 block leading-tight">
                Calibration
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Evidence-based self-knowledge mirror
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'today'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Today</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('calibration')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'calibration'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Calibration</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Header Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {gcalConnected && (
              <span className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Calendar className="w-3.5 h-3.5" />
                <span>GCal Connected</span>
              </span>
            )}

            <button
              onClick={onOpenSleepLog}
              title="Log sleep"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <Moon className="w-4 h-4 text-blue-600" />
            </button>

            <button
              onClick={onOpenNewTask}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Prediction</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
