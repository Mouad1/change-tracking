# Change Tracking Library - Complete Usage Guide

## Installation

### Step 1: Install the Package

```bash
npm install @mbmj/change-tracking
```

### Step 2: Import in Your Project

```typescript
import {
  DocumentChangeParser,
  ChangeBuilder,
  DiffIdentifier,
  ObjectManipulator,
} from "@mbmj/change-tracking";
```

## Best Practices

1. **Use immutable updates** - Prefer `getCopyWithChanges` over `applyChanges` to avoid mutating original objects
2. **Track change history** - Store change records for audit trails and debugging
3. **Validate paths** - Use the validation option when applying changes in production
4. **Type your data** - Use TypeScript interfaces for better type safety
5. **Batch changes** - Group related changes into a single DocumentChange for better atomicity

---

## Troubleshooting

### Issue: Changes not applied

- Check property paths are correct (case-sensitive)
- Ensure you're using the correct ChangeType (CREATE vs UPDATE)
- Verify the object structure matches your paths

### Issue: Array operations not working

- Use `@` notation for insertions/removals: `"items@0"`
- Use regular notation for element updates: `"items.0.name"` or `"items[0].name"`

### Issue: TypeScript errors

- Ensure you're importing from `"@mbmj/change-tracking"`
- Check that your TypeScript version is 4.5 or higher
- Verify your tsconfig has `"esModuleInterop": true`
