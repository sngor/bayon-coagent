# Split CloudFormation Templates

This directory contains the split CloudFormation templates for the Bayon CoAgent infrastructure. The original monolithic `template.yaml` has been broken down into smaller, more manageable templates to resolve performance issues and improve maintainability.

## Template Structure

### Main Template (`main-template.yaml`)

The orchestrator template that deploys all other stacks as nested stacks. This is the entry point for deployment.

**Resources:**

- Nested CloudFormation stacks
- Cross-stack parameter passing
- Consolidated outputs

### Core Infrastructure (`core-infrastructure.yaml`)

Contains the foundational AWS resources that other services depend on.

**Resources:**

- Cognito User Pool and Identity Pool
- DynamoDB table with GSI indexes
- S3 storage bucket with lifecycle policies
- IAM roles and policies
- API Gateway logging configuration

**Size:** ~400 lines (vs 6569 in original)

## Benefits of Split Architecture

### Performance Improvements

- **Reduced YAML parsing time**: Each template is under 1000 lines
- **Faster IDE performance**: No more "document symbols limited" warnings
- **Improved syntax highlighting**: Better editor responsiveness
- **Parallel development**: Teams can work on different templates simultaneously

### Maintainability

- **Logical separation**: Related resources grouped together
- **Easier debugging**: Smaller scope for troubleshooting
- **Modular updates**: Deploy only changed components
- **Better version control**: Cleaner diffs and merge conflicts

### Deployment Benefits

- **Faster deployments**: Only changed stacks need updates
- **Reduced blast radius**: Failures isolated to specific components
- **Better rollback**: Granular rollback capabilities
- **Resource limits**: Avoid CloudFormation 500 resource limit per stack

## Deployment

### Using the Deployment Script

```bash
# Deploy to development
./scripts/deploy-split-infrastructure.sh development

# Deploy to production with email alerts
ALARM_EMAIL=admin@bayoncoagent.com ./scripts/deploy-split-infrastructure.sh production
```

### Manual Deployment

```bash
# 1. Create S3 bucket for templates
aws s3 mb s3://bayon-coagent-templates-dev-123456789012

# 2. Upload templates
aws s3 cp infrastructure/cloudformation/ s3://bayon-coagent-templates-dev-123456789012/ --recursive

# 3. Deploy main stack
aws cloudformation create-stack \
  --stack-name bayon-coagent-main-development \
  --template-url https://bayon-coagent-templates-dev-123456789012.s3.amazonaws.com/main-template.yaml \
  --parameters ParameterKey=Environment,ParameterValue=development \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND
```

## Migration from Monolithic Template

### Backward Compatibility

The split templates maintain full backward compatibility with the original `template.yaml`:

- Same resource names and properties
- Identical outputs and exports
- Same parameter interface
- No breaking changes to existing deployments

### Migration Steps

1. **Backup existing stack**: Create a snapshot of current resources
2. **Deploy split templates**: Use the deployment script
3. **Verify functionality**: Test all application features
4. **Update CI/CD**: Point deployment pipelines to new templates
5. **Archive old template**: Move `template.yaml` to `template-legacy.yaml`

### Rollback Plan

If issues arise, you can rollback by:

1. Keeping the original `template.yaml` as backup
2. Using CloudFormation drift detection to compare resources
3. Reverting to the monolithic template if needed

## Template Organization

```
infrastructure/cloudformation/
├── README.md                    # This file
├── main-template.yaml          # Main orchestrator template
├── core-infrastructure.yaml    # Cognito, DynamoDB, S3, IAM
├── api-gateway-services.yaml   # API Gateway resources (planned)
├── lambda-functions.yaml       # Lambda functions (planned)
├── event-driven-architecture.yaml # EventBridge, SQS (planned)
└── monitoring-alarms.yaml      # CloudWatch monitoring (planned)
```

## Future Enhancements

### Additional Split Templates (Planned)

- **API Gateway Services**: All API Gateway resources and methods
- **Lambda Functions**: All Lambda functions and their configurations
- **Event-Driven Architecture**: EventBridge, SQS, and event processing
- **Monitoring & Alarms**: CloudWatch dashboards, alarms, and SNS topics
- **Secrets Management**: All Secrets Manager resources
- **Integration Services**: OAuth and external API integrations

### Advanced Features

- **Template validation**: Pre-deployment validation scripts
- **Cost estimation**: Per-template cost analysis
- **Resource tagging**: Automated tagging strategies
- **Environment promotion**: Dev → Staging → Prod workflows

## Troubleshooting

### Common Issues

**Template not found errors:**

- Ensure S3 bucket exists and templates are uploaded
- Check S3 bucket permissions and region
- Verify template URLs in nested stack references

**Parameter validation errors:**

- Check parameter types and allowed values
- Ensure required parameters are provided
- Validate cross-stack parameter references

**Resource dependency errors:**

- Review DependsOn attributes in nested stacks
- Check export/import name consistency
- Verify resource creation order

### Debugging Tips

1. **Use CloudFormation events**: Monitor stack events for detailed error messages
2. **Check nested stack status**: Each nested stack has its own event log
3. **Validate templates locally**: Use `aws cloudformation validate-template`
4. **Test in development**: Always test changes in dev environment first

## Best Practices

### Template Development

- Keep templates under 1000 lines for optimal performance
- Use consistent naming conventions across templates
- Document all parameters and outputs
- Include comprehensive resource tagging

### Deployment

- Always use the deployment script for consistency
- Test in development environment first
- Monitor CloudWatch during deployments
- Keep deployment logs for troubleshooting

### Maintenance

- Regular template validation and linting
- Keep templates in version control
- Document all changes in commit messages
- Review and update documentation regularly

## Support

For questions or issues with the split template architecture:

1. Check this README for common solutions
2. Review CloudFormation stack events
3. Consult the deployment script logs
4. Contact the infrastructure team
