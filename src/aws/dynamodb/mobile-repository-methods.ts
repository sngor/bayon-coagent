/**
 * Mobile Agent Features - Repository Methods
 * 
 * These methods should be added to the DynamoDBRepository class in repository.ts
 * Add them before the closing brace of the class (around line 3227).
 * 
 * IMPORTANT: These are class methods, so they should be indented properly
 * and placed inside the DynamoDBRepository class definition.
 */

// ==================== Mobile Agent Features Methods ====================

/**
 * Creates a mobile capture record
 * @param userId User ID
 * @param captureId Capture ID
 * @param captureData Mobile capture data
 * @returns The created DynamoDB item
 * @throws DynamoDBError if the operation fails
 */
async createMobileCapture<T>(
    userId: string,
    captureId: string,
    captureData: T
): Promise < DynamoDBItem < T >> {
    const { getMobileCaptureKeys } = await import('./keys');
    const keys = getMobileCaptureKeys(userId, captureId);
    return this.create(keys.PK, keys.SK, 'MobileCapture', captureData);
}

/**
 * Gets a mobile capture by ID
 * @param userId User ID
 * @param captureId Capture ID
 * @returns Mobile capture data or null if not found
 * @throws DynamoDBError if the operation fails
 */
async getMobileCapture<T>(
    userId: string,
    captureId: string
): Promise < T | null > {
    const { getMobileCaptureKeys } = await import('./keys');
    const keys = getMobileCaptureKeys(userId, captureId);
    return this.get<T>(keys.PK, keys.SK);
}

/**
 * Updates a mobile capture
 * @param userId User ID
 * @param captureId Capture ID
 * @param updates Partial capture data to update
 * @throws DynamoDBError if the operation fails
 */
async updateMobileCapture<T>(
    userId: string,
    captureId: string,
    updates: Partial<T>
): Promise < void> {
    const { getMobileCaptureKeys } = await import('./keys');
    const keys = getMobileCaptureKeys(userId, captureId);
    await this.update(keys.PK, keys.SK, updates);
}

/**
 * Deletes a mobile capture
 * @param userId User ID
 * @param captureId Capture ID
 * @throws DynamoDBError if the operation fails
 */
async deleteMobileCapture(
    userId: string,
    captureId: string
): Promise < void> {
    const { getMobileCaptureKeys } = await import('./keys');
    const keys = getMobileCaptureKeys(userId, captureId);
    await this.delete(keys.PK, keys.SK);
}

/**
 * Queries all mobile captures for a user
 * @param userId User ID
 * @param options Query options
 * @returns Query result with mobile captures
 * @throws DynamoDBError if the operation fails
 */
async queryMobileCaptures<T>(
    userId: string,
    options: QueryOptions = {}
): Promise < QueryResult < T >> {
    const pk = `USER#${userId}`;
    const skPrefix = 'CAPTURE#';
    return this.query<T>(pk, skPrefix, {
        ...options,
        scanIndexForward: false, // Most recent first
    });
}

/**
 * Creates a quick action
 * @param userId User ID
 * @param actionId Action ID
 * @param actionData Quick action data
 * @returns The created DynamoDB item
 * @throws DynamoDBError if the operation fails
 */
async createQuickAction<T>(
    userId: string,
    actionId: string,
    actionData: T
): Promise < DynamoDBItem < T >> {
    const { getQuickActionKeys } = await import('./keys');
    const keys = getQuickActionKeys(userId, actionId);
    return this.create(keys.PK, keys.SK, 'QuickAction', actionData);
}

/**
 * Gets a quick action by ID
 * @param userId User ID
 * @param actionId Action ID
 * @returns Quick action data or null if not found
 * @throws DynamoDBError if the operation fails
 */
async getQuickAction<T>(
    userId: string,
    actionId: string
): Promise < T | null > {
    const { getQuickActionKeys } = await import('./keys');
    const keys = getQuickActionKeys(userId, actionId);
    return this.get<T>(keys.PK, keys.SK);
}

