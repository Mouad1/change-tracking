import {
  ChangeDescriptor,
  ChangeType,
  DocumentChange,
  InvalidPathError,
  PropertyType,
  ApplyChangesOptions,
} from '../types';
import { ObjectManipulator } from '../utils/object-manipulator';

/**
 * Regex for validating property paths
 * Supports:
 * - Simple properties: `name`
 * - Nested properties: `user.address.city`
 * - Array access: `items[0].name`
 * - Array mutation notation: `items@0`
 */
const VALID_IDENTIFIER = '([a-zA-Z_$][0-9a-zA-Z_$]*)(\\[\\d+\\])?';
export const PROPERTY_PATH_REGEX = new RegExp(
  `^(${VALID_IDENTIFIER})(\\.${VALID_IDENTIFIER})*(@-?\\d+)?$`
);

/**
 * Parser for applying tracked changes to objects
 * Implements event-sourcing pattern for state reconstruction
 */
export class DocumentChangeParser {
  /**
   * Creates a deep copy of the object and applies all changes
   * @param obj - Original object
   * @param documentChanges - Array of document changes to apply
   * @param options - Apply options
   * @returns New object with changes applied
   */
  public static getCopyWithChanges<T extends object>(
    obj: T,
    documentChanges: DocumentChange[],
    options?: ApplyChangesOptions
  ): T {
    const copy = structuredClone(obj);
    return this.applyChanges(copy, documentChanges, options);
  }

  /**
   * Applies all document changes to an object (mutates in place)
   * @param obj - Object to modify
   * @param documentChanges - Array of document changes to apply
   * @param options - Apply options
   * @returns Modified object
   */
  public static applyChanges<T extends object>(
    obj: T,
    documentChanges: DocumentChange[],
    options?: ApplyChangesOptions
  ): T {
    for (const documentChange of documentChanges) {
      this.applyChange(obj, documentChange, options);
    }
    return obj;
  }

  /**
   * Creates a deep copy of the object and applies a single change
   * @param obj - Original object
   * @param documentChange - Document change to apply
   * @param options - Apply options
   * @returns New object with change applied
   */
  public static getCopyWithChange<T extends object>(
    obj: T,
    documentChange: DocumentChange,
    options?: ApplyChangesOptions
  ): T {
    const copy = structuredClone(obj);
    return this.applyChange(copy, documentChange, options);
  }

  /**
   * Applies a single document change to an object (mutates in place)
   * @param obj - Object to modify
   * @param documentChange - Document change to apply
   * @param options - Apply options
   * @returns Modified object
   */
  public static applyChange<T extends object>(
    obj: T,
    documentChange: DocumentChange,
    options: ApplyChangesOptions = { validatePaths: true }
  ): T {
    for (const change of documentChange.changes) {
      this.applyFieldChange(obj, change, options);
    }
    return obj;
  }

  /**
   * Applies a single field-level change
   */
  private static applyFieldChange<T extends object>(
    obj: T,
    change: ChangeDescriptor,
    options: ApplyChangesOptions
  ): void {
    const { propertyPath, type, newValue, newValueType } = change;

    if (options.validatePaths && !this.isValidPropertyPath(propertyPath)) {
      throw new InvalidPathError(propertyPath);
    }

    let parsedValue: unknown = null;
    if (type === ChangeType.CREATE || type === ChangeType.UPDATE) {
      if (newValue === undefined || newValueType === undefined) {
        throw new Error(
          `newValue and newValueType are required for ${type} operations`
        );
      }
      parsedValue = this.parseValue(newValue, newValueType);
    }

    if (this.isArrayChange(propertyPath)) {
      this.applyArrayChange(obj, propertyPath, type, parsedValue);
    } else {
      this.applyPropertyChange(obj, propertyPath, type, parsedValue);
    }
  }

  /**
   * Applies a change to an array element using @ notation
   */
  private static applyArrayChange<T extends object>(
    obj: T,
    path: string,
    type: ChangeType,
    value: unknown
  ): void {
    switch (type) {
      case ChangeType.CREATE:
        ObjectManipulator.insertAtIndex(obj, path, value);
        break;
      case ChangeType.UPDATE:
        ObjectManipulator.setValueAtIndex(obj, path, value);
        break;
      case ChangeType.DELETE:
        ObjectManipulator.removeAtIndex(obj, path);
        break;
    }
  }

  /**
   * Applies a change to a regular property
   */
  private static applyPropertyChange<T extends object>(
    obj: T,
    path: string,
    type: ChangeType,
    value: unknown
  ): void {
    switch (type) {
      case ChangeType.CREATE:
      case ChangeType.UPDATE:
        ObjectManipulator.setPropertyValue(obj, path, value);
        break;
      case ChangeType.DELETE:
        ObjectManipulator.deleteProperty(obj, path);
        break;
    }
  }

  /**
   * Checks if a path uses @ notation for array operations
   */
  private static isArrayChange(path: string): boolean {
    return path.includes('@');
  }

  /**
   * Parses a serialized value based on its type
   */
  private static parseValue(value: string, type: PropertyType): unknown {
    switch (type) {
      case PropertyType.STRING:
        return value;
      case PropertyType.NUMBER:
        return Number(value);
      case PropertyType.OBJECT:
        try {
          const parsed = JSON.parse(value);
          // Handle double-encoded JSON
          if (typeof parsed === 'string') {
            return JSON.parse(parsed);
          }
          return parsed;
        } catch {
          throw new Error(`Failed to parse object value: ${value}`);
        }
    }
  }

  /**
   * Validates a property path against the regex
   */
  public static isValidPropertyPath(path: string): boolean {
    return PROPERTY_PATH_REGEX.test(path);
  }
}
