import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    subscriptionLevel: "Explorer" | "Odyssey" | "Mastermind";
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
    interface JWT {
    id: string;
    subscriptionLevel: "Explorer" | "Odyssey" | "Mastermind";
  }
}