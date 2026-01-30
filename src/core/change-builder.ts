import {
  ChangeDescriptor,
  ChangeType,
  DocumentChange,
  PropertyType,
} from '../types';

/**
 * Builder utility for creating change descriptors
 * Provides a fluent API for constructing changes
 */
export class ChangeBuilder {
  private changes: ChangeDescriptor[] = [];

  /**
   * Creates a string property
   */
  createString(path: string, value: string): this {
    this.changes.push(
      ChangeBuilder.createStringDescriptor(path, value)
    );
    return this;
  }

  /**
   * Updates a string property
   */
  updateString(path: string, value: string): this {
    this.changes.push(
      ChangeBuilder.updateStringDescriptor(path, value)
    );
    return this;
  }

  /**
   * Creates a number property
   */
  createNumber(path: string, value: number): this {
    this.changes.push(
      ChangeBuilder.createNumberDescriptor(path, value)
    );
    return this;
  }

  /**
   * Updates a number property
   */
  updateNumber(path: string, value: number): this {
    this.changes.push(
      ChangeBuilder.updateNumberDescriptor(path, value)
    );
    return this;
  }

  /**
   * Creates an object property
   */
  createObject<T>(path: string, value: T): this {
    this.changes.push(
      ChangeBuilder.createObjectDescriptor(path, value)
    );
    return this;
  }

  /**
   * Updates an object property
   */
  updateObject<T>(path: string, value: T): this {
    this.changes.push(
      ChangeBuilder.updateObjectDescriptor(path, value)
    );
    return this;
  }

  /**
   * Deletes a property
   */
  delete(path: string): this {
    this.changes.push(ChangeBuilder.deleteDescriptor(path));
    return this;
  }

  /**
   * Builds the document change
   */
  build(options?: { id?: string; createdBy?: string }): DocumentChange {
    return {
      id: options?.id,
      changes: [...this.changes],
      createdBy: options?.createdBy,
      createdAt: new Date(),
    };
  }

  /**
   * Resets the builder for reuse
   */
  reset(): this {
    this.changes = [];
    return this;
  }

  // ============ Static Factory Methods ============

  /**
   * Creates a DocumentChange with string creation
   */
  static createStringChange(path: string, value: string): DocumentChange {
    return this.wrapChanges([this.createStringDescriptor(path, value)]);
  }

  /**
   * Creates a DocumentChange with string update
   */
  static updateStringChange(path: string, value: string): DocumentChange {
    return this.wrapChanges([this.updateStringDescriptor(path, value)]);
  }

  /**
   * Creates a DocumentChange with number creation
   */
  static createNumberChange(path: string, value: number): DocumentChange {
    return this.wrapChanges([this.createNumberDescriptor(path, value)]);
  }

  /**
   * Creates a DocumentChange with number update
   */
  static updateNumberChange(path: string, value: number): DocumentChange {
    return this.wrapChanges([this.updateNumberDescriptor(path, value)]);
  }

  /**
   * Creates a DocumentChange with object creation
   */
  static createObjectChange<T>(path: string, value: T): DocumentChange {
    return this.wrapChanges([this.createObjectDescriptor(path, value)]);
  }

  /**
   * Creates a DocumentChange with object update
   */
  static updateObjectChange<T>(path: string, value: T): DocumentChange {
    return this.wrapChanges([this.updateObjectDescriptor(path, value)]);
  }

  /**
   * Creates a DocumentChange with deletion
   */
  static deleteChange(path: string): DocumentChange {
    return this.wrapChanges([this.deleteDescriptor(path)]);
  }

  // ============ Descriptor Factory Methods ============

  static createStringDescriptor(path: string, value: string): ChangeDescriptor {
    return this.createDescriptor(ChangeType.CREATE, path, value, PropertyType.STRING);
  }

  static updateStringDescriptor(path: string, value: string): ChangeDescriptor {
    return this.createDescriptor(ChangeType.UPDATE, path, value, PropertyType.STRING);
  }

  static createNumberDescriptor(path: string, value: number): ChangeDescriptor {
    return this.createDescriptor(ChangeType.CREATE, path, String(value), PropertyType.NUMBER);
  }

  static updateNumberDescriptor(path: string, value: number): ChangeDescriptor {
    return this.createDescriptor(ChangeType.UPDATE, path, String(value), PropertyType.NUMBER);
  }

  static createObjectDescriptor<T>(path: string, value: T): ChangeDescriptor {
    return this.createDescriptor(ChangeType.CREATE, path, JSON.stringify(value), PropertyType.OBJECT);
  }

  static updateObjectDescriptor<T>(path: string, value: T): ChangeDescriptor {
    return this.createDescriptor(ChangeType.UPDATE, path, JSON.stringify(value), PropertyType.OBJECT);
  }

  static deleteDescriptor(path: string): ChangeDescriptor {
    return {
      type: ChangeType.DELETE,
      propertyPath: path,
    };
  }

  // ============ Private Helpers ============

  private static createDescriptor(
    type: ChangeType,
    path: string,
    value: string,
    valueType: PropertyType
  ): ChangeDescriptor {
    return {
      type,
      propertyPath: path,
      newValue: value,
      newValueType: valueType,
    };
  }

  private static wrapChanges(changes: ChangeDescriptor[]): DocumentChange {
    return {
      changes,
      createdAt: new Date(),
    };
  }
}
