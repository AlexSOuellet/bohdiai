import { Schibsted_Grotesk } from 'next/font/google';

/** The backend's one face (the redesign, 2026-10-27): sturdy and plain-spoken, heavy for headings. */
export const backendFace = Schibsted_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--font-backend', weight: ['400', '500', '600', '700', '800'] });
