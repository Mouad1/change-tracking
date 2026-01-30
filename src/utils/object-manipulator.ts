/**
 * Low-level utility for manipulating nested object properties
 */
export class ObjectManipulator {
  /**
   * Sets a value at a nested path
   * @param obj - Target object
   * @param path - Dot-notation path (e.g., 'user.address.city')
   * @param value - Value to set
   */
  public static setPropertyValue<T extends object>(
    obj: T,
    path: string,
    value: unknown
  ): void {
    const keys = this.parsePath(path);
    let current: Record<string, unknown> = obj as Record<string, unknown>;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] === undefined || current[key] === null) {
        // Determine if next key is numeric (array) or string (object)
        const nextKey = keys[i + 1];
        current[key] = /^\d+$/.test(nextKey) ? [] : {};
      }
      current = current[key] as Record<string, unknown>;
    }

    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
  }

  /**
   * Gets a value at a nested path
   * @param obj - Source object
   * @param path - Dot-notation path
   * @param defaultValue - Default value if path doesn't exist
   */
  public static getPropertyValue<T>(
    obj: object,
    path: string,
    defaultValue?: T
  ): T | undefined {
    const keys = this.parsePath(path);
    let current: unknown = obj;

    for (const key of keys) {
      if (current === undefined || current === null) {
        return defaultValue;
      }
      current = (current as Record<string, unknown>)[key];
    }

    return (current as T) ?? defaultValue;
  }

  /**
   * Deletes a property at a nested path
   * @param obj - Target object
   * @param path - Dot-notation path
   */
  public static deleteProperty<T extends object>(obj: T, path: string): void {
    const keys = this.parsePath(path);
    let current: Record<string, unknown> = obj as Record<string, unknown>;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] === undefined || current[key] === null) {
        return;
      }
      current = current[key] as Record<string, unknown>;
    }

    const lastKey = keys[keys.length - 1];
    if (Array.isArray(current)) {
      current.splice(Number(lastKey), 1);
    } else {
      delete current[lastKey];
    }
  }

  /**
   * Inserts a value at a specific array index
   * Uses @ notation: `items@0` means insert at index 0
   * @param obj - Target object
   * @param path - Path with @ notation for array index
   * @param value - Value to insert
   */
  public static insertAtIndex<T extends object>(
    obj: T,
    path: string,
    value: unknown
  ): void {
    const [arr, index] = this.getArrayAndIndex(obj, path);
    if (index === -1) {
      arr.push(value);
    } else {
      arr.splice(index, 0, value);
    }
  }

  /**
   * Removes an element at a specific array index
   * Uses @ notation: `items@0` means remove at index 0
   * @param obj - Target object
   * @param path - Path with @ notation for array index
   */
  public static removeAtIndex<T extends object>(obj: T, path: string): void {
    const [arr, index] = this.getArrayAndIndex(obj, path);
    if (index >= 0 && index < arr.length) {
      arr.splice(index, 1);
    }
  }

  /**
   * Sets a value at a specific array index
   * Uses @ notation: `items@0` means set at index 0
   * @param obj - Target object
   * @param path - Path with @ notation for array index
   * @param value - Value to set
   */
  public static setValueAtIndex<T extends object>(
    obj: T,
    path: string,
    value: unknown
  ): void {
    const [arr, index] = this.getArrayAndIndex(obj, path);
    if (index >= 0) {
      arr[index] = value;
    }
  }

  /**
   * Parses a path string into an array of keys
   * Handles dot notation and bracket notation
   * @param path - Path string (e.g., 'user.addresses[0].city')
   */
  private static parsePath(path: string): string[] {
    const result: string[] = [];
    let current = '';

    for (let i = 0; i < path.length; i++) {
      const char = path[i];

      if (char === '.') {
        if (current) {
          result.push(current);
          current = '';
        }
      } else if (char === '[') {
        if (current) {
          result.push(current);
          current = '';
        }
        // Find closing bracket
        const closingIndex = path.indexOf(']', i);
        if (closingIndex !== -1) {
          result.push(path.slice(i + 1, closingIndex));
          i = closingIndex;
        }
      } else if (char !== ']') {
        current += char;
      }
    }

    if (current) {
      result.push(current);
    }

    return result;
  }

  /**
   * Gets array and index from @ notation path
   * @param obj - Source object
   * @param path - Path with @ notation
   * @returns Tuple of [array, index]
   */
  private static getArrayAndIndex<T extends object>(
    obj: T,
    path: string
  ): [unknown[], number] {
    const [arrayPath, indexStr] = path.split('@');
    const index = parseInt(indexStr, 10);
    const arr = this.getPropertyValue<unknown[]>(obj, arrayPath, []) ?? [];
    return [arr, index];
  }
}
