import {
  type Coordinate3D,
  type BoundingBox3D,
  type StreetDef,
  type BuildingDef,
  type RoomDef,
  check3DOverlap,
} from './types';

export class SpatialRegistry {
  private streets = new Map<string, StreetDef>();
  private buildings = new Map<string, BuildingDef>();
  private rooms = new Map<string, RoomDef>();

  /**
   * Register a street or road corridor.
   * Throws an error if the street intersects an existing street or building in 3D space.
   */
  public registerStreet(street: StreetDef): void {
    if (this.streets.has(street.id)) {
      throw new Error(`Street "${street.id}" is already registered`);
    }

    // 1. Verify no overlap with existing streets in 3D
    for (const existing of this.streets.values()) {
      if (check3DOverlap(street.bounds, existing.bounds)) {
        throw new Error(
          `Spatial conflict: Street "${street.name}" (${street.id}) overlaps with Street "${existing.name}" (${existing.id}) in 3D space`
        );
      }
    }

    // 2. Verify no overlap with existing buildings in 3D
    for (const existing of this.buildings.values()) {
      if (check3DOverlap(street.bounds, existing.bounds)) {
        throw new Error(
          `Spatial conflict: Street "${street.name}" (${street.id}) overlaps with Building "${existing.name}" (${existing.id}) in 3D space`
        );
      }
    }

    this.streets.set(street.id, street);
  }

  /**
   * Register a building or physical compound.
   * Throws an error if the building intersects an existing building or street in 3D space.
   */
  public registerBuilding(building: BuildingDef): void {
    if (this.buildings.has(building.id)) {
      throw new Error(`Building "${building.id}" is already registered`);
    }

    // 1. Verify no overlap with existing buildings in 3D
    for (const existing of this.buildings.values()) {
      if (check3DOverlap(building.bounds, existing.bounds)) {
        throw new Error(
          `Spatial conflict: Building "${building.name}" (${building.id}) overlaps with Building "${existing.name}" (${existing.id}) in 3D space`
        );
      }
    }

    // 2. Verify no overlap with existing streets in 3D
    for (const existing of this.streets.values()) {
      if (check3DOverlap(building.bounds, existing.bounds)) {
        throw new Error(
          `Spatial conflict: Building "${building.name}" (${building.id}) overlaps with Street "${existing.name}" (${existing.id}) in 3D space`
        );
      }
    }

    this.buildings.set(building.id, building);
  }

  /**
   * Register an interior room or sub-area inside a building.
   * Throws an error if the parent building does not exist or if the room intersects a sibling room.
   */
  public registerRoom(room: RoomDef): void {
    if (this.rooms.has(room.id)) {
      throw new Error(`Room "${room.id}" is already registered`);
    }

    const parentBuilding = this.buildings.get(room.buildingId);
    if (!parentBuilding) {
      throw new Error(
        `Cannot register room "${room.name}" (${room.id}): Parent building "${room.buildingId}" does not exist`
      );
    }

    // Verify room fits inside building bounding box (with 0.5m tolerance for exterior margins)
    const b = parentBuilding.bounds;
    const r = room.bounds;
    const isInsideBuilding =
      r.min[0] >= b.min[0] - 0.5 &&
      r.max[0] <= b.max[0] + 0.5 &&
      r.min[1] >= b.min[1] - 0.5 &&
      r.max[1] <= b.max[1] + 0.5 &&
      r.min[2] >= b.min[2] - 0.5 &&
      r.max[2] <= b.max[2] + 0.5;

    if (!isInsideBuilding) {
      throw new Error(
        `Spatial error: Room "${room.name}" (${room.id}) extends outside the 3D envelope of building "${parentBuilding.name}"`
      );
    }

    // Verify no overlap with sibling rooms in the same building
    for (const existing of this.rooms.values()) {
      if (existing.buildingId === room.buildingId) {
        if (check3DOverlap(room.bounds, existing.bounds)) {
          throw new Error(
            `Spatial conflict: Room "${room.name}" (${room.id}) overlaps with sibling Room "${existing.name}" (${existing.id}) inside building "${parentBuilding.name}"`
          );
        }
      }
    }

    this.rooms.set(room.id, room);
  }

  public getStreet(id: string): StreetDef | undefined {
    return this.streets.get(id);
  }

  public getBuilding(id: string): BuildingDef | undefined {
    return this.buildings.get(id);
  }

  public getRoom(id: string): RoomDef | undefined {
    return this.rooms.get(id);
  }

  public listStreets(): StreetDef[] {
    return Array.from(this.streets.values());
  }

  public listBuildings(): BuildingDef[] {
    return Array.from(this.buildings.values());
  }

  public listRooms(): RoomDef[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Find what street, building, or room contains the given 3D coordinates.
   */
  public findAtPosition(pos: Coordinate3D): {
    street?: StreetDef;
    building?: BuildingDef;
    room?: RoomDef;
  } {
    const isInside = (b: BoundingBox3D) =>
      pos[0] >= b.min[0] &&
      pos[0] <= b.max[0] &&
      pos[1] >= b.min[1] &&
      pos[1] <= b.max[1] &&
      pos[2] >= b.min[2] &&
      pos[2] <= b.max[2];

    let foundRoom: RoomDef | undefined;
    for (const room of this.rooms.values()) {
      if (isInside(room.bounds)) {
        foundRoom = room;
        break;
      }
    }

    let foundBuilding: BuildingDef | undefined;
    for (const building of this.buildings.values()) {
      if (isInside(building.bounds)) {
        foundBuilding = building;
        break;
      }
    }

    let foundStreet: StreetDef | undefined;
    for (const street of this.streets.values()) {
      if (isInside(street.bounds)) {
        foundStreet = street;
        break;
      }
    }

    return {
      street: foundStreet,
      building: foundBuilding,
      room: foundRoom,
    };
  }

  /**
   * Clear all registered entities (used for testing or resetting world state).
   */
  public clear(): void {
    this.rooms.clear();
    this.buildings.clear();
    this.streets.clear();
  }
}

export const spatialRegistry = new SpatialRegistry();
