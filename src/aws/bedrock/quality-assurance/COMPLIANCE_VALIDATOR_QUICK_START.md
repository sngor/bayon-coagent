# Compliance Validator - Quick Start Guide

## What is the Compliance Validator?

The Compliance Validator is an AI-powered system that automatically checks real estate content for:

- **Fair Housing Act violations** - Discriminatory language about protected classes
- **Discriminatory language** - Economic discrimination, biased phrases
- **Legal compliance** - Required disclosures, truth in advertising

## Quick Start

### 1. Basic Usage

```typescript
import { getComplianceValidator } from "@/aws/bedrock/quality-assurance/compliance-validator";

const validator = getComplianceValidator();

const content = `
Beautiful 3-bedroom home with modern updates.
Features include granite countertops and hardwood floors.
Located in a desirable neighborhood near schools and parks.
`;

const result = await validator.validateCompliance(content, {
  checkFairHousing: true,
  checkDiscriminatory: true,
  checkLegal: true,
});

console.log("Compliant:", result.compliant);
console.log("Score:", result.complianceScore);
console.log("Violations:", result.violations.length);
```

### 2. Check Results

```typescript
if (!result.compliant) {
  // Show violations to user
  result.violations.forEach((violation) => {
    console.log(`${violation.severity}: ${violation.message}`);
    console.log(`Fix: ${violation.suggestion}`);
  });

  // Check risk level
  if (result.riskAssessment.overallRisk === "critical") {
    // Block publication
    alert("Critical compliance violations - cannot publish");
  } else {
    // Warn user
    alert("Compliance issues detected - review before publishing");
  }
}
```

### 3. Get Detailed Analysis

```typescript
const result = await validator.validateCompliance(content, rules, {
  strictMode: true, // More sensitive detection
  confidenceThreshold: 0.7, // Minimum confidence to flag
  includeEducation: true, // Include best practices
});

// View violations by type
console.log("Fair Housing:", result.violationsByType["fair-housing"].length);
console.log(
  "Discriminatory:",
  result.violationsByType["discriminatory"].length
);
console.log("Legal:", result.violationsByType["legal"].length);

// View risk assessment
console.log("Overall Risk:", result.riskAssessment.overallRisk);
console.log("Legal Risk:", result.riskAssessment.legalRisk);

// Get recommendations
result.riskAssessment.recommendations.forEach((rec) => {
  console.log(`- ${rec}`);
});
```

## Common Scenarios

### Scenario 1: Content Creation Workflow

```typescript
// After generating content
const generatedContent = await generateBlogPost(...);

// Check compliance before saving
const complianceResult = await validator.validateCompliance(
    generatedContent,
    {
        checkFairHousing: true,
        checkDiscriminatory: true,
        checkLegal: true,
    }
);

if (complianceResult.compliant) {
    // Safe to save and publish
    await saveContent(generatedContent);
} else {
    // Show violations and block publication
    showComplianceWarnings(complianceResult);
}
```

### Scenario 2: Real-time Validation

```typescript
import { debounce } from "lodash";

const checkCompliance = debounce(async (content: string) => {
  const result = await validator.validateCompliance(content, rules, {
    confidenceThreshold: 0.8, // Higher threshold for real-time
  });

  // Show inline warnings
  displayInlineWarnings(result.violations);
}, 500);

// Call as user types
textEditor.onChange((content) => {
  checkCompliance(content);
});
```

### Scenario 3: Batch Processing

```typescript
const contents = [content1, content2, content3];

// Check all content in parallel
const results = await Promise.all(
  contents.map((content) => validator.validateCompliance(content, rules))
);

// Filter out non-compliant content
const compliantContent = contents.filter((_, i) => results[i].compliant);
const nonCompliantContent = contents.filter((_, i) => !results[i].compliant);

console.log(
  `${compliantContent.length} compliant, ${nonCompliantContent.length} need review`
);
```

