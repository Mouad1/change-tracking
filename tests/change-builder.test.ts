import { describe, it, expect } from 'vitest';
import { ChangeBuilder, ChangeType, PropertyType } from '../src';

describe('ChangeBuilder', () => {
  describe('fluent API', () => {
    it('should build multiple changes', () => {
      const change = new ChangeBuilder()
        .createString('name', 'John')
        .createNumber('age', 25)
        .createObject('address', { city: 'Paris' })
        .build();

      expect(change.changes).toHaveLength(3);
      expect(change.changes[0]).toEqual({
        type: ChangeType.CREATE,
        propertyPath: 'name',
        newValue: 'John',
        newValueType: PropertyType.STRING,
      });
      expect(change.changes[1]).toEqual({
        type: ChangeType.CREATE,
        propertyPath: 'age',
        newValue: '25',
        newValueType: PropertyType.NUMBER,
      });
      expect(change.changes[2]).toEqual({
        type: ChangeType.CREATE,
        propertyPath: 'address',
        newValue: '{"city":"Paris"}',
        newValueType: PropertyType.OBJECT,
      });
    });

    it('should support chaining with reset', () => {
      const builder = new ChangeBuilder();

      const change1 = builder.createString('a', '1').build();
      builder.reset();
      const change2 = builder.createString('b', '2').build();

      expect(change1.changes).toHaveLength(1);
      expect(change1.changes[0].propertyPath).toBe('a');
      expect(change2.changes).toHaveLength(1);
      expect(change2.changes[0].propertyPath).toBe('b');
    });

    it('should include metadata in build', () => {
      const change = new ChangeBuilder()
        .createString('name', 'John')
        .build({ id: '123', createdBy: 'user1' });

      expect(change.id).toBe('123');
      expect(change.createdBy).toBe('user1');
      expect(change.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('static factory methods', () => {
    it('should create string change', () => {
      const change = ChangeBuilder.createStringChange('name', 'John');

      expect(change.changes).toHaveLength(1);
      expect(change.changes[0].type).toBe(ChangeType.CREATE);
      expect(change.changes[0].newValue).toBe('John');
      expect(change.changes[0].newValueType).toBe(PropertyType.STRING);
    });

    it('should update string change', () => {
      const change = ChangeBuilder.updateStringChange('name', 'Jane');

      expect(change.changes[0].type).toBe(ChangeType.UPDATE);
    });

    it('should create number change', () => {
      const change = ChangeBuilder.createNumberChange('count', 42);

      expect(change.changes[0].newValue).toBe('42');
      expect(change.changes[0].newValueType).toBe(PropertyType.NUMBER);
    });

    it('should create object change', () => {
      const obj = { nested: { value: 1 } };
      const change = ChangeBuilder.createObjectChange('data', obj);

      expect(change.changes[0].newValue).toBe(JSON.stringify(obj));
      expect(change.changes[0].newValueType).toBe(PropertyType.OBJECT);
    });

    it('should create delete change', () => {
      const change = ChangeBuilder.deleteChange('name');

      expect(change.changes[0].type).toBe(ChangeType.DELETE);
      expect(change.changes[0].newValue).toBeUndefined();
      expect(change.changes[0].newValueType).toBeUndefined();
    });
  });

  describe('descriptor methods', () => {
    it('should create update descriptors', () => {
      const desc = ChangeBuilder.updateStringDescriptor('name', 'John');

      expect(desc.type).toBe(ChangeType.UPDATE);
      expect(desc.propertyPath).toBe('name');
      expect(desc.newValue).toBe('John');
    });

    it('should create delete descriptor', () => {
      const desc = ChangeBuilder.deleteDescriptor('name');

      expect(desc.type).toBe(ChangeType.DELETE);
      expect(desc.propertyPath).toBe('name');
      expect(desc.newValue).toBeUndefined();
    });
  });
});
