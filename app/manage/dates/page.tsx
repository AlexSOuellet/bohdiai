import { redirect } from 'next/navigation';

/** Market dates became Markets; old links land on the new screen. */
export default function DatesPage(): never {
  redirect('/manage/markets');
}
