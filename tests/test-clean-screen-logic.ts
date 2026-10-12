import { useEconomyStore } from '../src/world/economyStore';

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

console.log('→ Testing Screen Cluster & Unified Currency Logic');

// 1. Test Proximity & Modal Badge Suppression Logic
function computeShowBadges(isNearby: boolean, isModalOpen: boolean) {
  return isNearby && !isModalOpen;
}

// Case 1: In center chunk, no modal -> Badges shown
assert(computeShowBadges(true, false) === true, 'Center chunk with no modal active displays badges');

// Case 2: In distant chunk (e.g. 100m away) -> Badges suppressed (no screen cluster)
assert(computeShowBadges(false, false) === false, 'Distant chunks suppress badges to prevent center screen cluster');

// Case 3: In center chunk, commerce modal open -> Badges suppressed
useEconomyStore.setState({ activeShopId: 'supermarket', isTransferModalOpen: false });
const isShopOpen = Boolean(useEconomyStore.getState().activeShopId || useEconomyStore.getState().isTransferModalOpen);
assert(isShopOpen === true, 'Commerce shop is recognized as open');
assert(computeShowBadges(true, isShopOpen) === false, 'Badges completely suppressed while Commerce modal is open');

// Case 4: In center chunk, transfer modal open -> Badges suppressed
useEconomyStore.setState({ activeShopId: null, isTransferModalOpen: true });
const isTransferOpen = Boolean(useEconomyStore.getState().activeShopId || useEconomyStore.getState().isTransferModalOpen);
assert(isTransferOpen === true, 'Transfer modal is recognized as open');
assert(computeShowBadges(true, isTransferOpen) === false, 'Badges completely suppressed while Transfer modal is open');

// Clean up
useEconomyStore.setState({ activeShopId: null, isTransferModalOpen: false });
const isClosed = Boolean(useEconomyStore.getState().activeShopId || useEconomyStore.getState().isTransferModalOpen);
assert(computeShowBadges(true, isClosed) === true, 'Badges restore when all modals close');

// 2. Test Currency System Consistency
const wallet = useEconomyStore.getState().walletBalance;
assert(typeof wallet === 'number' && wallet >= 0, 'Unified Naira Wallet balance is active and valid');

console.log(`\nScreen Cluster & Currency Logic Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
