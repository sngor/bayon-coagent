/**
 * Runtime validation for DynamoDB keys
 * Prevents malformed keys from reaching AWS
 */

import { DynamoDBKey } from './types';

export class KeyValidationError extends Error {
    constructor(message: string, public readonly key: Partial<DynamoDBKey>) {
        super(message);
        this.name = 'KeyValidationError';
    }
}

export interface ValidationRule {
    name: string;
    validate: (key: DynamoDBKey) => boolean;
    message: string;
}

const DEFAULT_RULES: ValidationRule[] = [
    {
        name: 'pk-format',
        validate: (key) => /^[A-Z_]+#.+$/.test(key.PK),
        message: 'PK must follow pattern: ENTITY_TYPE#identifier',
    },
    {
        name: 'sk-format',
        validate: (key) => /^([A-Z_]+#.+|[A-Z_]+)$/.test(key.SK),
        message: 'SK must follow pattern: ENTITY_TYPE#identifier or ENTITY_TYPE',
    },
    {
        name: 'pk-length',
        validate: (key) => key.PK.length <= 2048,
        message: 'PK must be <= 2048 characters',
    },
    {
        name: 'sk-length',
        validate: (key) => key.SK.length <= 1024,
        message: 'SK must be <= 1024 characters',
    },
    {
        name: 'no-special-chars',
        validate: (key) => !/[<>{}\\]/.test(key.PK) && !/[<>{}\\]/.test(key.SK),
        message: 'Keys must not contain special characters: < > { } \\',
    },
    {
        name: 'user-prefix-validation',
        validate: (key) => {
            if (key.PK.startsWith('USER#')) {
                return /^USER#[a-zA-Z0-9-_]+$/.test(key.PK);
            }
            return true;
        },
        message: 'USER# prefix must be followed by valid user ID (alphanumeric, hyphens, underscores only)',
    },
];

export class KeyValidator {
    private rules: ValidationRule[] = [...DEFAULT_RULES];

    addRule(rule: ValidationRule): void {
        this.rules.push(rule);
    }

    validate(key: DynamoDBKey): void {
        for (const rule of this.rules) {
            if (!rule.validate(key)) {
                throw new KeyValidationError(`${rule.name}: ${rule.message}`, key);
            }
        }
    }

    validateSafe(key: DynamoDBKey): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        for (const rule of this.rules) {
            if (!rule.validate(key)) {
                errors.push(`${rule.name}: ${rule.message}`);
            }
        }

        return { valid: errors.length === 0, errors };
    }
}

export const defaultValidator = new KeyValidator();