/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { TelemetryTracker } from '../utils/analytics/telemetryTracker';

interface AdminAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SESSION_KEY_ADMIN_AUTH = 'trunkfit_admin_auth_token';
const DEFAULT_MASTER_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'doghoney2026!';

export const AdminAnalyticsModal: React.FC<AdminAnalyticsModalProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_KEY_ADMIN_AUTH) === 'authorized';
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'cars' | 'items' | 'commerce'>('overview');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAuthenticated(sessionStorage.getItem(SESSION_KEY_ADMIN_AUTH) === 'authorized');
      setPasswordInput('');
      setAuthError(null);
    }
  }, [isOpen]);

  const bi = useMemo(() => TelemetryTracker.getAggregatedBI(), [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (attemptCount >= 5) {
      setAuthError('보안 정책상 연속 5회 실패로 입력이 잠겼습니다. 창을 닫고 잠시 후 다시 시도해 주세요.');
      return;
    }

    if (passwordInput === DEFAULT_MASTER_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY_ADMIN_AUTH, 'authorized');
      setIsAuthenticated(true);
      setAuthError(null);
      setAttemptCount(0);
    } else {
      const nextAttempts = attemptCount + 1;
      setAttemptCount(nextAttempts);
      setAuthError(`관리자 마스터 비밀번호가 일치하지 않습니다. (${nextAttempts}/5회)`);
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY_ADMIN_AUTH);
    setIsAuthenticated(false);
    setPasswordInput('');
    setAuthError(null);
  };

  const triggerDownload = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadToast(`${fileName} 파일이 성공적으로 다운로드되었습니다.`);
    setTimeout(() => setDownloadToast(null), 3500);
  };

  const handleExportMeasurements = () => {
    const csv = TelemetryTracker.exportMeasurementsCSV();
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerDownload(csv, `TrunkFit_측정데이터_${dateStr}.csv`);
  };

  const handleExportCommerce = () => {
    const csv = TelemetryTracker.exportCommerceClicksCSV();
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerDownload(csv, `TrunkFit_쿠팡전환데이터_${dateStr}.csv`);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0F172A] text-slate-100 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-slate-700 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] p-4.5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-[#FF7E36] flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[22px]">
                {isAuthenticated ? 'monitoring' : 'lock'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[16px] text-white tracking-tight">
                  {isAuthenticated ? '관리자 마케팅 & BI 대시보드' : '관리자 보안 인증 (Admin Gate)'}
                </h3>
                <span className="text-[10px] bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-full border border-orange-500/30">
                  {isAuthenticated ? 'AUTHORIZED' : 'PROTECTED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isAuthenticated
                  ? '실시간 유저 행동 분석 • 차종 통계 • 쿠팡 커머스 전환'
                  : '인가된 최고 관리자만 접근할 수 있습니다.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-600 transition-colors cursor-pointer"
                title="관리자 세션 종료"
              >
                세션 종료
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* ─── SECURITY AUTHENTICATION GATE (When Not Authenticated) ─── */}
        {!isAuthenticated ? (
          <div className="p-6 flex flex-col gap-5 bg-[#0F172A]">
            <div className="flex flex-col items-center text-center gap-2 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 text-slate-950 font-black">
                <span className="material-symbols-outlined text-[32px]">shield_person</span>
              </div>
              <h4 className="font-extrabold text-[17px] text-white mt-1">
                관리자 마스터 키 확인
              </h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                비즈니스 통계 및 유저 데이터 보안을 위해 관리자 인증 비밀번호를 입력해 주세요.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5 mt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>마스터 비밀번호</span>
                  <span className="text-[10.5px] text-slate-500 font-normal">Master Security Key</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="관리자 비밀번호 입력"
                    className="w-full bg-[#1E293B] border border-slate-600 focus:border-[#FF7E36] rounded-xl py-3 pl-3.5 pr-10 text-xs text-white placeholder-slate-500 outline-none transition-all"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-rose-400 shrink-0">error</span>
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#FF7E36] hover:bg-[#E0601A] text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer mt-1"
              >
                <span className="material-symbols-outlined text-[17px]">lock_open</span>
                인증 확인 및 대시보드 진입
              </button>
            </form>
          </div>
        ) : (
          /* ─── FULL AUTHENTICATED DASHBOARD ─── */
          <>
            {/* Download Toast */}
            {downloadToast && (
              <div className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-4 py-2 text-center border-b border-emerald-500/30 animate-in fade-in">
                {downloadToast}
              </div>
            )}

            {/* Sub Navigation */}
            <div className="flex border-b border-slate-800 bg-[#141E33] px-3 pt-2 gap-1 text-xs">
              {[
                { key: 'overview', label: '📊 종합 KPI' },
                { key: 'cars', label: '🚗 차종 점유율' },
                { key: 'items', label: '🥕 인기 물품' },
                { key: 'commerce', label: '🛒 쿠팡 전환' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSubTab(tab.key as any)}
                  className={`px-3 py-2 font-bold rounded-t-xl transition-all cursor-pointer ${
                    activeSubTab === tab.key
                      ? 'bg-[#0F172A] text-[#FF7E36] border-t-2 border-[#FF7E36]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Body Content */}
            <div className="p-4 overflow-y-auto flex flex-col gap-4 bg-[#0F172A]">
              {/* ─── TAB 1: OVERVIEW ─── */}
              {activeSubTab === 'overview' && (
                <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                  {/* 4 Primary KPI Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* 1. 총 측정 수 */}
                    <div className="bg-[#1E293B]/80 p-3.5 rounded-2xl border border-slate-700/60 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                        <span>총 측정 세션</span>
                        <span className="material-symbols-outlined text-[16px] text-blue-400">straighten</span>
                      </div>
                      <span className="text-2xl font-black text-white">{bi.totalMeasurements.toLocaleString()}건</span>
                      <span className="text-[10.5px] text-emerald-400 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">trending_up</span>
                        당근 연동 측정 활발
                      </span>
                    </div>

                    {/* 2. 쿠팡 전환 클릭 */}
                    <div className="bg-[#1E293B]/80 p-3.5 rounded-2xl border border-slate-700/60 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                        <span>쿠팡 구매 클릭</span>
                        <span className="material-symbols-outlined text-[16px] text-orange-400">ads_click</span>
                      </div>
                      <span className="text-2xl font-black text-orange-400">{bi.totalClicks.toLocaleString()}회</span>
                      <span className="text-[10.5px] text-orange-300">
                        전환율(CTR) <strong>{bi.estimatedCTR}%</strong>
                      </span>
                    </div>

                    {/* 3. 보유 차종 커버리지 */}
                    <div className="bg-[#1E293B]/80 p-3.5 rounded-2xl border border-slate-700/60 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                        <span>최다 보유 차종</span>
                        <span className="material-symbols-outlined text-[16px] text-purple-400">directions_car</span>
                      </div>
                      <span className="text-sm font-extrabold text-white truncate">
                        {bi.topCars[0]?.model || '싼타페'}
                      </span>
                      <span className="text-[10.5px] text-slate-400">
                        점유율 {bi.topCars[0]?.sharePercent || 0}%
                      </span>
                    </div>

                    {/* 4. 예상 제휴 수수료 */}
                    <div className="bg-[#1E293B]/80 p-3.5 rounded-2xl border border-slate-700/60 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                        <span>예상 커머스 수익</span>
                        <span className="material-symbols-outlined text-[16px] text-emerald-400">payments</span>
                      </div>
                      <span className="text-lg font-black text-emerald-400">
                        ₩{bi.estimatedRevenueKRW.toLocaleString()}
                      </span>
                      <span className="text-[10.5px] text-emerald-300/80">
                        수수료율 3% 추정치
                      </span>
                    </div>
                  </div>

                  {/* Data Extraction Action Center */}
                  <div className="bg-gradient-to-br from-[#1E293B] to-[#162032] p-4 rounded-2xl border border-slate-700 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-orange-400">download</span>
                        <span className="font-extrabold text-sm text-white">마케팅 데이터 원클릭 추출 (CSV)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Excel / Google Sheets 호환</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleExportMeasurements}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px] text-blue-400">table_chart</span>
                        측정 이력 CSV
                      </button>
                      <button
                        onClick={handleExportCommerce}
                        className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
                        쿠팡 전환 CSV
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 2: CAR DISTRIBUTION ─── */}
              {activeSubTab === 'cars' && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                  <span className="text-xs font-bold text-slate-300">사용자 보유 차종 점유율 랭킹 TOP 5</span>
                  <div className="flex flex-col gap-2.5">
                    {bi.topCars.map((car, idx) => (
                  <div key={car.model} className="bg-[#1E293B] p-3 rounded-xl border border-slate-700/60 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <strong className="text-white">{car.model}</strong>
                      </div>
                      <span className="font-extrabold text-[#FF7E36]">{car.count}회 ({car.sharePercent}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, car.sharePercent)}%` }}
                      />
                    </div>
                  </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── TAB 3: TOP MEASURED ITEMS ─── */}
              {activeSubTab === 'items' && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                  <span className="text-xs font-bold text-slate-300">당근마켓 최다 측정 품목 및 적재 성공률</span>
                  <div className="flex flex-col gap-2">
                    {bi.topItems.map((item, idx) => (
                      <div key={item.name} className="bg-[#1E293B] p-3 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-400 font-bold text-[11px] w-4">{idx + 1}.</span>
                          <div>
                            <strong className="text-white block">{item.name}</strong>
                            <span className="text-[10.5px] text-slate-400">총 {item.count}회 측정</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                            적재 성공 {item.fitsCount}
                          </span>
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-500/30">
                            적재 불가 {item.overCount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── TAB 4: COMMERCE PERFORMANCE ─── */}
              {activeSubTab === 'commerce' && (
                <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                  <span className="text-xs font-bold text-slate-300">쿠팡 강화학습 4대 추천 전략별 클릭 성과</span>
                  <div className="flex flex-col gap-2.5">
                    {bi.strategyPerformance.map((strat) => (
                      <div key={strat.strategy} className="bg-[#1E293B] p-3 rounded-xl border border-slate-700/60 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <strong className="text-white">{strat.label}</strong>
                          <span className="font-extrabold text-orange-400">{strat.clicks}회 클릭 ({strat.sharePercent}%)</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#3B82F6] h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, strat.sharePercent)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="p-3.5 bg-[#141E33] border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>{isAuthenticated ? '🔒 관리자 보안 세션 활성화됨' : '보안 접근 제어 활성화'}</span>
          <button
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
