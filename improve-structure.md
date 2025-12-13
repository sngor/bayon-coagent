# Project Structure Improvements

## Current Issues

1. **Root Clutter**: 20+ documentation files in root
2. **Test Scatter**: 15+ test files in root instead of organized structure
3. **Script Organization**: Deployment scripts mixed with other files
4. **Environment Files**: Multiple .env files without clear purpose

## Recommended Structure

```
/
├── README.md                    # Main project readme
├── CHANGELOG.md                 # Version history only
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├──
├── /src                         # Application code (already good)
├── /docs                        # All documentation
│   ├── README.md               # Documentation index
│   ├── /guides                 # Setup and development guides
│   ├── /deployment             # Deployment documentation
│   ├── /architecture           # System design docs
│   └── /archive               # Completed project docs
├──
├── /tests                      # All test files
│   ├── /unit                  # Unit tests
│   ├── /integration           # Integration tests
│   ├── /agents               # Agent-specific tests
│   ├── /deployment           # Deployment tests
│   └── /archive              # Old/experimental tests
├──
├── /scripts                   # All automation scripts
│   ├── /deployment           # Deployment scripts
│   ├── /migration           # Migration scripts
│   ├── /development         # Development helpers
│   └── /maintenance         # Cleanup and maintenance
├──
├── /infrastructure           # AWS CDK (already good)
├── /agents                  # Agent code (already good)
├── /public                  # Static assets (already good)
└── /node_modules           # Dependencies
```

## Benefits

### Developer Experience

- **Faster Navigation**: Find files quickly
- **Clear Purpose**: Each directory has single responsibility
- **Less Confusion**: No more "where does this go?"

### Maintenance

- **Easier Cleanup**: Archive old files systematically
- **Better Organization**: Related files grouped together
- **Simpler Onboarding**: New developers understand structure

### Tooling

- **Better IDE Support**: Cleaner file trees
- **Improved Search**: Scoped to relevant directories
- **Faster Builds**: Less file scanning

## Implementation Steps

1. **Clean Root Directory** (5 minutes)

   ```bash
   ./cleanup-root-docs.sh
   ```

2. **Organize Tests** (5 minutes)

   ```bash
   ./organize-test-files.sh
   ```

3. **Organize Scripts** (10 minutes)

   ```bash
   ./organize-scripts.sh
   ```

4. **Update Documentation** (15 minutes)

   - Update README.md with new structure
   - Create docs/README.md index
   - Update import paths if needed

5. **Update Tooling** (10 minutes)
   - Update .gitignore patterns
   - Update Jest config for new test paths
   - Update any build scripts

## File Count Reduction

**Before**: 60+ files in root
**After**: ~10 essential files in root

**Root Files to Keep**:

- README.md
- CHANGELOG.md
- package.json
- Configuration files (next.config.ts, etc.)
- Environment templates (.env.example)

**Everything Else**: Organized into subdirectories
