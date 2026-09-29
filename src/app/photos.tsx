import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PhotoComparatorModal } from '@/components/photo-comparator-modal';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  evolutionRepository,
  FullEvolutionEntry,
} from '@/features/photos/evolution-repository';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

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

const POSE_OPTIONS = [
  { id: 'frente', label: 'Frente' },
  { id: 'costas', label: 'Costas' },
  { id: 'lado_direito', label: 'Lado Direito' },
  { id: 'lado_esquerdo', label: 'Lado Esquerdo' },
  { id: 'outro', label: 'Outro' },
];

export default function PhotosScreen() {
  const theme = useTheme();
  const tabBarHeight = useTabBarHeight();

  const [entries, setEntries] = useState<FullEvolutionEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [fullscreenPhotoUri, setFullscreenPhotoUri] = useState<string | null>(null);
  const [showComparatorModal, setShowComparatorModal] = useState(false);

  // Overlay Novo Mês
  const [showAddMonthModal, setShowAddMonthModal] = useState(false);
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newCoverUri, setNewCoverUri] = useState<string | null>(null);
  const [newWeight, setNewWeight] = useState('');
  const [newBodyFat, setNewBodyFat] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Inline Adicionar Pose no Mês Selecionado
  const [isAddingPose, setIsAddingPose] = useState(false);
  const [addPhotoUri, setAddPhotoUri] = useState<string | null>(null);
  const [addPose, setAddPose] = useState<string>('costas');

  const loadEntries = useCallback(() => {
    try {
      const data = evolutionRepository.getAll();
      setEntries(data);
    } catch (e) {
      console.error('Erro ao carregar fotos de evolução:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const selectedEntry = entries.find((e) => e.id === selectedEntryId) ?? null;

  const handlePickCoverImage = async () => {
    haptics.light();
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso à galeria de fotos para continuar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setNewCoverUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Erro ao selecionar foto de capa:', e);
    }
  };

  const handlePickAdditionalImage = async () => {
    haptics.light();
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso à galeria de fotos para continuar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setAddPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Erro ao selecionar foto adicional:', e);
    }
  };

  const handleSaveNewMonth = () => {
    Keyboard.dismiss();
    if (!newCoverUri) {
      Alert.alert('Foto Obrigatória', 'Selecione a foto principal de frente para a capa do mês.');
      return;
    }

    const yearNum = parseInt(newYear, 10) || new Date().getFullYear();
    const monthNum = Number(newMonth);
    const id = `${yearNum}-${String(monthNum).padStart(2, '0')}`;

    haptics.success();
    evolutionRepository.saveEntry({
      id,
      year: yearNum,
      month: monthNum,
      coverPhotoUri: newCoverUri,
      weightKg: newWeight ? parseFloat(newWeight.replace(',', '.')) : null,
      bodyFat: newBodyFat ? parseFloat(newBodyFat.replace(',', '.')) : null,
      notes: newNotes || null,
      createdAt: Date.now(),
    });

    setShowAddMonthModal(false);
    setNewCoverUri(null);
    setNewWeight('');
    setNewBodyFat('');
    setNewNotes('');
    loadEntries();
  };

  const handleSaveAdditionalPhoto = () => {
    Keyboard.dismiss();
    if (!selectedEntry || !addPhotoUri) {
      Alert.alert('Atenção', 'Selecione uma foto da galeria antes de salvar.');
      return;
    }

    haptics.success();
    evolutionRepository.addPhoto({
      entryId: selectedEntry.id,
      photoUri: addPhotoUri,
      pose: addPose,
    });

    setIsAddingPose(false);
    setAddPhotoUri(null);
    loadEntries();
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert('Excluir Foto', 'Deseja remover esta foto do histórico?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          haptics.medium();
          evolutionRepository.deletePhoto(photoId);
          loadEntries();
        },
      },
    ]);
  };

  const handleDeleteMonth = (entryId: string) => {
    Alert.alert('Excluir Mês', 'Deseja excluir todo o registro fotográfico deste mês?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          haptics.medium();
          evolutionRepository.deleteEntry(entryId);
          setSelectedEntryId(null);
          setIsAddingPose(false);
          loadEntries();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: tabBarHeight + Spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <ThemedText type="header">Evolução Física</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Acompanhamento fotográfico mensal.
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                {entries.length >= 2 && (
                  <Pressable
                    onPress={() => {
                      haptics.light();
                      setShowComparatorModal(true);
                    }}
                    style={[styles.compareBtn, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder }]}>
                    <ThemedText type="smallBold" style={{ color: theme.primaryHover }}>
                      ⇄ Comparar
                    </ThemedText>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    haptics.medium();
                    setShowAddMonthModal(true);
                  }}
                  style={[styles.addMonthBtn, { backgroundColor: theme.primary }]}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                    + Novo Mês
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>

          {/* CARROSSEL HORIZONTAL DE MESES */}
          {entries.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <ThemedText type="title" style={{ textAlign: 'center' }}>
                Nenhum mês cadastrado ainda
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.xs }}>
                Clique em &quot;+ Novo Mês&quot; para adicionar a foto de capa (frente) deste mês e iniciar o acompanhamento visual.
              </ThemedText>
              <Pressable
                onPress={() => setShowAddMonthModal(true)}
                style={[styles.startFirstBtn, { backgroundColor: theme.primary, marginTop: Spacing.md }]}>
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                  Adicionar Primeiro Mês ➔
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.carouselSection}>
              <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700', marginBottom: Spacing.xs }}>
                DESLIZE PARA NAVEGAR ENTRE OS MESES ⇄
              </ThemedText>

              <ScrollView
                horizontal
                pagingEnabled={false}
                snapToInterval={CARD_WIDTH + Spacing.md}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContainer}>
                {entries.map((item) => {
                  const monthName = MONTH_NAMES[item.month - 1] || `Mês ${item.month}`;
                  const totalPhotosCount = 1 + item.photos.length;

                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        haptics.light();
                        setIsAddingPose(false);
                        setSelectedEntryId(item.id);
                      }}
                      style={[
                        styles.monthCard,
                        {
                          width: CARD_WIDTH,
                          backgroundColor: theme.card,
                          borderColor: theme.cardBorder,
                        },
                      ]}>
                      {/* Foto Principal de Capa (Frente) */}
                      <View style={styles.coverImageWrapper}>
                        <Image
                          source={{ uri: item.coverPhotoUri }}
                          style={styles.coverImage}
                          resizeMode="cover"
                        />
                        <View style={styles.coverGradientOverlay} />

                        {/* Badge de Contagem de Fotos */}
                        <View style={styles.photosCountBadge}>
                          <ThemedText type="caption" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                            📷 {totalPhotosCount} {totalPhotosCount === 1 ? 'foto' : 'fotos'}
                          </ThemedText>
                        </View>

                        {/* Identificador do Mês sobre a Imagem */}
                        <View style={styles.monthCoverMeta}>
                          <ThemedText type="caption" style={{ color: theme.primaryHover, fontWeight: '800' }}>
                            {item.year}
                          </ThemedText>
                          <ThemedText type="title" style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800' }}>
                            {monthName}
                          </ThemedText>
                        </View>
                      </View>

                      {/* Informações Complementares do Card */}
                      <View style={styles.cardFooterInfo}>
                        <View style={styles.metricsRow}>
                          {item.weightKg ? (
                            <View style={[styles.miniMetricChip, { backgroundColor: theme.backgroundElevated }]}>
                              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                                Peso: <ThemedText type="caption" style={{ color: theme.text, fontWeight: '700' }}>{item.weightKg}kg</ThemedText>
                              </ThemedText>
                            </View>
                          ) : null}

                          {item.bodyFat ? (
                            <View style={[styles.miniMetricChip, { backgroundColor: theme.backgroundElevated }]}>
                              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                                BF: <ThemedText type="caption" style={{ color: theme.primaryHover, fontWeight: '700' }}>{item.bodyFat}%</ThemedText>
                              </ThemedText>
                            </View>
                          ) : null}
                        </View>

                        <ThemedText type="caption" style={{ color: theme.primary, textAlign: 'center', marginTop: 4 }}>
                          Toque para ver todas as fotos ➔
                        </ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* DICA DE EVOLUÇÃO */}
          <View style={[styles.tipBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
              💡 DICA DE PADRONIZAÇÃO
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
              Tire suas fotos sempre no mesmo horário (ex: pela manhã em jejum), na mesma iluminação e distância para máxima precisão na comparação.
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* OVERLAY 1: GALERIA COMPLETA DO MÊS SELECIONADO (SEM MODAL NATIVO) */}
      {selectedEntry && (
        <View style={styles.absoluteOverlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => {
              setIsAddingPose(false);
              setSelectedEntryId(null);
            }}
          />
          <View style={[styles.overlayContent, { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder }]}>
            {/* Header do Mês */}
            <View style={styles.detailHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '700' }}>
                  REGISTRO COMPLETO
                </ThemedText>
                <ThemedText type="title">
                  {MONTH_NAMES[selectedEntry.month - 1]} de {selectedEntry.year}
                </ThemedText>
                {selectedEntry.weightKg && (
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {selectedEntry.weightKg} kg {selectedEntry.bodyFat ? `• ${selectedEntry.bodyFat}% BF` : ''}
                  </ThemedText>
                )}
              </View>
              <Pressable
                onPress={() => {
                  setIsAddingPose(false);
                  setSelectedEntryId(null);
                }}
                hitSlop={12}
                style={styles.closeBtn}>
                <ThemedText type="title" style={{ color: theme.textSecondary }}>
                  ✕
                </ThemedText>
              </Pressable>
            </View>

            {/* Grade de Fotos do Mês ou Formulário Inline de Adicionar Pose */}
            <ScrollView
              style={styles.galleryScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {isAddingPose ? (
                /* FORMULÁRIO INLINE PARA ADICIONAR POSE */
                <View style={styles.addPoseInlineContainer}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                    <ThemedText type="smallBold" style={{ color: theme.primary }}>
                      + Nova Pose ({MONTH_NAMES[selectedEntry.month - 1]})
                    </ThemedText>
                    <Pressable
                      onPress={() => {
                        setIsAddingPose(false);
                        setAddPhotoUri(null);
                      }}>
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        Cancelar
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* Picker de Imagem */}
                  <Pressable
                    onPress={handlePickAdditionalImage}
                    style={[
                      styles.imagePickerPlaceholder,
                      {
                        backgroundColor: theme.backgroundElevated,
                        borderColor: addPhotoUri ? theme.primary : theme.cardBorder,
                        height: 180,
                      },
                    ]}>
                    {addPhotoUri ? (
                      <Image source={{ uri: addPhotoUri }} style={styles.previewPickedImage} resizeMode="cover" />
                    ) : (
                      <View style={{ alignItems: 'center', gap: Spacing.xs }}>
                        <ThemedText type="title">📷</ThemedText>
                        <ThemedText type="smallBold" style={{ color: theme.primary }}>
                          Selecionar Foto da Galeria
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: theme.textMuted }}>
                          Toque para escolher uma foto
                        </ThemedText>
                      </View>
                    )}
                  </Pressable>

                  {/* Seletor da Pose */}
                  <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs, marginBottom: Spacing.xs }}>
                    TIPO DE POSE
                  </ThemedText>
                  <View style={styles.poseOptionsRow}>
                    {POSE_OPTIONS.map((opt) => {
                      const isSelected = addPose === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          onPress={() => {
                            haptics.light();
                            setAddPose(opt.id);
                          }}
                          style={[
                            styles.poseOptionChip,
                            {
                              backgroundColor: isSelected ? theme.primaryDark : theme.backgroundElevated,
                              borderColor: isSelected ? theme.primary : theme.cardBorder,
                            },
                          ]}>
                          <ThemedText
                            type="caption"
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

                  <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
                    <Pressable
                      onPress={() => {
                        setIsAddingPose(false);
                        setAddPhotoUri(null);
                      }}
                      style={[styles.saveMonthBtn, { flex: 1, backgroundColor: theme.backgroundElevated, borderWidth: 1, borderColor: theme.cardBorder }]}>
                      <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
                        Voltar
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={handleSaveAdditionalPhoto}
                      style={[styles.saveMonthBtn, { flex: 2, backgroundColor: theme.primary }]}>
                      <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                        Salvar Pose
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                /* VISUALIZAÇÃO PADRÃO DA GALERIA */
                <>
                  <ThemedText type="caption" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
                    FOTO PRINCIPAL
                  </ThemedText>

                  {/* Foto de Capa (Frente) */}
                  <Pressable
                    onPress={() => setFullscreenPhotoUri(selectedEntry.coverPhotoUri)}
                    style={[styles.mainPhotoContainer, { borderColor: theme.primary }]}>
                    <Image
                      source={{ uri: selectedEntry.coverPhotoUri }}
                      style={styles.mainPhoto}
                      resizeMode="cover"
                    />
                    <View style={styles.poseTag}>
                      <ThemedText type="caption" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                        Frente (Capa)
                      </ThemedText>
                    </View>
                  </Pressable>

                  {/* Fotos Adicionais (Costas, Lados, etc.) */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.xs }}>
                    <ThemedText type="caption" style={{ color: theme.textMuted }}>
                      OUTRAS POSES ({selectedEntry.photos.length})
                    </ThemedText>
                    <Pressable
                      onPress={() => {
                        haptics.light();
                        setAddPhotoUri(null);
                        setIsAddingPose(true);
                      }}
                      style={[styles.addPoseBtn, { backgroundColor: theme.primary }]}>
                      <ThemedText type="caption" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                        + Adicionar Pose
                      </ThemedText>
                    </Pressable>
                  </View>

                  {selectedEntry.photos.length === 0 ? (
                    <View style={[styles.emptyPhotosBox, { backgroundColor: theme.backgroundElevated }]}>
                      <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                        Nenhuma foto adicional cadastrada neste mês. Toque em &quot;+ Adicionar Pose&quot; para registrar costas ou laterais.
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.photosGrid}>
                      {selectedEntry.photos.map((p) => {
                        const poseLabel =
                          POSE_OPTIONS.find((opt) => opt.id === p.pose)?.label || p.pose;
                        return (
                          <View key={p.id} style={styles.photoGridItem}>
                            <Pressable
                              onPress={() => setFullscreenPhotoUri(p.photoUri)}
                              style={[styles.gridPhotoWrapper, { borderColor: theme.cardBorder }]}>
                              <Image source={{ uri: p.photoUri }} style={styles.gridPhoto} resizeMode="cover" />
                              <View style={styles.gridPoseTag}>
                                <ThemedText type="caption" style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                                  {poseLabel}
                                </ThemedText>
                              </View>
                            </Pressable>
                            <Pressable
                              onPress={() => handleDeletePhoto(p.id)}
                              hitSlop={6}
                              style={styles.deletePhotoBtn}>
                              <ThemedText type="caption" style={{ color: theme.danger, fontSize: 10 }}>
                                Excluir
                              </ThemedText>
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {selectedEntry.notes && (
                    <View style={[styles.notesBox, { backgroundColor: theme.backgroundElevated, marginTop: Spacing.md }]}>
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        OBSERVAÇÕES DO MÊS:
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.text, marginTop: 2 }}>
                        {selectedEntry.notes}
                      </ThemedText>
                    </View>
                  )}

                  {/* Ação de Excluir Mês */}
                  <Pressable
                    onPress={() => handleDeleteMonth(selectedEntry.id)}
                    style={styles.deleteMonthBtn}>
                    <ThemedText type="caption" style={{ color: theme.danger }}>
                      Excluir Registro Deste Mês
                    </ThemedText>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* OVERLAY 2: ADICIONAR NOVO MÊS */}
      {showAddMonthModal && (
        <View style={styles.absoluteOverlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => {
              Keyboard.dismiss();
              setShowAddMonthModal(false);
            }}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}>
            <View style={[styles.overlayContent, { backgroundColor: theme.cardElevated, borderColor: theme.cardBorder }]}>
              <View style={styles.detailHeader}>
                <ThemedText type="title">Novo Mês de Evolução</ThemedText>
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowAddMonthModal(false);
                  }}
                  hitSlop={12}>
                  <ThemedText type="title" style={{ color: theme.textSecondary }}>✕</ThemedText>
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 440 }}>
                {/* Seletor da Foto Principal de Capa */}
                <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                  FOTO PRINCIPAL (CAPA - CORPO DE FRENTE) *
                </ThemedText>
                <Pressable
                  onPress={handlePickCoverImage}
                  style={[
                    styles.imagePickerPlaceholder,
                    {
                      backgroundColor: theme.backgroundElevated,
                      borderColor: newCoverUri ? theme.primary : theme.cardBorder,
                    },
                  ]}>
                  {newCoverUri ? (
                    <Image source={{ uri: newCoverUri }} style={styles.previewPickedImage} resizeMode="cover" />
                  ) : (
                    <View style={{ alignItems: 'center', gap: Spacing.xs }}>
                      <ThemedText type="title">📷</ThemedText>
                      <ThemedText type="smallBold" style={{ color: theme.primary }}>
                        Selecionar Foto de Frente
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: theme.textMuted }}>
                        Esta foto será a capa do carrossel mensal
                      </ThemedText>
                    </View>
                  )}
                </Pressable>

                {/* Seletor de Mês e Ano */}
                <View style={styles.monthYearRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: 4 }}>
                      MÊS (1-12)
                    </ThemedText>
                    <TextInput
                      value={newMonth.toString()}
                      onChangeText={(txt) => setNewMonth(Math.min(12, Math.max(1, parseInt(txt, 10) || 1)))}
                      keyboardType="number-pad"
                      style={[styles.inputField, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder, color: theme.text }]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: 4 }}>
                      ANO
                    </ThemedText>
                    <TextInput
                      value={newYear}
                      onChangeText={setNewYear}
                      keyboardType="number-pad"
                      style={[styles.inputField, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder, color: theme.text }]}
                    />
                  </View>
                </View>

                {/* Peso e BF Opcionais */}
                <View style={styles.monthYearRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: 4 }}>
                      PESO CORPORAL (KG)
                    </ThemedText>
                    <TextInput
                      value={newWeight}
                      onChangeText={setNewWeight}
                      placeholder="Ex: 82.5"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      style={[styles.inputField, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder, color: theme.text }]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: 4 }}>
                      GORDURA / BF (%)
                    </ThemedText>
                    <TextInput
                      value={newBodyFat}
                      onChangeText={setNewBodyFat}
                      placeholder="Ex: 12.0"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      style={[styles.inputField, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder, color: theme.text }]}
                    />
                  </View>
                </View>

                {/* Observações */}
                <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.sm, marginBottom: 4 }}>
                  ANOTAÇÕES DO MÊS (OPCIONAL)
                </ThemedText>
                <TextInput
                  value={newNotes}
                  onChangeText={setNewNotes}
                  placeholder="Ex: Fim do cutting, melhora visível nos deltoides..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={2}
                  style={[styles.inputField, { backgroundColor: theme.backgroundElevated, borderColor: theme.cardBorder, color: theme.text, height: 60 }]}
                />

                <Pressable
                  onPress={handleSaveNewMonth}
                  style={[styles.saveMonthBtn, { backgroundColor: theme.primary, marginTop: Spacing.md }]}>
                  <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                    Salvar Mês no Carrossel
                  </ThemedText>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* OVERLAY FULLSCREEN IMAGE VIEWER */}
      {fullscreenPhotoUri && (
        <View style={styles.fullscreenOverlay}>
          <Pressable
            onPress={() => setFullscreenPhotoUri(null)}
            style={styles.fullscreenCloseBtn}>
            <ThemedText type="title" style={{ color: '#FFFFFF' }}>✕</ThemedText>
          </Pressable>
          <Image
            source={{ uri: fullscreenPhotoUri }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </View>
      )}

      {/* OVERLAY COMPARADOR DE EVOLUÇÃO (ANTES & DEPOIS) */}
      <PhotoComparatorModal
        visible={showComparatorModal}
        entries={entries}
        onClose={() => setShowComparatorModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    marginBottom: Spacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compareBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  addMonthBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xs,
  },
  emptyCard: {
    padding: Spacing.xl,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  startFirstBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xs,
  },
  carouselSection: {
    marginTop: Spacing.xs,
  },
  carouselContainer: {
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  monthCard: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverImageWrapper: {
    width: '100%',
    height: 380,
    position: 'relative',
    backgroundColor: '#000000',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  photosCountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  monthCoverMeta: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
  },
  cardFooterInfo: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  miniMetricChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  tipBox: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  absoluteOverlay: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  overlayContent: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '90%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  galleryScroll: {
    maxHeight: 480,
  },
  addPoseInlineContainer: {
    padding: Spacing.xs,
  },
  mainPhotoContainer: {
    width: '100%',
    height: 240,
    borderRadius: Radius.xs,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
  },
  poseTag: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  addPoseBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  emptyPhotosBox: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    alignItems: 'center',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoGridItem: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) / 2 - 8,
    gap: 4,
  },
  gridPhotoWrapper: {
    width: '100%',
    height: 160,
    borderRadius: Radius.xs,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gridPhoto: {
    width: '100%',
    height: '100%',
  },
  gridPoseTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  deletePhotoBtn: {
    alignSelf: 'center',
    padding: 2,
  },
  notesBox: {
    padding: Spacing.sm,
    borderRadius: Radius.xs,
  },
  deleteMonthBtn: {
    marginTop: Spacing.lg,
    alignSelf: 'center',
    padding: Spacing.sm,
  },
  imagePickerPlaceholder: {
    height: 200,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  previewPickedImage: {
    width: '100%',
    height: '100%',
  },
  monthYearRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  inputField: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
    fontSize: 14,
  },
  saveMonthBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poseOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  poseOptionChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  fullscreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 10,
    padding: Spacing.sm,
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.33,
  },
});
