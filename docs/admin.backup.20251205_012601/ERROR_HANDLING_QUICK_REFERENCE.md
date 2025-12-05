# Admin Role Management - Error Handling Quick Reference

## Error Codes

### Authorization Errors

| Code              | Message                                      | Cause                                 |
| ----------------- | -------------------------------------------- | ------------------------------------- |
| `UNAUTHORIZED`    | You must be signed in to perform this action | User not authenticated                |
| `FORBIDDEN`       | Only SuperAdmins can assign/revoke roles     | User lacks SuperAdmin privileges      |
| `SELF_REVOCATION` | You cannot revoke your own SuperAdmin role   | SuperAdmin attempting self-revocation |

### Data Errors

| Code                     | Message                                                            | Cause                                |
| ------------------------ | ------------------------------------------------------------------ | ------------------------------------ |
| `USER_NOT_FOUND`         | The specified user does not exist                                  | Target user ID not found in database |
| `COGNITO_UPDATE_FAILED`  | Failed to update role. Please try again.                           | Cognito API failure                  |
| `DYNAMODB_UPDATE_FAILED` | Failed to update role. Changes have been rolled back.              | DynamoDB write failure               |
| `AUDIT_LOG_FAILED`       | Failed to complete role assignment. Changes have been rolled back. | Audit log creation failure           |

### Validation Errors

| Code               | Message       | Cause                         |
| ------------------ | ------------- | ----------------------------- |
| `VALIDATION_ERROR` | Invalid input | Zod schema validation failure |

## Rollback Behavior

### What Gets Rolled Back?

| Failure Point      | Cognito Rollback      | DynamoDB Rollback | Audit Log Rollback |
| ------------------ | --------------------- | ----------------- | ------------------ |
| Cognito Update     | N/A (nothing changed) | N/A               | N/A                |
| DynamoDB Update    | ✅ Yes                | N/A (failed)      | N/A                |
| Audit Log Creation | ✅ Yes                | ✅ Yes            | N/A (failed)       |
| Email Send         | ❌ No (non-critical)  | ❌ No             | ❌ No              |

### Rollback Success Indicators

**Successful Rollback:**

```json
{
  "level": "INFO",
  "message": "Cognito rollback successful",
  "operationId": "uuid",
  "restoredRole": "user"
}
```

**Failed Rollback (Critical):**

```json
{
  "level": "ERROR",
  "message": "CRITICAL: Cognito rollback failed",
  "severity": "CRITICAL",
  "requiresManualIntervention": true
}
```

## CloudWatch Log Queries

### Find Failed Operations

```
fields @timestamp, operationId, userId, code, message
| filter success = false
| sort @timestamp desc
| limit 100
```

### Find Rollback Operations

```
fields @timestamp, operationId, userId, message, previousRole
| filter message like /Rolling back/
| sort @timestamp desc
```

### Find Critical Failures

```
fields @timestamp, operationId, userId, message, context
| filter severity = "CRITICAL"
| sort @timestamp desc
```

### Monitor Operation Performance

```
fields @timestamp, operationId, duration
| filter message like /completed successfully/
| stats avg(duration), max(duration), p99(duration) by bin(5m)
```

### Track Error Rates

```
fields @timestamp, code
| filter success = false
| stats count() by code, bin(1h)
```

## Debugging Checklist

### When a Role Assignment Fails:

1. **Check CloudWatch Logs**

   - Search for the operation ID
   - Look for error messages and codes
   - Check if rollback was successful

2. **Verify User State**

   - Check Cognito user attributes
   - Check DynamoDB user profile
   - Verify roles match between systems

3. **Check Audit Log**

   - Look for audit entries
   - Verify timestamps
   - Check for partial operations

4. **Review Error Context**
   - Check error code
   - Review context object
   - Look for stack traces

### When a Rollback Fails:

1. **Immediate Actions**

   - Check CloudWatch for CRITICAL logs
   - Note the operation ID
   - Identify which system failed

