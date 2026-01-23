import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Permission } from "./permissions";
import { Role } from "@/model/User";
import { hasAnyPermission } from "./rbac";

/**
 * RBAC Middleware for API routes with dynamic params
 * Checks authentication and permissions before allowing access
 */
export async function withRBACParams<T extends Record<string, string>>(
  request: NextRequest,
  params: Promise<T> | T,
  requiredPermission: Permission | Permission[],
  handler: (
    request: NextRequest,
    context: { params: Promise<T> | T }
  ) => Promise<NextResponse>
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
    return handler(request, { params });
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
