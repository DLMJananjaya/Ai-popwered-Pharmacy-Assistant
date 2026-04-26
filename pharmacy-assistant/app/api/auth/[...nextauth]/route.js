import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db"; // <-- ADD THIS
import User from "@/models/User"; // <-- ADD THIS
import bcrypt from "bcryptjs";    // <-- ADD THIS

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {}, // We handle the form state in the frontend
      async authorize(credentials) {
        try {
          // 1. Connect to the database
          await dbConnect();

          // 2. Find the user. 
          // Note: your login form sends 'email', so we check credentials.email
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            console.log("No user found with this email");
            return null;
          }

          // 3. Compare the typed password with the hashed password in Atlas
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordCorrect) {
            console.log("Password does not match");
            return null;
          }

          // 4. Return the user data to be stored in the JWT session
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role, // This helps for your Admin checks later
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET, // Ensure this is in your .env.local
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // This allows you to access the user ID in your frontend session
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };