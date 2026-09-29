import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Retorna a altura total que deve ser usada como paddingBottom
 * para evitar que o conteúdo fique sob a tab bar nativa.
 *
 * NativeTabs (expo-router/unstable-native-tabs) renderiza a tab bar
 * por cima do conteúdo. A altura da tab bar nativa é:
 *   - iOS: ~49px + safe area bottom (home indicator)
 *   - Android: ~56px (sem safe area bottom geralmente)
 */
export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'ios') {
    // Tab bar iOS padrão: 49px + home indicator (insets.bottom)
    return 49 + insets.bottom;
  }

  if (Platform.OS === 'android') {
    // Tab bar Android padrão: 56px (material design)
    // Adiciona bottom inset para dispositivos com gesture navigation
    return 56 + insets.bottom;
  }

  // Web ou outros: sem tab bar nativa
  return 0;
}
