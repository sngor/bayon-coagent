# Next Step: Splitting actions.ts

## Current Status

✅ **Phase 1 Complete:** Feature modules created and populated  
🔄 **Phase 2 In Progress:** Split monolithic actions.ts file

## The Challenge

The `src/app/actions.ts` file contains:
- **6,673 lines of code**
- **118 exported functions**
- Mixed concerns (auth, content, intelligence, admin, etc.)

## Recommended Approach

Given the size and complexity, this should be done **incrementally and carefully**:

### Option 1: Gradual Migration (RECOMMENDED)
1. **Keep actions.ts** as the source of truth initially
2. **Create feature-specific action files** alongside it
3. **Add re-exports** to actions.ts for backward compatibility
4. **Migrate one feature at a time**, updating imports
5. **Remove from actions.ts** only after verification

### Option 2: Big Bang (RISKY)
- Split everything at once
- Update all imports simultaneously
- Higher risk of breaking changes

## Next Immediate Steps

### Step 1: Create Brand Actions Example ✅
Let me create one complete example to establish the pattern:

**Create:** `features/brand/actions/brand-actions.ts`

**Move these functions:**
- `generateBioAction`
- `findCompetitorsAction`
- `enrichCompetitorAction`
- `runNapAuditAction`
- `getAuditDataAction`

**Add re-export to actions.ts:**
```typescript
// Backward compatibility - re-export from feature modules
export {
  generateBioAction,
  findCompetitorsAction,
  enrichCompetitorAction,
  runNapAuditAction,
  getAuditDataAction,
} from '@/features/brand/actions/brand-actions';
```

### Step 2: Example Pattern for Other Features

Once the brand actions pattern is established, repeat for:

1. **Content Generation** → `features/content-engine/actions/generation-actions.ts`
2. **Market Intelligence** → `features/intelligence/actions/market-actions.ts`  
3. **Training/Learning** → `features/intelligence/actions/training-actions.ts`
4. **File Management** → `app/file-actions.ts`
5. **Projects** → `app/project-actions.ts`

### Step 3: Update Documentation

After each migration:
- Update import examples
- Document the pattern
- Note which actions moved where

## Estimated Timeline

- **Per feature migration:** 30-60 minutes
- **Total effort:** ~8-12 hours of focused work
- **Recommended:** 1-2 features per session

## Safety Checks

After each migration:
```bash
# 1. Type check
npx tsc --noEmit

# 2. Test build
npm run build

# 3. Test in dev mode
npm run dev
```

## Current Action

I've documented the plan. **Would you like me to:**

A) **Create the first example** (brand actions migration with re-exports)
B) **Create migration scripts** to automate the process
C) **Focus on a different phase** of the reorganization
D) **Proceed with testing** the current reorganization

The reorganization of feature modules (Phase 1) is complete and working. The actions.ts split is the natural next step, but it's a significant undertaking that should be done methodically.

---

**Recommendation:**  
Start with **Option A** - create one complete example migration to validate the pattern, then proceed incrementally with the rest.
