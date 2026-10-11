import { useEffect } from 'react';
import { InfiniteWorld } from './InfiniteWorld';
import { VehicleVisualModel } from './VehicleModels';
import { useVehicleStore } from '../world/vehicleStore';

export { VehicleVisualModel };

export function StreetEnvironment() {
  const spawnVehicle = useVehicleStore((s) => s.spawnVehicle);

  // Initialize estate starter vehicles at BBNaija South Gate on Admiralty Way
  useEffect(() => {
    spawnVehicle('okada_01', 'bike', [-12.0, 31.0, 0], Math.PI / 4);
    spawnVehicle('keke_01', 'keke_napep', [-4.0, 31.0, 0], 0);
    spawnVehicle('innoson_01', 'car', [8.0, 31.0, 0], -Math.PI / 12);
    spawnVehicle('danfo_01', 'danfo_bus', [20.0, 31.0, 0], 0);
  }, [spawnVehicle]);

  return <InfiniteWorld />;
}
