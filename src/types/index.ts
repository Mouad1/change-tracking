/**
 * Type of change operation
 */
export enum ChangeType {
  /** Create a new property or array element */
  CREATE = 'CREATE',
  /** Update an existing property or array element */
  UPDATE = 'UPDATE',
  /** Delete a property or array element */
  DELETE = 'DELETE',
}

/**
 * Type of the property value being changed
 */
export enum PropertyType {
  STRING = 'string',
  NUMBER = 'number',
  OBJECT = 'object',
}

/**
 * Represents a single field-level change
 */
export interface ChangeDescriptor {
  /** Type of change operation */
  type: ChangeType;
  /**
   * Path to the property being changed.
   * - Dot notation for nested: `user.address.city`
   * - Bracket notation for arrays: `items[0].name`
   * - @ notation for array mutations: `items@0` (insert/remove at index)
   */
  propertyPath: string;
  /** Serialized new value (required for CREATE and UPDATE) */
  newValue?: string;
  /** Type of the new value for deserialization */
  newValueType?: PropertyType;
}

/**
 * Groups related field changes into a single change event
 */
export interface DocumentChange {
  /** Unique identifier for this change group */
  id?: string;
  /** Array of field-level changes */
  changes: ChangeDescriptor[];
  /** Who made this change */
  createdBy?: string;
  /** When this change was created */
  createdAt?: Date;
}

/**
 * Main change tracking document that holds all changes for an entity
 */
export interface ChangeTrackingDocument<TMetadata = Record<string, unknown>> {
  /** Unique identifier for this tracking document */
  id?: string;
  /** Reference to the entity being tracked */
  entityId: string;
  /** Current sequence number for conflict detection */
  lastChangeIndex: number;
  /** Array of all document changes */
  documentChanges: DocumentChange[];
  /** Optional metadata */
  metadata?: TMetadata;
  /** Creation timestamp */
  createdAt?: Date;
  /** Last update timestamp */
  updatedAt?: Date;
}

/**
 * Request to insert a new change
 */
export interface InsertChangeRequest {
  /** ID of the entity to track changes for */
  entityId: string;
  /** The change to insert */
  documentChange: DocumentChange;
  /** Client's known last change index (for optimistic locking) */
  lastChangeIndex: number;
}

/**
 * Response when retrieving changes
 */
export interface ChangesResponse {
  /** Changes from the requested index */
  documentChanges: DocumentChange[];
  /** Current sequence number on server */
  lastChangeIndex: number;
  /** Last update timestamp */
  updatedAt?: Date;
}

/**
 * Result of comparing two datasets
 */
export interface DiffResult<T> {
  /** Items that exist in new but not in old */
  inserts: T[];
  /** Items that exist in both but have differences */
  updates: Array<{ oldItem: T; newItem: T }>;
  /** Set of processed item identifiers */
  processedIds: Set<string>;
}

/**
 * Configuration for the diff identifier
 */
export interface DiffConfig<T> {
  /** Field to use as the unique identifier */
  idField: keyof T;
  /** Field to use as the display name */
  nameField: keyof T;
  /** Optional field indicating soft-delete status */
  isDeletedField?: keyof T;
  /** Fields to ignore when comparing for changes */
  ignoreFields?: (keyof T)[];
}

/**
 * Options for applying changes
 */
export interface ApplyChangesOptions {
  /** Whether to clone the object before applying changes (default: true for getCopyWithChanges) */
  clone?: boolean;
  /** Whether to validate property paths (default: true) */
  validatePaths?: boolean;
}

/**
 * Error thrown when a change operation fails
 */
export class ChangeTrackingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ChangeTrackingError';
  }
}

/**
 * Error thrown when there's a conflict during change insertion
 */
export class ConflictError extends ChangeTrackingError {
  constructor(
    message: string,
    public readonly expectedIndex: number,
    public readonly actualIndex: number
  ) {
    super(message, 'CONFLICT', { expectedIndex, actualIndex });
    this.name = 'ConflictError';
  }
}

/**
 * Error thrown when a property path is invalid
 */
export class InvalidPathError extends ChangeTrackingError {
  constructor(path: string) {
    super(`Invalid property path: ${path}`, 'INVALID_PATH', { path });
    this.name = 'InvalidPathError';
  }
}
