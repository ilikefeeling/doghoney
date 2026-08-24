import React from 'react';

interface TopAppBarProps {
  onOpenMenu: () => void;
  onOpenHelp: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ onOpenMenu, onOpenHelp }) => {
  return (
    <header className="w-full sticky top-0 bg-[#F8F9FC]/95 backdrop-blur-md shadow-xs z-40 border-b border-[#EDEEF1]">
      <div className="flex items-center justify-between px-5 h-16 w-full max-w-md mx-auto">
        <button
          onClick={onOpenMenu}
          className="text-[#584238] hover:bg-[#F2F3F6] active:scale-95 transition-all rounded-full p-2 flex items-center justify-center cursor-pointer"
          aria-label="메뉴 열기"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div className="flex items-center gap-1.5 select-none">
          <span className="text-[20px] font-extrabold tracking-tight text-[#FF7E36] font-['Noto_Sans_KR'] flex items-center gap-1">
            <span className="material-symbols-outlined text-[#FF7E36] text-[22px] fill-1">local_shipping</span>
            개꿀 <span className="text-[#A04100] font-['Be_Vietnam_Pro'] ml-0.5">Doghoney</span>
          </span>
        </div>

        <button
          onClick={onOpenHelp}
          className="text-[#584238] hover:bg-[#F2F3F6] active:scale-95 transition-all rounded-full p-2 flex items-center justify-center cursor-pointer"
          aria-label="도움말 보기"
        >
          <span className="material-symbols-outlined text-[24px]">help</span>
        </button>
      </div>
    </header>
  );
};
