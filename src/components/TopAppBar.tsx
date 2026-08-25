/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface TopAppBarProps {
  onOpenMenu: () => void;
  onOpenHelp: () => void;
  onOpenAdmin?: () => void;
  isLoggedIn?: boolean;
  userProfileImage?: string;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onOpenMenu,
  onOpenHelp,
  onOpenAdmin,
  isLoggedIn,
  userProfileImage,
}) => {
  const [logoTapCount, setLogoTapCount] = useState(0);

  const handleLogoClick = () => {
    const next = logoTapCount + 1;
    if (next >= 5) {
      setLogoTapCount(0);
      if (onOpenAdmin) onOpenAdmin();
    } else {
      setLogoTapCount(next);
      setTimeout(() => setLogoTapCount(0), 2500);
    }
  };

  return (
    <header className="w-full sticky top-0 bg-[#F8F9FC]/95 backdrop-blur-md shadow-xs z-40 border-b border-[#EDEEF1]">
      <div className="flex items-center justify-between px-5 h-16 w-full max-w-md mx-auto">
        <button
          onClick={onOpenMenu}
          className="text-[#584238] hover:bg-[#F2F3F6] active:scale-95 transition-all rounded-full p-2 flex items-center justify-center cursor-pointer relative"
          aria-label="메뉴 열기"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
          {/* 로그인 상태 뱃지 */}
          {isLoggedIn && !userProfileImage && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
          )}
        </button>

        {/* Brand Logo (5-tap hidden developer shortcut to Admin Auth Gate) */}
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-1.5 select-none cursor-pointer active:scale-98 transition-transform"
        >
          <span className="text-[20px] font-extrabold tracking-tight text-[#FF7E36] font-['Noto_Sans_KR'] flex items-center gap-1">
            <span className="material-symbols-outlined text-[#FF7E36] text-[22px] fill-1">local_shipping</span>
            개꿀 <span className="text-[#A04100] font-['Be_Vietnam_Pro'] ml-0.5">Doghoney</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn && userProfileImage && (
            <img 
              src={userProfileImage} 
              alt="프로필" 
              className="w-8 h-8 rounded-full border-2 border-[#FF7E36] object-cover cursor-pointer shadow-sm"
              onClick={onOpenMenu}
            />
          )}
          <button
            onClick={onOpenHelp}
            className="text-[#584238] hover:bg-[#F2F3F6] active:scale-95 transition-all rounded-full p-2 flex items-center justify-center cursor-pointer"
            aria-label="도움말 보기"
          >
            <span className="material-symbols-outlined text-[24px]">help</span>
          </button>
        </div>
      </div>
    </header>
  );
};
