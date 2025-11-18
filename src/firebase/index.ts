/**
 * Firebase Compatibility Shim
 * 
 * This file provides compatibility stubs for Firebase hooks
 * while the migration to AWS is in progress.
 * 
 * TODO: Remove this file once all pages are migrated to AWS
 */

import { useUser as useAwsUser } from '@/aws/auth/use-user';

// Re-export AWS user hook as Firebase user hook for compatibility
export const useUser = useAwsUser;

// Stub implementations for Firebase hooks
export function useFirestore() {
  console.warn('useFirestore is deprecated - migrate to AWS DynamoDB');
  return null;
}

export function useDoc(ref: any) {
  console.warn('useDoc is deprecated - migrate to AWS DynamoDB useItem hook');
  return {
    data: null,
    loading: false,
    error: null,
  };
}

export function useCollection(ref: any) {
  console.warn('useCollection is deprecated - migrate to AWS DynamoDB useQuery hook');
  return {
    data: [],
    loading: false,
    error: null,
  };
}

export function useMemoFirebase(callback: () => any, deps: any[]) {
  console.warn('useMemoFirebase is deprecated - use React.useMemo instead');
  return callback();
}

export async function addDocumentNonBlocking(ref: any, data: any) {
  console.warn('addDocumentNonBlocking is deprecated - migrate to AWS DynamoDB repository');
  return Promise.resolve({ id: 'stub-id' });
}

export async function setDocumentNonBlocking(ref: any, data: any) {
  console.warn('setDocumentNonBlocking is deprecated - migrate to AWS DynamoDB repository');
  return Promise.resolve();
}

export async function deleteDocumentNonBlocking(ref: any) {
  console.warn('deleteDocumentNonBlocking is deprecated - migrate to AWS DynamoDB repository');
  return Promise.resolve();
}
