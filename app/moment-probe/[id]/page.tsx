/** THROWAWAY PROBE render route — see ../moments.tsx. Delete with the folder. */
import { notFound } from 'next/navigation';
import { MomentFrame, momentById } from '../moments';

export default async function MomentProbePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const moment = momentById(id);
  if (moment === undefined) notFound();
  return <MomentFrame sheet={moment.sheet} page={moment.page} />;
}