/**
 * Updates a quick action
 * @param userId User ID
 * @param actionId Action ID
 * @param updates Partial action data to update
 * @throws DynamoDBError if the operation fails
 */
async updateQuickAction<T>(
    userId: string,
    actionId: string,
    updates: Partial<T>
): Promise < void> {
    const { getQuickActionKeys } = await import('./keys');
    const keys = getQuickActionKeys(userId, actionId);
    await this.update(keys.PK, keys.SK, updates);
}

/**
 * Deletes a quick action
 * @param userId User ID
 * @param actionId Action ID
 * @throws DynamoDBError if the operation fails
 */
async deleteQuickAction(
    userId: string,
    actionId: string
): Promise < void> {
    const { getQuickActionKeys } = await import('./keys');
    const keys = getQuickActionKeys(userId, actionId);
    await this.delete(keys.PK, keys.SK);
}

/**
 * Queries all quick actions for a user
 * @param userId User ID
 * @param options Query options
 * @returns Query result with quick actions
 * @throws DynamoDBError if the operation fails
 */
async queryQuickActions<T>(
    userId: string,
    options: QueryOptions = {}
): Promise < QueryResult < T >> {
    const pk = `USER#${userId}`;
    const skPrefix = 'QUICKACTION#';
    return this.query<T>(pk, skPrefix, options);
}

/**
 * Creates a property share record
 * @param userId User ID
 * @param shareId Share ID
 * @param shareData Property share data
 * @returns The created DynamoDB item
 * @throws DynamoDBError if the operation fails
 */
async createPropertyShare<T>(
    userId: string,
    shareId: string,
    shareData: T
): Promise < DynamoDBItem < T >> {
    const { getPropertyShareKeys } = await import('./keys');
    const keys = getPropertyShareKeys(userId, shareId);
    return this.create(keys.PK, keys.SK, 'PropertyShare', shareData);
}

/**
 * Gets a property share by ID
 * @param userId User ID
 * @param shareId Share ID
 * @returns Property share data or null if not found
 * @throws DynamoDBError if the operation fails
 */
async getPropertyShare<T>(
    userId: string,
    shareId: string
): Promise < T | null > {
    const { getPropertyShareKeys } = await import('./keys');
    const keys = getPropertyShareKeys(userId, shareId);
    return this.get<T>(keys.PK, keys.SK);
}

/**
 * Updates a property share
 * @param userId User ID
 * @param shareId Share ID
 * @param updates Partial share data to update
 * @throws DynamoDBError if the operation fails
 */
async updatePropertyShare<T>(
    userId: string,
    shareId: string,
    updates: Partial<T>
): Promise < void> {
    const { getPropertyShareKeys } = await import('./keys');
    const keys = getPropertyShareKeys(userId, shareId);
    await this.update(keys.PK, keys.SK, updates);
}

/**
 * Deletes a property share
 * @param userId User ID
 * @param shareId Share ID
 * @throws DynamoDBError if the operation fails
 */
async deletePropertyShare(
    userId: string,
    shareId: string
): Promise < void> {
    const { getPropertyShareKeys } = await import('./keys');
    const keys = getPropertyShareKeys(userId, shareId);
    await this.delete(keys.PK, keys.SK);
}

/**
 * Queries all property shares for a user
 * @param userId User ID
 * @param options Query options
 * @returns Query result with property shares
 * @throws DynamoDBError if the operation fails
 */
async queryPropertyShares<T>(
    userId: string,
    options: QueryOptions = {}
): Promise < QueryResult < T >> {
    const pk = `USER#${userId}`;
    const skPrefix = 'SHARE#';
    return this.query<T>(pk, skPrefix, {
        ...options,
        scanIndexForward: false, // Most recent first
    });
}

/**
 * Creates a voice note
 * @param userId User ID
 * @param noteId Note ID
 * @param noteData Voice note data
 * @returns The created DynamoDB item
 * @throws DynamoDBError if the operation fails
 */
