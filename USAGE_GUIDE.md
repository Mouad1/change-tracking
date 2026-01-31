# Change Tracking Module

A framework-agnostic TypeScript library for tracking, replaying, and managing object changes using event-sourcing patterns.

## Features

- **Event Sourcing** - Immutable change records that can be replayed to reconstruct state
- **Type-Safe** - Strongly typed APIs with full TypeScript support
- **Framework-Agnostic** - Works with any TypeScript/JavaScript project
- **Zero Runtime Dependencies** - No external dependencies required
- **Diff Detection** - Identify inserts, updates, and deletions between datasets

## Installation

```bash
npm install @mbmj/change-tracking
```

## Quick Start

### Applying Changes to Objects

```typescript
import { DocumentChangeParser, ChangeBuilder } from "@mbmj/change-tracking";

// Original object
const user = { name: "John", age: 25 };

// Create changes
const changes = [
  ChangeBuilder.updateStringChange("name", "Jane"),
  ChangeBuilder.updateNumberChange("age", 30),
];

// Apply changes (creates a new object)
const updatedUser = DocumentChangeParser.getCopyWithChanges(user, changes);
// Result: { name: 'Jane', age: 30 }

// Original is unchanged
console.log(user); // { name: 'John', age: 25 }
```

### Building Changes with Fluent API

```typescript
import { ChangeBuilder } from "@mbmj/change-tracking";

const change = new ChangeBuilder()
  .createString("name", "John")
  .createNumber("age", 25)
  .createObject("address", { city: "Paris", country: "France" })
  .build({ createdBy: "user123" });
```

### Working with Nested Properties

```typescript
import { DocumentChangeParser, ChangeBuilder } from "@mbmj/change-tracking";

const data = {
  user: {
    profile: {
      name: "John",
      settings: { theme: "light" },
    },
  },
};

const changes = [
  ChangeBuilder.updateStringChange("user.profile.name", "Jane"),
  ChangeBuilder.updateStringChange("user.profile.settings.theme", "dark"),
];

const updated = DocumentChangeParser.getCopyWithChanges(data, changes);
```

### Array Operations

Use `@` notation for array mutations:

```typescript
import {
  DocumentChangeParser,
  ChangeType,
  PropertyType,
} from "@mbmj/change-tracking";

const data = { items: ["a", "b", "c"] };

// Insert at index 1
const insertChange = {
  changes: [
    {
      type: ChangeType.CREATE,
      propertyPath: "items@1",
      newValue: "x",
      newValueType: PropertyType.STRING,
    },
  ],
};

DocumentChangeParser.applyChange(data, insertChange);
// Result: { items: ['a', 'x', 'b', 'c'] }

// Delete at index 1
const deleteChange = {
  changes: [
    {
      type: ChangeType.DELETE,
      propertyPath: "items@1",
    },
  ],
};

DocumentChangeParser.applyChange(data, deleteChange);
// Result: { items: ['a', 'b', 'c'] }
```

### Diff Detection

Compare datasets to identify changes:

```typescript
import { DiffIdentifier } from "@mbmj/change-tracking";

interface Product {
  id: string;
  name: string;
  price: number;
  isDeleted?: boolean;
}

const existingProducts: Product[] = [
  { id: "1", name: "Widget", price: 10 },
  { id: "2", name: "Gadget", price: 20 },
];

const importedProducts = new Map<string, Product>([
  ["Widget", { id: "1", name: "Widget", price: 15 }], // Updated price
  ["NewItem", { id: "3", name: "NewItem", price: 30 }], // New item
]);

const result = DiffIdentifier.identifyChanges(
  importedProducts,
  existingProducts,
  {
    idField: "id",
    nameField: "name",
    isDeletedField: "isDeleted",
  },
);

console.log(result.inserts); // [{ id: '3', name: 'NewItem', price: 30 }]
console.log(result.updates); // [{ oldItem: {..., price: 10}, newItem: {..., price: 15} }]
```

