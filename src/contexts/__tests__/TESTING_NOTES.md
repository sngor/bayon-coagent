# Workflow Context Testing Notes

## Current Status

The WorkflowContext implementation is complete and TypeScript-validated. However, comprehensive unit tests require proper mocking setup for the workflow instance service.

## Test Requirements

### Mocking Needed

The tests require mocking of:

1. `@/lib/workflow-instance-service` - Database operations
2. `localStorage` - Browser storage API
3. Timer functions - For debouncing tests

### Test File

The test file `workflow-context.test.tsx` contains comprehensive test cases but needs proper Jest/Vitest mocking configuration.

## Running Tests

### Option 1: Integration Tests (Recommended)

Run integration tests with a real database connection:

```bash
npm test -- src/contexts/__tests__/workflow-context.test.tsx
```

### Option 2: Unit Tests with Mocks

Set up proper mocking in `jest.setup.ts` or use a mocking library like `msw`.

## Test Coverage

The test file covers:

- ✅ Hook usage validation
- ✅ Loading workflows
- ✅ Completing steps
- ✅ Skipping steps
- ✅ Navigation between steps
- ✅ Progress calculation
- ✅ Remaining time calculation
- ✅ Local storage backup
- ✅ Auto-save behavior
- ✅ Clearing workflows

## Manual Testing

Until proper mocking is set up, manual testing can verify:

1. **Load Workflow**

   - Open browser DevTools
   - Load a workflow
   - Check localStorage for `workflow-backup`

2. **Complete Steps**

   - Complete a step
   - Verify progress updates
   - Check database for saved state

3. **Auto-Save**

   - Make changes
   - Wait 30 seconds
   - Verify database updated

4. **Session Recovery**

   - Load workflow
   - Refresh page
   - Verify state restored from localStorage

5. **Navigation**
   - Complete multiple steps
   - Navigate back to previous step
   - Verify state preserved

## Future Improvements

1. Set up proper Jest mocking configuration
2. Add integration tests with test database
3. Add E2E tests with Playwright/Cypress
4. Add property-based tests for state transitions
5. Add performance tests for auto-save

## Related Files

- `src/contexts/workflow-context.tsx` - Implementation
- `src/contexts/workflow-context-example.tsx` - Usage examples
- `src/contexts/WORKFLOW_CONTEXT_README.md` - Documentation
- `src/lib/workflow-state-manager.test.ts` - State manager tests (working)