async createVoiceNote<T>(
    userId: string,
    noteId: string,
    noteData: T
): Promise < DynamoDBItem < T >> {
    const { getVoiceNoteKeys } = await import('./keys');
    const keys = getVoiceNoteKeys(userId, noteId);
    return this.create(keys.PK, keys.SK, 'VoiceNote', noteData);
}

/**
 * Gets a voice note by ID
 * @param userId User ID
 * @param noteId Note ID
 * @returns Voice note data or null if not found
 * @throws DynamoDBError if the operation fails
 */
async getVoiceNote<T>(
    userId: string,
    noteId: string
): Promise < T | null > {
    const { getVoiceNoteKeys } = await import('./keys');
    const keys = getVoiceNoteKeys(userId, noteId);
    return this.get<T>(keys.PK, keys.SK);
}

/**
 * Updates a voice note
 * @param userId User ID
 * @param noteId Note ID
 * @param updates Partial note data to update
 * @throws DynamoDBError if the operation fails
 */
async updateVoiceNote<T>(
    userId: string,
    noteId: string,
    updates: Partial<T>
): Promise < void> {
    const { getVoiceNoteKeys } = await import('./keys');
    const keys = getVoiceNoteKeys(userId, noteId);
    await this.update(keys.PK, keys.SK, updates);
}

/**
 * Deletes a voice note
 * @param userId User ID
 * @param noteId Note ID
 * @throws DynamoDBError if the operation fails
 */
async deleteVoiceNote(
    userId: string,
    noteId: string
): Promise < void> {
    const { getVoiceNoteKeys } = await import('./keys');
    const keys = getVoiceNoteKeys(userId, noteId);
    await this.delete(keys.PK, keys.SK);
}

/**
 * Queries all voice notes for a user
 * @param userId User ID
 * @param options Query options
 * @returns Query result with voice notes
 * @throws DynamoDBError if the operation fails
 */
async queryVoiceNotes<T>(
    userId: string,
    options: QueryOptions = {}
): Promise < QueryResult < T >> {
    const pk = `USER#${userId}`;
    const skPrefix = 'VOICENOTE#';
    return this.query<T>(pk, skPrefix, {
        ...options,
        scanIndexForward: false, // Most recent first
    });
}

/**
 * Queries voice notes by property ID
 * @param userId User ID
 * @param propertyId Property ID
 * @param options Query options
 * @returns Query result with voice notes for the property
 * @throws DynamoDBError if the operation fails
 */
async queryVoiceNotesByProperty<T>(
    userId: string,
    propertyId: string,
    options: QueryOptions = {}
): Promise < QueryResult < T >> {
    const pk = `USER#${userId}`;
    const skPrefix = 'VOICENOTE#';

    return this.query<T>(pk, skPrefix, {
        ...options,
        filterExpression: options.filterExpression
            ? `${options.filterExpression} AND #data.#propertyId = :propertyId`
            : '#data.#propertyId = :propertyId',
        expressionAttributeNames: {
            ...options.expressionAttributeNames,
            '#data': 'Data',
            '#propertyId': 'propertyId',
        },
        expressionAttributeValues: {
            ...options.expressionAttributeValues,
            ':propertyId': propertyId,
        },
        scanIndexForward: false, // Most recent first
    });
}

/**
 * Creates a location check-in
 * @param userId User ID
 * @param checkInId Check-in ID
 * @param checkInData Location check-in data
 * @returns The created DynamoDB item
 * @throws DynamoDBError if the operation fails
 */
async createLocationCheckIn<T>(
    userId: string,
    checkInId: string,
    checkInData: T
): Promise < DynamoDBItem < T >> {
    const { getLocationCheckInKeys } = await import('./keys');
    const keys = getLocationCheckInKeys(userId, checkInId);
    return this.create(keys.PK, keys.SK, 'LocationCheckIn', checkInData);
}

