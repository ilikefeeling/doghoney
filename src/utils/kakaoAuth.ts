/**
 * Kakao Social Login and User Profile Management
 */

import { initKakao } from './kakaoShare';

export interface UserProfile {
  id: string;
  nickname: string;
  profileImage?: string;
  email?: string;
  isLoggedIn: boolean;
  registeredCars?: string[]; // Array of car IDs saved in user garage
}

const STORAGE_KEY_USER = 'trunkfit-user-profile';

/**
 * Get current saved user profile from localStorage
 */
export function getSavedUserProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return { id: 'guest', nickname: '게스트', isLoggedIn: false, registeredCars: [] };
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY_USER);
    if (data) {
      return JSON.parse(data);
    }
  } catch { /* ignore */ }

  return { id: 'guest', nickname: '게스트', isLoggedIn: false, registeredCars: [] };
}

/**
 * Save user profile to localStorage
 */
export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
  } catch { /* ignore */ }
}

/**
 * Perform Kakao Social Login
 */
export function loginWithKakao(): Promise<UserProfile> {
  return new Promise((resolve, reject) => {
    const isReady = initKakao();

    if (!isReady || !window.Kakao?.Auth) {
      // If no valid Kakao key or SDK not initialized, provide seamless demo login for testing
      console.warn('[TrunkFit] Kakao SDK not initialized with API key. Performing Fast Demo Login.');
      const demoUser: UserProfile = {
        id: `kakao-${Date.now()}`,
        nickname: '당근러버',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        email: 'danggeun@example.com',
        isLoggedIn: true,
        registeredCars: ['hyundai-santafe-2023'],
      };
      saveUserProfile(demoUser);
      resolve(demoUser);
      return;
    }

    window.Kakao.Auth.login({
      success: () => {
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: (res: any) => {
            const kakaoAccount = res.kakao_account;
            const profile = kakaoAccount?.profile;
            const user: UserProfile = {
              id: String(res.id),
              nickname: profile?.nickname || '카카오 회원',
              profileImage: profile?.profile_image_url || undefined,
              email: kakaoAccount?.email || undefined,
              isLoggedIn: true,
              registeredCars: getSavedUserProfile().registeredCars || [],
            };
            saveUserProfile(user);
            resolve(user);
          },
          fail: (err: any) => {
            reject(err);
          },
        });
      },
      fail: (err: any) => {
        reject(err);
      },
    });
  });
}

/**
 * Logout
 */
export function logoutUser(): Promise<void> {
  return new Promise((resolve) => {
    if (initKakao() && window.Kakao?.Auth?.getAccessToken()) {
      window.Kakao.Auth.logout(() => {
        const guest: UserProfile = { id: 'guest', nickname: '게스트', isLoggedIn: false, registeredCars: [] };
        saveUserProfile(guest);
        resolve();
      });
    } else {
      const guest: UserProfile = { id: 'guest', nickname: '게스트', isLoggedIn: false, registeredCars: [] };
      saveUserProfile(guest);
      resolve();
    }
  });
}
