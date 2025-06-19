
import { AppSettings, UserRole, UserWithRoles } from '@/types/workflow';

// Helper function to convert null values to undefined for type compatibility
export function convertNullToUndefined<T>(obj: any): T {
  if (obj === null || obj === undefined) {
    return undefined as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertNullToUndefined(item)) as T;
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = value === null ? undefined : convertNullToUndefined(value);
    }
    return converted as T;
  }
  
  return obj as T;
}

export function convertAppSettings(settings: any): AppSettings {
  return convertNullToUndefined<AppSettings>(settings);
}

export function convertUserRoles(users: any[]): UserRole[] {
  return users.map(user => convertNullToUndefined<UserRole>(user));
}

export function convertUserWithRoles(users: any[]): UserWithRoles[] {
  return users.map(user => convertNullToUndefined<UserWithRoles>(user));
}
