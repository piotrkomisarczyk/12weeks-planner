/**
 * Position Utilities
 * 
 * Helper functions for managing task positions using a single-field strategy.
 * Position is encoded as: weekOrder * 100 + dayRank
 * - weekOrder: Position within week view (1, 2, 3... → 100, 200, 300...)
 * - dayRank: Position within day/slot (1-99)
 * 
 * This allows:
 * - Week view to maintain block order of goals/sections
 * - Day view to reorder tasks within a day without affecting week order
 * - Both views to coexist without conflicts
 */

/**
 * Encode position from week order and day rank
 * @param weekOrder - Position in week view (e.g., 1, 2, 3)
 * @param dayRank - Position within day/slot (1-99)
 * @returns Encoded position value
 */
export function encodePosition(weekOrder: number, dayRank: number): number {
  return weekOrder * 100 + dayRank;
}

/**
 * Decode position into week order and day rank
 * @param position - Encoded position value
 * @returns Object with weekOrder and dayRank
 */
export function decodePosition(position: number): { weekOrder: number; dayRank: number } {
  const weekOrder = Math.floor(position / 100);
  const dayRank = position % 100;
  return { weekOrder, dayRank };
}

/**
 * Extract week order from position
 * @param position - Encoded position value
 * @returns Week order component
 */
export function getWeekOrder(position: number): number {
  return Math.floor(position / 100);
}

/**
 * Extract day rank from position
 * @param position - Encoded position value
 * @returns Day rank component
 */
export function getDayRank(position: number): number {
  return position % 100;
}

/**
 * Update only the day rank component of a position, keeping week order intact
 * Useful for reordering tasks within a day without affecting week view order
 * @param position - Current encoded position
 * @param newDayRank - New day rank (1-99)
 * @returns Updated position with new day rank
 */
export function updateDayRank(position: number, newDayRank: number): number {
  const weekOrder = getWeekOrder(position);
  return encodePosition(weekOrder, newDayRank);
}

/**
 * Update only the week order component of a position, resetting day rank to default
 * Useful for reordering in week view
 * @param position - Current encoded position
 * @param newWeekOrder - New week order
 * @param defaultDayRank - Default day rank to use (default: 1)
 * @returns Updated position with new week order
 */
export function updateWeekOrder(
  position: number, 
  newWeekOrder: number, 
  defaultDayRank: number = 1
): number {
  return encodePosition(newWeekOrder, defaultDayRank);
}

/**
 * Generate positions for a list of items in week view
 * Sets weekOrder to index * 100, dayRank to current day rank or 1
 * @param items - Array of items with position field
 * @returns Array of items with updated positions
 */
export function generateWeekViewPositions<T extends { position: number }>(
  items: T[]
): Array<T & { position: number }> {
  return items.map((item, index) => ({
    ...item,
    position: encodePosition(index + 1, getDayRank(item.position) || 1),
  }));
}

/**
 * Generate positions for a list of items in day view
 * Preserves weekOrder, updates dayRank sequentially
 * @param items - Array of items with position field
 * @returns Array of items with updated positions
 */
export function generateDayViewPositions<T extends { position: number }>(
  items: T[]
): Array<T & { position: number }> {
  // Get the week order from the first item (all should be same day)
  const weekOrder = items.length > 0 ? getWeekOrder(items[0].position) : 1;
  
  return items.map((item, index) => ({
    ...item,
    position: encodePosition(weekOrder, index + 1),
  }));
}

/**
 * Normalize positions to prevent overflow and maintain proper spacing
 * Reindexes positions while maintaining relative order
 * @param items - Array of items with position field
 * @param preserveWeekOrder - If true, preserves week order blocks
 * @returns Array of items with normalized positions
 */
export function normalizePositions<T extends { position: number }>(
  items: T[],
  preserveWeekOrder: boolean = true
): Array<T & { position: number }> {
  if (items.length === 0) return [];

  // Sort by current position
  const sorted = [...items].sort((a, b) => a.position - b.position);

  if (preserveWeekOrder) {
    // Group by week order
    const grouped = new Map<number, T[]>();
    sorted.forEach((item) => {
      const weekOrder = getWeekOrder(item.position);
      const group = grouped.get(weekOrder) || [];
      group.push(item);
      grouped.set(weekOrder, group);
    });

    // Normalize each group
    let result: Array<T & { position: number }> = [];
    let currentWeekOrder = 1;

    Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([_, group]) => {
        const normalized = group.map((item, index) => ({
          ...item,
          position: encodePosition(currentWeekOrder, index + 1),
        }));
        result = result.concat(normalized);
        currentWeekOrder++;
      });

    return result;
  } else {
    // Simple sequential normalization
    return sorted.map((item, index) => ({
      ...item,
      position: encodePosition(index + 1, 1),
    }));
  }
}

/**
 * Check if positions need normalization (e.g., approaching integer overflow)
 * @param positions - Array of position values
 * @param threshold - Maximum safe position value (default: 1000000)
 * @returns True if normalization is recommended
 */
export function shouldNormalizePositions(
  positions: number[], 
  threshold: number = 1000000
): boolean {
  if (positions.length === 0) return false;
  const maxPosition = Math.max(...positions);
  return maxPosition > threshold;
}

/**
 * Sort items by position for display
 * @param items - Array of items with position field
 * @returns Sorted array
 */
export function sortByPosition<T extends { position: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.position - b.position);
}

