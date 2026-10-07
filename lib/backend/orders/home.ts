/** Orders' part of the home screen: new orders waiting on the owner. */
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { HomeContributor, HomeData } from '../home';
import { countNewOrders } from './queries';

export function ordersHomeData(waiting: number): HomeData {
  return {
    tiles: [{ label: 'New orders', value: String(waiting), note: 'waiting on you' }],
    attention: waiting === 0 ? [] : [waiting === 1 ? 'One new order is waiting. Open Orders to answer it.' : `${waiting} new orders are waiting. Open Orders to answer them.`],
  };
}

export const ordersHome: HomeContributor = {
  feature: 'cart',
  load: async (tenantId) => ordersHomeData(await countNewOrders(await createSupabaseServerClient(), tenantId)),
};
