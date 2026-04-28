import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import { Resend } from "resend";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "firebase-applet-config.json"), "utf8"));
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function startServer() {
  // Initialize Firebase Admin with project identification
  for (const app of admin.apps) {
    if (app) {
      console.log(`[Firebase Admin] Deleting existing app: ${app.name}`);
      await app.delete();
    }
  }

  const projectToUse = firebaseConfig.projectId;
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  
  console.log(`[Firebase Admin] Initializing with Project ID: ${projectToUse}, Database ID: ${dbId}`);

  const adminApp = admin.initializeApp({ 
    projectId: projectToUse
  });

  const auth = admin.auth(adminApp);
  const db = getFirestore(adminApp, dbId === '(default)' ? undefined : dbId);
  
  console.log(`[Firebase Admin] SDK Active. Project: ${projectToUse}, Database: ${dbId}`);

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
      const decodedToken = await auth.verifyIdToken(idToken);
      
      let userData: any = null;
      try {
        const userDoc = await db.collection("users").doc(decodedToken.uid).get();
        userData = userDoc.data();
      } catch (dbError: any) {
        console.error(`[Firestore Error] Failed to fetch user document for ${decodedToken.uid}:`, dbError);
        
        // Fallback to bootstrap admin if db fails (e.g. initial setup or IAM delay)
        if (decodedToken.email === "riteshgarad4@gmail.com") {
          userData = { 
            role: "Admin", 
            email: decodedToken.email, 
            name: decodedToken.name || "Master Admin",
            uid: decodedToken.uid 
          };
        } else {
          return res.status(500).json({ 
            error: `Database error: ${dbError.message}`
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

  // Middleware to verify ANY authenticated user (Volunteer, Admin, Dept Head)
  const verifyAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      (req as any).user = decodedToken;
      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Email Automation Route
  app.post("/api/automation/send-email", verifyAuth, async (req, res) => {
    const { type, to, subject, html, text, amount, requesterName, requesterEmail, message, status, reason } = req.body;

    if (!resend) {
      console.warn("[Resend] API Key missing. Skipping email.");
      return res.status(503).json({ error: "Email service not configured. Add RESEND_API_KEY to secrets." });
    }

    try {
      let emailOptions: any = {};

      if (type === 'REQUEST_TO_FINANCE') {
        // Notify Finance Head
        emailOptions = {
          from: "NGO Mission Control <notifications@resend.dev>",
          to: "yukta-finance-head@gmail.com", // Finance Head Email
          subject: subject || `[FISCAL ALERT] New Expense Request: ₹${amount || '0'}`,
          html: html || `<div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #1e40af;">New Expense Authorization Required</h2>
            <p><strong>From:</strong> ${requesterName}</p>
            <p><strong>Amount:</strong> ₹${amount}</p>
            <p><strong>Professional Message:</strong></p>
            <blockquote style="border-left: 4px solid #1e40af; padding-left: 15px; font-style: italic;">${message}</blockquote>
            <p style="margin-top: 20px;">Review this in the Command Center Dashboard.</p>
          </div>`
        };
      } else if (type === 'DECISION_TO_VOLUNTEER') {
        // Send back to Volunteer
        emailOptions = {
          from: "NGO Finance Department <finance@resend.dev>",
          to: requesterEmail || to,
          subject: subject || `Update on your Expense Request: ${status}`,
          html: html || `<div style="font-family: sans-serif; padding: 20px; border: 1px solid ${status === 'Approved' ? '#10b981' : '#ef4444'}; border-radius: 12px; background-color: ${status === 'Approved' ? '#f0fdf4' : '#fef2f2'};">
            <h2 style="color: ${status === 'Approved' ? '#059669' : '#dc2626'}; text-transform: uppercase;">Request ${status}</h2>
            <p>Hello ${requesterName},</p>
            <p>Your request for <strong>₹${amount}</strong> has been <strong>${status.toUpperCase()}</strong>.</p>
            ${reason ? `<div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;"><p><strong>Note:</strong> ${reason}</p></div>` : ''}
            <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">Mission Control Finance Hub.</p>
          </div>`
        };
      } else {
        // Generic send
        emailOptions = {
          from: "NGO Mission Control <onboarding@resend.dev>",
          to: to || "riteshgarad4@gmail.com",
          subject,
          html,
          text
        };
      }

      const data = await resend.emails.send(emailOptions);
      res.json({ success: true, id: data.data?.id });
    } catch (error: any) {
      console.error("[Resend Error]:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Notify Admins & Finance Head about new requests
  app.post("/api/notify/expense-request", verifyAuth, async (req, res) => {
    const { requestId, amount, requesterName, description } = req.body;

    try {
      console.log(`[Notification] Fetching all users to identify recipients...`);
      const usersSnap = await db.collection('users').get();
      
      const batch = db.batch();
      const notifiedUids = new Set<string>();
      let recipientsCount = 0;

      usersSnap.forEach(doc => {
        const userData = doc.data();
        const isAdmin = userData.role === 'Admin';
        const isFinanceHead = (userData.role === 'Department Head' || userData.role === 'Dept Head') && userData.department === 'Finance';

        if ((isAdmin || isFinanceHead) && !notifiedUids.has(doc.id)) {
          const notificationRef = db.collection(`users/${doc.id}/notifications`).doc();
          batch.set(notificationRef, {
            type: 'approval',
            title: 'New Expense Authorization Required',
            message: `${requesterName} is requesting ₹${amount} for ${description}.`,
            timestamp: FieldValue.serverTimestamp(),
            isRead: false,
            relatedId: requestId,
            priority: 'high'
          });
          notifiedUids.add(doc.id);
          recipientsCount++;
        }
      });

      if (recipientsCount > 0) {
        await batch.commit();
        console.log(`[Notification] Successfully sent notifications to ${recipientsCount} recipients.`);
      } else {
        console.warn(`[Notification] No eligible recipients (Admins or Finance Heads) found in system.`);
      }

      res.json({ success: true, count: recipientsCount });
    } catch (error: any) {
      console.error("[Notification Error]:", error);
      res.status(500).json({ error: error.message });
    }
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
