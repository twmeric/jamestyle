import { useEffect, useState } from 'react';
import { useAppStore } from './store/appStore';
import HealingIntro from './components/HealingIntro';
import Opening from './components/Opening';
import CardGallery from './components/CardGallery';
import EndingScreen from './components/EndingScreen';
import ShareModal from './components/ShareModal';

import LangToggle from './components/LangToggle';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import TouchRipple from './components/TouchRipple';
import GlitchEffect from './components/GlitchEffect';
import AchievementToast from './components/AchievementToast';
import { motion } from 'framer-motion';
import { checkTimeBasedAchievements, recordVisitAndCheckStreak } from './utils/achievements';

function App() {
  const { phase, lang, initTracking, setPhase } = useAppStore();
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Initialize session tracking on mount
  useEffect(() => {
    initTracking();
    checkTimeBasedAchievements();
    recordVisitAndCheckStreak();
  }, [initTracking]);

  // Secret key combo to open analytics: press 'a' 3 times quickly
  useEffect(() => {
    let pressCount = 0;
    let timer: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') {
        pressCount++;
        clearTimeout(timer);
        timer = setTimeout(() => { pressCount = 0; }, 1000);
        if (pressCount >= 3) {
          pressCount = 0;
          setShowAnalytics(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, []);

  if (showAnalytics) {
    return <AnalyticsDashboard onClose={() => setShowAnalytics(false)} />;
  }

  return (
    <div className={`font-naikai ${lang === 'sc' ? 'lang-sc' : ''}`}>
      <LangToggle />

      {/* Healing intro (30s immersive opening) */}
      {phase === 'healing' && <HealingIntro onComplete={() => setPhase('opening')} />}

      {/* Opening animation */}
      {phase === 'opening' && <Opening />}

      {/* Main gallery */}
      {phase === 'gallery' && <CardGallery />}

      {/* Ending screen */}
      {phase === 'ending' && <EndingScreen />}

      {/* Modals */}
      <ShareModal />

      {/* Visual Effects */}
      <TouchRipple />
      <GlitchEffect />
      <AchievementToast />
    </div>
  );
}

export default App;
