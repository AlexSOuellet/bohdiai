import type { Metadata } from 'next';
import { Caveat } from 'next/font/google';
import { Scene } from '@/components/Scene';
import { Checkup } from '@/components/checkup/Checkup';
import './checkup.css';

// Alex's handwriting: his asides, his notes on the write-up, his sign-off.
const hand = Caveat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-hand',
  weight: ['500', '600'],
});

export const metadata: Metadata = {
  title: 'Where does your making stand? — BohdiAI',
  description:
    'A few minutes of taps about your work and what you want from it, then an honest write-up from Alex: what’s working, what isn’t, and where to start.',
};

/** bohdiai.com/checkup — the maker checkup. Runs full screen, without the site header. */
export default function CheckupPage(): React.ReactElement {
  return (
    <div className={hand.variable}>
      <Scene>
        <Checkup />
      </Scene>
    </div>
  );
}
