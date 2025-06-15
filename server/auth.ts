import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import fs from "fs";
import path from "path";

interface GoogleProfile {
  id: string;
  displayName: string;
  emails: Array<{ value: string; verified: boolean }>;
  photos: Array<{ value: string }>;
  name: {
    givenName: string;
    familyName: string;
  };
}

export function setupPassport() {
  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Load Google OAuth credentials from file or environment variables
  let credentials;
  try {
    const credentialsPath = path.join(
      process.cwd(),
      "server/config/credentials.json"
    );
    credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
  } catch (error) {
    console.log(
      "Google OAuth credentials file not found, checking environment variables..."
    );

    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientID || !clientSecret) {
      console.log(
        "Google OAuth not configured - neither credentials.json nor environment variables found"
      );
      console.log("Skipping Google OAuth setup...");
      return;
    }

    credentials = {
      web: {
        client_id: clientID,
        client_secret: clientSecret,
      },
    };
  }

  // Use dynamic callback URL for compatibility with Replit and local environments
  const baseUrl = process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS}`
    : "http://localhost:5000";

  passport.use(
    new GoogleStrategy(
      {
        clientID: credentials.web.client_id,
        clientSecret: credentials.web.client_secret,
        callbackURL: `${baseUrl}/auth/google/callback`,
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: GoogleProfile,
        done: any
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          // Check if user already exists
          const existingUser = await storage.getUserByGoogleId(profile.id);

          if (existingUser) {
            const updatedUser = await storage.updateUser(
              (existingUser as any)._id.toString(),
              {
                name: profile.displayName,
                email: email,
                picture: profile.photos?.[0]?.value,
                givenName: profile.name?.givenName,
                familyName: profile.name?.familyName,
                googleAccessToken: accessToken,
                googleRefreshToken: refreshToken,
                tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
              }
            );
            return done(null, updatedUser);
          } else {
            const newUser = await storage.createUser({
              googleId: profile.id,
              email: email,
              name: profile.displayName,
              picture: profile.photos?.[0]?.value,
              givenName: profile.name?.givenName,
              familyName: profile.name?.familyName,
              isEngineer: false,
              googleAccessToken: accessToken,
              googleRefreshToken: refreshToken,
              tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
            });
            return done(null, newUser);
          }
        } catch (error) {
          console.error("Error in Google OAuth callback:", error);
          return done(error);
        }
      }
    )
  );

  // Serialize user for session storage
  passport.serializeUser((user: any, done) => {
    done(null, user._id.toString());
  });
}

// Middleware to ensure user is authenticated
export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

// Middleware to check if user is an engineer
export function requireEngineer(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.isEngineer) {
    return next();
  }
  res.status(403).json({ error: "Engineer access required" });
}
