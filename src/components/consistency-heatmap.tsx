/**
 * ConsistencyHeatmap
 *
 * Mapa de frequência dos últimos 3 meses (12 semanas).
 * Responsivo: tamanho das células calculado dinamicamente via useWindowDimensions.
 * Header/Footer usam flex + numberOfLines para nunca transbordar.
 * Lógica de dados isolada em buildHeatmapData() para clareza e testabilidade.
 */

import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { workoutRepository } from '@/features/workouts/workout-repository';
import { useTheme } from '@/hooks/use-theme';

// ─── Constantes ────────────────────────────────────────────────────────────
const TOTAL_WEEKS = 12;
const DAYS_PER_WEEK = 7;
const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const LABEL_COL_WIDTH = 14;
const CELL_GAP = 3;

// ─── Helpers ───────────────────────────────────────────────────────────────

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

// ─── Tipos ─────────────────────────────────────────────────────────────────

interface DayCell {
  date: Date;
  count: number;
  isToday: boolean;
  isFuture: boolean;
}

interface HeatmapData {
  grid: DayCell[][];
  streak: number;
  totalCompleted: number;
}

// ─── Lógica de Dados ───────────────────────────────────────────────────────

function buildHeatmapData(): HeatmapData {
  const allSessions = workoutRepository.getAll().filter((s) => s.completedAt !== null);

  const counts = new Map<string, number>();
  for (const s of allSessions) {
    const key = toDateKey(new Date(s.startedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Início: domingo da semana (TOTAL_WEEKS - 1) semanas atrás
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - today.getDay() - (TOTAL_WEEKS - 1) * DAYS_PER_WEEK);
  startDate.setHours(0, 0, 0, 0);

  const grid: DayCell[][] = [];
  const cursor = new Date(startDate);

  for (let w = 0; w < TOTAL_WEEKS; w++) {
    const week: DayCell[] = [];
    for (let d = 0; d < DAYS_PER_WEEK; d++) {
      const date = new Date(cursor);
      week.push({
        date,
        count: counts.get(toDateKey(date)) ?? 0,
        isToday: isSameDay(date, today),
        isFuture: date > today,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(week);
  }

  // Streak de dias consecutivos
  let streak = 0;
  const streakCursor = new Date(today);
  streakCursor.setHours(0, 0, 0, 0);

  if ((counts.get(toDateKey(streakCursor)) ?? 0) === 0) {
    streakCursor.setDate(streakCursor.getDate() - 1);
  }

  while ((counts.get(toDateKey(streakCursor)) ?? 0) > 0) {
    streak++;
    streakCursor.setDate(streakCursor.getDate() - 1);
  }

  return { grid, streak, totalCompleted: allSessions.length };
}

// ─── Componente ────────────────────────────────────────────────────────────

export function ConsistencyHeatmap() {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const { grid, streak, totalCompleted } = useMemo(() => {
    try {
      return buildHeatmapData();
    } catch {
      return { grid: [], streak: 0, totalCompleted: 0 };
    }
  }, []);

  // Tamanho de célula responsivo
  const containerPadding = Spacing.md * 2;
  const effectiveWidth = Math.min(screenWidth, MaxContentWidth) - containerPadding;
  const totalGapSpace = (TOTAL_WEEKS + 1) * CELL_GAP;
  const availableForCells = effectiveWidth - LABEL_COL_WIDTH - totalGapSpace;
  const cellSize = Math.max(8, Math.floor(availableForCells / TOTAL_WEEKS));

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>

      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
          CONSISTÊNCIA
        </ThemedText>
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.headerTitle} numberOfLines={1}>
            Mapa de Frequência
          </ThemedText>
          {streak > 0 && (
            <View
              style={[
                styles.streakBadge,
                { backgroundColor: theme.primaryDark, borderColor: theme.primary },
              ]}>
              <ThemedText
                type="caption"
                style={{ color: theme.primaryHover, fontWeight: '800' }}
                numberOfLines={1}>
                🔥 {streak}d
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Grid */}
      <View style={[styles.grid, { gap: CELL_GAP }]}>
        {/* Labels dos dias */}
        <View style={[styles.labelsCol, { width: LABEL_COL_WIDTH, gap: CELL_GAP }]}>
          {DAY_LABELS.map((lbl, i) => (
            <View key={i} style={{ height: cellSize, justifyContent: 'center' }}>
              <ThemedText style={[styles.dayLabel, { color: theme.textMuted }]}>
                {lbl}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Semanas */}
        <View style={[styles.weeksRow, { gap: CELL_GAP }]}>
          {grid.map((week, wIdx) => (
            <View key={wIdx} style={[styles.weekCol, { gap: CELL_GAP }]}>
              {week.map((day, dIdx) => {
                let bg: string = theme.backgroundElevated;
                let border: string = 'rgba(255,255,255,0.06)';

                if (day.isFuture) {
                  bg = 'transparent';
                  border = 'transparent';
                } else if (day.count > 0) {
                  bg = theme.primary;
                  border = theme.primaryHover;
                } else if (day.isToday) {
                  border = theme.primary;
                }

                return (
                  <View
                    key={dIdx}
                    style={[
                      styles.cell,
                      {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: bg,
                        borderColor: border,
                        opacity: day.isFuture ? 0.12 : 1,
                      },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: 'rgba(255,255,255,0.06)' }]}>
        <ThemedText
          type="caption"
          style={{ color: theme.textMuted, flexShrink: 1 }}
          numberOfLines={1}>
          {totalCompleted} sessões no histórico
        </ThemedText>
        <View style={styles.legend}>
          <ThemedText style={[styles.legendLabel, { color: theme.textMuted }]}>Menos</ThemedText>
          <View style={[styles.legendBox, { backgroundColor: theme.backgroundElevated }]} />
          <View style={[styles.legendBox, { backgroundColor: theme.primary, opacity: 0.5 }]} />
          <View style={[styles.legendBox, { backgroundColor: theme.primary }]} />
          <ThemedText style={[styles.legendLabel, { color: theme.textMuted }]}>Mais</ThemedText>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  header: {
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  streakBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
    flexShrink: 0,
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  labelsCol: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 9,
    lineHeight: 11,
    textAlign: 'center',
  },
  weeksRow: {
    flexDirection: 'row',
    flex: 1,
  },
  weekCol: {
    flexDirection: 'column',
    flex: 1,
  },
  cell: {
    borderRadius: 2,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: 9,
  },
  legendBox: {
    width: 9,
    height: 9,
    borderRadius: 2,
  },
});
