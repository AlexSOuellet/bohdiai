import { IBM_Plex_Sans } from 'next/font/google';

/** Penny's body face. Cormorant Garamond (display) is already loaded in app/layout.tsx as --font-serif. */
export const plex = IBM_Plex_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-plex', weight: ['400', '500', '600'] });