## Integration with Quality Assurance Strand

```typescript
import { getQualityAssuranceStrand } from "@/aws/bedrock/quality-assurance/quality-assurance-strand";

const qaStrand = getQualityAssuranceStrand();

// Comprehensive quality check including compliance
const result = await qaStrand.validateContent({
  content: myContent,
  validationTypes: ["factual", "compliance", "grammar"],
  complianceRules: {
    checkFairHousing: true,
    checkDiscriminatory: true,
    checkLegal: true,
  },
});

// Access compliance results
if (result.compliance) {
  console.log("Compliance Score:", result.compliance.complianceScore);
  console.log("Violations:", result.compliance.violations);
}
```

## What Gets Flagged?

### ❌ Fair Housing Violations

```typescript
// These will be flagged:
"Perfect for families with children";
"Great for Christian families";
"Ideal for able-bodied residents";
"No children allowed";
"Adults only community";
```

### ✅ Compliant Alternatives

```typescript
// These are compliant:
"Spacious 3-bedroom home"
"Near places of worship"
"Features accessible entrance"
"55+ age-restricted community" (if qualified)
"Property features include stairs"
```

### ❌ Discriminatory Language

```typescript
// These will be flagged:
"No Section 8 or welfare";
"Professionals only";
"Exclusive community";
"Must speak English";
```

### ✅ Inclusive Alternatives

```typescript
// These are compliant:
"All qualified applicants welcome";
"Quiet, well-maintained community";
"Vibrant neighborhood";
"Property information available";
```

## Configuration Options

### Strict Mode

```typescript
// Normal mode - flags clear violations
const result1 = await validator.validateCompliance(content, rules, {
  strictMode: false,
});

// Strict mode - flags potential violations
const result2 = await validator.validateCompliance(content, rules, {
  strictMode: true,
});
```

**Use strict mode when:**

- Creating content for publication
- Training or educational purposes
- High-risk content (advertising, listings)

**Use normal mode when:**

- Real-time validation
- Draft content
- Internal communications

### Confidence Threshold

```typescript
// Lower threshold = more violations flagged (higher sensitivity)
const sensitive = await validator.validateCompliance(content, rules, {
  confidenceThreshold: 0.6,
});

// Higher threshold = fewer violations flagged (higher specificity)
const specific = await validator.validateCompliance(content, rules, {
  confidenceThreshold: 0.9,
});
```

**Recommended thresholds:**

- Real-time validation: 0.8-0.9
- Pre-publication check: 0.7
- Strict compliance: 0.6

### Custom Patterns

```typescript
const result = await validator.validateCompliance(content, {
  checkFairHousing: true,
  checkDiscriminatory: true,
  checkLegal: true,
  customPatterns: [
    {
      pattern: "luxury|upscale|prestigious",
      message: "Economic descriptors may be discriminatory",
      severity: "warning",
    },
    {
      pattern: "exclusive",
      message: 'Avoid "exclusive" as it may suggest discrimination',
      severity: "warning",
    },
  ],
});
```

## Understanding Results

### Compliance Score

- **1.0**: Perfect compliance, no violations
- **0.9-0.99**: Excellent, minor issues only
- **0.7-0.89**: Good, some warnings
- **0.5-0.69**: Fair, multiple issues
- **<0.5**: Poor, significant violations

### Risk Levels

- **Critical**: Fair Housing violations or multiple errors - DO NOT PUBLISH
- **High**: Legal issues or errors - REVIEW REQUIRED
- **Medium**: Multiple warnings - RECOMMENDED FIXES
- **Low**: Minor issues or compliant - SAFE TO PUBLISH

### Severity Levels

- **Error**: Must fix before publication
- **Warning**: Should fix to reduce risk
- **Info**: Consider fixing for best practices

## Best Practices

### 1. Always Check Before Publishing

