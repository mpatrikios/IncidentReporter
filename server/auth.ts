import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
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

interface MicrosoftProfile {
  id: string;
  displayName: string;
  emails: Array<{ value: string }>;
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

  // Load OAuth credentials from file or environment variables
  let credentials;
  try {
    const credentialsPath = path.join(
      process.cwd(),
      "server/config/credentials.json"
    );
    credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
  } catch (error) {
    console.log(
      "OAuth credentials file not found, checking environment variables..."
    );

    const googleClientID = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const microsoftClientID = process.env.MICROSOFT_CLIENT_ID;
    const microsoftClientSecret = process.env.MICROSOFT_CLIENT_SECRET;

    credentials = {
      google: {
        web: {
          client_id: googleClientID,
          client_secret: googleClientSecret,
        },
      },
      microsoft: {
        client_id: microsoftClientID,
        client_secret: microsoftClientSecret,
        tenant_id: "common",
        redirect_uri: "http://localhost:5000/auth/microsoft/callback"
      }
    };
  }

  // Use dynamic callback URL for compatibility with Replit and local environments
  const baseUrl = process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS}`
    : "http://localhost:5000";

  // Setup Google OAuth if configured
  if (credentials.google?.web?.client_id && credentials.google?.web?.client_secret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: credentials.google.web.client_id,
          clientSecret: credentials.google.web.client_secret,
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

          // Check if user exists by Google ID first
          let existingUser = await storage.getUserByGoogleId(profile.id);
          
          // If not found by Google ID, check by email (in case user exists but hasn't linked Google yet)
          if (!existingUser) {
            existingUser = await storage.getUserByEmail(email);
          }

          if (existingUser) {
            // User exists - update their information and tokens
            const updatedUser = await storage.updateUser(
              (existingUser as any)._id.toString(),
              {
                googleId: profile.id, // Link Google ID if it wasn't already linked
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
            // User does not exist in database - deny access
            return done(new Error("User not verified. Only verified paying users can access this application."));
          }
        } catch (error) {
          console.error("Error in Google OAuth callback:", error);
          return done(error);
        }
        }
      )
    );
  }

  // Setup Microsoft OAuth if configured
  if (credentials.microsoft?.client_id && credentials.microsoft?.client_secret) {
    passport.use(
      new MicrosoftStrategy(
        {
          clientID: credentials.microsoft.client_id,
          clientSecret: credentials.microsoft.client_secret,
          callbackURL: `${baseUrl}/auth/microsoft/callback`,
          scope: ['user.read'],
          tenant: credentials.microsoft.tenant_id || 'common',
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: MicrosoftProfile,
          done: any
        ) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email found in Microsoft profile"));
            }

            // Check if user exists by Microsoft ID first
            let existingUser = await storage.getUserByMicrosoftId(profile.id);
            
            // If not found by Microsoft ID, check by email (in case user exists but hasn't linked Microsoft yet)
            if (!existingUser) {
              existingUser = await storage.getUserByEmail(email);
            }

            if (existingUser) {
              // User exists - update their information and tokens
              const updatedUser = await storage.updateUser(
                (existingUser as any)._id.toString(),
                {
                  microsoftId: profile.id, // Link Microsoft ID if it wasn't already linked
                  name: profile.displayName,
                  email: email,
                  picture: profile.photos?.[0]?.value,
                  givenName: profile.name?.givenName,
                  familyName: profile.name?.familyName,
                  microsoftAccessToken: accessToken,
                  microsoftRefreshToken: refreshToken,
                  tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
                }
              );
              return done(null, updatedUser);
            } else {
              // User does not exist in database - deny access
              return done(new Error("User not verified. Only verified paying users can access this application."));
            }
          } catch (error) {
            console.error("Error in Microsoft OAuth callback:", error);
            return done(error);
          }
        }
      )
    );
  }

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
