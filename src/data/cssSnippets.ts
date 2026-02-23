export interface CSSSnippet {
  name: string;
  description: string;
  css: string;
}

export const cssSnippets: CSSSnippet[] = [
  {
    name: 'Compact Mode',
    description: 'Reduces padding and margins throughout the UI',
    css: `/* Compact Mode */
.bento-card { padding: 0.75rem !important; }
.space-y-6 > * + * { margin-top: 0.75rem !important; }
.space-y-4 > * + * { margin-top: 0.5rem !important; }
.gap-6 { gap: 0.75rem !important; }
.gap-4 { gap: 0.5rem !important; }
.p-6 { padding: 0.75rem !important; }
.p-4 { padding: 0.5rem !important; }`,
  },
  {
    name: 'Larger Text',
    description: 'Increases the base font size for better readability',
    css: `/* Larger Text */
html { font-size: 18px !important; }
.text-sm { font-size: 0.95rem !important; }
.text-xs { font-size: 0.85rem !important; }`,
  },
  {
    name: 'Hide Animations',
    description: 'Disables all transitions and animations',
    css: `/* Hide Animations */
*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
}`,
  },
  {
    name: 'Custom Accent Color',
    description: 'Changes the accent color to a custom value',
    css: `/* Custom Accent Color — change the hex to your preferred color */
:root {
  --accent-primary: #e11d48 !important;
}`,
  },
  {
    name: 'Rounded Everything',
    description: 'Applies maximum border-radius to all elements',
    css: `/* Rounded Everything */
.bento-card,
[class*="rounded"] {
  border-radius: 1.5rem !important;
}
button, input, select, textarea {
  border-radius: 1rem !important;
}`,
  },
  {
    name: 'Flat Design',
    description: 'Removes all shadows and gradients for a flat look',
    css: `/* Flat Design */
* {
  box-shadow: none !important;
  text-shadow: none !important;
}
[class*="shadow"] {
  box-shadow: none !important;
}
[style*="gradient"] {
  background-image: none !important;
}`,
  },
  {
    name: 'Focus Mode Typography',
    description: 'Uses a larger serif font optimized for reading notes',
    css: `/* Focus Mode Typography */
.ProseMirror,
[class*="editor"],
[class*="note-content"] {
  font-family: Georgia, 'Times New Roman', serif !important;
  font-size: 1.15rem !important;
  line-height: 1.8 !important;
  max-width: 65ch !important;
  margin-left: auto !important;
  margin-right: auto !important;
}`,
  },
  {
    name: 'High Contrast',
    description: 'Increases contrast for better accessibility',
    css: `/* High Contrast */
:root {
  --text-light-primary: #000000 !important;
  --text-dark-primary: #ffffff !important;
  --text-light-secondary: #1a1a1a !important;
  --text-dark-secondary: #e5e5e5 !important;
  --border-light: #333333 !important;
  --border-dark: #cccccc !important;
}`,
  },
];
