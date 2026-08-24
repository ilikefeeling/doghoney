import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function KakaoCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(location.search).get('code');
    if (!code) {
      setErrorMsg('인가 코드가 없습니다. 다시 로그인해주세요.');
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    const fetchToken = async () => {
      const restApiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
      if (!restApiKey) {
        setErrorMsg('서버 설정 오류: REST API 키가 없습니다. (관리자 문의 필요)');
        return;
      }

      try {
        const redirectUri = window.location.hostname === 'localhost'
          ? 'http://localhost:3000/oauth/callback/kakao'
          : 'https://www.doghoney.xyz/oauth/callback/kakao';
        
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', restApiKey);
        params.append('redirect_uri', redirectUri);
        params.append('code', code);

        const response = await fetch('https://kauth.kakao.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
          body: params.toString(),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error_description || '토큰 발급 실패');
        }

        const data = await response.json();
        const { access_token, refresh_token } = data;
        
        localStorage.setItem('kakao_access_token', access_token);
        if (refresh_token) {
          localStorage.setItem('kakao_refresh_token', refresh_token);
        }

        // 로그인 성공, 메인으로 완전히 다시 로드하여 useAuth가 초기화되도록 함
        window.location.replace('/');
      } catch (err: any) {
        console.error('Failed to get kakao token:', err);
        setErrorMsg(err.message || '로그인 처리 중 오류가 발생했습니다.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    fetchToken();
  }, [location, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FC] p-4">
      {errorMsg ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
          <div className="w-16 h-16 bg-[#FEE2E2] text-[#B91C1C] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">error</span>
          </div>
          <h2 className="text-[18px] font-bold text-[#191C1E] mb-2">로그인 실패</h2>
          <p className="text-[14px] text-[#595F67]">{errorMsg}</p>
          <p className="text-[12px] text-[#595F67] mt-4">잠시 후 메인 화면으로 이동합니다...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 border-4 border-[#FF7E36]/30 border-t-[#FF7E36] rounded-full animate-spin"></div>
          <p className="text-[15px] font-medium text-[#595F67]">카카오 로그인 처리 중...</p>
        </div>
      )}
    </div>
  );
}
