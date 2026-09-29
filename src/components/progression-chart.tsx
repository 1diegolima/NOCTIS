/**
 * ProgressionChart.tsx
 *
 * Gráfico de linha simples construído com react-native primitivos (View/SVG-free).
 * Mostra a evolução do 1RM estimado de um exercício ao longo do tempo.
 * Totalmente responsivo usando useWindowDimensions.
 */

import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ExerciseProgressionPoint } from '@/features/analytics/analytics-repository';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  points: ExerciseProgressionPoint[];
  metricKey?: 'estimated1RM' | 'weightKg';
}

const CHART_HEIGHT = 120;
const CHART_PADDING_X = 8;
const Y_LABELS = 5;

export function ProgressionChart({ points, metricKey = 'estimated1RM' }: Props) {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - Spacing.lg * 2 - Spacing.md * 2;

  if (points.length < 2) {
    return (
      <View style={[styles.emptyContainer, { borderColor: theme.cardBorder }]}>
        <ThemedText type="caption" style={{ color: theme.textMuted, textAlign: 'center' }}>
          Registre pelo menos 2 séries para ver o gráfico de progressão
        </ThemedText>
      </View>
    );
  }

  // Reduz pontos: pega o melhor valor por sessão (mesmo dia)
  const bySession = new Map<string, ExerciseProgressionPoint>();
  for (const p of points) {
    const key = p.date;
    const existing = bySession.get(key);
    if (!existing || p[metricKey] > existing[metricKey]) {
      bySession.set(key, p);
    }
  }
  const reduced = Array.from(bySession.values()).slice(-20); // máx 20 pontos

  const values = reduced.map((p) => p[metricKey]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Normaliza valor para coordenada Y no canvas
  const toY = (val: number) =>
    CHART_HEIGHT - ((val - minVal) / range) * (CHART_HEIGHT - 16) - 8;

  // Distribui pontos uniformemente na largura disponível
  const usableWidth = chartWidth - CHART_PADDING_X * 2;
  const toX = (i: number) =>
    CHART_PADDING_X + (i / (reduced.length - 1)) * usableWidth;

  // Constrói o path SVG como string de segmentos de linha View
  const lineSegments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < reduced.length - 1; i++) {
    lineSegments.push({
      x1: toX(i),
      y1: toY(values[i]),
      x2: toX(i + 1),
      y2: toY(values[i + 1]),
    });
  }

  // Labels Y
  const yLabels: { label: string; y: number }[] = [];
  for (let i = 0; i <= Y_LABELS; i++) {
    const val = minVal + (range * i) / Y_LABELS;
    yLabels.push({ label: `${Math.round(val)}`, y: toY(val) });
  }

  const label = metricKey === 'estimated1RM' ? '1RM Estimado (kg)' : 'Carga (kg)';

  return (
    <View style={styles.wrapper}>
      {/* Rótulo */}
      <ThemedText type="caption" style={{ color: theme.textMuted, marginBottom: 4 }}>
        {label}
      </ThemedText>

      {/* Área do gráfico */}
      <View style={[styles.chartArea, { width: chartWidth, height: CHART_HEIGHT }]}>
        {/* Linhas de grade horizontais */}
        {yLabels.map((yl, i) => (
          <View
            key={i}
            style={[
              styles.gridLine,
              {
                top: yl.y,
                width: chartWidth,
                borderColor: 'rgba(255,255,255,0.05)',
              },
            ]}
          />
        ))}

        {/* Segmentos de linha */}
        {lineSegments.map((seg, i) => {
          const dx = seg.x2 - seg.x1;
          const dy = seg.y2 - seg.y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

          return (
            <View
              key={i}
              style={[
                styles.lineSegment,
                {
                  width: length,
                  top: seg.y1,
                  left: seg.x1,
                  backgroundColor: theme.primary,
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: '0 0',
                },
              ]}
            />
          );
        })}

        {/* Pontos */}
        {reduced.map((p, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                top: toY(values[i]) - 3,
                left: toX(i) - 3,
                backgroundColor: i === reduced.length - 1 ? theme.primary : theme.primaryDark,
                borderColor: theme.primary,
              },
            ]}
          />
        ))}
      </View>

      {/* Labels X — primeiro e último */}
      <View style={[styles.xLabels, { width: chartWidth }]}>
        <ThemedText style={[styles.xLabel, { color: theme.textMuted }]}>
          {reduced[0]?.date}
        </ThemedText>
        <ThemedText style={[styles.xLabel, { color: theme.primary }]}>
          {reduced[reduced.length - 1]?.date}
        </ThemedText>
      </View>

      {/* Valor atual em destaque */}
      <View style={[styles.currentValue, { backgroundColor: theme.backgroundElevated }]}>
        <ThemedText type="caption" style={{ color: theme.textMuted }}>Atual</ThemedText>
        <ThemedText type="smallBold" style={{ color: theme.primary }}>
          {values[values.length - 1]}kg
        </ThemedText>
        {values.length > 1 && (
          <ThemedText
            type="caption"
            style={{
              color: values[values.length - 1] >= values[0] ? '#22C55E' : '#EF4444',
            }}>
            {values[values.length - 1] >= values[0] ? '↑' : '↓'}
            {Math.abs(Math.round((values[values.length - 1] - values[0]) * 10) / 10)}kg
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  emptyContainer: {
    padding: Spacing.lg,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  chartArea: {
    position: 'relative',
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    borderTopWidth: 1,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xLabel: {
    fontSize: 9,
  },
  currentValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
  },
});
