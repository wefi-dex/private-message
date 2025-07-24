/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useThemeContext } from '@/components/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const systemTheme = useColorScheme() ?? 'light';
  let theme = systemTheme;
  try {
    const { theme: contextTheme } = useThemeContext();
    if (contextTheme) {
      theme = contextTheme;
    }
  } catch {}
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
