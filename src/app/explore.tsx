import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function WorkoutsScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="header">Treinos</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Gerencie suas rotinas e histórico de sessões.
            </ThemedText>
          </View>

          {/* Card Inicial */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              },
            ]}>
            <ThemedText type="title">Estrutura de Treino</ThemedText>
            <ThemedText type="default" style={{ color: theme.textSecondary }}>
              O NOCTIS salva tudo localmente no seu aparelho (offline-first).
            </ThemedText>

            <View style={styles.stepsList}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                • Seleção e criação de exercícios
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                • Registro rápido de carga (kg) e repetições
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                • Histórico contínuo entre semanas
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: BottomTabInset + Spacing.xxxl,
    gap: Spacing.lg,
  },
  header: {
    gap: 4,
    marginTop: Spacing.xs,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  stepsList: {
    gap: Spacing.sm,
  },
});
