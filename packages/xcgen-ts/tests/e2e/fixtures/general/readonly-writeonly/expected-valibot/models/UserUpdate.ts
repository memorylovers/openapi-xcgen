/**
 * UserUpdate model
 * Auto-generated from OpenAPI specification
 */

/**
 * User update model with both readOnly and writeOnly fields
 */
export interface UserUpdate {
  /** Username */ username?: string | undefined;
  /** Email address */ email?: string | undefined;
  /** Current password for verification */ currentPassword?: string | undefined;
  /** New password */ newPassword?: string | undefined;
  /** Last login timestamp (server-managed) */ lastLoginAt?: Date | undefined;
}