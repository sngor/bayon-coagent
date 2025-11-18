/**
 * Firebase Firestore Compatibility Shim
 * 
 * This file provides compatibility stubs for Firebase Firestore functions
 * while the migration to AWS is in progress.
 * 
 * TODO: Remove this file once all pages are migrated to AWS DynamoDB
 */

// Stub types
export interface DocumentReference {
  id: string;
  path: string;
}

export interface CollectionReference {
  id: string;
  path: string;
}

export interface Query {
  type: 'query';
}

// Stub functions
export function doc(...args: any[]): DocumentReference {
  console.warn('Firebase doc() is deprecated - migrate to AWS DynamoDB');
  return {
    id: 'stub-id',
    path: 'stub/path',
  };
}

export function collection(...args: any[]): CollectionReference {
  console.warn('Firebase collection() is deprecated - migrate to AWS DynamoDB');
  return {
    id: 'stub-collection',
    path: 'stub/collection',
  };
}

export function query(...args: any[]): Query {
  console.warn('Firebase query() is deprecated - migrate to AWS DynamoDB');
  return {
    type: 'query',
  };
}

export function orderBy(...args: any[]): any {
  console.warn('Firebase orderBy() is deprecated - migrate to AWS DynamoDB');
  return {};
}

export function limit(...args: any[]): any {
  console.warn('Firebase limit() is deprecated - migrate to AWS DynamoDB');
  return {};
}

export function where(...args: any[]): any {
  console.warn('Firebase where() is deprecated - migrate to AWS DynamoDB');
  return {};
}

export function getDocs(...args: any[]): Promise<any> {
  console.warn('Firebase getDocs() is deprecated - migrate to AWS DynamoDB');
  return Promise.resolve({ docs: [] });
}

export function getDoc(...args: any[]): Promise<any> {
  console.warn('Firebase getDoc() is deprecated - migrate to AWS DynamoDB');
  return Promise.resolve({ exists: () => false, data: () => null });
}

export function setDoc(...args: any[]): Promise<void> {
  console.warn('Firebase setDoc() is deprecated - migrate to AWS DynamoDB');
  return Promise.resolve();
}

export function addDoc(...args: any[]): Promise<DocumentReference> {
  console.warn('Firebase addDoc() is deprecated - migrate to AWS DynamoDB');
  return Promise.resolve({
    id: 'stub-id',
    path: 'stub/path',
  });
}

export function deleteDoc(...args: any[]): Promise<void> {
  console.warn('Firebase deleteDoc() is deprecated - migrate to AWS DynamoDB');
  return Promise.resolve();
}

export function updateDoc(...args: any[]): Promise<void> {
  console.warn('Firebase updateDoc() is deprecated - migrate to AWS DynamoDB');
  return Promise.resolve();
}
