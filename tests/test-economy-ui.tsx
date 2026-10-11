import React from 'react';
import { renderToString } from 'react-dom/server';
import { WalletHUD } from '../src/components/WalletHUD';
import { CommerceModal } from '../src/components/CommerceModal';
import { TransferModal } from '../src/components/TransferModal';
import { useEconomyStore } from '../src/world/economyStore';
import { COMMERCE_CATALOG } from '../src/data/commerceCatalog';
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

console.log('→ Testing Virtual Currency & Commerce UI Components');

// Initialize Mock Game State
useGame.setState({
  state: {
    phase: 'daily',
    day: 1,
    week: 1,
    gameOver: false,
    onboardingDone: true,
    phaseDone: false,
    player: {
      id: 'player_1',
      name: 'Ebuka Obi',
      nickname: 'Ebuka',
      gender: 'male',
      age: 28,
      avatar: '👑',
      accentColor: '#3b82f6',
      energy: 90,
      sanity: 85,
      hunger: 60,
      fanbaseClout: 15000,
      bbCoins: 50000,
      relationships: { npc_mercy: 35 },
    },
    housemates: [
      {
        id: 'npc_mercy',
        name: 'Mercy Eke',
        nickname: 'Lambo',
        avatar: '💎',
        status: 'active',
        relationships: { player_1: 35 },
      },
    ],
  } as any,
});

// 1. WalletHUD Rendering
const econ = useEconomyStore.getState();
econ.resetEconomy();

const hudHtml = renderToString(<WalletHUD />);
assert(hudHtml.includes('₦50,000'), 'WalletHUD displays formatted ₦50,000 currency balance');
assert(hudHtml.includes('Send ₦'), 'WalletHUD displays quick send / spray money button');
assert(hudHtml.includes('Wallet'), 'WalletHUD displays Wallet descriptor label');

// 2. CommerceModal Rendering (Catalog & Establishments)
econ.openShop('supermarket');
const shopHtml = renderToString(<CommerceModal />);

assert(shopHtml.includes('Gas Station'), 'CommerceModal renders Gas Station tab');
assert(shopHtml.includes('Supermarket'), 'CommerceModal renders Supermarket tab');
assert(shopHtml.includes('Suya &amp; Food') || shopHtml.includes('Suya & Food'), 'CommerceModal renders Restaurant/Suya tab');
assert(shopHtml.includes('Bar &amp; Club') || shopHtml.includes('Bar & Club'), 'CommerceModal renders Bar & Nightclub tab');
assert(shopHtml.includes('Activities'), 'CommerceModal renders Activities tab');
assert(shopHtml.includes('Inventory'), 'CommerceModal renders Inventory tab');
assert(shopHtml.includes('History'), 'CommerceModal renders History tab');

// Verify Items in Catalog view
assert(shopHtml.includes('Fearless Energy Drink'), 'CommerceModal lists Fearless Energy Drink');
assert(shopHtml.includes('Designer Sunglasses'), 'CommerceModal lists Designer Sunglasses');
assert(shopHtml.includes('Buy Now'), 'CommerceModal renders Buy Now action buttons');

// 3. CommerceModal with Inventory & Use Item
const sampleItem = COMMERCE_CATALOG[0];
econ.buyItem(sampleItem);
const populatedHtml = renderToString(<CommerceModal />);
assert(populatedHtml.includes('₦'), 'CommerceModal reflects updated wallet balance after purchase');

// 4. TransferModal Rendering
econ.openTransferModal();
const transferHtml = renderToString(<TransferModal />);

assert(transferHtml.includes('Send Money to Housemate'), 'TransferModal renders header title');
assert(transferHtml.includes('Lambo'), 'TransferModal lists active housemate recipient (Lambo)');
assert(transferHtml.includes('1,000') && transferHtml.includes('5,000'), 'TransferModal renders preset amount chips');
assert(transferHtml.includes('Spraying you money at the Saturday Party'), 'TransferModal renders party spraying memo option');
assert(transferHtml.includes('Relationship Affinity Boost'), 'TransferModal displays affinity preview');

console.log(`\nEconomy UI Tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
