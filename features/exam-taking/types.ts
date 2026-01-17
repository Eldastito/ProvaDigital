export type FontType = 'sans' | 'serif' | 'dyslexic';
export type ThemeType = 'light' | 'dark' | 'sepia' | 'high-contrast';

export interface AccessibilityConfig {
    fontSize: number; // Percentage (100 = base)
    fontType: FontType;
    theme: ThemeType;
    lineHeight: number; // 1.5 default
    letterSpacing: number; // 0 default
    focusMode: boolean; // "Zen Mode"
    hideTimer: boolean;
    textToSpeech: boolean;
}

export const DEFAULT_ACCESSIBILITY_CONFIG: AccessibilityConfig = {
    fontSize: 100,
    fontType: 'sans',
    theme: 'light',
    lineHeight: 1.5,
    letterSpacing: 0,
    focusMode: false,
    hideTimer: false,
    textToSpeech: false
};
