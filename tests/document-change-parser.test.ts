import { describe, it, expect } from 'vitest';
import {
  DocumentChangeParser,
  ChangeBuilder,
  ChangeType,
  PropertyType,
  InvalidPathError,
} from '../src';

describe('DocumentChangeParser', () => {
  describe('applyChanges', () => {
    it('should apply string creation', () => {
      const obj = {};
      const changes = [ChangeBuilder.createStringChange('name', 'John')];

      const result = DocumentChangeParser.applyChanges(obj, changes);

      expect(result).toEqual({ name: 'John' });
    });

    it('should apply string update', () => {
      const obj = { name: 'John' };
      const changes = [ChangeBuilder.updateStringChange('name', 'Jane')];

      const result = DocumentChangeParser.applyChanges(obj, changes);

      expect(result).toEqual({ name: 'Jane' });
    });

    it('should apply number creation', () => {
      const obj = {};
      const changes = [ChangeBuilder.createNumberChange('age', 25)];

      const result = DocumentChangeParser.applyChanges(obj, changes);

      expect(result).toEqual({ age: 25 });
    });

    it('should apply object creation', () => {
      const obj = {};
      const address = { city: 'Paris', country: 'France' };
      const changes = [ChangeBuilder.createObjectChange('address', address)];

      const result = DocumentChangeParser.applyChanges(obj, changes);

      expect(result).toEqual({ address });
    });

    it('should apply deletion', () => {
      const obj = { name: 'John', age: 25 };
      const changes = [ChangeBuilder.deleteChange('age')];

      const result = DocumentChangeParser.applyChanges(obj, changes);

      expect(result).toEqual({ name: 'John' });
    });

    it('should apply nested property changes', () => {
      const obj = { user: { profile: { name: 'John' } } };
      const changes = [
        ChangeBuilder.updateStringChange('user.profile.name', 'Jane'),
      ];

      const result = DocumentChangeParser.applyChanges(obj, changes);

      expect(result).toEqual({ user: { profile: { name: 'Jane' } } });
    });

    it('should apply multiple changes in sequence', () => {
      const obj = { name: 'John' };
      const changes = [
        ChangeBuilder.updateStringChange('name', 'Jane'),
        ChangeBuilder.createNumberChange('age', 30),
        ChangeBuilder.createObjectChange('address', { city: 'Paris' }),
      ];

      const result = DocumentChangeParser.applyChanges(obj, changes);

      expect(result).toEqual({
        name: 'Jane',
        age: 30,
        address: { city: 'Paris' },
      });
    });
  });

  describe('getCopyWithChanges', () => {
    it('should not modify original object', () => {
      const original = { name: 'John' };
      const changes = [ChangeBuilder.updateStringChange('name', 'Jane')];

      const result = DocumentChangeParser.getCopyWithChanges(original, changes);

      expect(original).toEqual({ name: 'John' });
      expect(result).toEqual({ name: 'Jane' });
    });
  });

  describe('array operations with @ notation', () => {
    it('should insert at array index', () => {
      const obj = { items: ['a', 'b', 'c'] };
      const change = {
        changes: [
          {
            type: ChangeType.CREATE,
            propertyPath: 'items@1',
            newValue: 'x',
            newValueType: PropertyType.STRING,
          },
        ],
      };

      const result = DocumentChangeParser.applyChange(obj, change);

      expect(result.items).toEqual(['a', 'x', 'b', 'c']);
    });

    it('should update at array index', () => {
      const obj = { items: ['a', 'b', 'c'] };
      const change = {
        changes: [
          {
            type: ChangeType.UPDATE,
            propertyPath: 'items@1',
            newValue: 'x',
            newValueType: PropertyType.STRING,
          },
        ],
      };

      const result = DocumentChangeParser.applyChange(obj, change);

      expect(result.items).toEqual(['a', 'x', 'c']);
    });

    it('should delete at array index', () => {
      const obj = { items: ['a', 'b', 'c'] };
      const change = {
        changes: [
          {
            type: ChangeType.DELETE,
            propertyPath: 'items@1',
          },
        ],
      };

      const result = DocumentChangeParser.applyChange(obj, change);

      expect(result.items).toEqual(['a', 'c']);
    });

    it('should append when index is -1', () => {
      const obj = { items: ['a', 'b'] };
      const change = {
        changes: [
          {
            type: ChangeType.CREATE,
            propertyPath: 'items@-1',
            newValue: 'c',
            newValueType: PropertyType.STRING,
          },
        ],
      };

      const result = DocumentChangeParser.applyChange(obj, change);

      expect(result.items).toEqual(['a', 'b', 'c']);
    });
  });

  describe('path validation', () => {
    it('should accept valid paths', () => {
      expect(DocumentChangeParser.isValidPropertyPath('name')).toBe(true);
      expect(DocumentChangeParser.isValidPropertyPath('user.name')).toBe(true);
      expect(DocumentChangeParser.isValidPropertyPath('items[0]')).toBe(true);
      expect(DocumentChangeParser.isValidPropertyPath('items[0].name')).toBe(true);
      expect(DocumentChangeParser.isValidPropertyPath('items@0')).toBe(true);
      expect(DocumentChangeParser.isValidPropertyPath('user.items@0')).toBe(true);
    });

    it('should reject invalid paths', () => {
      expect(DocumentChangeParser.isValidPropertyPath('')).toBe(false);
      expect(DocumentChangeParser.isValidPropertyPath('123')).toBe(false);
      expect(DocumentChangeParser.isValidPropertyPath('.name')).toBe(false);
      expect(DocumentChangeParser.isValidPropertyPath('name.')).toBe(false);
    });

    it('should throw on invalid path when validation enabled', () => {
      const obj = {};
      const change = {
        changes: [
          {
            type: ChangeType.CREATE,
            propertyPath: '.invalid',
            newValue: 'test',
            newValueType: PropertyType.STRING,
          },
        ],
      };

      expect(() =>
        DocumentChangeParser.applyChange(obj, change, { validatePaths: true })
      ).toThrow(InvalidPathError);
    });
  });
});