2. **Manual Verification**

   - Check Cognito user attributes
   - Check DynamoDB user profile
   - Compare with audit log

3. **Manual Correction**
   - Update Cognito if needed
   - Update DynamoDB if needed
   - Create manual audit entry

## Common Issues

### Issue: "User not found"

**Cause:** Target user doesn't exist in DynamoDB
**Solution:** Verify user ID, check if user has completed signup

### Issue: "Cognito update failed"

**Cause:** Invalid credentials, network issues, or Cognito service issues
**Solution:** Check AWS credentials, verify Cognito service status, retry operation

### Issue: "DynamoDB update failed"

**Cause:** Network issues, throttling, or invalid data
**Solution:** Check DynamoDB service status, verify table exists, check for throttling

### Issue: "Rollback failed"

**Cause:** System unavailable during rollback
**Solution:** Manual intervention required, follow manual correction steps

## Monitoring Alerts

### Recommended Alerts

1. **High Error Rate**

   - Threshold: > 5% of operations failing
   - Action: Investigate root cause

2. **Critical Rollback Failures**

   - Threshold: Any CRITICAL severity log
   - Action: Immediate manual intervention

3. **Slow Operations**

   - Threshold: > 5 seconds duration
   - Action: Investigate performance issues

4. **Email Failures**
   - Threshold: > 10% email failures
   - Action: Check email service configuration

## Testing Error Scenarios

### Unit Test Examples

```typescript
// Test Cognito failure
it("should rollback when Cognito update fails", async () => {
  mockCognitoClient.updateUserRole.mockRejectedValue(
    new Error("Cognito error")
  );
  const result = await assignRole({ userId: "test", role: "admin" });
  expect(result.success).toBe(false);
  expect(result.error).toBe("COGNITO_UPDATE_FAILED");
});

// Test DynamoDB failure with rollback
it("should rollback Cognito when DynamoDB update fails", async () => {
  mockCognitoClient.updateUserRole.mockResolvedValue();
  mockRepository.updateUserRole.mockRejectedValue(new Error("DynamoDB error"));

  const result = await assignRole({ userId: "test", role: "admin" });

  expect(result.success).toBe(false);
  expect(result.error).toBe("DYNAMODB_UPDATE_FAILED");
  expect(mockCognitoClient.updateUserRole).toHaveBeenCalledTimes(2); // Initial + rollback
});
```

### Integration Test Scenarios

1. **Simulate Cognito Failure**

   - Mock Cognito API to return error
   - Verify operation fails immediately
   - Verify no changes in DynamoDB

2. **Simulate DynamoDB Failure**

   - Mock DynamoDB to return error
   - Verify Cognito rollback is called
   - Verify final state matches initial state

3. **Simulate Audit Log Failure**
   - Mock audit log creation to fail
   - Verify both systems are rolled back
   - Verify error message indicates rollback

## Best Practices

### For Developers

1. **Always check operation ID** - Use it to trace operations in CloudWatch
2. **Monitor rollback logs** - Ensure rollbacks are successful
3. **Test error scenarios** - Don't just test happy paths
4. **Use structured logging** - Include context in all log messages
5. **Handle email failures gracefully** - Email is non-critical

### For Operations

1. **Set up CloudWatch alerts** - Monitor for critical failures
2. **Review logs regularly** - Look for patterns in failures
3. **Document manual interventions** - Keep track of rollback failures
4. **Monitor performance** - Track operation duration trends
5. **Test disaster recovery** - Practice manual correction procedures

## Support Contacts

### When to Escalate

- Any CRITICAL severity logs
- Rollback failures
- Data inconsistency between Cognito and DynamoDB
- Repeated failures for the same operation
- Performance degradation (> 5 seconds per operation)

### Information to Provide

1. Operation ID
2. User ID (acting admin and target user)
3. Timestamp of failure
4. Error code and message
5. CloudWatch log excerpts
6. Current state of user in both systems
