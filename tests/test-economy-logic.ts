import { useEconomyStore } from '../src/world/economyStore';
import { COMMERCE_CATALOG, SHOPS, type ShopId } from '../src/data/commerceCatalog';
import { useGame } from '../src/store';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

console.log('→ Testing Virtual Currency & Commerce System Logic');

// 1. Establishments & Catalog Integrity
const shopIds: ShopId[] = ['gas_station', 'supermarket', 'restaurant', 'bar', 'activity'];
for (const s of shopIds) {
  const def = SHOPS[s];
  assert(Boolean(def.name && def.emoji && def.headline), `Shop definition valid for ${s} (${def.name})`);
  const items = COMMERCE_CATALOG.filter((it) => it.shopId === s);
  assert(items.length >= 3, `Establishment ${def.name} offers multiple items (${items.length} items)`);
}

// 2. Initial Wallet State
const econ = useEconomyStore.getState();
econ.resetEconomy();
assert(useEconomyStore.getState().walletBalance === 50000, 'Starting wallet balance is initialized to ₦50,000');
assert(Object.keys(useEconomyStore.getState().inventory).length === 0, 'Starting inventory is empty');
assert(useEconomyStore.getState().transactions.length === 1, 'Initial deposit transaction is logged');

// 3. Spending Validation
const fuelItem = COMMERCE_CATALOG.find((it) => it.id === 'fuel-pms-tank')!;
assert(Boolean(fuelItem), 'PMS Petrol fuel item exists in catalog');

// Successful spend
const buyFuelResult = useEconomyStore.getState().buyItem(fuelItem);
assert(buyFuelResult.success === true, 'Player successfully purchases PMS Petrol tank refill');
assert(
  useEconomyStore.getState().walletBalance === 50000 - fuelItem.cost,
  `Wallet balance correctly decrements by ₦${fuelItem.cost} (Current: ₦${useEconomyStore.getState().walletBalance})`
);
assert(
  useEconomyStore.getState().inventory[fuelItem.id]?.count === 1,
  'Purchased fuel is placed into player inventory'
);

// Insufficient funds rejection
const expensiveItem = {
  ...fuelItem,
  id: 'luxury-yacht',
  cost: 9999999,
  name: 'Luxury Superyacht',
};
const failedBuy = useEconomyStore.getState().buyItem(expensiveItem);
assert(failedBuy.success === false, 'buyItem correctly rejects purchase when cost exceeds wallet balance');
assert(
  useEconomyStore.getState().walletBalance === 45000,
  'Wallet balance remains untouched upon rejected transaction'
);

// 4. Multi-Category Purchases
const jollofItem = COMMERCE_CATALOG.find((it) => it.id === 'food-party-jollof')!;
const shadesItem = COMMERCE_CATALOG.find((it) => it.id === 'mart-designer-shades')!;
const chapmanItem = COMMERCE_CATALOG.find((it) => it.id === 'bar-chapman-cocktail')!;

useEconomyStore.getState().buyItem(jollofItem);
useEconomyStore.getState().buyItem(shadesItem);
useEconomyStore.getState().buyItem(chapmanItem);

const currentInv = useEconomyStore.getState().inventory;
assert(Boolean(currentInv[jollofItem.id]), 'Restaurant item (Party Jollof) stored in inventory');
assert(Boolean(currentInv[shadesItem.id]), 'Supermarket item (Designer Shades) stored in inventory');
assert(Boolean(currentInv[chapmanItem.id]), 'Bar item (Chapman Cocktail) stored in inventory');

// Repeat item purchase stack verification
useEconomyStore.getState().buyItem(jollofItem);
assert(useEconomyStore.getState().inventory[jollofItem.id].count === 2, 'Repeat purchase increments inventory item count to 2');

// 5. Using Inventory Items & Applying Stat Effects
// Mock initial game state player
useGame.setState({
  state: {
    phase: 'daily',
    day: 1,
    week: 1,
    gameOver: false,
    onboardingDone: true,
    phaseDone: false,
    player: {
      id: 'test_player',
      name: 'Player One',
      nickname: 'Player',
      gender: 'male',
      age: 25,
      stateOfOrigin: 'Lagos',
      profession: 'artist',
      trait: 'strategic',
      avatar: '😎',
      accentColor: '#0284c7',
      bio: 'Test',
      energy: 50,
      sanity: 50,
      hunger: 80,
      houseStanding: 50,
      fanbaseClout: 5000,
      bbCoins: useEconomyStore.getState().walletBalance,
      strikes: 0,
      status: 'active',
      isHoH: false,
      isImmune: false,
      isNominated: false,
      isHuman: true,
      currentRoom: 'Lounge',
      relationships: { npc_chommy: 20 },
    },
    housemates: [
      {
        id: 'npc_chommy',
        name: 'Chommy Gold',
        nickname: 'Chommy',
        gender: 'female',
        age: 24,
        stateOfOrigin: 'Imo',
        profession: 'model',
        trait: 'dramatic',
        avatar: '💃🏾',
        accentColor: '#ec4899',
        bio: 'NPC',
        energy: 80,
        sanity: 80,
        hunger: 40,
        houseStanding: 60,
        fanbaseClout: 12000,
        bbCoins: 15000,
        strikes: 0,
        status: 'active',
        isHoH: false,
        isImmune: false,
        isNominated: false,
        currentRoom: 'Lounge',
        relationships: { test_player: 20 },
      },
    ],
    logs: [],
    tweets: [],
    activityDeck: [],
    nominations: [],
    evictionVotes: {},
    evictedThisWeek: null,
  } as any,
});

const preHunger = useGame.getState().state!.player.hunger;
const useRes = useEconomyStore.getState().useItem(jollofItem.id);
assert(useRes.success === true, 'useItem consumes inventory item successfully');
assert(
  useEconomyStore.getState().inventory[jollofItem.id].count === 1,
  'Item count decrements after consumption'
);
assert(
  useGame.getState().state!.player.hunger < preHunger,
  'Consuming food item restores satiety (decreases hunger stat)'
);

// 6. Peer-to-Peer Transfers & Spraying Money
const preTransferBal = useEconomyStore.getState().walletBalance;
const transferRes = useEconomyStore.getState().transferToHousemate(
  'npc_chommy',
  'Chommy',
  5000,
  'Spraying you money at the Saturday Party 🎉'
);

assert(transferRes.success === true, 'P2P money transfer executes successfully');
assert(
  useEconomyStore.getState().walletBalance === preTransferBal - 5000,
  'Sender balance decrements by transfer amount (₦5,000)'
);
assert(
  useGame.getState().state!.player.relationships.npc_chommy > 20,
  'Transferring money increases relationship affinity score with recipient'
);

const recentTx = useEconomyStore.getState().transactions[0];
assert(
  recentTx.type === 'transfer_out' && recentTx.amount === 5000,
  'Transfer is logged in financial transaction history'
);

// 7. Earning Income
useEconomyStore.getState().earn(20000, 'Won Games Arena Friday Wager');
assert(
  useEconomyStore.getState().walletBalance === preTransferBal - 5000 + 20000,
  'earn() increases wallet balance accurately'
);

console.log(`\nEconomy Logic Tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
