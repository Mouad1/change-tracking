import { describe, it, expect } from 'vitest';
import { DiffIdentifier, InactiveItemError } from '../src';

interface TestItem {
  id: string;
  name: string;
  value: number;
  isDeleted?: boolean;
}

const config = {
  idField: 'id' as const,
  nameField: 'name' as const,
  isDeletedField: 'isDeleted' as const,
  ignoreFields: [] as (keyof TestItem)[],
};

describe('DiffIdentifier', () => {
  describe('identifyChanges', () => {
    it('should identify inserts', () => {
      const existing: TestItem[] = [
        { id: '1', name: 'Item 1', value: 10 },
      ];
      const newItems = new Map<string, TestItem>([
        ['Item 1', { id: '1', name: 'Item 1', value: 10 }],
        ['Item 2', { id: '2', name: 'Item 2', value: 20 }],
      ]);

      const result = DiffIdentifier.identifyChanges(newItems, existing, config);

      expect(result.inserts).toHaveLength(1);
      expect(result.inserts[0].name).toBe('Item 2');
      expect(result.updates).toHaveLength(0);
    });

    it('should identify updates', () => {
      const existing: TestItem[] = [
        { id: '1', name: 'Item 1', value: 10 },
      ];
      const newItems = new Map<string, TestItem>([
        ['Item 1', { id: '1', name: 'Item 1', value: 20 }],
      ]);

      const result = DiffIdentifier.identifyChanges(newItems, existing, config);

      expect(result.updates).toHaveLength(1);
      expect(result.updates[0].oldItem.value).toBe(10);
      expect(result.updates[0].newItem.value).toBe(20);
      expect(result.inserts).toHaveLength(0);
    });

    it('should not flag unchanged items as updates', () => {
      const existing: TestItem[] = [
        { id: '1', name: 'Item 1', value: 10 },
      ];
      const newItems = new Map<string, TestItem>([
        ['Item 1', { id: '1', name: 'Item 1', value: 10 }],
      ]);

      const result = DiffIdentifier.identifyChanges(newItems, existing, config);

      expect(result.updates).toHaveLength(0);
      expect(result.inserts).toHaveLength(0);
    });

    it('should work with object input instead of Map', () => {
      const existing: TestItem[] = [];
      const newItems: Record<string, TestItem> = {
        item1: { id: '1', name: 'Item 1', value: 10 },
      };

      const result = DiffIdentifier.identifyChanges(newItems, existing, config);

      expect(result.inserts).toHaveLength(1);
    });

    it('should throw when trying to resurrect deleted item', () => {
      const existing: TestItem[] = [
        { id: '1', name: 'Item 1', value: 10, isDeleted: true },
      ];
      const newItems = new Map<string, TestItem>([
        ['Item 1', { id: '1', name: 'Item 1', value: 10, isDeleted: false }],
      ]);

      expect(() =>
        DiffIdentifier.identifyChanges(newItems, existing, config)
      ).toThrow(InactiveItemError);
    });

    it('should track processed IDs', () => {
      const existing: TestItem[] = [];
      const newItems = new Map<string, TestItem>([
        ['Item 1', { id: '1', name: 'Item 1', value: 10 }],
        ['Item 2', { id: '2', name: 'Item 2', value: 20 }],
      ]);

      const result = DiffIdentifier.identifyChanges(newItems, existing, config);

      expect(result.processedIds.has('1')).toBe(true);
      expect(result.processedIds.has('2')).toBe(true);
    });

    it('should ignore specified fields when comparing', () => {
      const existing: TestItem[] = [
        { id: '1', name: 'Item 1', value: 10 },
      ];
      const newItems = new Map<string, TestItem>([
        ['Item 1', { id: '1', name: 'Item 1', value: 999 }],
      ]);

      const configWithIgnore = {
        ...config,
        ignoreFields: ['value' as const],
      };

      const result = DiffIdentifier.identifyChanges(
        newItems,
        existing,
        configWithIgnore
      );

      expect(result.updates).toHaveLength(0);
    });
  });

  describe('identifyInactive', () => {
    it('should identify deleted items as inactive', () => {
      const existing: TestItem[] = [
        { id: '1', name: 'Item 1', value: 10, isDeleted: true },
      ];
      const processedIds = new Set<string>();

      const result = DiffIdentifier.identifyInactive(
        existing,
        processedIds,
        config
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Item 1');
    });

    it('should throw when active item is missing from import', () => {
      const existing: TestItem[] = [
        { id: '1', name: 'Item 1', value: 10, isDeleted: false },
      ];
      const processedIds = new Set<string>();

      expect(() =>
        DiffIdentifier.identifyInactive(existing, processedIds, config)
      ).toThrow(InactiveItemError);
    });

    it('should not throw when throwOnMissing is false', () => {
      const existing: TestItem[] = [
        { id: '1', name: 'Item 1', value: 10, isDeleted: false },
      ];
      const processedIds = new Set<string>();

      const result = DiffIdentifier.identifyInactive(
        existing,
        processedIds,
        config,
        { throwOnMissing: false }
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Item 1');
    });

    it('should not flag processed items', () => {
      const existing: TestItem[] = [
        { id: '1', name: 'Item 1', value: 10 },
      ];
      const processedIds = new Set(['1']);

      const result = DiffIdentifier.identifyInactive(
        existing,
        processedIds,
        config
      );

      expect(result).toHaveLength(0);
    });
  });
});