```typescript
const canPublish = async (content: string): Promise<boolean> => {
  const result = await validator.validateCompliance(content, rules);

  // Block critical violations
  if (result.riskAssessment.overallRisk === "critical") {
    return false;
  }

  // Warn on high risk
  if (result.riskAssessment.overallRisk === "high") {
    return await confirmWithUser(
      "High risk violations detected. Publish anyway?"
    );
  }

  return true;
};
```

### 2. Show Clear Feedback

```typescript
const displayViolations = (result: DetailedComplianceResult) => {
  if (result.compliant) {
    showSuccess("Content is compliant!");
    return;
  }

  // Group by severity
  const errors = result.violations.filter((v) => v.severity === "error");
  const warnings = result.violations.filter((v) => v.severity === "warning");

  if (errors.length > 0) {
    showError(`${errors.length} critical issue(s) must be fixed`);
    errors.forEach((e) => showViolation(e));
  }

  if (warnings.length > 0) {
    showWarning(`${warnings.length} warning(s) should be addressed`);
    warnings.forEach((w) => showViolation(w));
  }
};
```

### 3. Provide Fix Suggestions

```typescript
const showViolation = (violation: ComplianceViolation) => {
  return {
    message: violation.message,
    suggestion: violation.suggestion,
    location: violation.location,
    canAutoFix: false, // Manual review required for compliance
  };
};
```

### 4. Track Compliance Over Time

```typescript
const trackCompliance = async (userId: string, content: string) => {
  const result = await validator.validateCompliance(content, rules);

  await saveComplianceRecord({
    userId,
    timestamp: new Date(),
    compliant: result.compliant,
    score: result.complianceScore,
    violationCount: result.violations.length,
    riskLevel: result.riskAssessment.overallRisk,
  });
};
```

## Troubleshooting

### False Positives

If you get false positives:

1. **Adjust confidence threshold**: Increase to 0.8 or 0.9
2. **Review context**: Some phrases are acceptable in certain contexts
3. **Use normal mode**: Strict mode is more sensitive
4. **Check violation confidence**: Low confidence violations may be false positives

### Missing Violations

If violations aren't detected:

1. **Use strict mode**: More sensitive detection
2. **Lower confidence threshold**: Decrease to 0.6
3. **Add custom patterns**: For organization-specific rules
4. **Review content**: Some violations may be subtle

### Performance Issues

If validation is slow:

1. **Batch processing**: Check multiple pieces in parallel
2. **Cache results**: Don't re-check unchanged content
3. **Adjust thresholds**: Higher thresholds = faster processing
4. **Selective checking**: Only enable needed check types

## Getting Help

### Documentation

- Full implementation guide: `COMPLIANCE_VALIDATOR_IMPLEMENTATION.md`
- Usage examples: `compliance-validator-example.ts`
- Type definitions: `types.ts`

### Resources

- [Fair Housing Act Overview](https://www.hud.gov/fair_housing)
- [HUD Advertising Guidelines](https://www.hud.gov/program_offices/fair_housing_equal_opp/fair_housing_advertising)
- [NAR Fair Housing Resources](https://www.nar.realtor/fair-housing)

### Support

- Review violation messages and suggestions
- Consult legal counsel for critical violations
- Use educational content for best practices
- Contact compliance team for guidance

## Next Steps

1. **Test with your content**: Run the validator on sample content
2. **Review examples**: Check `compliance-validator-example.ts`
3. **Integrate into workflow**: Add to content creation pipeline
4. **Train your team**: Share best practices and common violations
5. **Monitor compliance**: Track violations over time

---

**Ready to start?** Import the validator and run your first compliance check!

```typescript
import { getComplianceValidator } from "@/aws/bedrock/quality-assurance/compliance-validator";

const validator = getComplianceValidator();
const result = await validator.validateCompliance(yourContent, {
  checkFairHousing: true,
  checkDiscriminatory: true,
  checkLegal: true,
});

console.log("Compliant:", result.compliant);
```
