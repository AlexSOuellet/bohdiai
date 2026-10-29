import { redirect } from 'next/navigation';

/** Tools opens on the first one, Cost to make. */
export default function ToolsPage(): never {
  redirect('/manage/tools/cost');
}
