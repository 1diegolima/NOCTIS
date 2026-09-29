/**
 * rest-timer-context.tsx
 *
 * Timer de descanso global com notificação push background via expo-notifications.
 * Quando o timer inicia, agenda uma notificação local para disparar ao fim do descanso.
 * Se o usuário sair do app, ainda recebe o alerta.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { notificationService } from '@/features/workouts/notification-service';
import { haptics } from '@/utils/haptics';

// ─── Interface ─────────────────────────────────────────────────────────────

interface RestTimerContextData {
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
  exerciseName?: string;
  startTimer: (seconds: number, exerciseName?: string) => void;
  stopTimer: () => void;
  addSeconds: (seconds: number) => void;
}

// ─── Context ───────────────────────────────────────────────────────────────

const RestTimerContext = createContext<RestTimerContextData>({
  remainingSeconds: 0,
  totalSeconds: 0,
  isRunning: false,
  startTimer: () => {},
  stopTimer: () => {},
  addSeconds: () => {},
});

// ─── Provider ──────────────────────────────────────────────────────────────

export function RestTimerProvider({ children }: { children: React.ReactNode }) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [exerciseName, setExerciseName] = useState<string | undefined>(undefined);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifIdRef = useRef<string | null>(null);

  const clearCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopTimer = useCallback(() => {
    clearCountdown();
    notificationService.cancelNotification(notifIdRef.current);
    notifIdRef.current = null;
    setIsRunning(false);
    setRemainingSeconds(0);
    setTotalSeconds(0);
    setExerciseName(undefined);
  }, []);

  const startTimer = useCallback((seconds: number, name?: string) => {
    clearCountdown();
    // Cancela notificação anterior se houver
    notificationService.cancelNotification(notifIdRef.current);
    notifIdRef.current = null;

    haptics.light();
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setExerciseName(name);
    setIsRunning(true);

    // Agenda notificação push (funciona em background)
    notificationService
      .scheduleRestTimerNotification(seconds)
      .then((id) => {
        notifIdRef.current = id;
      })
      .catch(() => {}); // silencioso — notificação é enhancement, não crítico
  }, []);

  const addSeconds = useCallback((extra: number) => {
    haptics.light();
    setRemainingSeconds((prev) => prev + extra);
    setTotalSeconds((prev) => prev + extra);

    // Re-agenda notificação com o novo tempo restante
    notificationService.cancelNotification(notifIdRef.current);
    setRemainingSeconds((current) => {
      notificationService
        .scheduleRestTimerNotification(current + extra)
        .then((id) => {
          notifIdRef.current = id;
        })
        .catch(() => {});
      return current + extra;
    });
  }, []);

  // Countdown em foreground
  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearCountdown();
          setIsRunning(false);
          haptics.success();
          notifIdRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearCountdown;
  }, [isRunning, remainingSeconds > 0]); // eslint-disable-line

  return (
    <RestTimerContext.Provider
      value={{ remainingSeconds, totalSeconds, isRunning, exerciseName, startTimer, stopTimer, addSeconds }}>
      {children}
    </RestTimerContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useRestTimer() {
  return useContext(RestTimerContext);
}
