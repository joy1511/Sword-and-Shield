import { useState, useEffect } from 'react';
import { Sword, Shield, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { motion } from 'framer-motion';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface ActiveInputScreenProps {
  currentRound: number;
  totalRounds: number;
  onSubmit: (sword: number, shield: number) => void;
}

export function ActiveInputScreen({
  currentRound,
  totalRounds,
  onSubmit
}: ActiveInputScreenProps) {
  const [selectedSword, setSelectedSword] = useState<number | null>(null);
  const [shieldPrediction, setShieldPrediction] = useState([50]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const { playClick, playLockIn, playTension, stopTension } = useSoundEffects();

  // ── Reset local state when the round changes ──────────────────────────────
  useEffect(() => {
    setSelectedSword(null);
    setShieldPrediction([50]);
    setIsSubmitted(false);
    setTimeLeft(60);
  }, [currentRound]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // ── Tension sound for final 5 seconds ─────────────────────────────────────
  useEffect(() => {
    if (timeLeft === 5 && !isSubmitted) {
      playTension();
    }
    if (timeLeft <= 0 || isSubmitted) {
      stopTension();
    }
  }, [timeLeft, isSubmitted, playTension, stopTension]);

  const handleSwordSelect = (num: number) => {
    if (isSubmitted) return;
    setSelectedSword(num);
    playClick();
  };

  const handleLockIn = () => {
    if (selectedSword !== null) {
      playLockIn();
      onSubmit(selectedSword, shieldPrediction[0]);
      setIsSubmitted(true);
      stopTension();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isDanger = timeLeft <= 10;

  return (
    <div className={`min-h-screen bg-background transition-colors duration-1000 ${isDanger ? 'bg-gradient-to-b from-[#EF4444]/5 to-background' : ''}`}>
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="text-sm font-semibold tracking-wider text-muted-foreground">
            ROUND <span className="text-foreground">{currentRound}</span> OF {totalRounds}
          </div>
          <motion.div
            animate={isDanger ? {
              scale: [1, 1.05, 1],
              transition: { repeat: Infinity, duration: 0.5 }
            } : {}}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold ${isDanger
                ? 'bg-[#EF4444]/20 text-[#EF4444]'
                : 'bg-[#06B6D4]/10 text-[#06B6D4]'
              }`}
          >
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </motion.div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8 pb-32">
        {/* Sword Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EF4444]/20 flex items-center justify-center">
              <Sword className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div>
              <h3 className="font-semibold">Choose Your Sword</h3>
              <p className="text-sm text-muted-foreground">Pick a number from 1 to 10</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <motion.button
                key={num}
                onClick={() => handleSwordSelect(num)}
                disabled={isSubmitted}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                animate={selectedSword === num ? {
                  scale: [1, 1.08, 1.04],
                  boxShadow: [
                    '0 0 0px rgba(239, 68, 68, 0)',
                    '0 0 20px rgba(239, 68, 68, 0.6)',
                    '0 0 12px rgba(239, 68, 68, 0.4)',
                  ],
                  transition: { duration: 0.3 }
                } : {
                  scale: 1,
                  boxShadow: '0 0 0px rgba(239, 68, 68, 0)',
                }}
                className={`
                  aspect-square rounded-xl font-mono text-2xl font-bold
                  transition-colors duration-200 touch-manipulation
                  ${selectedSword === num
                    ? 'bg-[#EF4444] text-background'
                    : 'bg-card border-2 border-border hover:border-[#EF4444] hover:bg-[#EF4444]/10'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {num}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Shield Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#06B6D4]/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#06B6D4]" />
            </div>
            <div>
              <h3 className="font-semibold">Predict Crowd Popularity</h3>
              <p className="text-sm text-muted-foreground">What % of players will pick your number?</p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 space-y-6">
            <div className="text-center">
              <motion.div
                key={shieldPrediction[0]}
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-mono text-6xl font-bold text-[#06B6D4]"
              >
                {shieldPrediction[0]}%
              </motion.div>
              <div className="text-sm text-muted-foreground mt-2">
                {shieldPrediction[0] < 20 ? 'Rare choice' :
                  shieldPrediction[0] < 40 ? 'Uncommon' :
                    shieldPrediction[0] < 60 ? 'Moderate' :
                      shieldPrediction[0] < 80 ? 'Popular' : 'Very popular'}
              </div>
            </div>

            <Slider
              value={shieldPrediction}
              onValueChange={setShieldPrediction}
              max={100}
              step={1}
              disabled={isSubmitted}
              className="cursor-pointer"
            />

            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-2xl mx-auto">
          {isSubmitted ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-card border-2 border-[#06B6D4] rounded-xl p-6 text-center"
            >
              <div className="text-[#06B6D4] font-semibold mb-2">✅ Locked In!</div>
              <div className="text-sm text-muted-foreground">Waiting for other players...</div>
            </motion.div>
          ) : (
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                onClick={handleLockIn}
                disabled={selectedSword === null}
                className="w-full h-16 text-lg font-bold bg-[#06B6D4] hover:bg-[#0891B2] text-background shadow-lg shadow-[#06B6D4]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedSword === null ? 'Select a Sword Number' : 'LOCK IN'}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
