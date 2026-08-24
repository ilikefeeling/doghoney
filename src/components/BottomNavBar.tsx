import React from 'react';

export type TabKey = 'measure' | 'history' | 'transport' | 'profile';

interface BottomNavBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onTabChange }) => {
  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'measure', label: '측정', icon: 'straighten' },
    { key: 'history', label: '기록', icon: 'history' },
    { key: 'transport', label: '운반', icon: 'local_shipping' },
    { key: 'profile', label: '설정', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#EDEEF1]/95 backdrop-blur-md border-t border-[#DFC0B3]/40 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] h-20 max-w-md mx-auto flex justify-around items-center px-4">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            aria-label={tab.label}
            className={`flex flex-col items-center justify-center transition-all cursor-pointer select-none py-1.5 px-4 rounded-full ${
              isActive
                ? 'bg-[#FF7E36] text-white shadow-xs font-bold scale-105'
                : 'text-[#584238] hover:text-[#FF7E36]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[22px] ${isActive ? 'fill-1' : ''}`}
            >
              {tab.icon}
            </span>
            <span className="text-[11px] tracking-tight font-medium mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
