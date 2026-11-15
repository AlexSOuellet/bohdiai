'use client';

/** The tools to try (Alex, 2026-11-15), one tab each. Nothing is saved: the buttons
 *  that save to a product or keep a piece are left out. Describe it (an AI call each
 *  use) and What to bring (it reads a maker's own market sales) aren't here. */
import { useState } from 'react';
import { CostTool } from '@/app/manage/tools/_components/CostTool';
import { PriceTool } from '@/app/manage/tools/_components/PriceTool';
import { WorthTool } from '@/app/manage/tools/_components/WorthTool';
import { GoalTool } from '@/app/manage/tools/_components/GoalTool';
import { ShipTool } from '@/app/manage/tools/_components/ShipTool';
import { PrintTool } from '@/app/manage/tools/_components/PrintTool';
import { BLANK_PRICE } from '@/lib/tools/forms';

export const TRY_TOOLS = [
  { key: 'cost', name: 'Cost to make' },
  { key: 'price', name: 'Price it' },
  { key: 'worth', name: 'Is it worth it?' },
  { key: 'goal', name: 'Monthly goal' },
  { key: 'ship', name: 'Shipping' },
  { key: 'print', name: 'Print it' },
] as const;
type ToolKey = (typeof TRY_TOOLS)[number]['key'];

export function TryTools(): React.ReactElement {
  const [tool, setTool] = useState<ToolKey>('cost');
  return (
    <div className="bk-tools bk-try-tools">
      <div className="bk-print-tabs" role="tablist" aria-label="The tools">
        {TRY_TOOLS.map((t) => (
          <button key={t.key} type="button" role="tab" id={`try-tab-${t.key}`} aria-selected={tool === t.key} aria-controls="try-panel" className="bk-print-tab" onClick={() => setTool(t.key)}>
            {t.name}
          </button>
        ))}
      </div>
      <div id="try-panel" role="tabpanel" aria-labelledby={`try-tab-${tool}`} className="bk-try-panel">
        {tool === 'cost' && <CostTool publicPage />}
        {tool === 'price' && <PriceTool initial={BLANK_PRICE} carry={null} canSaveProduct={false} publicPage />}
        {tool === 'worth' && <WorthTool canSaveEvent={false} />}
        {tool === 'goal' && <GoalTool />}
        {tool === 'ship' && <ShipTool />}
        {tool === 'print' && <PrintTool pieces={[]} products={null} canSavePieces={false} />}
      </div>
    </div>
  );
}
