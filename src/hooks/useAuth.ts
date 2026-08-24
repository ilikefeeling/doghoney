import { useState, useEffect, useCallback } from 'react';

interface UserProfile {
  nickname: string;
  profile_image_url?: string;
}

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    // 1. 카카오 SDK 초기화 및 세션 확인
    const checkKakaoSession = async () => {
      if (!window.Kakao) {
        console.warn('Kakao SDK not loaded yet.');
        setIsReady(true);
        return;
      }

      const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY;
      if (!kakaoKey) {
        console.warn('VITE_KAKAO_JS_KEY is missing.');
        setIsReady(true);
        return;
      }

      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(kakaoKey);
      }

      const token = localStorage.getItem('kakao_access_token');
      if (token) {
        window.Kakao.Auth.setAccessToken(token);
        try {
          const profile = await fetchKakaoProfile();
          setUser(profile);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Failed to fetch profile with existing token', error);
          localStorage.removeItem('kakao_access_token');
          setIsLoggedIn(false);
        }
      }
      setIsReady(true);
    };

    checkKakaoSession();
  }, []);

  const fetchKakaoProfile = (): Promise<UserProfile> => {
    return new Promise((resolve, reject) => {
      window.Kakao.API.request({
        url: '/v2/user/me',
        success: function (response: any) {
          resolve({
            nickname: response.kakao_account?.profile?.nickname || '사용자',
            profile_image_url: response.kakao_account?.profile?.profile_image_url,
          });
        },
        fail: function (error: any) {
          reject(error);
        },
      });
    });
  };

  const loginWithKakao = useCallback(() => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      alert('카카오 로그인을 초기화할 수 없습니다. (키가 없거나 로드되지 않음)');
      return;
    }

    window.Kakao.Auth.login({
      success: async function (authObj: any) {
        const token = authObj.access_token;
        localStorage.setItem('kakao_access_token', token);
        window.Kakao.Auth.setAccessToken(token);
        
        try {
          const profile = await fetchKakaoProfile();
          setUser(profile);
          setIsLoggedIn(true);
        } catch (e) {
          console.error(e);
        }
      },
      fail: function (err: any) {
        console.error('Kakao login fail', err);
        alert('로그인에 실패했습니다.');
      },
    });
  }, []);

  const logout = useCallback(() => {
    if (window.Kakao && window.Kakao.Auth.getAccessToken()) {
      window.Kakao.Auth.logout(() => {
        localStorage.removeItem('kakao_access_token');
        setIsLoggedIn(false);
        setUser(null);
      });
    } else {
      localStorage.removeItem('kakao_access_token');
      setIsLoggedIn(false);
      setUser(null);
    }
  }, []);

  return { isReady, isLoggedIn, user, loginWithKakao, logout };
}


