/**
 * Schema Markup Validator
 * 
 * Validates Schema.org structured data against specifications
 * Requirements: 8.4
 */

export interface ValidationError {
    field: string;
    message: string;
    severity: "error" | "warning";
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}

// ==================== Type-Specific Validators ====================

/**
 * Validates Person schema markup
 * 
 * @param schema - The schema object to validate
 * @returns Validation result with errors and warnings
 */
export function validatePersonSchema(schema: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Required fields
    if (!schema["@type"] || schema["@type"] !== "Person") {
        errors.push({
            field: "@type",
            message: "Schema must have @type of 'Person'",
            severity: "error",
        });
    }

    if (!schema.name || schema.name.trim() === "") {
        errors.push({
            field: "name",
            message: "Person schema requires a name",
            severity: "error",
        });
    }

    // Recommended fields
    if (!schema.url) {
        warnings.push({
            field: "url",
            message: "Person schema should include a URL",
            severity: "warning",
        });
    }

    if (!schema.telephone) {
        warnings.push({
            field: "telephone",
            message: "Person schema should include a telephone number",
            severity: "warning",
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validates RealEstateAgent schema markup
 * 
 * @param schema - The schema object to validate
 * @returns Validation result with errors and warnings
 */
export function validateRealEstateAgentSchema(schema: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Required fields
    if (!schema["@type"] || schema["@type"] !== "RealEstateAgent") {
        errors.push({
            field: "@type",
            message: "Schema must have @type of 'RealEstateAgent'",
            severity: "error",
        });
    }

    if (!schema.name || schema.name.trim() === "") {
        errors.push({
            field: "name",
            message: "RealEstateAgent schema requires a name",
            severity: "error",
        });
    }

    // Recommended fields
    if (!schema.description) {
        warnings.push({
            field: "description",
            message: "RealEstateAgent schema should include a description",
            severity: "warning",
        });
    }

    if (!schema.telephone) {
        warnings.push({
            field: "telephone",
            message: "RealEstateAgent schema should include a telephone number",
            severity: "warning",
        });
    }

    if (!schema.address) {
        warnings.push({
            field: "address",
            message: "RealEstateAgent schema should include an address",
            severity: "warning",
        });
    }

    if (!schema.license) {
        warnings.push({
            field: "license",
            message: "RealEstateAgent schema should include a license number",
            severity: "warning",
        });
    }

    // Validate nested address if present
    if (schema.address) {
        if (!schema.address["@type"] || schema.address["@type"] !== "PostalAddress") {
            errors.push({
                field: "address.@type",
                message: "Address must have @type of 'PostalAddress'",
                severity: "error",
            });
        }

        if (!schema.address.streetAddress) {
            warnings.push({
                field: "address.streetAddress",
                message: "PostalAddress should include streetAddress",
                severity: "warning",
            });
        }
    }

    // Validate aggregate rating if present
    if (schema.aggregateRating) {
        const ratingValidation = validateAggregateRating(schema.aggregateRating);
        errors.push(...ratingValidation.errors);
        warnings.push(...ratingValidation.warnings);
    }

    // Validate reviews if present
    if (schema.review) {
        if (!Array.isArray(schema.review)) {
            errors.push({
                field: "review",
                message: "Review property must be an array",
                severity: "error",
            });
        } else {
            schema.review.forEach((review: any, index: number) => {
                const reviewValidation = validateReviewSchema(review);
                reviewValidation.errors.forEach((error) => {
                    errors.push({
                        ...error,
                        field: `review[${index}].${error.field}`,
                    });
                });
                reviewValidation.warnings.forEach((warning) => {
                    warnings.push({
                        ...warning,
                        field: `review[${index}].${warning.field}`,
                    });
                });
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validates Article schema markup
 * 
 * @param schema - The schema object to validate
 * @returns Validation result with errors and warnings
 */
export function validateArticleSchema(schema: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Required fields
    if (!schema["@type"] || schema["@type"] !== "Article") {
        errors.push({
            field: "@type",
            message: "Schema must have @type of 'Article'",
            severity: "error",
        });
    }

    if (!schema.headline || schema.headline.trim() === "") {
        errors.push({
            field: "headline",
            message: "Article schema requires a headline",
            severity: "error",
        });
    }

    if (!schema.author) {
        errors.push({
            field: "author",
            message: "Article schema requires an author",
            severity: "error",
        });
    } else {
        if (!schema.author["@type"] || schema.author["@type"] !== "Person") {
            errors.push({
                field: "author.@type",
                message: "Author must have @type of 'Person'",
                severity: "error",
            });
        }

        if (!schema.author.name) {
            errors.push({
                field: "author.name",
                message: "Author must have a name",
                severity: "error",
            });
        }
    }

    if (!schema.datePublished) {
        errors.push({
            field: "datePublished",
            message: "Article schema requires a datePublished",
            severity: "error",
        });
    } else {
        // Validate ISO 8601 date format
        if (!isValidISODate(schema.datePublished)) {
            errors.push({
                field: "datePublished",
                message: "datePublished must be in ISO 8601 format",
                severity: "error",
            });
        }
    }

    // Recommended fields
    if (!schema.description) {
        warnings.push({
            field: "description",
            message: "Article schema should include a description",
            severity: "warning",
        });
    }

    if (!schema.image) {
        warnings.push({
            field: "image",
            message: "Article schema should include an image",
            severity: "warning",
        });
    }

    if (!schema.publisher) {
        warnings.push({
            field: "publisher",
            message: "Article schema should include a publisher",
            severity: "warning",
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validates Review schema markup
 * 
 * @param schema - The schema object to validate
 * @returns Validation result with errors and warnings
 */
export function validateReviewSchema(schema: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Required fields
    if (!schema["@type"] || schema["@type"] !== "Review") {
        errors.push({
            field: "@type",
            message: "Schema must have @type of 'Review'",
            severity: "error",
        });
    }

    if (!schema.author) {
        errors.push({
            field: "author",
            message: "Review schema requires an author",
            severity: "error",
        });
    } else {
        if (!schema.author["@type"] || schema.author["@type"] !== "Person") {
            errors.push({
                field: "author.@type",
                message: "Author must have @type of 'Person'",
                severity: "error",
            });
        }

        if (!schema.author.name) {
            errors.push({
                field: "author.name",
                message: "Author must have a name",
                severity: "error",
            });
        }
    }

    if (!schema.datePublished) {
        errors.push({
            field: "datePublished",
            message: "Review schema requires a datePublished",
            severity: "error",
        });
    } else {
        if (!isValidISODate(schema.datePublished)) {
            errors.push({
                field: "datePublished",
                message: "datePublished must be in ISO 8601 format",
                severity: "error",
            });
        }
    }

    if (!schema.reviewBody || schema.reviewBody.trim() === "") {
        errors.push({
            field: "reviewBody",
            message: "Review schema requires a reviewBody",
            severity: "error",
        });
    }

    // Validate reviewRating if present
    if (schema.reviewRating) {
        if (!schema.reviewRating["@type"] || schema.reviewRating["@type"] !== "Rating") {
            errors.push({
                field: "reviewRating.@type",
                message: "reviewRating must have @type of 'Rating'",
                severity: "error",
            });
        }

        if (!schema.reviewRating.ratingValue) {
            errors.push({
                field: "reviewRating.ratingValue",
                message: "Rating requires a ratingValue",
                severity: "error",
            });
        } else {
            const rating = parseFloat(schema.reviewRating.ratingValue);
            if (isNaN(rating) || rating < 1 || rating > 5) {
                errors.push({
                    field: "reviewRating.ratingValue",
                    message: "ratingValue must be between 1 and 5",
                    severity: "error",
                });
            }
        }
    } else {
        warnings.push({
            field: "reviewRating",
            message: "Review schema should include a reviewRating",
            severity: "warning",
        });
    }

    // Recommended fields
    if (!schema.itemReviewed) {
        warnings.push({
            field: "itemReviewed",
            message: "Review schema should include itemReviewed",
            severity: "warning",
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validates AggregateRating schema markup
 * 
 * @param schema - The schema object to validate
 * @returns Validation result with errors and warnings
 */
function validateAggregateRating(schema: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!schema["@type"] || schema["@type"] !== "AggregateRating") {
        errors.push({
            field: "aggregateRating.@type",
            message: "AggregateRating must have @type of 'AggregateRating'",
            severity: "error",
        });
    }

    if (!schema.ratingValue) {
        errors.push({
            field: "aggregateRating.ratingValue",
            message: "AggregateRating requires a ratingValue",
            severity: "error",
        });
    } else {
        const rating = parseFloat(schema.ratingValue);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            errors.push({
                field: "aggregateRating.ratingValue",
                message: "ratingValue must be between 1 and 5",
                severity: "error",
            });
        }
    }

    if (!schema.reviewCount) {
        errors.push({
            field: "aggregateRating.reviewCount",
            message: "AggregateRating requires a reviewCount",
            severity: "error",
        });
    } else {
        const count = parseInt(schema.reviewCount);
        if (isNaN(count) || count < 1) {
            errors.push({
                field: "aggregateRating.reviewCount",
                message: "reviewCount must be a positive integer",
                severity: "error",
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

// ==================== Generic Validator ====================

/**
 * Validates any schema markup based on its @type
 * 
 * @param schema - The schema object to validate
 * @returns Validation result with errors and warnings
 */
export function validateSchema(schema: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check for @context
    if (!schema["@context"]) {
        warnings.push({
            field: "@context",
            message: "Schema should include @context property",
            severity: "warning",
        });
    } else if (schema["@context"] !== "https://schema.org") {
        warnings.push({
            field: "@context",
            message: "@context should be 'https://schema.org'",
            severity: "warning",
        });
    }

    // Check for @type
    if (!schema["@type"]) {
        errors.push({
            field: "@type",
            message: "Schema must have @type property",
            severity: "error",
        });

        return {
            isValid: false,
            errors,
            warnings,
        };
    }

    // Validate based on type
    let typeValidation: ValidationResult;

    switch (schema["@type"]) {
        case "Person":
            typeValidation = validatePersonSchema(schema);
            break;
        case "RealEstateAgent":
            typeValidation = validateRealEstateAgentSchema(schema);
            break;
        case "Article":
            typeValidation = validateArticleSchema(schema);
            break;
        case "Review":
            typeValidation = validateReviewSchema(schema);
            break;
        default:
            warnings.push({
                field: "@type",
                message: `Unknown schema type: ${schema["@type"]}`,
                severity: "warning",
            });
            return {
                isValid: true,
                errors,
                warnings,
            };
    }

    return {
        isValid: typeValidation.isValid,
        errors: [...errors, ...typeValidation.errors],
        warnings: [...warnings, ...typeValidation.warnings],
    };
}

/**
 * Validates multiple schema objects
 * 
 * @param schemas - Array of schema objects to validate
 * @returns Array of validation results
 */
export function validateMultipleSchemas(schemas: any[]): ValidationResult[] {
    return schemas.map(validateSchema);
}

// ==================== Utility Functions ====================

/**
 * Checks if a string is a valid ISO 8601 date
 * 
 * @param dateString - The date string to validate
 * @returns True if valid ISO 8601 date
 */
function isValidISODate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString.includes("-");
}

/**
 * Formats validation errors into human-readable messages
 * 
 * @param validation - The validation result
 * @returns Array of formatted error messages
 */
export function formatValidationErrors(validation: ValidationResult): string[] {
    const messages: string[] = [];

    validation.errors.forEach((error) => {
        messages.push(`Error in ${error.field}: ${error.message}`);
    });

    validation.warnings.forEach((warning) => {
        messages.push(`Warning in ${warning.field}: ${warning.message}`);
    });

    return messages;
}

/**
 * Generates fix suggestions based on validation errors
 * 
 * @param validation - The validation result
 * @returns Array of fix suggestions
 */
export function generateFixSuggestions(validation: ValidationResult): string[] {
    const suggestions: string[] = [];

    validation.errors.forEach((error) => {
        switch (error.field) {
            case "name":
                suggestions.push("Add a name to your profile to fix this error");
                break;
            case "headline":
                suggestions.push("Add a title to your blog post");
                break;
            case "author.name":
                suggestions.push("Ensure your profile has a name set");
                break;
            case "datePublished":
                suggestions.push("Add a publication date in ISO 8601 format (YYYY-MM-DD)");
                break;
            case "reviewBody":
                suggestions.push("Ensure the testimonial has text content");
                break;
            default:
                suggestions.push(`Fix the ${error.field} field: ${error.message}`);
        }
    });

    return suggestions;
}
