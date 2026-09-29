import { useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { FullEvolutionEntry } from '@/features/photos/evolution-repository';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const POSE_FILTERS = [
  { id: 'frente', label: 'Frente' },
  { id: 'costas', label: 'Costas' },
  { id: 'lado_direito', label: 'Lado D.' },
  { id: 'lado_esquerdo', label: 'Lado E.' },
];

interface Props {
  visible: boolean;
  entries: FullEvolutionEntry[];
  onClose: () => void;
}

export function PhotoComparatorModal({ visible, entries, onClose }: Props) {
  const theme = useTheme();

  // Ordena por data crescente para antes/depois
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const [beforeId, setBeforeId] = useState<string>(sortedEntries[0]?.id || '');
  const [afterId, setAfterId] = useState<string>(
    sortedEntries[sortedEntries.length - 1]?.id || ''
  );
  const [selectedPose, setSelectedPose] = useState<string>('frente');

  if (!visible || sortedEntries.length < 2) {
    if (visible && sortedEntries.length < 2) {
      return (
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={[styles.content, { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder }]}>
            <View style={styles.header}>
              <ThemedText type="title">Comparador de Evolução</ThemedText>
              <Pressable onPress={onClose} hitSlop={12}>
                <ThemedText type="title" style={{ color: theme.textSecondary }}>✕</ThemedText>
              </Pressable>
            </View>
            <ThemedText type="default" style={{ color: theme.textSecondary, textAlign: 'center', marginVertical: Spacing.xl }}>
              Cadastre pelo menos 2 meses com fotos para comparar sua evolução visual lado a lado.
            </ThemedText>
            <Pressable
              onPress={onClose}
              style={[styles.closeActionBtn, { backgroundColor: theme.primary }]}>
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>Entendido</ThemedText>
            </Pressable>
          </View>
        </View>
      );
    }
    return null;
  }

  const beforeEntry = sortedEntries.find((e) => e.id === beforeId) || sortedEntries[0];
  const afterEntry =
    sortedEntries.find((e) => e.id === afterId) || sortedEntries[sortedEntries.length - 1];

  // Helper para buscar foto pela pose selecionada
  const getPhotoForPose = (entry: FullEvolutionEntry, pose: string) => {
    if (pose === 'frente') return entry.coverPhotoUri;
    const found = entry.photos.find((p) => p.pose === pose);
    return found ? found.photoUri : null;
  };

  const beforePhoto = getPhotoForPose(beforeEntry, selectedPose);
  const afterPhoto = getPhotoForPose(afterEntry, selectedPose);

  // Cálculos de variação
  const weightDiff =
    beforeEntry.weightKg && afterEntry.weightKg
      ? Number((afterEntry.weightKg - beforeEntry.weightKg).toFixed(1))
      : null;

  const bfDiff =
    beforeEntry.bodyFat && afterEntry.bodyFat
      ? Number((afterEntry.bodyFat - beforeEntry.bodyFat).toFixed(1))
      : null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.content, { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
              TRANSFORMAÇÃO
            </ThemedText>
            <ThemedText type="title">Comparar Evolução</ThemedText>
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <ThemedText type="title" style={{ color: theme.textSecondary }}>✕</ThemedText>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
          {/* Seletor de Pose */}
          <View style={styles.poseSelectorRow}>
            {POSE_FILTERS.map((p) => {
              const active = selectedPose === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    haptics.light();
                    setSelectedPose(p.id);
                  }}
                  style={[
                    styles.poseTab,
                    {
                      backgroundColor: active ? theme.primary : theme.backgroundElevated,
                      borderColor: active ? theme.primary : theme.cardBorder,
                    },
                  ]}>
                  <ThemedText
                    type="caption"
                    style={{
                      color: active ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: active ? '700' : '500',
                    }}>
                    {p.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Comparação Lado a Lado de Imagens */}
          <View style={styles.comparisonGrid}>
            {/* ANTES */}
            <View style={styles.sideCard}>
              <View style={styles.sideLabelBadge}>
                <ThemedText type="caption" style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 10 }}>
                  ANTES
                </ThemedText>
              </View>

              {/* Seletor do Mês Inicial */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniMonthScroll}>
                {sortedEntries.map((e) => {
                  const isSel = e.id === beforeEntry.id;
                  return (
                    <Pressable
                      key={e.id}
                      onPress={() => {
                        haptics.light();
                        setBeforeId(e.id);
                      }}
                      style={[
                        styles.miniMonthChip,
                        {
                          backgroundColor: isSel ? theme.primaryDark : theme.backgroundElevated,
                          borderColor: isSel ? theme.primary : theme.cardBorder,
                        },
                      ]}>
                      <ThemedText
                        type="caption"
                        style={{
                          fontSize: 10,
                          color: isSel ? theme.primaryHover : theme.textMuted,
                          fontWeight: isSel ? '700' : '500',
                        }}>
                        {MONTH_NAMES[e.month - 1].slice(0, 3)}/{String(e.year).slice(2)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Imagem Antes */}
              <View style={[styles.photoBox, { borderColor: theme.cardBorder }]}>
                {beforePhoto ? (
                  <Image source={{ uri: beforePhoto }} style={styles.photoImg} resizeMode="cover" />
                ) : (
                  <View style={styles.noPhotoBox}>
                    <ThemedText type="caption" style={{ color: theme.textMuted, textAlign: 'center' }}>
                      Sem foto ({selectedPose})
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.metaBox}>
                <ThemedText type="smallBold" style={{ textAlign: 'center' }}>
                  {MONTH_NAMES[beforeEntry.month - 1]} {beforeEntry.year}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                  {beforeEntry.weightKg ? `${beforeEntry.weightKg} kg` : 'Sem peso'}
                  {beforeEntry.bodyFat ? ` • ${beforeEntry.bodyFat}% BF` : ''}
                </ThemedText>
              </View>
            </View>

            {/* DEPOIS */}
            <View style={styles.sideCard}>
              <View style={[styles.sideLabelBadge, { backgroundColor: theme.primary }]}>
                <ThemedText type="caption" style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 10 }}>
                  DEPOIS
                </ThemedText>
              </View>

              {/* Seletor do Mês Final */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.miniMonthScroll}>
                {sortedEntries.map((e) => {
                  const isSel = e.id === afterEntry.id;
                  return (
                    <Pressable
                      key={e.id}
                      onPress={() => {
                        haptics.light();
                        setAfterId(e.id);
                      }}
                      style={[
                        styles.miniMonthChip,
                        {
                          backgroundColor: isSel ? theme.primaryDark : theme.backgroundElevated,
                          borderColor: isSel ? theme.primary : theme.cardBorder,
                        },
                      ]}>
                      <ThemedText
                        type="caption"
                        style={{
                          fontSize: 10,
                          color: isSel ? theme.primaryHover : theme.textMuted,
                          fontWeight: isSel ? '700' : '500',
                        }}>
                        {MONTH_NAMES[e.month - 1].slice(0, 3)}/{String(e.year).slice(2)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Imagem Depois */}
              <View style={[styles.photoBox, { borderColor: theme.primary }]}>
                {afterPhoto ? (
                  <Image source={{ uri: afterPhoto }} style={styles.photoImg} resizeMode="cover" />
                ) : (
                  <View style={styles.noPhotoBox}>
                    <ThemedText type="caption" style={{ color: theme.textMuted, textAlign: 'center' }}>
                      Sem foto ({selectedPose})
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.metaBox}>
                <ThemedText type="smallBold" style={{ textAlign: 'center' }}>
                  {MONTH_NAMES[afterEntry.month - 1]} {afterEntry.year}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                  {afterEntry.weightKg ? `${afterEntry.weightKg} kg` : 'Sem peso'}
                  {afterEntry.bodyFat ? ` • ${afterEntry.bodyFat}% BF` : ''}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Card Resumo da Variação de Métricas */}
          <View style={[styles.diffSummaryCard, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder }]}>
            <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700', textAlign: 'center' }}>
              BALANÇO DA EVOLUÇÃO
            </ThemedText>

            <View style={styles.diffRow}>
              <View style={styles.diffItem}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Variação de Peso</ThemedText>
                <ThemedText
                  type="title"
                  style={{
                    color: weightDiff === null ? theme.textMuted : weightDiff < 0 ? '#10B981' : theme.primaryHover,
                  }}>
                  {weightDiff === null ? '—' : `${weightDiff > 0 ? '+' : ''}${weightDiff} kg`}
                </ThemedText>
              </View>

              <View style={styles.diffDivider} />

              <View style={styles.diffItem}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Variação de Gordura</ThemedText>
                <ThemedText
                  type="title"
                  style={{
                    color: bfDiff === null ? theme.textMuted : bfDiff < 0 ? '#10B981' : theme.danger,
                  }}>
                  {bfDiff === null ? '—' : `${bfDiff > 0 ? '+' : ''}${bfDiff}% BF`}
                </ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  poseSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  poseTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sideCard: {
    flex: 1,
    gap: Spacing.xs,
    position: 'relative',
  },
  sideLabelBadge: {
    position: 'absolute',
    top: 36,
    left: 4,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  miniMonthScroll: {
    marginBottom: 4,
  },
  miniMonthChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 4,
  },
  photoBox: {
    width: '100%',
    height: 230,
    borderRadius: Radius.xs,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  noPhotoBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  metaBox: {
    marginTop: 2,
  },
  diffSummaryCard: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diffItem: {
    flex: 1,
    alignItems: 'center',
  },
  diffDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeActionBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.xs,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
});
