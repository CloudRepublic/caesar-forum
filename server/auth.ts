import { ConfidentialClientApplication, CryptoProvider } from "@azure/msal-node";
import type { Express, Request, Response } from "express";
import type { User } from "@shared/schema";

// Convert "Last, First" format to "First Last" format
function formatDisplayName(name: string): string {
  if (!name) return name;
  if (name.includes(",")) {
    const parts = name.split(",").map(p => p.trim());
    if (parts.length === 2 && parts[0] && parts[1]) {
      return `${parts[1]} ${parts[0]}`;
    }
  }
  return name;
}

declare module "express-session" {
  interface SessionData {
    user?: User;
    authState?: string;
    authCodeVerifier?: string;
  }
}

const REDIRECT_URI = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}/auth/redirect`
  : "http://localhost:5000/auth/redirect";

const POST_LOGOUT_REDIRECT_URI = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}/`
  : "http://localhost:5000/";

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET!,
  },
};

const cryptoProvider = new CryptoProvider();

let msalClient: ConfidentialClientApplication | null = null;

function getMsalClient(): ConfidentialClientApplication {
  if (!msalClient) {
    if (!process.env.AZURE_CLIENT_ID || !process.env.AZURE_TENANT_ID || !process.env.AZURE_CLIENT_SECRET) {
      throw new Error("Azure AD configuration missing");
    }
    msalClient = new ConfidentialClientApplication(msalConfig);
  }
  return msalClient;
}

export function registerAuthRoutes(app: Express): void {
  app.get("/auth/login", async (req: Request, res: Response) => {
    try {
      const { verifier, challenge } = await cryptoProvider.generatePkceCodes();
      const state = cryptoProvider.createNewGuid();

      req.session.authState = state;
      req.session.authCodeVerifier = verifier;

      const authCodeUrl = await getMsalClient().getAuthCodeUrl({
        scopes: ["openid", "profile", "email"],
        redirectUri: REDIRECT_URI,
        codeChallenge: challenge,
        codeChallengeMethod: "S256",
        state,
        prompt: "select_account",
      });

      res.redirect(authCodeUrl);
    } catch (error) {
      console.error("Error initiating login:", error);
      res.redirect("/?error=login_failed");
    }
  });

  app.get("/auth/redirect", async (req: Request, res: Response) => {
    try {
      const { code, state, error, error_description } = req.query;

      if (error) {
        console.error("Auth error:", error, error_description);
        return res.redirect("/?error=auth_failed");
      }

      if (!code || typeof code !== "string") {
        return res.redirect("/?error=no_code");
      }

      if (state !== req.session.authState) {
        return res.redirect("/?error=invalid_state");
      }

      const tokenResponse = await getMsalClient().acquireTokenByCode({
        code,
        scopes: ["openid", "profile", "email"],
        redirectUri: REDIRECT_URI,
        codeVerifier: req.session.authCodeVerifier,
      });

      if (!tokenResponse || !tokenResponse.account) {
        return res.redirect("/?error=no_token");
      }

      const account = tokenResponse.account;
      const idTokenClaims = tokenResponse.idTokenClaims as Record<string, unknown>;

      const user: User = {
        id: account.localAccountId || account.homeAccountId,
        name: formatDisplayName((idTokenClaims.name as string) || account.name || "Onbekende gebruiker"),
        email: (idTokenClaims.preferred_username as string) || 
               (idTokenClaims.email as string) || 
               account.username || 
               "",
      };

      req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session:", err);
          return res.redirect("/?error=session_error");
        }

        req.session.user = user;

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Error saving session:", saveErr);
            return res.redirect("/?error=session_error");
          }
          res.redirect("/");
        });
      });
    } catch (error) {
      console.error("Error completing login:", error);
      res.redirect("/?error=token_failed");
    }
  });

  app.get("/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
      
      res.clearCookie("connect.sid");
      
      const logoutUrl = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(POST_LOGOUT_REDIRECT_URI)}`;
      res.redirect(logoutUrl);
    });
  });

  app.get("/api/me", (req: Request, res: Response) => {
    if (req.session.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });
}
