import { connectDB } from "@/lib/mongoose";
import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth, { NextAuthOptions } from "next-auth";
import User, {IUser} from "@/models/User";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      await connectDB();

      if (!credentials?.email || !credentials.password) return null;

      const user = await User.findOne({ email: credentials.email });
      if (!user) return null;

      const isValid = await bcrypt.compare(credentials.password, user.password);
      if (!isValid) return null;

      return {
        id: user._id.toString(),
        email: user.email,
        subscriptionLevel: user.subscriptionLevel,
        role: user.role
      }
    }
    })
  ],

  session: {
    strategy: "jwt"
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.subscriptionLevel = user.subscriptionLevel;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.subscriptionLevel = token.subscriptionLevel as "free" | "basic" | "pro" | "premium";
        session.user.role = token.role as "customer" | "admin";
      }
      return session;
    }
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };