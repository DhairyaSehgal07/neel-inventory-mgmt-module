import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import prisma from '@/lib/prisma';
import { signInSchema } from '@/schemas/signInSchema';
import type { JWTCallbackParams, SessionCallbackParams } from '@/types/nextAuth';
import type { User } from 'next-auth';

export const { auth, handlers } = NextAuth({
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        mobileNumber: { label: 'Mobile Number', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        try {
          // ✅ Validate input with Zod
          const parsed = signInSchema.safeParse(credentials);
          if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors;
            throw new Error(errors.mobileNumber?.[0] || errors.password?.[0] || 'Invalid input');
          }

          const { mobileNumber, password } = parsed.data;

          // 🗃️ Connect to DB
          await dbConnect();

          // 🔍 Find user by mobile number
          const user = await prisma.user.findUnique({
            where: { mobileNumber },
          });

          if (!user) {
            throw new Error('No user found with this mobile number');
          }

          if (!user.isActive) {
            throw new Error('Your account has been deactivated');
          }

          // 🔑 Verify password
          const isPasswordCorrect = await bcrypt.compare(password, user.password);

          if (!isPasswordCorrect) {
            throw new Error('Incorrect password');
          }

          // ✅ Return user (single id field)
          return {
            id: String(user.id),
            name: user.name,
            mobileNumber: user.mobileNumber,
            role: user.role,
            permissions: user.permissions || [],
            isActive: user.isActive,
          } as User;
        } catch (err) {
          const error = err as Error;
          throw new Error(error?.message || 'Authentication failed');
        }
      },
    }),
  ],

  // 🧩 JWT + Session Callbacks
  callbacks: {
    async jwt({ token, user }: JWTCallbackParams) {
      if (user) {
        token.id = user.id;
        token.mobileNumber = user.mobileNumber;
        token.name = user.name;
        token.role = user.role;
        token.permissions = user.permissions || [];
        token.isActive = user.isActive;
      }
      return token;
    },
    async session({ session, token }: SessionCallbackParams) {
      if (token) {
        session.user = {
          id: token.id,
          mobileNumber: token.mobileNumber,
          name: token.name,
          role: token.role,
          permissions: token.permissions || [],
          isActive: token.isActive,
        };
      }
      return session;
    },
  },

  session: {
    strategy: 'jwt',
  } as const,

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: '/sign-in',
  },

  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
});
