import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase-applet-config.json"), "utf8"));

async function startServer() {
  // Initialize Firebase Admin with project identification

  const projectToUse = firebaseConfig.projectId;
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  
  console.log(`[Firebase Admin] Detected Project ID from config: ${projectToUse}`);
  console.log(`[Firebase Admin] Detected Database ID from config: ${dbId}`);
  console.log(`[Firebase Admin] Process Environment Project: ${process.env.GOOGLE_CLOUD_PROJECT || 'not set'}`);

  let adminApp: admin.app.App;
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0]!;
    console.log(`[Firebase Admin] Re-using existing app: ${adminApp.name}`);
  } else {
    // Attempt to initialize with specific project ID first
    try {
      adminApp = admin.initializeApp({ 
        projectId: projectToUse
      });
      console.log(`[Firebase Admin] Initialized with config projectId: ${projectToUse}`);
    } catch (e: any) {
      console.warn(`[Firebase Admin] Failed initializing with projectId ${projectToUse}, trying default:`, e.message);
      adminApp = admin.initializeApp();
    }
  }

  const auth = adminApp.auth();
  
  // Use getFirestore with explicit databaseId if provided
  const db = getFirestore(adminApp, dbId === '(default)' ? undefined : dbId);
  
  console.log(`[Firebase Admin] SDK Active. Effective Project: ${adminApp.options.projectId || 'Implicit'}, Database: ${dbId}`);

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware to verify Admin role
  const verifyAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      console.log(`[Auth] Verifying token for user...`);
      const decodedToken = await auth.verifyIdToken(idToken);
      console.log(`[Auth] User verified: ${decodedToken.email} (${decodedToken.uid})`);

      console.log(`[Firestore] Fetching profile for ${decodedToken.uid} from ${dbId}...`);
      let userData: any = null;
      try {
        console.log(`[Firestore] Attempting to fetch document users/${decodedToken.uid} on database ${dbId}`);
        const userDoc = await db.collection("users").doc(decodedToken.uid).get();
        userData = userDoc.data();
        console.log(`[Firestore] Profile fetched:`, userData ? "exists" : "not found");
      } catch (dbError: any) {
        console.error(`[Firestore Error] Failed to fetch user document for ${decodedToken.uid}:`, dbError);
        console.error(`[Firestore Debug] App Options:`, JSON.stringify(adminApp.options));
        console.error(`[Firestore Debug] Database ID used: ${dbId}`);
        
        // Fallback to bootstrap admin if db fails (e.g. initial setup or IAM delay)
        if (decodedToken.email === "riteshgarad4@gmail.com") {
          console.log(`[Auth] Bootstrap admin detected via email fallback`);
          userData = { 
            role: "Admin", 
            email: decodedToken.email, 
            name: decodedToken.name || "Master Admin",
            uid: decodedToken.uid 
          };
        } else {
          return res.status(500).json({ 
            error: `Database error: ${dbError.message}`,
            details: dbError.code === 7 ? "IAM Permission Denied. Ensure the service account has access to the Firestore database." : undefined
          });
        }
      }

      const role = userData?.role || (decodedToken.email === "riteshgarad4@gmail.com" ? "Admin" : null);

      if (role !== "Admin") {
        return res.status(403).json({ error: "Forbidden: Admin access required" });
      }

      (req as any).user = decodedToken;
      next();
    } catch (error) {
      console.error("Auth Error:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Admin: Create User
  app.post("/api/admin/create-user", verifyAdmin, async (req, res) => {
    const { email, password, name, role, department } = req.body;

    try {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      });

      await db.collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        name,
        role,
        department: department || "General",
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
      });

      res.json({ success: true, uid: userRecord.uid });
    } catch (error: any) {
      console.error("Create User Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: List Users
  app.get("/api/admin/users", verifyAdmin, async (req, res) => {
    try {
      console.log(`[Firestore] Fetching all users from ${dbId}...`);
      const usersSnapshot = await db.collection("users").get();
      const users = usersSnapshot.docs.map(doc => doc.data());
      console.log(`[Firestore] Successfully fetched ${users.length} users`);
      res.json(users);
    } catch (error: any) {
      console.error("[Firestore Error] Failed to list users:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Update User
  app.patch("/api/admin/users/:uid", verifyAdmin, async (req, res) => {
    const { uid } = req.params;
    const updates = req.body;

    try {
      await db.collection("users").doc(uid).update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Delete User (Hard Delete)
  app.delete("/api/admin/users/:uid", verifyAdmin, async (req, res) => {
    const { uid } = req.params;
    try {
      // 1. Delete from Firebase Auth
      await auth.deleteUser(uid);
      // 2. Delete from Firestore
      await db.collection("users").doc(uid).delete();
      
      res.json({ success: true, message: "Operative scrubbed from system" });
    } catch (error: any) {
      console.error("Delete User Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get User Email (Helper for client-side reset)
  app.get("/api/admin/users/:uid/email", verifyAdmin, async (req, res) => {
    const { uid } = req.params;
    try {
      const userRecord = await auth.getUser(uid);
      res.json({ email: userRecord.email });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
