import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" }
      },
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

          if (user.isVerified === false) {
            throw new Error("UNVERIFIED");
          }

          // 4. Check 1-hour grace period for login OTP
          const ONE_HOUR = 60 * 60 * 1000;
          const isGracePeriodOver = !user.lastLoginAt || (Date.now() - user.lastLoginAt.getTime() > ONE_HOUR);

          if (isGracePeriodOver) {
            if (!credentials.otp) {
              // Tell the frontend we need an OTP
              throw new Error("OTP_REQUIRED");
            } else {
              // Verify the provided OTP
              if (credentials.otp.trim() !== user.otp) {
                throw new Error("INVALID_OTP");
              }
              if (new Date() > new Date(user.otpExpiry)) {
                throw new Error("EXPIRED_OTP");
              }
            }
          }

          // 5. Login successful, update lastLoginAt and clear OTP
          user.lastLoginAt = new Date();
          user.otp = undefined;
          user.otpExpiry = undefined;
          await user.save();

          // 6. Return the user data to be stored in the JWT session
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role, // This helps for your Admin checks later
          };
        } catch (error) {
          console.error("Auth error:", error.message);
          if (["UNVERIFIED", "OTP_REQUIRED", "INVALID_OTP", "EXPIRED_OTP"].includes(error.message)) {
            throw error;
          }
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