/**
 * Gets a location check-in by ID
 * @param userId User ID
 * @param checkInId Check-in ID
 * @returns Location check-in data or null if not found
 * @throws DynamoDBError if the operation fails
 */
async getLocationCheckIn<T>(
    userId: string,
    checkInId: string
): Promise < T | null > {
    const { getLocationCheckInKeys } = await import('./keys');
    const keys = getLocationCheckInKeys(userId, checkInId);
    return this.get<T>(keys.PK, keys.SK);
}

/**
 * Updates a location check-in
 * @param userId User ID
 * @param checkInId Check-in ID
 * @param updates Partial check-in data to update
 * @throws DynamoDBError if the operation fails
 */
async updateLocationCheckIn<T>(
    userId: string,
    checkInId: string,
    updates: Partial<T>
): Promise < void> {
    const { getLocationCheckInKeys } = await import('./keys');
    const keys = getLocationCheckInKeys(userId, checkInId);
    await this.update(keys.PK, keys.SK, updates);
}

/**
 * Deletes a location check-in
 * @param userId User ID
 * @param checkInId Check-in ID
 * @throws DynamoDBError if the operation fails
 */
async deleteLocationCheckIn(
    userId: string,
    checkInId: string
): Promise < void> {
    const { getLocationCheckInKeys } = await import('./keys');
    const keys = getLocationCheckInKeys(userId, checkInId);
    await this.delete(keys.PK, keys.SK);
}

/**
 * Queries all location check-ins for a user
 * @param userId User ID
 * @param options Query options
 * @returns Query result with location check-ins
 * @throws DynamoDBError if the operation fails
 */
async queryLocationCheckIns<T>(
    userId: string,
    options: QueryOptions = {}
): Promise < QueryResult < T >> {
    const pk = `USER#${userId}`;
    const skPrefix = 'CHECKIN#';
    return this.query<T>(pk, skPrefix, {
        ...options,
        scanIndexForward: false, // Most recent first
    });
}

/**
 * Queries location check-ins by property ID
 * @param userId User ID
 * @param propertyId Property ID
 * @param options Query options
 * @returns Query result with check-ins for the property
 * @throws DynamoDBError if the operation fails
 */
async queryLocationCheckInsByProperty<T>(
    userId: string,
    propertyId: string,
    options: QueryOptions = {}
): Promise < QueryResult < T >> {
    const pk = `USER#${userId}`;
    const skPrefix = 'CHECKIN#';

    return this.query<T>(pk, skPrefix, {
        ...options,
        filterExpression: options.filterExpression
            ? `${options.filterExpression} AND #data.#propertyId = :propertyId`
            : '#data.#propertyId = :propertyId',
        expressionAttributeNames: {
            ...options.expressionAttributeNames,
            '#data': 'Data',
            '#propertyId': 'propertyId',
        },
        expressionAttributeValues: {
            ...options.expressionAttributeValues,
            ':propertyId': propertyId,
        },
        scanIndexForward: false, // Most recent first
    });
}

/**
 * Queries location check-ins by appointment ID
 * @param userId User ID
 * @param appointmentId Appointment ID
 * @param options Query options
 * @returns Query result with check-ins for the appointment
 * @throws DynamoDBError if the operation fails
 */
async queryLocationCheckInsByAppointment<T>(
    userId: string,
    appointmentId: string,
    options: QueryOptions = {}
): Promise < QueryResult < T >> {
    const pk = `USER#${userId}`;
    const skPrefix = 'CHECKIN#';

    return this.query<T>(pk, skPrefix, {
        ...options,
        filterExpression: options.filterExpression
            ? `${options.filterExpression} AND #data.#appointmentId = :appointmentId`
            : '#data.#appointmentId = :appointmentId',
        expressionAttributeNames: {
            ...options.expressionAttributeNames,
            '#data': 'Data',
            '#appointmentId': 'appointmentId',
        },
        expressionAttributeValues: {
            ...options.expressionAttributeValues,
            ':appointmentId': appointmentId,
        },
        scanIndexForward: false, // Most recent first
    });
}
