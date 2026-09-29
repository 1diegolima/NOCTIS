/**
 * notification-service.ts
 *
 * Serviço de notificações locais para o timer de descanso.
 * Usa expo-notifications para agendar alertas mesmo com app em background.
 * Requer development build (não funciona no Expo Go).
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configura comportamento de notificações quando o app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  /** Solicita permissão de notificação ao usuário */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('rest-timer', {
        name: 'Timer de Descanso',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#DC2626',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Agenda uma notificação local para daqui a `seconds` segundos.
   * Retorna o identifier para poder cancelar se necessário.
   */
  async scheduleRestTimerNotification(seconds: number): Promise<string | null> {
    try {
      const hasPermission = await notificationService.requestPermission();
      if (!hasPermission) return null;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Descanso Concluído!',
          body: 'Hora de voltar pro ferro. Bora!',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
        },
      });

      return id;
    } catch (e) {
      console.warn('[notificationService] Falha ao agendar notificação:', e);
      return null;
    }
  },

  /** Cancela uma notificação agendada pelo seu identifier */
  async cancelNotification(id: string | null): Promise<void> {
    if (!id) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // silencioso — pode já ter disparado
    }
  },

  /** Cancela todas as notificações agendadas */
  async cancelAll(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // silencioso
    }
  },
};
