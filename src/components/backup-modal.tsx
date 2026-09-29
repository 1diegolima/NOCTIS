import { useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { backupService } from '@/features/backup/backup-service';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function BackupModal({ visible, onClose }: Props) {
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportedContent, setExportedContent] = useState<string>('');
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  if (!visible) return null;

  const handleGenerateJsonBackup = () => {
    haptics.medium();
    const json = backupService.exportAllDataAsJson();
    setExportedContent(json);
  };

  const handleGenerateCsv = () => {
    haptics.medium();
    const csv = backupService.exportWorkoutsAsCsv();
    setExportedContent(csv);
  };

  const handlePerformImport = () => {
    Keyboard.dismiss();
    if (!importJsonText.trim()) {
      Alert.alert('Atenção', 'Cole o JSON de backup no campo abaixo.');
      return;
    }

    haptics.heavy();
    const result = backupService.importDataFromJson(importJsonText);
    if (result.success) {
      Alert.alert('Sucesso', result.message, [
        {
          text: 'OK',
          onPress: () => {
            setImportJsonText('');
            onClose();
          },
        },
      ]);
    } else {
      Alert.alert('Erro na Importação', result.message);
    }
  };

  return (
    <View style={styles.overlay}>
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          Keyboard.dismiss();
          onClose();
        }}
      />
      <View style={[styles.content, { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
              SEGURANÇA DOS DADOS
            </ThemedText>
            <ThemedText type="title">Backup & Exportação</ThemedText>
          </View>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              onClose();
            }}
            hitSlop={12}
            style={styles.closeBtn}>
            <ThemedText type="title" style={{ color: theme.textSecondary }}>✕</ThemedText>
          </Pressable>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <Pressable
            onPress={() => {
              haptics.light();
              setActiveTab('export');
            }}
            style={[
              styles.tabBtn,
              {
                backgroundColor: activeTab === 'export' ? theme.primary : theme.backgroundElevated,
                borderColor: activeTab === 'export' ? theme.primary : theme.cardBorder,
              },
            ]}>
            <ThemedText
              type="smallBold"
              style={{ color: activeTab === 'export' ? '#FFFFFF' : theme.textSecondary }}>
              Exportar Dados
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => {
              haptics.light();
              setActiveTab('import');
            }}
            style={[
              styles.tabBtn,
              {
                backgroundColor: activeTab === 'import' ? theme.primary : theme.backgroundElevated,
                borderColor: activeTab === 'import' ? theme.primary : theme.cardBorder,
              },
            ]}>
            <ThemedText
              type="smallBold"
              style={{ color: activeTab === 'import' ? '#FFFFFF' : theme.textSecondary }}>
              Importar Backup
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {activeTab === 'export' ? (
            <View style={styles.sectionBody}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Gere um backup completo de todos os seus treinos, rotinas e fotos de evolução ou exporte o histórico em planilha CSV.
              </ThemedText>

              <View style={styles.exportButtonsRow}>
                <Pressable
                  onPress={handleGenerateJsonBackup}
                  style={[styles.actionBtn, { backgroundColor: theme.primary }]}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                    📦 Gerar Backup JSON
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={handleGenerateCsv}
                  style={[styles.actionBtn, { backgroundColor: theme.backgroundElevated, borderWidth: 1, borderColor: theme.cardBorder }]}>
                  <ThemedText type="smallBold" style={{ color: theme.text }}>
                    📊 Exportar CSV (Excel)
                  </ThemedText>
                </Pressable>
              </View>

              {exportedContent.length > 0 && (
                <View style={[styles.codeBox, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
                    <ThemedText type="caption" style={{ color: theme.primary }}>
                      DADOS PRONTOS ({Math.round(exportedContent.length / 1024)} KB)
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textMuted }}>
                      {copiedNotification ? '✓ Copiado!' : 'Selecione e copie'}
                    </ThemedText>
                  </View>

                  <TextInput
                    value={exportedContent}
                    editable={false}
                    multiline
                    selectTextOnFocus
                    style={[styles.codeText, { color: theme.text }]}
                  />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.sectionBody}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Cole o código JSON de um backup salvo anteriormente para restaurar seus dados.
              </ThemedText>

              <TextInput
                value={importJsonText}
                onChangeText={setImportJsonText}
                placeholder="Cole o JSON de backup aqui..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={8}
                style={[styles.importInput, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder, color: theme.text }]}
              />

              <Pressable
                onPress={handlePerformImport}
                style={[styles.actionBtn, { backgroundColor: theme.primary, marginTop: Spacing.sm }]}>
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                  Restaurar Backup no App ➔
                </ThemedText>
              </Pressable>
            </View>
          )}
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
    paddingBottom: Spacing.xxl,
    maxHeight: '90%',
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
  tabSwitcher: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBody: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  exportButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBox: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    maxHeight: 180,
  },
  importInput: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    height: 160,
    textAlignVertical: 'top',
  },
});
