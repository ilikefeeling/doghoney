import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged, OAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';

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
}

export const AdminPage: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && (user.email === 'www.ilikefeeling@gmail.com' || user.uid === 'p5cxakvBKMYdY5LDZ5XX1Ic4XrB2')) {
        setIsAdmin(true);
        fetchUsers();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersCol = collection(db, 'users');
      const userSnapshot = await getDocs(usersCol);
      const userList = userSnapshot.docs.map(doc => doc.data() as UserData);
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoginLoading(true);
    try {
      const provider = new OAuthProvider('oidc.kakao');
      // 카카오 계정 선택 창을 강제로 띄우도록 설정
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(result);
      const kakaoProfile: any = additionalInfo?.profile;
      
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      const isNewUser = !userSnap.exists();
      const userEmail = result.user.email || '';
      const isUserAdmin = userEmail === 'www.ilikefeeling@gmail.com' || result.user.uid === 'p5cxakvBKMYdY5LDZ5XX1Ic4XrB2';

      const displayName = result.user.displayName || kakaoProfile?.nickname || kakaoProfile?.name || '카카오 유저';
      const photoURL = result.user.photoURL || kakaoProfile?.picture || kakaoProfile?.profile_image || '';

      const userDataToSave: any = {
        uid: result.user.uid,
        email: userEmail,
        displayName: displayName,
        photoURL: photoURL,
        lastLoginAt: new Date().toISOString(),
        role: isUserAdmin ? 'admin' : 'user'
      };

      if (isNewUser) {
        userDataToSave.createdAt = new Date().toISOString();
      }

      await setDoc(userRef, userDataToSave, { merge: true });

    } catch (error) {
      console.error('Kakao login error:', error);
      alert('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-gray-500 animate-pulse">관리자 권한을 확인 중입니다...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <span className="material-symbols-outlined text-[64px] text-gray-400 mb-4">admin_panel_settings</span>
        <h1 className="text-xl font-bold text-gray-800 mb-2">관리자 로그인이 필요합니다</h1>
        <p className="text-gray-500 mb-6">
          어드민 대시보드에 접근하려면 관리자 계정으로 로그인해 주세요.
        </p>
        <button 
          onClick={handleAdminLogin}
          disabled={loginLoading}
          className="bg-[#FEE500] text-[#191919] px-6 py-3 rounded-lg font-bold text-[15px] flex items-center gap-2 hover:bg-[#FEE500]/90 transition-colors shadow-sm disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px] fill-1">chat_bubble</span>
          {loginLoading ? '로그인 중...' : '카카오 계정으로 관리자 로그인'}
        </button>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-4 px-6 py-2 text-gray-500 font-medium hover:text-gray-800 transition-colors"
        >
          메인으로 돌아가기
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <span className="material-symbols-outlined text-[64px] text-red-400 mb-4">lock</span>
        <h1 className="text-xl font-bold text-gray-800 mb-2">접근 권한이 없습니다</h1>
        <p className="text-gray-500 mb-2">
          이 페이지는 <b>www.ilikefeeling@gmail.com</b> 계정으로 로그인한 관리자만 접근할 수 있습니다.
        </p>
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 inline-block text-left">
          <div className="mb-1">현재 로그인된 계정: <b>{currentUser?.email || '이메일 정보 없음'}</b></div>
          <div>고유 ID (UID): <b className="select-all">{currentUser?.uid}</b></div>
        </div>
        <button 
          onClick={() => {
            auth.signOut().then(() => window.location.reload());
          }}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors mb-2"
        >
          로그아웃 후 다른 계정으로 로그인
        </button>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          메인으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#FF7E36] flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px]">admin_panel_settings</span>
            개꿀 관리자 대시보드
          </h1>
          <button 
            onClick={() => window.location.href = '/'}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            앱으로 돌아가기
          </button>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-blue-500">group</span>
              가입 유저 목록
            </h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
              총 {users.length}명
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">프로필</th>
                  <th scope="col" className="px-6 py-4 font-semibold">이름</th>
                  <th scope="col" className="px-6 py-4 font-semibold">차량 정보</th>
                  <th scope="col" className="px-6 py-4 font-semibold">이메일</th>
                  <th scope="col" className="px-6 py-4 font-semibold">최근 접속일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u, i) => (
                  <tr key={u.uid || i} className="bg-white hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.displayName} className="w-10 h-10 rounded-full border border-gray-200 object-cover shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                      {u.displayName}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {u.carInfo?.carModel ? `${u.carInfo.manufacturer} ${u.carInfo.carModel} ${u.carInfo.carYear ? `(${u.carInfo.carYear}년식)` : ''}` : <span className="text-gray-300 italic">미입력</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {u.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs font-mono">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ko-KR') : '-'}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">sentiment_dissatisfied</span>
                      <p>아직 가입한 유저가 없습니다.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
