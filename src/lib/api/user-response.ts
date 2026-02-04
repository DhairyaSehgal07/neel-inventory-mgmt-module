/**
 * User shape returned by API (password never included).
 */
export type UserResponse = {
  id: number;
  name: string;
  mobileNumber: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function toUserResponse(
  user: UserResponse & { password: string }
): UserResponse {
  const { password: _p, ...rest } = user;
  return rest as UserResponse;
}
