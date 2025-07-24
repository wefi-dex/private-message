/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: '#5A0FC8',
    secondprimary:'#BD9FE9',
    semiprimary:'#DECFF4',
    shadeprimary:'#AD87E4',
    fontsemi:'#F2F2F2',
    fontthird:'#565856',
    textbio:'#D0D0D0'
  },
  dark: {
    text: '#ECEDEE',
    background: '#1C1B2D',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: 'white',
  },
};
