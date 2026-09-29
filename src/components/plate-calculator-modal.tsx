import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { calculatePlates } from '@/features/workouts/plate-calculator';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/utils/haptics';

interface PlateCalculatorModalProps {
  visible: boolean;
  initialWeight?: number;
  exerciseName?: string;
  onClose: () => void;
  onApplyWeight?: (weight: number) => void;
}

const BAR_OPTIONS = [
  { label: 'Olímpica 20kg', weight: 20 },
  { label: 'Média 15kg', weight: 15 },
  { label: 'W / Leve 10kg', weight: 10 },
];

const PLATE_COLORS: Record<number, string> = {
  25: '#DC2626', // Vermelho
  20: '#2563EB', // Azul
  15: '#EAB308', // Amarelo
  10: '#16A34A', // Verde
  5: '#FFFFFF',  // Branco
  2.5: '#1F2937', // Preto/Cinza
  1.25: '#6B7280', // Cinza claro
};

export function PlateCalculatorModal({
  visible,
  initialWeight = 80,
  exerciseName = 'Exercício com Barra',
  onClose,
  onApplyWeight,
}: PlateCalculatorModalProps) {
  const theme = useTheme();
  const [adjustedWeight, setAdjustedWeight] = useState<number | null>(null);
  const [barWeight, setBarWeight] = useState(20);

  const targetWeight = adjustedWeight !== null ? adjustedWeight : initialWeight || 80;
  const result = calculatePlates(targetWeight, barWeight);

  const adjustWeight = (delta: number) => {
    const next = Math.max(barWeight, Math.round((targetWeight + delta) * 10) / 10);
    setAdjustedWeight(next);
    haptics.light();
  };

  const handleClose = () => {
    setAdjustedWeight(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <ThemedText type="caption" style={{ color: theme.primary, letterSpacing: 1 }}>
                CALCULADORA DE ANILHAS
              </ThemedText>
              <ThemedText type="subtitle" numberOfLines={1} style={{ color: theme.text, marginTop: 2 }}>
                {exerciseName}
              </ThemedText>
            </View>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: theme.cardElevated }]}
              onPress={() => {
                haptics.light();
                handleClose();
              }}>
              <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
                ✕
              </ThemedText>
            </Pressable>
          </View>

          {/* Peso Alvo & Controles Rápidos */}
          <View style={[styles.targetDisplay, { backgroundColor: theme.backgroundElevated }]}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              PESO TOTAL (BARRA + ANILHAS)
            </ThemedText>
            <View style={styles.weightValueRow}>
              <ThemedText type="title" style={{ fontSize: 36, color: theme.text, fontWeight: '800' }}>
                {targetWeight}
              </ThemedText>
              <ThemedText type="default" style={{ color: theme.textSecondary, marginLeft: 4, marginBottom: 6 }}>
                kg
              </ThemedText>
            </View>

            {/* Ajustes Rápidos */}
            <View style={styles.quickAdjustRow}>
              {[-10, -2.5, +2.5, +10].map((delta) => (
                <Pressable
                  key={delta}
                  style={[styles.quickAdjustBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={() => adjustWeight(delta)}>
                  <ThemedText type="small" style={{ color: delta > 0 ? theme.primary : theme.textSecondary }}>
                    {delta > 0 ? `+${delta}` : delta} kg
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Seletor da Barra */}
          <View style={styles.section}>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
              TIPO DE BARRA
            </ThemedText>
            <View style={styles.barOptionsRow}>
              {BAR_OPTIONS.map((opt) => {
                const isSelected = barWeight === opt.weight;
                return (
                  <Pressable
                    key={opt.weight}
                    style={[
                      styles.barOptionBtn,
                      {
                        backgroundColor: isSelected ? theme.primaryMuted : theme.backgroundElevated,
                        borderColor: isSelected ? theme.primary : theme.cardBorder,
                      },
                    ]}
                    onPress={() => {
                      setBarWeight(opt.weight);
                      haptics.light();
                    }}>
                    <ThemedText
                      type="small"
                      style={{
                        color: isSelected ? theme.primaryHover : theme.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      }}>
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Anilhas por Lado */}
          <View style={styles.section}>
            <View style={styles.breakdownHeader}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                ANILHAS POR CADA LADO
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                {result.weightPerSide} kg / lado
              </ThemedText>
            </View>

            {result.platesPerSide.length === 0 ? (
              <View style={[styles.emptyPlatesBox, { backgroundColor: theme.backgroundElevated }]}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Apenas o peso da barra ({barWeight} kg). Nenhuma anilha necessária.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.platesGrid}>
                {result.platesPerSide.map((p) => (
                  <View
                    key={p.plate}
                    style={[
                      styles.plateItem,
                      {
                        backgroundColor: theme.backgroundElevated,
                        borderColor: PLATE_COLORS[p.plate] || theme.primary,
                      },
                    ]}>
                    <View
                      style={[
                        styles.plateColorIndicator,
                        { backgroundColor: PLATE_COLORS[p.plate] || theme.primary },
                      ]}
                    />
                    <ThemedText type="smallBold" style={{ color: theme.text, fontSize: 16 }}>
                      {p.countPerSide}x
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
                      {p.plate} kg
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {!result.exactMatch && (
              <ThemedText type="caption" style={{ color: '#F59E0B', marginTop: Spacing.sm }}>
                ⚠️ O peso {targetWeight} kg não pôde ser montado exatamente com anilhas convencionais (Total: {result.totalCalculated} kg).
              </ThemedText>
            )}
          </View>

          {/* Ações */}
          <View style={styles.actionsRow}>
            {onApplyWeight && (
              <Pressable
                style={[styles.applyBtn, { backgroundColor: theme.primary }]}
                onPress={() => {
                  haptics.medium();
                  onApplyWeight(targetWeight);
                  handleClose();
                }}>
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                  Aplicar Carga ({targetWeight} kg)
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetDisplay: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  weightValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  quickAdjustRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    width: '100%',
    justifyContent: 'center',
  },
  quickAdjustBtn: {
    flex: 1,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
  },
  section: {
    marginBottom: Spacing.md,
  },
  barOptionsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  barOptionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  emptyPlatesBox: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    alignItems: 'center',
  },
  platesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  plateItem: {
    flex: 1,
    minWidth: 70,
    padding: Spacing.sm,
    borderRadius: Radius.xs,
    borderLeftWidth: 4,
    alignItems: 'center',
    position: 'relative',
  },
  plateColorIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actionsRow: {
    marginTop: Spacing.sm,
  },
  applyBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
});
