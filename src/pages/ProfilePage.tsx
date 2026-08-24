import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { CAR_DATA } from '../components/ForceCarSelectModal';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [manufacturer, setManufacturer] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Load existing car info if any
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.carInfo) {
            setManufacturer(data.carInfo.manufacturer || "");
            setCarModel(data.carInfo.carModel || "");
            setCarYear(data.carInfo.carYear || "");
          }
        }
      } else {
        // Redirect to home if not logged in
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSave = async () => {
    if (!currentUser) return;
    if (!manufacturer || !carModel || !carYear) {
      alert('모든 항목을 선택해주세요.');
      return;
    }
    
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      // setDoc with merge to avoid overwriting other fields like nickname, role
      await setDoc(userRef, {
        carInfo: {
          manufacturer,
          carModel,
          carYear
        }
      }, { merge: true });
      alert('차량 정보가 성공적으로 저장되었습니다!');
      navigate('/');
    } catch (error) {
      console.error("Error saving car info:", error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const availableModels = manufacturer ? Object.keys(CAR_DATA[manufacturer] || {}) : [];
  const availableYears = manufacturer && carModel ? (CAR_DATA[manufacturer][carModel] || []) : [];

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-['Pretendard']">
      <header className="w-full bg-white shadow-xs border-b border-[#EDEEF1] h-14 flex items-center px-4">
        <button 
          onClick={() => navigate(-1)}
          className="text-[#584238] p-2 -ml-2 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
        </button>
        <h1 className="text-[17px] font-bold text-[#1A1A1A] ml-2 flex-1">내 차 설정</h1>
      </header>

      <main className="p-5 max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-1">내 차 정보 입력</h2>
          <p className="text-[14px] text-gray-500 mb-6">
            차량 정보를 설정하면 향후 트렁크 용량 측정 시<br/>정확한 가상 시뮬레이션을 제공받을 수 있습니다.
          </p>

          <div className="space-y-5">
            {/* 제조사 선택 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-gray-700 ml-1">제조사</label>
              <select 
                value={manufacturer}
                onChange={(e) => {
                  setManufacturer(e.target.value);
                  setCarModel("");
                  setCarYear("");
                }}
                className="w-full bg-[#F4F5F7] border border-transparent focus:border-[#FF7E36] focus:bg-white focus:ring-1 focus:ring-[#FF7E36] rounded-xl px-4 py-3.5 text-[15px] outline-none transition-all appearance-none cursor-pointer text-[#1A1A1A]"
              >
                <option value="">제조사를 선택해주세요</option>
                {Object.keys(CAR_DATA).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* 차종 선택 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-gray-700 ml-1">차종</label>
              <select 
                value={carModel}
                onChange={(e) => {
                  setCarModel(e.target.value);
                  setCarYear("");
                }}
                disabled={!manufacturer}
                className="w-full bg-[#F4F5F7] border border-transparent focus:border-[#FF7E36] focus:bg-white focus:ring-1 focus:ring-[#FF7E36] rounded-xl px-4 py-3.5 text-[15px] outline-none transition-all appearance-none cursor-pointer text-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">차종을 선택해주세요</option>
                {availableModels.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* 연식 선택 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-gray-700 ml-1">연식</label>
              <select 
                value={carYear}
                onChange={(e) => setCarYear(e.target.value)}
                disabled={!carModel}
                className="w-full bg-[#F4F5F7] border border-transparent focus:border-[#FF7E36] focus:bg-white focus:ring-1 focus:ring-[#FF7E36] rounded-xl px-4 py-3.5 text-[15px] outline-none transition-all appearance-none cursor-pointer text-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">연식을 선택해주세요</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}년식</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || !manufacturer || !carModel || !carYear}
            className="w-full mt-8 bg-[#FF7E36] hover:bg-[#E56A28] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-[16px] py-4 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </main>
    </div>
  );
};
