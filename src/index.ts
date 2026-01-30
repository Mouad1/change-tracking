// Types
export {
  ChangeType,
  PropertyType,
  type ChangeDescriptor,
  type DocumentChange,
  type ChangeTrackingDocument,
  type InsertChangeRequest,
  type ChangesResponse,
  type DiffResult,
  type DiffConfig,
  type ApplyChangesOptions,
  ChangeTrackingError,
  ConflictError,
  InvalidPathError,
} from './types';

// Core
export {
  DocumentChangeParser,
  PROPERTY_PATH_REGEX,
} from './core/document-change-parser';

export { ChangeBuilder } from './core/change-builder';

export { DiffIdentifier, InactiveItemError } from './core/diff-identifier';

// Utils
export { ObjectManipulator } from './utils/object-manipulator';
