import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        await dbConnect();

        // 1. Find User & Validate Password
        const user = await User.findOne({ email: credentials.email });
        if (!user) throw new Error("No user found with this email");

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordCorrect) throw new Error("Invalid password");

        // 2. Check if admin has approved this account
        if (!user.isAdminVerified) {
          throw new Error("PENDING_ADMIN_APPROVAL");
        }

        // 3. Handle OTP Verification Attempt
        if (credentials.otp) {
          const verifiedUser = await User.findOne({
            email: credentials.email,
            otp: credentials.otp,
            otpExpiry: { $gt: new Date() } // Check if OTP is still valid
          });

          if (!verifiedUser) {
            throw new Error("Invalid or expired OTP. Please try again.");
          }

          // Success: Reset grace period and clear OTP
          verifiedUser.lastLoginAt = new Date();
          verifiedUser.otp = undefined;
          verifiedUser.otpExpiry = undefined;
          await verifiedUser.save();

          return verifiedUser;
        }

        // 3. Grace Period Check (1 Hour)
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // If first login or last login was more than 1 hour ago
        if (!user.lastLoginAt || user.lastLoginAt < oneHourAgo) {
          throw new Error("OTP_REQUIRED");
        }

        // Within grace period - login approved
        return user;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user._id;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.image = token.image;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };