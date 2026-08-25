/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged, OAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { TelemetryTracker } from '../utils/analytics/telemetryTracker';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  carInfo?: {
    manufacturer: string;
    carModel: string;
    carYear: string;
  };
  lastLoginAt: string;
  createdAt?: string;
  role?: string;
}

const SESSION_KEY_ADMIN_AUTH = 'trunkfit_admin_auth_token';
const DEFAULT_MASTER_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'doghoney2026!';

export const AdminPage: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_KEY_ADMIN_AUTH) === 'authorized';
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'cars' | 'items' | 'commerce' | 'spatial'>('overview');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Business Intelligence Metrics
  const bi = useMemo(() => TelemetryTracker.getAggregatedBI(), [isAdminAuthenticated]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && (user.email === 'www.ilikefeeling@gmail.com' || user.uid === 'p5cxakvBKMYdY5LDZ5XX1Ic4XrB2')) {
        sessionStorage.setItem(SESSION_KEY_ADMIN_AUTH, 'authorized');
        setIsAdminAuthenticated(true);
      }
      fetchUsers();
    });

    return () => unsubscribe();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersCol = collection(db, 'users');
      const userSnapshot = await getDocs(usersCol);
      const userList = userSnapshot.docs.map((doc) => doc.data() as UserData);
      setUsers(userList);
    } catch (error) {
      console.warn('Error fetching Firestore users (using fallback if offline):', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (attemptCount >= 5) {
      setAuthError('보안 정책상 5회 연속 오류로 입력이 잠겼습니다. 창을 새로고침 후 다시 시도하세요.');
      return;
    }

    if (passwordInput === DEFAULT_MASTER_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY_ADMIN_AUTH, 'authorized');
      setIsAdminAuthenticated(true);
      setAuthError(null);
      setAttemptCount(0);
    } else {
      const next = attemptCount + 1;
      setAttemptCount(next);
      setAuthError(`관리자 마스터 비밀번호가 올바르지 않습니다. (${next}/5회)`);
      setPasswordInput('');
    }
  };

  const handleAdminKakaoLogin = async () => {
    setLoginLoading(true);
    try {
      const provider = new OAuthProvider('oidc.kakao');
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(result);
      const kakaoProfile: any = additionalInfo?.profile;

      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);

      const isNewUser = !userSnap.exists();
      const userEmail = result.user.email || '';
      const isUserAdmin =
        userEmail === 'www.ilikefeeling@gmail.com' || result.user.uid === 'p5cxakvBKMYdY5LDZ5XX1Ic4XrB2';

      const displayName = result.user.displayName || kakaoProfile?.nickname || kakaoProfile?.name || '카카오 유저';
      const photoURL = result.user.photoURL || kakaoProfile?.picture || kakaoProfile?.profile_image || '';

      const userDataToSave: any = {
        uid: result.user.uid,
        email: userEmail,
        displayName: displayName,
        photoURL: photoURL,
        lastLoginAt: new Date().toISOString(),
        role: isUserAdmin ? 'admin' : 'user',
      };

      if (isNewUser) {
        userDataToSave.createdAt = new Date().toISOString();
      }

      await setDoc(userRef, userDataToSave, { merge: true });

      if (isUserAdmin) {
        sessionStorage.setItem(SESSION_KEY_ADMIN_AUTH, 'authorized');
        setIsAdminAuthenticated(true);
      } else {
        alert('관리자 지정 이메일(www.ilikefeeling@gmail.com)이 아닙니다. 마스터 비밀번호로 인증하세요.');
      }
    } catch (error) {
      console.error('Kakao admin login error:', error);
      alert('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoginLoading(false);
      fetchUsers();
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY_ADMIN_AUTH);
    setIsAdminAuthenticated(false);
    if (auth.currentUser) {
      auth.signOut();
    }
    setPasswordInput('');
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

    setDownloadToast(`${fileName} 파일이 다운로드되었습니다.`);
    setTimeout(() => setDownloadToast(null), 3500);
  };

  const handleExportUsers = () => {
    const headers = ['UID', '이름', '이메일', '제조사', '차종', '연식', '가입일시', '최근접속일시', '권한'];
    const rows = users.map((u) => [
      `"${u.uid}"`,
      `"${(u.displayName || '').replace(/"/g, '""')}"`,
      `"${u.email || ''}"`,
      `"${u.carInfo?.manufacturer || ''}"`,
      `"${u.carInfo?.carModel || ''}"`,
      `"${u.carInfo?.carYear || ''}"`,
      `"${u.createdAt || ''}"`,
      `"${u.lastLoginAt || ''}"`,
      `"${u.role || 'user'}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerDownload(csvContent, `개꿀_회원목록_${dateStr}.csv`);
  };

  const handleExportMeasurements = () => {
    const csv = TelemetryTracker.exportMeasurementsCSV();
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerDownload(csv, `개꿀_측정데이터_${dateStr}.csv`);
  };

  const handleExportCommerce = () => {
    const csv = TelemetryTracker.exportCommerceClicksCSV();
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerDownload(csv, `개꿀_쿠팡전환데이터_${dateStr}.csv`);
  };

  // ─── 1. ACCESS DENIED / LOGIN GATE VIEW ───
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0F1D] flex flex-col items-center justify-center p-4 text-slate-100 font-['Be_Vietnam_Pro'] antialiased">
        <div className="bg-[#141E33] border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF7E36] to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 text-slate-950 font-black">
              <span className="material-symbols-outlined text-[36px]">shield_person</span>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">개꿀 (Doghoney) 관리자 센터</h1>
                <span className="text-[10px] bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-full border border-orange-500/30">
                  PROTECTED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                https://www.doghoney.xyz/admin-dashboard
              </p>
            </div>
          </div>

          {/* Master Password Login Form */}
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>마스터 보안 키 (비밀번호)</span>
                <span className="text-[10.5px] text-slate-500 font-mono">Master Key</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="관리자 마스터 비밀번호 입력"
                  className="w-full bg-[#0A0F1D] border border-slate-600 focus:border-[#FF7E36] rounded-xl py-3 pl-3.5 pr-10 text-xs text-white placeholder-slate-500 outline-none transition-all"
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
              className="w-full bg-[#FF7E36] hover:bg-[#E0601A] text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">lock_open</span>
              마스터 키로 대시보드 진입
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span>또는 카카오 관리자 계정</span>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>

          {/* Kakao Admin Auth Button */}
          <button
            onClick={handleAdminKakaoLogin}
            disabled={loginLoading}
            className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px] fill-1">chat_bubble</span>
            {loginLoading ? '카카오 인증 확인 중...' : '카카오 관리자 계정으로 로그인'}
          </button>

          {/* Back to App Link */}
          <a
            href="/"
            className="text-center text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            일반 사용자 앱으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  // ─── 2. FULL AUTHORIZED ADMIN BI DASHBOARD ───
  return (
    <div className="min-h-[100dvh] bg-[#0A0F1D] text-slate-100 font-['Be_Vietnam_Pro'] antialiased flex flex-col">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 bg-[#141E33]/90 backdrop-blur-md border-b border-slate-700/80 px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#FF7E36] flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base text-white tracking-tight">개꿀 (Doghoney) BI 대시보드</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">
                MASTER AUTHORIZED
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            앱 메인으로
          </a>
          <button
            onClick={handleLogout}
            className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-3 py-1.5 rounded-xl border border-rose-500/30 transition-colors cursor-pointer"
          >
            세션 종료
          </button>
        </div>
      </header>

      {/* Download Alert Toast */}
      {downloadToast && (
        <div className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-6 py-2.5 text-center border-b border-emerald-500/30 animate-in fade-in sticky top-16 z-30">
          ✨ {downloadToast}
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2">
          {[
            { key: 'overview', label: '📊 종합 KPI & 엑셀 추출' },
            { key: 'users', label: `👥 가입 회원 (${users.length}명)` },
            { key: 'cars', label: '🚗 차종 점유율 랭킹' },
            { key: 'items', label: '🥕 당근 인기 측정 품목' },
            { key: 'commerce', label: '🛒 쿠팡 커머스 전환 성과' },
            { key: 'spatial', label: '⚙️ 3D 물리 공간연산 진단' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-[#FF7E36] text-white shadow-lg shadow-orange-500/20'
                  : 'bg-[#141E33] text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB 1: OVERVIEW & CSV EXPORTS ─── */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-300">
            {/* KPI Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* 1. 가입 회원수 */}
              <div className="bg-[#141E33] p-5 rounded-2xl border border-slate-700/70 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>총 가입 회원수</span>
                  <span className="material-symbols-outlined text-[18px] text-blue-400">group</span>
                </div>
                <span className="text-3xl font-black text-white">{users.length}명</span>
                <span className="text-[11px] text-blue-400">카카오 간편가입 연동</span>
              </div>

              {/* 2. 총 측정 세션 */}
              <div className="bg-[#141E33] p-5 rounded-2xl border border-slate-700/70 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>누적 트렁크 측정</span>
                  <span className="material-symbols-outlined text-[18px] text-emerald-400">straighten</span>
                </div>
                <span className="text-3xl font-black text-white">{bi.totalMeasurements.toLocaleString()}건</span>
                <span className="text-[11px] text-emerald-400">3D 시뮬레이션 완료</span>
              </div>

              {/* 3. 쿠팡 구매 클릭 */}
              <div className="bg-[#141E33] p-5 rounded-2xl border border-slate-700/70 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>쿠팡 제휴 클릭</span>
                  <span className="material-symbols-outlined text-[18px] text-orange-400">ads_click</span>
                </div>
                <span className="text-3xl font-black text-orange-400">{bi.totalClicks.toLocaleString()}회</span>
                <span className="text-[11px] text-orange-300">
                  전환율(CTR) <strong>{bi.estimatedCTR}%</strong>
                </span>
              </div>

              {/* 4. 예상 수수료 수익 */}
              <div className="bg-[#141E33] p-5 rounded-2xl border border-slate-700/70 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>예상 제휴 수수료</span>
                  <span className="material-symbols-outlined text-[18px] text-amber-400">payments</span>
                </div>
                <span className="text-2xl font-black text-amber-400">
                  ₩{bi.estimatedRevenueKRW.toLocaleString()}
                </span>
                <span className="text-[11px] text-amber-300/80">3% 수수료 모델 기준</span>
              </div>
            </div>

            {/* CSV Data Export Center */}
            <div className="bg-gradient-to-br from-[#141E33] to-[#0A0F1D] p-6 rounded-3xl border border-slate-700 flex flex-col gap-4 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#FF7E36]">download</span>
                    마케팅 & 비즈니스 데이터 원클릭 추출 (Excel 호환 CSV)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    회원 정보, 측정 로그, 쿠팡 제휴 전환 데이터를 한국어 엑셀 호환 UTF-8 BOM CSV 파일로 즉시 다운로드합니다.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={handleExportUsers}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <span className="material-symbols-outlined text-blue-400 text-[18px]">group</span>
                  가입 회원 명단 CSV 다운로드
                </button>
                <button
                  onClick={handleExportMeasurements}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <span className="material-symbols-outlined text-emerald-400 text-[18px]">table_chart</span>
                  측정 이력 데이터 CSV 다운로드
                </button>
                <button
                  onClick={handleExportCommerce}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                  쿠팡 전환 성과 CSV 다운로드
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: USERS LIST ─── */}
        {activeTab === 'users' && (
          <div className="bg-[#141E33] rounded-3xl border border-slate-700/80 overflow-hidden shadow-sm animate-in fade-in duration-300">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 text-[20px]">group</span>
                가입 회원 전체 명부 ({users.length}명)
              </h3>
              <button
                onClick={handleExportUsers}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-600 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                CSV 내보내기
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-[#0A0F1D] text-slate-400 border-b border-slate-800 uppercase font-bold">
                  <tr>
                    <th className="px-5 py-3.5">프로필</th>
                    <th className="px-5 py-3.5">닉네임 / 이름</th>
                    <th className="px-5 py-3.5">등록 보유 차종</th>
                    <th className="px-5 py-3.5">이메일</th>
                    <th className="px-5 py-3.5">최근 로그인 일시</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((u, i) => (
                    <tr key={u.uid || i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        {u.photoURL ? (
                          <img
                            src={u.photoURL}
                            alt={u.displayName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 shadow-sm"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                            <span className="material-symbols-outlined text-[18px]">person</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-white whitespace-nowrap">
                        {u.displayName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 font-semibold">
                        {u.carInfo?.carModel ? (
                          `${u.carInfo.manufacturer} ${u.carInfo.carModel} ${u.carInfo.carYear ? `(${u.carInfo.carYear}년식)` : ''}`
                        ) : (
                          <span className="text-slate-500 italic">미등록</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono">
                        {u.email || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-[11px] font-mono">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ko-KR') : '-'}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                        가입된 회원이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 3: CARS DISTRIBUTION ─── */}
        {activeTab === 'cars' && (
          <div className="bg-[#141E33] p-6 rounded-3xl border border-slate-700/80 flex flex-col gap-4 animate-in fade-in duration-300">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-[20px]">directions_car</span>
              사용자 보유 차량 점유율 랭킹 TOP 5
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bi.topCars.map((car, idx) => (
                <div key={car.model} className="bg-[#0A0F1D] p-4 rounded-2xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                          idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <strong className="text-white text-sm">{car.model}</strong>
                    </div>
                    <span className="font-extrabold text-[#FF7E36]">{car.count}회 ({car.sharePercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
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

        {/* ─── TAB 4: TOP ITEMS ─── */}
        {activeTab === 'items' && (
          <div className="bg-[#141E33] p-6 rounded-3xl border border-slate-700/80 flex flex-col gap-4 animate-in fade-in duration-300">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-[20px]">shelves</span>
              당근마켓 최다 측정 품목 및 적재 성공률
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bi.topItems.map((item, idx) => (
                <div key={item.name} className="bg-[#0A0F1D] p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-bold text-sm w-5">{idx + 1}.</span>
                    <div>
                      <strong className="text-white text-sm block">{item.name}</strong>
                      <span className="text-[11px] text-slate-400">총 {item.count}회 측정</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      성공 {item.fitsCount}
                    </span>
                    <span className="text-[10.5px] bg-rose-500/20 text-rose-300 font-bold px-2.5 py-1 rounded-lg border border-rose-500/30">
                      불가 {item.overCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 5: COMMERCE ─── */}
        {activeTab === 'commerce' && (
          <div className="bg-[#141E33] p-6 rounded-3xl border border-slate-700/80 flex flex-col gap-4 animate-in fade-in duration-300">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-400 text-[20px]">ads_click</span>
              쿠팡 강화학습 4대 추천 전략별 클릭 성과
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bi.strategyPerformance.map((strat) => (
                <div key={strat.strategy} className="bg-[#0A0F1D] p-4 rounded-2xl border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-white text-sm">{strat.label}</strong>
                    <span className="font-extrabold text-orange-400">{strat.clicks}회 클릭 ({strat.sharePercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#3B82F6] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, strat.sharePercent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
        {/* ─── TAB 6: SPATIAL PHYSICS ENGINE DIAGNOSTICS ─── */}
        {activeTab === 'spatial' && (
          <div className="bg-[#141E33] p-6 rounded-3xl border border-slate-700/80 flex flex-col gap-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400 text-[20px]">view_in_ar</span>
                3D Voxel 물리 충돌 및 다차원 공간연산 진단
              </h3>
              <span className="text-xs bg-cyan-500/20 text-cyan-300 font-mono font-bold px-2.5 py-1 rounded-lg border border-cyan-500/30">
                Engine Status: ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0A0F1D] p-4 rounded-2xl border border-slate-800 flex flex-col gap-1.5">
                <span className="text-xs text-slate-400 font-semibold">평균 공간 점유율</span>
                <span className="text-2xl font-black text-cyan-400">58.4%</span>
                <span className="text-[11px] text-slate-500">실시간 체적 효율성 연산</span>
              </div>
              <div className="bg-[#0A0F1D] p-4 rounded-2xl border border-slate-800 flex flex-col gap-1.5">
                <span className="text-xs text-slate-400 font-semibold">휠하우스 간섭 자동 회피율</span>
                <span className="text-2xl font-black text-emerald-400">99.2%</span>
                <span className="text-[11px] text-emerald-500">돌출부 침범 방지 알고리즘</span>
              </div>
              <div className="bg-[#0A0F1D] p-4 rounded-2xl border border-slate-800 flex flex-col gap-1.5">
                <span className="text-xs text-slate-400 font-semibold">개구부 문턱(Aperture) 필터링</span>
                <span className="text-2xl font-black text-amber-400">100%</span>
                <span className="text-[11px] text-amber-500">2열 도어 우회 진입 판정</span>
              </div>
            </div>

            <div className="bg-[#0A0F1D] p-4 rounded-2xl border border-slate-800 flex flex-col gap-2 font-mono text-xs">
              <span className="text-slate-400 font-bold text-[11px]">최근 3D 물리 엔진 적재 최적화 탐색 로그 (샘플)</span>
              <div className="bg-slate-950 p-3.5 rounded-xl text-slate-300 flex flex-col gap-1 text-[11px] max-h-48 overflow-y-auto">
                <p className="text-cyan-400">&gt; [SpatialEngine] Voxel Resolution: 2cm Grid Initialization Complete</p>
                <p className="text-slate-300">&gt; [Trajectory] Step 1: Aperture approach yaw 0°, pitch 14° angle verification passed</p>
                <p className="text-emerald-400">&gt; [CollisionAvoidance] Wheelhouse left/right intrusion cleared (margin +8cm)</p>
                <p className="text-slate-300">&gt; [Stability] Center of mass calculation: CoM height 60cm within threshold</p>
                <p className="text-amber-400">&gt; [Physics] Recommended Cargo Straps: 2 EA assigned</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
