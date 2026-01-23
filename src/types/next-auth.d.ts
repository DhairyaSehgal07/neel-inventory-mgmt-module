import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      _id?: string;
      name?: string;
      mobileNumber?: string;
      role?: "Admin" | "Manager" | "Supervisor" | "Worker";
      permissions?: string[];
      isActive?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    _id?: string;
    name?: string;
    mobileNumber?: string;
    role?: "Admin" | "Manager" | "Supervisor" | "Worker";
    permissions?: string[];
    isActive?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    _id?: string;
    name?: string;
    mobileNumber?: string;
    role?: "Admin" | "Manager" | "Supervisor" | "Worker";
    permissions?: string[];
    isActive?: boolean;
  }
}
