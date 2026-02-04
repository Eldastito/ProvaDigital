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
    readingSpeed: number; // 0.8 to 2.0
    penMode: 'none' | 'pen' | 'highlighter' | 'eraser';
    penColor: string;
    markerColor: string;
    strokeSize: number;
    showScratchpad: boolean;
}

export const DEFAULT_ACCESSIBILITY_CONFIG: AccessibilityConfig = {
    fontSize: 100,
    fontType: 'sans',
    theme: 'light',
    lineHeight: 1.5,
    letterSpacing: 0,
    focusMode: false,
    hideTimer: false,
    textToSpeech: false,
    readingSpeed: 1.0,
    penMode: 'none',
    penColor: '#3b82f6', // blue-500
    markerColor: '#fde047', // yellow-300
    strokeSize: 3,
    showScratchpad: false
};
