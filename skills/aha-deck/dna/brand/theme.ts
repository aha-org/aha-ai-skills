// DLS tokens from the Figma file ("ahatherapy"), the same values as the SwiftUI prototype.

export const C = {
  backgroundPrimary: '#FDFBF7',
  backgroundSecondary: '#FDF6F4',
  backgroundTertiary: '#F0E9E6',
  contentPrimary: '#202020',
  contentSecondary: '#62605F',
  contentTertiary: '#898786',
  brand: '#749C49',
  borderOpaque: '#CAC8C7',
  borderSelected: '#202020',
  /** Selected multiple-choice option fill. */
  brandWash: '#F1F5ED',
  otherBorder: '#D0D5DD',
  placeholder: '#5E5E5E',
  success: '#4CAF63',
  error: '#FF3F3D',
  link: '#276EF1',
  icon: '#343330',
};

/** Satoshi weights (loaded in App.tsx). */
export const F = {
  regular: 'Satoshi-Regular',
  medium: 'Satoshi-Medium',
  bold: 'Satoshi-Bold',
  /** Handwriting: the journal on the daily log (Schoolbell, as on the welcome's sticky notes). */
  hand: 'Schoolbell',
};

export const FONT_FILES = {
  'Satoshi-Regular': require('../assets/fonts/Satoshi-Regular.otf'),
  'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.otf'),
  'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.otf'),
  Schoolbell: require('@expo-google-fonts/schoolbell/400Regular/Schoolbell_400Regular.ttf'),
};

/** Figma screens are 390 x 844 with a 44 pt status bar; content starts 12 pt below it. */
export const LAYOUT = { contentTop: 56, side: 16 };

/**
 * Line height that matches SwiftUI: Satoshi's natural line is 1.35 x the font size
 * (ascent 1010 + descent 240 + gap 100 per 1000), plus the text style's extra line spacing.
 */
export const lh = (size: number, spacing = 0) => Math.round((size * 1.35 + spacing) * 10) / 10;

/**
 * Ink for letters that are laid out but not written yet. Not 'transparent': on Android a nested
 * span coloured 'transparent' (colour value 0) is read as "no colour" and drawn in the parent's
 * colour, so whole sentences showed at once while only the haptics ran word by word. This is just
 * as invisible but a different value.
 */
export const UNWRITTEN = 'rgba(255,255,255,0)';
