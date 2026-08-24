import React, { useState, useEffect } from 'react';
import { OAuthProvider, signInWithPopup, signOut, getAdditionalUserInfo } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export const KakaoLoginBtn: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const provider = new OAuthProvider('oidc.kakao');
      // 카카오 계정 선택 창을 강제로 띄우도록 설정
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(result);
      const kakaoProfile: any = additionalInfo?.profile;
      
      // Save user to Firestore
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      const isNewUser = !userSnap.exists();
      const userEmail = result.user.email || '';
      const isAdmin = userEmail === 'www.ilikefeeling@gmail.com' || result.user.uid === 'p5cxakvBKMYdY5LDZ5XX1Ic4XrB2';

      const displayName = result.user.displayName || kakaoProfile?.nickname || kakaoProfile?.name || '카카오 유저';
      const photoURL = result.user.photoURL || kakaoProfile?.picture || kakaoProfile?.profile_image || '';

      const userDataToSave: any = {
        uid: result.user.uid,
        email: userEmail,
        displayName: displayName,
        photoURL: photoURL,
        lastLoginAt: new Date().toISOString(),
        role: isAdmin ? 'admin' : 'user'
      };

      if (isNewUser) {
        userDataToSave.createdAt = new Date().toISOString();
      }

      await setDoc(userRef, userDataToSave, { merge: true });

    } catch (error) {
      console.error('Kakao login error:', error);
      alert('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.photoURL && (
          <img src={user.photoURL} alt="profile" className="w-8 h-8 rounded-full border border-gray-200" />
        )}
        <div className="flex flex-col items-end">
          <button onClick={() => window.location.href = '/profile'} className="text-[12px] font-bold text-[#FF7E36] hover:text-[#E56A28] underline underline-offset-2">
            내 차 설정
          </button>
          <button onClick={handleLogout} className="text-[10px] font-medium text-gray-400 hover:text-gray-600 underline underline-offset-2">
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="bg-[#FEE500] text-[#191919] px-3 py-1.5 rounded-lg font-bold text-[13px] flex items-center gap-1.5 hover:bg-[#FEE500]/90 transition-colors shadow-sm"
    >
      <span className="material-symbols-outlined text-[16px] fill-1">chat_bubble</span>
      {loading ? '로그인 중...' : '카카오 로그인'}
    </button>
  );
};
