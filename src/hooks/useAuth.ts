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
          
          // 토큰 갱신(Refresh) 시도
          const refreshToken = localStorage.getItem('kakao_refresh_token');
          const restApiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
          
          if (refreshToken && restApiKey) {
            try {
              const params = new URLSearchParams();
              params.append('grant_type', 'refresh_token');
              params.append('client_id', restApiKey);
              params.append('refresh_token', refreshToken);
              
              const response = await fetch('https://kauth.kakao.com/oauth/token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                },
                body: params.toString(),
              });
              
              if (response.ok) {
                const data = await response.json();
                const { access_token, refresh_token: new_refresh_token } = data;
                
                localStorage.setItem('kakao_access_token', access_token);
                window.Kakao.Auth.setAccessToken(access_token);
                
                if (new_refresh_token) {
                  localStorage.setItem('kakao_refresh_token', new_refresh_token);
                }
                
                // 갱신된 토큰으로 프로필 재요청
                const profile = await fetchKakaoProfile();
                setUser(profile);
                setIsLoggedIn(true);
                setIsReady(true);
                return;
              }
            } catch (refreshError) {
              console.error('Failed to refresh token', refreshError);
            }
          }
          
          // 갱신 실패 시 로컬스토리지 정리
          localStorage.removeItem('kakao_access_token');
          localStorage.removeItem('kakao_refresh_token');
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
    // 모바일 환경이나 다른 도메인(vercel 임시도메인, www 누락 등)에서 
    // 접속해도 항상 등록된 정식 도메인으로 리다이렉트되도록 고정합니다.
    const redirectUri = window.location.hostname === 'localhost'
      ? 'http://localhost:3000/oauth/callback/kakao'
      : 'https://www.doghoney.xyz/oauth/callback/kakao';

    const restApiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
    if (!restApiKey) {
      alert('카카오 REST API 키가 설정되지 않았습니다.');
      return;
    }

    // JS SDK를 거치지 않고 REST API 방식으로 직접 리다이렉트 (KOE006 에러 원천 차단)
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${restApiKey}&redirect_uri=${redirectUri}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  }, []);

  const logout = useCallback(() => {
    if (window.Kakao && window.Kakao.Auth.getAccessToken()) {
      window.Kakao.Auth.logout(() => {
        localStorage.removeItem('kakao_access_token');
        localStorage.removeItem('kakao_refresh_token');
        setIsLoggedIn(false);
        setUser(null);
      });
    } else {
      localStorage.removeItem('kakao_access_token');
      localStorage.removeItem('kakao_refresh_token');
      setIsLoggedIn(false);
      setUser(null);
    }
  }, []);

  return { isReady, isLoggedIn, user, loginWithKakao, logout };
}


