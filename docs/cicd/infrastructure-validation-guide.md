# Infrastructure Validation Workflow Guide

## Overview

The Infrastructure Validation workflow automatically validates AWS SAM templates and CloudFormation configurations to ensure infrastructure changes are correct before deployment. This workflow helps catch configuration errors early and provides visibility into infrastructure changes through pull request comments.

## Workflow File

`.github/workflows/validate-infrastructure.yml`

## Triggers

The workflow runs automatically on:

1. **Push to main or develop branches** when infrastructure files change:

   - `template.yaml`
   - `template-*.yaml` (any SAM template files)
   - `samconfig.toml`
   - Files in `infrastructure/` directory

2. **Pull requests to main or develop** when infrastructure files change

3. **Manual trigger** via GitHub Actions UI (workflow_dispatch)

## Jobs

### 1. Validate SAM Templates

**Purpose**: Validates SAM template syntax and CloudFormation best practices

**Steps**:

- Installs AWS SAM CLI and cfn-lint
- Validates main `template.yaml` using `sam validate --lint`
- Validates additional template files (`template-*.yaml`)
- Runs cfn-lint on all templates for best practice checks
- Uploads validation results as artifacts

**What it checks**:

- YAML syntax errors
- SAM template structure
- CloudFormation resource definitions
- Parameter and output configurations
- IAM policy syntax
- Best practices and common anti-patterns

### 2. Preview Infrastructure Changes

**Purpose**: Generates a preview of infrastructure changes for each environment

**Runs on**: Pull requests only

**Environments**: Development and Production (runs in parallel)

**Steps**:

- Configures AWS credentials for the target environment
- Creates a CloudFormation changeset without executing it
- Extracts changeset details showing what will change
- Formats changes into a readable markdown report
- Cleans up the changeset after preview
- Uploads change preview as artifacts

**What it shows**:

- Resources to be added
- Resources to be modified
- Resources to be deleted
- Resource types and logical IDs

### 3. Comment on PR

**Purpose**: Posts infrastructure change preview as a PR comment

**Runs on**: Pull requests only (after preview job completes)

**Steps**:

- Downloads change previews for all environments
- Formats changes into a comprehensive comment
- Updates existing comment or creates new one
- Provides links to detailed artifacts

**Comment includes**:

- Changes for Development environment
- Changes for Production environment
- Note that these are preview-only (no actual changes)
- Link to workflow artifacts for full details

### 4. Notify on Failure

**Purpose**: Alerts team when validation fails

**Runs on**: Any job failure

**Notifications**:

- Sends Slack notification with failure details
- Creates GitHub issue for failures on main branch
- Includes workflow run link and commit details

## Required Secrets

Configure these secrets in GitHub repository settings:

### AWS Credentials

- `AWS_ACCESS_KEY_ID_DEV`: Development environment AWS access key
- `AWS_SECRET_ACCESS_KEY_DEV`: Development environment AWS secret key
- `AWS_ACCESS_KEY_ID_PROD`: Production environment AWS access key
- `AWS_SECRET_ACCESS_KEY_PROD`: Production environment AWS secret key

### Notification Services (Optional)

- `SLACK_WEBHOOK_URL`: Slack webhook for failure notifications

## Usage Examples

### Validating Infrastructure Changes

1. **Make changes to SAM templates**:

   ```bash
   # Edit your SAM template
   vim template.yaml

   # Commit changes
   git add template.yaml
   git commit -m "feat: add new Lambda function"
   ```

2. **Create a pull request**:

   ```bash
   git push origin feature/new-lambda
   # Create PR on GitHub
   ```

3. **Review the validation results**:

   - Check the workflow status on the PR
   - Review the infrastructure change preview comment
   - Download artifacts for detailed changeset information

4. **Fix any validation errors**:
   ```bash
   # If validation fails, fix the issues
   vim template.yaml
   git add template.yaml
   git commit -m "fix: correct Lambda function configuration"
   git push
   ```

### Manual Validation

You can manually trigger the workflow:

1. Go to **Actions** tab in GitHub
2. Select **Infrastructure Validation** workflow
3. Click **Run workflow**
4. Select the branch to validate
5. Click **Run workflow** button

### Understanding Change Previews

The workflow generates change previews showing:

```markdown
## Infrastructure Changes for development

- **Add**: MyNewLambdaFunction (AWS::Lambda::Function)
- **Modify**: MyExistingTable (AWS::DynamoDB::Table)
- **Remove**: OldUnusedBucket (AWS::S3::Bucket)
```

**Change Types**:

- **Add**: New resource will be created
- **Modify**: Existing resource will be updated
- **Remove**: Resource will be deleted
- **Replace**: Resource will be deleted and recreated

## Common Validation Errors

### SAM Template Syntax Errors

**Error**: `Template format error: YAML not well-formed`

**Solution**: Check YAML indentation and syntax

```bash
# Use a YAML validator
python -c "import yaml; yaml.safe_load(open('template.yaml'))"
```

### Missing Required Properties

**Error**: `Property validation failure: Missing required property 'Runtime'`

**Solution**: Add the required property to your resource definition

```yaml
MyFunction:
  Type: AWS::Lambda::Function
  Properties:
    Runtime: python3.11 # Add missing property
    Handler: index.handler
    Code: ./src
```

### Invalid Resource References

