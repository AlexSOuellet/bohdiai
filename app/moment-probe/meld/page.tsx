/** THROWAWAY PROBE — the meld interaction. Delete with the folder. */
import { notFound } from 'next/navigation';
import { momentById } from '../moments';
import { MeldDemo } from '../MeldDemo';

export default function MeldPage() {
  const moment = momentById('candles-cinematic');
  if (moment === undefined) notFound();
  return <MeldDemo moment={moment} />;
}
