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

  // Load Google OAuth credentials
  let credentials;
  try {
    const credentialsPath = path.join(process.cwd(), 'server/config/credentials.json');
    credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  } catch (error) {
    console.error('Error loading Google OAuth credentials:', error);
    console.log('Please ensure server/config/credentials.json exists with your Google OAuth credentials');
    return;
  }

  // Configure Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: credentials.web.client_id,
    clientSecret: credentials.web.client_secret,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken: string, refreshToken: string, profile: GoogleProfile, done: any) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email found in Google profile'));
      }

      // Check if user already exists
      const existingUser = await storage.getUserByGoogleId(profile.id);
      
      if (existingUser) {
        // Update existing user with latest profile info and tokens
        const updatedUser = await storage.updateUser((existingUser as any)._id.toString(), {
          name: profile.displayName,
          email: email,
          picture: profile.photos?.[0]?.value,
          givenName: profile.name?.givenName,
          familyName: profile.name?.familyName,
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken,
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        });
        
        return done(null, updatedUser);
      } else {
        // Create new user
        const newUser = await storage.createUser({
          googleId: profile.id,
          email: email,
          name: profile.displayName,
          picture: profile.photos?.[0]?.value,
          givenName: profile.name?.givenName,
          familyName: profile.name?.familyName,
          isEngineer: false, // Default to false, can be updated later
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken,
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        });

        return done(null, newUser);
      }
    } catch (error) {
      console.error('Error in Google OAuth callback:', error);
      return done(error);
    }
  }));

  // Serialize user for session storage
  passport.serializeUser((user: any, done) => {
    done(null, user._id.toString());
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        done(null, user);
      } else {
        done(new Error('User not found'));
      }
    } catch (error) {
      done(error);
    }
  });
}

// Middleware to ensure user is authenticated
export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

// Middleware to check if user is an engineer
export function requireEngineer(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.isEngineer) {
    return next();
  }
  res.status(403).json({ error: 'Engineer access required' });
}