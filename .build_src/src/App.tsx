import { useEffect, useState } from 'react';
import { useAppStore } from './store/appStore';
import HealingIntro from './components/HealingIntro';
import Opening from './components/Opening';
import CardGallery from './components/CardGallery';
import EndingScreen from './components/EndingScreen';


import LangToggle from './components/LangToggle';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import TouchRipple from './components/TouchRipple';
import GlitchEffect from './components/GlitchEffect';
import AchievementToast from './components/AchievementToast';
import { motion } from 'framer-motion';
import { checkTimeBasedAchievements, recordVisitAndCheckStreak } from './utils/achievements';

import { playMusic } from './utils/soundManager';

function App() {
  const { phase, lang, initTracking, setPhase } = useAppStore();
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Initialize session tracking on mount
  useEffect(() => {
    initTracking();
    checkTimeBasedAchievements();
    recordVisitAndCheckStreak();
    playMusic('healing');
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

  // Background music per phase
  useEffect(() => {
    if (phase === 'healing') {
      playMusic('healing');
    } else if (phase === 'gallery') {
      playMusic('gallery');
    } else if (phase === 'ending') {
      playMusic('ending');
    }
  }, [phase]);

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


      {/* Visual Effects */}
      <TouchRipple />
      <GlitchEffect />
      <AchievementToast />

      {/* Powered by Footer — normal flow block, scroll to see */}
      {phase === 'ending' && (
        <footer className="relative z-40 bg-[#0a0a0a] pt-8 pb-4 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
            <span className="text-[10px] text-cream/25 tracking-wider">
              © 2026 JameStyle.com
            </span>
            <a
              href="https://jkdcoding.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity"
            >
              <span className="text-[10px] text-cream/30">
                Powered by{' '}
                <span
                  className="font-bold"
                  style={{
                    color: '#FFFF00',
                    textShadow: '0 0 8px rgba(255,255,0,0.6)',
                  }}
                >
                  JKDCoding
                </span>
              </span>
            </a>
            <div className="flex items-center gap-3 text-[10px] text-cream/20">
              <a
                href="/privacy.html"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cream/50 transition-colors"
              >
                {lang === 'sc' ? '隐私政策' : '隱私政策'}
              </a>
              <span>|</span>
              <a
                href="/terms.html"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cream/50 transition-colors"
              >
                {lang === 'sc' ? '使用条款' : '使用條款'}
              </a>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}

export default App;
