import { DiffConfig, DiffResult } from '../types';

/**
 * Error thrown when an inactive item is found in an invalid state
 */
export class InactiveItemError extends Error {
  constructor(
    message: string,
    public readonly itemName: string,
    public readonly errorType: 'ALREADY_DELETED' | 'MISSING'
  ) {
    super(message);
    this.name = 'InactiveItemError';
  }
}

/**
 * Utility for identifying differences between datasets
 * Used for import/sync operations to detect inserts, updates, and deletions
 */
export class DiffIdentifier {
  /**
   * Compares two datasets and identifies inserts and updates
   * @param newItems - Map of new items keyed by identifier
   * @param existingItems - Array of existing items
   * @param config - Configuration for comparison
   * @returns DiffResult containing inserts, updates, and processed IDs
   */
  public static identifyChanges<T extends Record<string, unknown>>(
    newItems: Map<string, T> | Record<string, T>,
    existingItems: T[],
    config: DiffConfig<T>
  ): DiffResult<T> {
    const { idField, nameField, isDeletedField, ignoreFields = [] } = config;

    // Build existing items map
    const existingMap = new Map<string, T>();
    for (const item of existingItems) {
      const name = String(item[nameField]);
      existingMap.set(name, item);
    }

    const updates: Array<{ oldItem: T; newItem: T }> = [];
    const inserts: T[] = [];
    const processedIds = new Set<string>();

    // Convert to iterable
    const newItemsIterable =
      newItems instanceof Map ? newItems.values() : Object.values(newItems);

    for (const item of newItemsIterable) {
      const name = item[nameField];
      if (!name) {
        console.warn('Item missing name field, skipping:', item);
        continue;
      }

      const nameStr = String(name);

      if (existingMap.has(nameStr)) {
        const oldItem = existingMap.get(nameStr)!;

        // Check for resurrection of deleted items
        if (isDeletedField && !item[isDeletedField] && oldItem[isDeletedField]) {
          throw new InactiveItemError(
            `Cannot resurrect deleted item: ${nameStr}`,
            nameStr,
            'ALREADY_DELETED'
          );
        }

        // Check if there are actual changes
        if (!this.deepEqual(oldItem, item, ignoreFields as string[])) {
          updates.push({ oldItem, newItem: item });
        }
      } else {
        inserts.push(item);
      }

      processedIds.add(String(item[idField]));
    }

    return { inserts, updates, processedIds };
  }

  /**
   * Identifies items that exist in the old dataset but not in the new one
   * @param existingItems - Array of existing items
   * @param processedIds - Set of IDs that were processed
   * @param config - Configuration for comparison
   * @param options - Options for handling missing items
   * @returns Array of inactive item names
   */
  public static identifyInactive<T extends Record<string, unknown>>(
    existingItems: T[],
    processedIds: Set<string>,
    config: DiffConfig<T>,
    options: { throwOnMissing?: boolean } = { throwOnMissing: true }
  ): Array<{ name: string }> {
    const { idField, nameField, isDeletedField } = config;
    const inactive: Array<{ name: string }> = [];

    for (const item of existingItems) {
      const id = String(item[idField]).trim();

      if (!processedIds.has(id)) {
        const name = String(item[nameField]);

        // If item was already deleted, it's expected to be missing
        if (isDeletedField && item[isDeletedField]) {
          inactive.push({ name });
        } else if (options.throwOnMissing) {
          // Item exists in database but not in import - this is an error
          throw new InactiveItemError(
            `Item missing from import: ${name}`,
            name,
            'MISSING'
          );
        } else {
          inactive.push({ name });
        }
      }
    }

    return inactive;
  }

  /**
   * Deep equality comparison with field exclusion
   */
  private static deepEqual(
    obj1: unknown,
    obj2: unknown,
    ignoreFields: string[] = []
  ): boolean {
    if (obj1 === obj2) return true;

    if (
      typeof obj1 !== 'object' ||
      typeof obj2 !== 'object' ||
      obj1 === null ||
      obj2 === null
    ) {
      return false;
    }

    const keys1 = Object.keys(obj1 as object).filter(
      (k) => !ignoreFields.includes(k)
    );
    const keys2 = Object.keys(obj2 as object).filter(
      (k) => !ignoreFields.includes(k)
    );

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (
        !keys2.includes(key) ||
        !this.deepEqual(
          (obj1 as Record<string, unknown>)[key],
          (obj2 as Record<string, unknown>)[key],
          ignoreFields
        )
      ) {
        return false;
      }
    }

    return true;
  }
}
