import { View, StyleSheet, Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Seg=1, Ter=2, Qua=3, Qui=4, Sex=5, Sáb=6, Dom=0
const WEEK_DAYS = [
  { label: 'S', jsDay: 1 }, // Segunda
  { label: 'T', jsDay: 2 }, // Terça
  { label: 'Q', jsDay: 3 }, // Quarta
  { label: 'Q', jsDay: 4 }, // Quinta
  { label: 'S', jsDay: 5 }, // Sexta
  { label: 'S', jsDay: 6 }, // Sábado
  { label: 'D', jsDay: 0 }, // Domingo
];

interface WeeklyBarProps {
  /** Conjunto de dias JS (0=Dom..6=Sáb) com treino concluído */
  completedDays: Set<number>;
  /** Dia atual da semana (0=Dom..6=Sáb) */
  todayJsDay: number;
}

export function WeeklyBar({ completedDays, todayJsDay }: WeeklyBarProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {WEEK_DAYS.map(({ label, jsDay }, idx) => {
        const isToday = jsDay === todayJsDay;
        const isDone = completedDays.has(jsDay);

        return (
          <View key={idx} style={styles.dayCol}>
            {/* Indicador de treino concluído */}
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isDone ? theme.primary : 'transparent',
                  borderColor: isDone ? theme.primary : theme.cardBorder,
                },
              ]}
            />

            {/* Letra do dia */}
            <View
              style={[
                styles.dayBubble,
                {
                  backgroundColor: isToday ? theme.primary : isDone ? theme.cardElevated : theme.card,
                  borderColor: isToday ? theme.primary : theme.cardBorder,
                },
              ]}>
              <ThemedText
                type="caption"
                style={{
                  color: isToday ? '#FFFFFF' : isDone ? theme.primaryHover : theme.textMuted,
                  fontWeight: isToday || isDone ? '700' : '400',
                }}>
                {label}
              </ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  dayCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  dayBubble: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
