import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useRestTimer } from '@/contexts/rest-timer-context';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/utils/haptics';

export function FloatingRestTimer() {
  const theme = useTheme();
  const tabBarHeight = useTabBarHeight();
  const { remainingSeconds, totalSeconds, isRunning, exerciseName, stopTimer, addSeconds } =
    useRestTimer();

  if (!isRunning || remainingSeconds <= 0) {
    return null;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  return (
    <View
      style={[
        styles.container,
        {
          bottom: tabBarHeight + Spacing.sm,
          backgroundColor: theme.cardElevated,
          borderColor: theme.primary,
        },
      ]}>
      {/* Barra de Progresso Superior */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${progress}%`, backgroundColor: theme.primary },
          ]}
        />
      </View>

      <View style={styles.contentRow}>
        {/* Ícone e Tempo */}
        <View style={styles.timerInfo}>
          <ThemedText type="title" style={{ fontSize: 18, color: theme.primary }}>
            ⏱️ {timeFormatted}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }} numberOfLines={1}>
            {exerciseName ? `Descanso • ${exerciseName}` : 'Descanso entre séries'}
          </ThemedText>
        </View>

        {/* Ações Rápidas */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => addSeconds(30)}
            style={[styles.miniBtn, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder }]}>
            <ThemedText type="caption" style={{ color: theme.text, fontWeight: '700' }}>
              +30s
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => {
              haptics.light();
              stopTimer();
            }}
            style={[styles.skipBtn, { backgroundColor: theme.primaryDark, borderColor: theme.primary }]}>
            <ThemedText type="caption" style={{ color: theme.primaryHover, fontWeight: '700' }}>
              Pular
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 998,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  progressBarTrack: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarFill: {
    height: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  timerInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  miniBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  skipBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
});
