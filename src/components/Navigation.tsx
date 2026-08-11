import React from 'react';
import { LayoutDashboard, Target, History, Settings, Moon, Plus, Calendar } from 'lucide-react';

interface NavigationProps {
  activeTab: 'today' | 'calibration' | 'history' | 'settings';
  setActiveTab: (tab: 'today' | 'calibration' | 'history' | 'settings') => void;
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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4361ee] font-bold text-lg shadow-xs">
              <Target className="w-5 h-5 text-[#4361ee]" />
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
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Today</span>
            </button>

            <button
              onClick={() => setActiveTab('calibration')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'calibration'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Calibration</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
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
              <Moon className="w-4 h-4 text-indigo-600" />
            </button>

            <button
              onClick={onOpenNewTask}
              className="flex items-center space-x-1.5 bg-[#4361ee] hover:bg-[#3852d0] text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-xs transition-colors"
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
