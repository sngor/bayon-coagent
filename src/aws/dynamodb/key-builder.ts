/**
 * Type-safe DynamoDB key builder
 * Prevents runtime errors from malformed keys
 */

import { DynamoDBKey } from './types';

export class KeyBuilder {
    private pk: string = '';
    private sk: string = '';
    private gsi1pk?: string;
    private gsi1sk?: string;
    private gsi2pk?: string;
    private gsi2sk?: string;

    static user(userId: string): KeyBuilder {
        const builder = new KeyBuilder();
        builder.pk = `USER#${userId}`;
        return builder;
    }

    static listing(listingId: string): KeyBuilder {
        const builder = new KeyBuilder();
        builder.pk = `LISTING#${listingId}`;
        return builder;
    }

    static analytics(date: string): KeyBuilder {
        const builder = new KeyBuilder();
        builder.pk = `ANALYTICS#${date}`;
        return builder;
    }

    profile(): KeyBuilder {
        this.sk = 'PROFILE';
        return this;
    }

    agent(agentId: string): KeyBuilder {
        this.sk = `AGENT#${agentId}`;
        return this;
    }

    content(contentId: string): KeyBuilder {
        this.sk = `CONTENT#${contentId}`;
        return this;
    }

    withGSI1(pk: string, sk?: string): KeyBuilder {
        this.gsi1pk = pk;
        if (sk) this.gsi1sk = sk;
        return this;
    }

    withGSI2(pk: string, sk?: string): KeyBuilder {
        this.gsi2pk = pk;
        if (sk) this.gsi2sk = sk;
        return this;
    }

    build(): DynamoDBKey & {
        GSI1PK?: string;
        GSI1SK?: string;
        GSI2PK?: string;
        GSI2SK?: string;
    } {
        if (!this.pk || !this.sk) {
            throw new Error('Both PK and SK must be set');
        }

        const keys: any = {
            PK: this.pk,
            SK: this.sk,
        };

        if (this.gsi1pk) keys.GSI1PK = this.gsi1pk;
        if (this.gsi1sk) keys.GSI1SK = this.gsi1sk;
        if (this.gsi2pk) keys.GSI2PK = this.gsi2pk;
        if (this.gsi2sk) keys.GSI2SK = this.gsi2sk;

        return keys;
    }
}

// Usage examples:
// KeyBuilder.user(userId).profile().build()
// KeyBuilder.user(userId).content(contentId).withGSI1('CONTENT#TYPE', contentType).build()