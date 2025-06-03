import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    subscriptionLevel: "free" | "basic" | "pro" | "premium";
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
    interface JWT {
    id: string;
    subscriptionLevel: "free" | "basic" | "pro" | "premium";
  }
}