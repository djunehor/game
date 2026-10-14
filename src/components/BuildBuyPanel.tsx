import { useMemo, useState } from 'react';
import { CATALOG, CATALOG_BY_ID, CATEGORY_LABELS } from '../life/catalog';
import { canAfford, objectPrice, sellValue } from '../life/buildMode';
import { canPlace } from '../life/buildMode';
import { regionLabelAt } from '../life/objects';
import { useLifeStore } from '../life/lifeStore';

import type { ObjectCategory } from '../life/types';

// ---------------------------------------------------------------------------
// Build / Buy mode: pick a catalog item, aim it, place it.
// ---------------------------------------------------------------------------

const CATEGORY_ORDER: ObjectCategory[] = [
  'beds',
  'seating',
  'surfaces',
  'appliances',
  'plumbing',
  'electronics',
  'skill',
  'decor',
  'outdoor',
];

export function BuildBuyPanel() {
  const household = useLifeStore((s) => s.household);
  const mode = useLifeStore((s) => s.mode);
  const placingCatalogId = useLifeStore((s) => s.placingCatalogId);
  const placingUid = useLifeStore((s) => s.placingUid);
  const rotation = useLifeStore((s) => s.rotation);
  const ghost = useLifeStore((s) => s.ghost);
  const startPlacing = useLifeStore((s) => s.startPlacing);
  const startMoving = useLifeStore((s) => s.startMoving);
  const cancelPlacing = useLifeStore((s) => s.cancelPlacing);
  const rotatePlacing = useLifeStore((s) => s.rotatePlacing);
  const confirmPlace = useLifeStore((s) => s.confirmPlace);
  const sellObject = useLifeStore((s) => s.sellObject);
  const clearRoom = useLifeStore((s) => s.clearRoom);

  const [category, setCategory] = useState<ObjectCategory>('beds');
  const [tab, setTab] = useState<'catalog' | 'lot'>('catalog');
  const tool = useLifeStore((s) => s.tool);
  const setTool = useLifeStore((s) => s.setTool);

  const funds = household?.funds ?? 0;

  const items = useMemo(
    () => CATALOG.filter((o) => o.category === category).sort((a, b) => a.price - b.price),
    [category],
  );

  const grouped = useMemo(() => {
    const out: Record<string, { uid: string; catalogId: string }[]> = {};
    if (!household) return out;
    const regions = useLifeStore.getState().regions();
    for (const placed of household.lot) {
      const room = regionLabelAt(household.plot, regions, placed.x, placed.z);
      (out[room] ??= []).push({ uid: placed.uid, catalogId: placed.catalogId });
    }
    return out;
  }, [household, household?.lot]);

  if (!household || mode !== 'build') return null;

  const check = placingCatalogId && ghost
    ? canPlace(household.lot, placingCatalogId, ghost.x, ghost.z, rotation, placingUid ?? undefined)
    : null;
  const placingDef = placingCatalogId ? CATALOG_BY_ID[placingCatalogId] : null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 flex max-h-[62vh] flex-col border-t border-white/15 bg-slate-950/95 text-white backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-gold">🔨 Build &amp; Buy</span>
          <span className="text-[11px] text-white/50">₦{funds.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {([
            { id: 'object' as const, label: '🛋️ Objects' },
            { id: 'wall' as const, label: '🧱 Walls' },
            { id: 'door' as const, label: '🚪 Doors' },
            { id: 'floor' as const, label: '🟫 Floors' },
            { id: 'erase' as const, label: '🧽 Remove' },
          ]).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTool(t.id)}
              className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                tool === t.id ? 'bg-gold/25 text-gold ring-1 ring-gold/50' : 'text-white/60 hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-white/15" />
          {(['catalog', 'lot'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                tab === t ? 'bg-white/15 text-gold' : 'text-white/60 hover:bg-white/10'
              }`}
            >
              {t === 'catalog' ? 'Catalog' : 'Your Lot'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => useLifeStore.getState().setMode('live')}
            className="ml-2 rounded-xl bg-emerald-600 px-3 py-1 text-[11px] font-bold hover:bg-emerald-500 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Placement bar */}
      {placingDef && (
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-black/30 px-3 py-2">
          <span className="text-sm font-bold">
            {placingDef.emoji} {placingDef.name}
          </span>
          <span className="text-[11px] text-white/50">
            {placingUid ? 'Moving' : `₦${objectPrice(placingDef.id).toLocaleString()}`}
          </span>
          <span
            className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
              check?.ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {check?.ok ? '✓ Can place' : check?.reason ?? 'Aim at the floor'}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={rotatePlacing}
              className="rounded-xl bg-white/10 px-2.5 py-1 text-[11px] font-bold hover:bg-white/20 cursor-pointer"
            >
              ⟳ Rotate
            </button>
            <button
              type="button"
              onClick={confirmPlace}
              disabled={!check?.ok}
              className={`rounded-xl px-3 py-1 text-[11px] font-bold transition ${
                check?.ok ? 'bg-gold text-black hover:brightness-110 cursor-pointer' : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {placingUid ? 'Move here' : 'Buy & Place'}
            </button>
            <button
              type="button"
              onClick={cancelPlacing}
              className="rounded-xl bg-white/10 px-2.5 py-1 text-[11px] font-bold hover:bg-white/20 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {tool !== 'object' ? (
        <div className="px-3 py-3 text-[11px] text-white/60">
          {tool === 'wall' && `Click the ground to draw a wall (₦30 each). Walls divide your plot into rooms — the rooms are named after what you put in them.`}
          {tool === 'door' && `Click a wall segment to fit a door (₦120). Doors separate rooms but let Sims through — without one, a room is sealed.`}
          {tool === 'floor' && `Click tiles to lay flooring (₦45 per tile).`}
          {tool === 'erase' && `Click a wall to knock it down and get half your money back (highlighted in red).`}
        </div>
      ) : tab === 'catalog' ? (
        <>
          {/* Categories */}
          <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-2 py-1.5">
            {CATEGORY_ORDER.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                  category === c ? 'bg-gold/25 text-gold ring-1 ring-gold/50' : 'text-white/60 hover:bg-white/10'
                }`}
              >
                {CATEGORY_LABELS[c].emoji} {CATEGORY_LABELS[c].label}
              </button>
            ))}
          </div>

          {/* Items */}
          <div className="grid max-h-[36vh] grid-cols-2 gap-2 overflow-y-auto p-2 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => {
              const affordable = canAfford(funds, item.id);
              const active = placingCatalogId === item.id && !placingUid;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!affordable}
                  onClick={() => startPlacing(item.id)}
                  title={item.description}
                  className={`flex flex-col gap-1 rounded-2xl border p-2 text-left transition ${
                    active
                      ? 'border-gold bg-gold/15'
                      : affordable
                        ? 'border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer'
                        : 'cursor-not-allowed border-white/5 bg-white/5 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{item.emoji}</span>
                    <span className={`text-[11px] font-bold ${affordable ? 'text-amber-300' : 'text-rose-300'}`}>
                      ₦{item.price.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold leading-tight">{item.name}</span>
                  <span className="line-clamp-2 text-[10px] leading-tight text-white/45">{item.description}</span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {Object.entries(item.ratings)
                      .filter(([, v]) => (v ?? 0) >= 6)
                      .slice(0, 3)
                      .map(([k, v]) => (
                        <span key={k} className="rounded bg-emerald-500/15 px-1 text-[9px] font-bold text-emerald-300">
                          {k} {v}
                        </span>
                      ))}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="max-h-[40vh] space-y-3 overflow-y-auto p-3">
          {Object.keys(grouped).length === 0 && (
            <p className="text-[11px] text-white/50">Nothing placed yet — buy something from the catalog.</p>
          )}
          {Object.keys(grouped).map((room) => (
            <div key={room}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
                  🏠 {room}
                </span>
                <button
                  type="button"
                  onClick={() => clearRoom(room)}
                  className="rounded-lg bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                >
                  Sell all
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {grouped[room].map(({ uid, catalogId }) => {
                  const def = CATALOG_BY_ID[catalogId];
                  if (!def) return null;
                  return (
                    <div
                      key={uid}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2 py-1"
                    >
                      <span className="text-sm">{def.emoji}</span>
                      <span className="text-[11px] font-semibold">{def.name}</span>
                      <button
                        type="button"
                        onClick={() => startMoving(uid)}
                        className="rounded px-1 text-[10px] text-sky-300 hover:bg-white/10 cursor-pointer"
                      >
                        Move
                      </button>
                      <button
                        type="button"
                        onClick={() => sellObject(uid)}
                        className="rounded px-1 text-[10px] text-rose-300 hover:bg-white/10 cursor-pointer"
                      >
                        Sell ₦{sellValue(catalogId).toLocaleString()}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