## API Reference

### Types

#### `ChangeType`

```typescript
enum ChangeType {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}
```

#### `PropertyType`

```typescript
enum PropertyType {
  STRING = "string",
  NUMBER = "number",
  OBJECT = "object",
}
```

#### `ChangeDescriptor`

```typescript
interface ChangeDescriptor {
  type: ChangeType;
  propertyPath: string;
  newValue?: string;
  newValueType?: PropertyType;
}
```

#### `DocumentChange`

```typescript
interface DocumentChange {
  id?: string;
  changes: ChangeDescriptor[];
  createdBy?: string;
  createdAt?: Date;
}
```

### DocumentChangeParser

| Method                             | Description                                 |
| ---------------------------------- | ------------------------------------------- |
| `getCopyWithChanges(obj, changes)` | Creates a deep copy and applies all changes |
| `applyChanges(obj, changes)`       | Applies changes in place (mutates)          |
| `getCopyWithChange(obj, change)`   | Creates a deep copy and applies one change  |
| `applyChange(obj, change)`         | Applies one change in place                 |
| `isValidPropertyPath(path)`        | Validates a property path                   |

### ChangeBuilder

#### Fluent API

```typescript
new ChangeBuilder()
  .createString(path, value)
  .updateString(path, value)
  .createNumber(path, value)
  .updateNumber(path, value)
  .createObject(path, value)
  .updateObject(path, value)
  .delete(path)
  .build(options?)
  .reset()
```

#### Static Methods

```typescript
ChangeBuilder.createStringChange(path, value);
ChangeBuilder.updateStringChange(path, value);
ChangeBuilder.createNumberChange(path, value);
ChangeBuilder.updateNumberChange(path, value);
ChangeBuilder.createObjectChange(path, value);
ChangeBuilder.updateObjectChange(path, value);
ChangeBuilder.deleteChange(path);
```

### DiffIdentifier

| Method                                                            | Description                 |
| ----------------------------------------------------------------- | --------------------------- |
| `identifyChanges(newItems, existingItems, config)`                | Finds inserts and updates   |
| `identifyInactive(existingItems, processedIds, config, options?)` | Finds deleted/missing items |

### ObjectManipulator

Low-level utilities for nested object manipulation:

| Method                                  | Description                 |
| --------------------------------------- | --------------------------- |
| `setPropertyValue(obj, path, value)`    | Sets a nested property      |
| `getPropertyValue(obj, path, default?)` | Gets a nested property      |
| `deleteProperty(obj, path)`             | Deletes a property          |
| `insertAtIndex(obj, path, value)`       | Inserts into array at index |
| `removeAtIndex(obj, path)`              | Removes from array at index |
| `setValueAtIndex(obj, path, value)`     | Updates array element       |

## Property Path Syntax

| Syntax   | Description                    | Example             |
| -------- | ------------------------------ | ------------------- |
| `name`   | Simple property                | `user`              |
| `a.b.c`  | Nested property                | `user.profile.name` |
| `arr[0]` | Array access                   | `items[0].name`     |
| `arr@0`  | Array mutation (insert/remove) | `items@0`           |
| `arr@-1` | Append to array                | `items@-1`          |

## Error Handling

The library provides typed errors:

```typescript
import {
  InvalidPathError,
  ConflictError,
  ChangeTrackingError,
} from "@mbmj/change-tracking";

try {
  DocumentChangeParser.applyChange(obj, change, { validatePaths: true });
} catch (error) {
  if (error instanceof InvalidPathError) {
    console.error("Invalid path:", error.details?.path);
  }
}
```

## Testing

```bash
npm test
npm run test:coverage
```

## Building

```bash
npm run build
```

Outputs:

- `dist/index.js` - CommonJS
- `dist/index.mjs` - ES Modules
- `dist/index.d.ts` - Type declarations

## License

MIT
