/**
 * GoalProgress Component
 * Displays and controls goal progress with a slider
 * Includes confetti animation when reaching 100%
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import confetti from 'canvas-confetti';

interface GoalProgressProps {
  progress: number;
  onChange: (progress: number) => void;
  disabled?: boolean;
}

/**
 * Progress slider component with visual feedback
 * - Step by 5%
 * - Debounced update (1000ms)
 * - Confetti animation at 100%
 */
export function GoalProgress({ progress, onChange, disabled = false }: GoalProgressProps) {
  const [localProgress, setLocalProgress] = useState(progress);
  const [hasShownConfetti, setHasShownConfetti] = useState(progress === 100);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with external progress changes
  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Trigger confetti when reaching 100%
  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  }, []);

  // Handle slider change with debounce
  const handleSliderChange = useCallback((values: number[]) => {
    const newProgress = values[0];
    setLocalProgress(newProgress);

    // Trigger confetti when reaching 100% for the first time
    if (newProgress === 100 && !hasShownConfetti) {
      triggerConfetti();
      setHasShownConfetti(true);
    }

    // Clear previous timeout
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounced update to parent (1000ms)
    debounceTimerRef.current = setTimeout(() => {
      onChange(newProgress);
    }, 1000);
  }, [onChange, hasShownConfetti, triggerConfetti]);

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Progress</span>
        <span className="text-sm font-semibold text-primary">
          {localProgress}%
        </span>
      </div>
      
      <Slider
        value={[localProgress]}
        onValueChange={handleSliderChange}
        max={100}
        step={5}
        disabled={disabled}
        className="w-full"
        aria-label="Goal progress"
      />
    </div>
  );
}

