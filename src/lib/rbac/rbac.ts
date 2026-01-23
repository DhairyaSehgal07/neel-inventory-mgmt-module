import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Permission } from "./permissions";
import { Role } from "@/model/User";

/**
 * Check if a user has a specific permission
 * Admin users have all permissions by default
 */
export function hasPermission(
  userRole: Role | undefined,
  userPermissions: Permission[] | undefined,
  requiredPermission: Permission
): boolean {
  // Admin has access to everything
  if (userRole === "Admin") {
    return true;
  }

  // Check if user has the required permission
  if (userPermissions && userPermissions.includes(requiredPermission)) {
    return true;
  }

  return false;
}

/**
 * Check if a user has any of the required permissions
 */
export function hasAnyPermission(
  userRole: Role | undefined,
  userPermissions: Permission[] | undefined,
  requiredPermissions: Permission[]
): boolean {
  // Admin has access to everything
  if (userRole === "Admin") {
    return true;
  }

  // Check if user has any of the required permissions
  if (userPermissions) {
    return requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    );
  }

  return false;
}

/**
 * Check if a user has all of the required permissions
 */
export function hasAllPermissions(
  userRole: Role | undefined,
  userPermissions: Permission[] | undefined,
  requiredPermissions: Permission[]
): boolean {
  // Admin has access to everything
  if (userRole === "Admin") {
    return true;
  }

  // Check if user has all of the required permissions
  if (userPermissions) {
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );
  }

  return false;
}

/**
 * RBAC Middleware for API routes
 * Checks authentication and permissions before allowing access
 */
export async function withRBAC(
  request: NextRequest,
  requiredPermission: Permission | Permission[],
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get the current session
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Authentication required",
        },
        { status: 401 }
      );
    }

    // Check if user account is active
    if (!session.user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Account is deactivated",
        },
        { status: 403 }
      );
    }

    const userRole = session.user.role as Role | undefined;
    const userPermissions = (session.user.permissions as Permission[]) || [];

    // Check permissions
    const permissionsArray = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];

    const hasAccess = hasAnyPermission(userRole, userPermissions, permissionsArray);

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: Insufficient permissions",
          requiredPermission: permissionsArray,
        },
        { status: 403 }
      );
    }

    // User has permission, proceed with the handler
    // Note: For dynamic routes with params, use withRBACParams instead
    return handler(request);
  } catch (error) {
    console.error("RBAC middleware error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error during authorization",
      },
      { status: 500 }
    );
  }
}

/**
 * Middleware to check if user is authenticated (without permission check)
 */
export async function requireAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Authentication required",
        },
        { status: 401 }
      );
    }

    if (!session.user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Account is deactivated",
        },
        { status: 403 }
      );
    }

    return handler(request);
  } catch (error) {
    console.error("Auth middleware error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error during authentication",
      },
      { status: 500 }
    );
  }
}

/**
 * Middleware to check if user is Admin
 */
export async function requireAdmin(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Authentication required",
        },
        { status: 401 }
      );
    }

    if (!session.user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Account is deactivated",
        },
        { status: 403 }
      );
    }

    if (session.user.role !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: Admin access required",
        },
        { status: 403 }
      );
    }

    return handler(request);
  } catch (error) {
    console.error("Admin middleware error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error during authorization",
      },
      { status: 500 }
    );
  }
}