**Error**: `Unresolved resource dependencies [MyTable]`

**Solution**: Ensure referenced resources exist and are spelled correctly

```yaml
MyFunction:
  Type: AWS::Lambda::Function
  Properties:
    Environment:
      Variables:
        TABLE_NAME: !Ref MyTable # Ensure MyTable is defined
```

### CloudFormation Best Practice Violations

**Error**: `E3012: Property Resources/MyBucket/Properties/BucketName should not be hardcoded`

**Solution**: Use parameters or dynamic naming

```yaml
Parameters:
  BucketName:
    Type: String
    Default: !Sub "${AWS::StackName}-bucket"

Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref BucketName
```

## Troubleshooting

### Workflow Not Triggering

**Issue**: Workflow doesn't run when infrastructure files change

**Solutions**:

1. Check that changed files match the path filters:

   - `template.yaml`
   - `template-*.yaml`
   - `samconfig.toml`
   - `infrastructure/**`

2. Verify workflow file is in `.github/workflows/` directory

3. Check branch protection rules aren't blocking the workflow

### Change Preview Fails

**Issue**: Preview job fails with AWS credentials error

**Solutions**:

1. Verify AWS credentials are configured in GitHub Secrets
2. Check credential names match the expected format:

   - `AWS_ACCESS_KEY_ID_DEV`
   - `AWS_SECRET_ACCESS_KEY_DEV`
   - `AWS_ACCESS_KEY_ID_PROD`
   - `AWS_SECRET_ACCESS_KEY_PROD`

3. Ensure credentials have permissions for:
   - `cloudformation:CreateChangeSet`
   - `cloudformation:DescribeChangeSet`
   - `cloudformation:DeleteChangeSet`

### No Changes Detected

**Issue**: Preview shows "No changes detected"

**Explanation**: This is normal when:

- Template changes don't affect deployed resources
- Only comments or formatting changed
- Changes are identical to current deployment

**Action**: No action needed - this indicates templates are in sync

### Changeset Creation Timeout

**Issue**: Changeset creation takes too long or times out

**Solutions**:

1. Check AWS CloudFormation console for stuck stacks
2. Verify stack exists and is in a stable state
3. Increase timeout in workflow if needed:
   ```yaml
   - name: Generate infrastructure change preview
     timeout-minutes: 15 # Increase from default
   ```

## Best Practices

### 1. Always Review Change Previews

Before merging infrastructure changes:

- Review the change preview comment on your PR
- Understand what resources will be affected
- Verify changes match your intentions
- Check for unexpected modifications or deletions

### 2. Test in Development First

Follow the deployment progression:

1. Merge to `develop` branch
2. Deploy to development environment
3. Verify changes work as expected
4. Create release candidate tag for staging
5. Finally deploy to production

### 3. Use Descriptive Commit Messages

Help reviewers understand infrastructure changes:

```bash
# Good
git commit -m "feat(infra): add DynamoDB table for user sessions"

# Better
git commit -m "feat(infra): add DynamoDB table for user sessions

- Add UserSessions table with on-demand billing
- Configure TTL for automatic session cleanup
- Add GSI for querying by user ID"
```

### 4. Keep Templates Modular

Split large templates into smaller, focused files:

```
template.yaml           # Main template
template-core.yaml      # Core infrastructure
template-api.yaml       # API Gateway and Lambda
template-storage.yaml   # S3 and DynamoDB
```

### 5. Use Parameters for Environment-Specific Values

Avoid hardcoding values that differ between environments:

```yaml
Parameters:
  Environment:
    Type: String
    AllowedValues: [development, staging, production]

  AlarmEmail:
    Type: String
    Description: Email for CloudWatch alarms

Resources:
  MyTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "${AWS::StackName}-${Environment}-table"
      BillingMode: !If [IsProduction, PROVISIONED, PAY_PER_REQUEST]
```

## Integration with Other Workflows

### CI Workflow

The Infrastructure Validation workflow complements the CI workflow:

- CI validates application code
- Infrastructure Validation validates infrastructure code
- Both must pass before merging

### Deployment Workflows

Infrastructure validation runs before deployment:

1. **Validate**: Check templates are correct
2. **Preview**: Show what will change
3. **Deploy**: Apply changes (separate workflow)

### Security Workflow

Infrastructure validation includes security checks:

- cfn-lint checks for security best practices
- Validates IAM policies and permissions
- Identifies publicly accessible resources

## Monitoring and Metrics

Track these metrics for infrastructure validation:

- **Validation success rate**: Percentage of validations that pass
- **Average validation time**: How long validations take
- **Common errors**: Most frequent validation failures
- **Change frequency**: How often infrastructure changes

View metrics in:

- GitHub Actions insights
- Workflow run history
- Custom dashboards (if configured)

## Additional Resources

- [AWS SAM CLI Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)
- [cfn-lint Documentation](https://github.com/aws-cloudformation/cfn-lint)
- [CloudFormation Best Practices](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/best-practices.html)
- [SAM Template Anatomy](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification-template-anatomy.html)

## Support

If you encounter issues with the Infrastructure Validation workflow:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review workflow logs in GitHub Actions
3. Check AWS CloudFormation console for stack status
4. Contact the DevOps team via Slack (#devops channel)
5. Create an issue in the repository with the `infrastructure` label
