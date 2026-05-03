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

  // Diagnostic: FCM Check
  console.log(`[Firebase Cloud Messaging] Node Active. Built-in push delivery online.`);

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS Middleware for Mobile App Support (Median)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    // Handle Preflight OPTIONS
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

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

  // Utility to log automation events safely
  const logAutomationEvent = async (event: any) => {
    try {
      // Deep clean to ensure no undefined values are sent to Firestore
      const cleanEvent = JSON.parse(JSON.stringify(event, (key, value) => 
        value === undefined ? null : value
      ));
      
      await db.collection('automation_logs').add({
        ...cleanEvent,
        timestamp: FieldValue.serverTimestamp()
      });
    } catch (logErr: any) {
      console.warn(`[Automation Log] Best-effort logging failed: ${logErr.message}. Primary operation continued.`);
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      resendConfigured: !!process.env.RESEND_API_KEY,
      environment: process.env.NODE_ENV || 'development'
    });
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
        // Dynamically identify Finance Head recipients
        let financeHeadEmails = ["riteshgarad4@gmail.com"]; // Fallback to Admin
        try {
          const financeHeadsSnap = await db.collection('users')
            .where('department', '==', 'Finance')
            .where('role', 'in', ['Department Head', 'Dept Head', 'Admin'])
            .get();
          
          if (!financeHeadsSnap.empty) {
            const foundEmails = financeHeadsSnap.docs.map(doc => doc.data().email).filter(e => !!e);
            if (foundEmails.length > 0) {
              financeHeadEmails = foundEmails;
            }
          }
          console.log(`[Email Automation] Identified Finance Heads: ${financeHeadEmails.join(', ')}`);
        } catch (dbErr) {
          console.warn("[Email Automation] DB lookup for Finance Head failed, using fallback.");
        }

        // Notify Finance Head
        emailOptions = {
          from: "NGO Mission Control <notifications@resend.dev>",
          to: financeHeadEmails,
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
      } else if (type === 'REPORT_SUMMARY') {
        emailOptions = {
          from: "NGO Impact Audit <reports@resend.dev>",
          to: to || ["riteshgarad4@gmail.com", "yuktagarad@gmail.com"],
          subject: subject || `WEEKLY IMPACT REPORT: ${new Date().toLocaleDateString()}`,
          html: html || `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #4A1412; border-radius: 24px; background-color: #fafaf9;">
            <div style="background-color: #4A1412; color: white; padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">GARAD FOUNDATION</h1>
              <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">MISSION BHARARI OS • AUDIT COMMUNIQUE</p>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #4A1412; border-bottom: 2px solid #E2E8F0; padding-bottom: 15px;">Operational Summary</h2>
              <p style="font-size: 14px; color: #475569; line-height: 1.6;">${message || 'The weekly mission audit has been finalized. Access the full strategic dashboard for deep-dive analytics.'}</p>
              <div style="margin-top: 30px; text-align: center;">
                <p style="font-size: 10px; font-weight: bold; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px;">Verified by Mission Bharari OS Security Protocols</p>
              </div>
            </div>
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
      
      // Log to automation_logs safely
      await logAutomationEvent({
        action: 'Email Dispatch',
        type: type || 'GENERIC',
        recipient: emailOptions.to || 'Unknown',
        subject: emailOptions.subject || 'No Subject',
        status: 'success',
        resendId: data.data?.id || 'resend-dispatch-confirmed',
        details: `Autonomous signal transmitted to ${Array.isArray(emailOptions.to) ? emailOptions.to.join(', ') : emailOptions.to}`
      });

      res.json({ success: true, id: data.data?.id });
    } catch (error: any) {
      console.error("[Resend Error]:", error);
      
      // Log failure safely
      await logAutomationEvent({
        action: 'Email Dispatch',
        type: type || 'GENERIC',
        status: 'error',
        error: error.message,
        details: `Transmission failure: ${error.message}`
      });

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

  // Firebase Cloud Messaging Push Notification Endpoint
  app.post("/api/notify/push", verifyAuth, async (req, res) => {
    const { title, message, url, data, userId, externalIds, segment } = req.body;

    try {
      let targetFcmTokens: string[] = [];
      let targetOneSignalIds: string[] = [];
      
      console.log(`[Push] Targeting request:`, { userId, externalIds, segment, title });
  
      if (userId || (externalIds && externalIds.length > 0)) {
        // Target specific user(s)
        const idsToTarget = (externalIds && externalIds.length > 0) ? externalIds : [userId];
        
        const usersSnapshot = await db.collection("users")
          .where(admin.firestore.FieldPath.documentId(), "in", idsToTarget)
          .get();
          
        usersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.fcmToken) targetFcmTokens.push(data.fcmToken);
          if (data.onesignalId) targetOneSignalIds.push(data.onesignalId);
        });
          
        console.log(`[Push] Found ${targetFcmTokens.length} FCM tokens and ${targetOneSignalIds.length} OneSignal IDs`);
      } else if (segment === 'Subscribed Users' || !segment) {
        // Broadcast
        const usersSnapshot = await db.collection("users").get();
        usersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.fcmToken) targetFcmTokens.push(data.fcmToken);
          if (data.onesignalId) targetOneSignalIds.push(data.onesignalId);
        });
      }
  
      if (targetFcmTokens.length === 0 && targetOneSignalIds.length === 0) {
        return res.status(200).json({ success: false, message: "No target signals found" });
      }

      const results = { fcm: null as any, onesignal: null as any };

      // 1. Send FCM
      if (targetFcmTokens.length > 0) {
        const messagePayload = {
          notification: { title, body: message },
          data: { ...data, url: url || '' },
          tokens: targetFcmTokens,
        };
        results.fcm = await admin.messaging().sendEachForMulticast(messagePayload);
      }

      // 2. Send OneSignal
      if (targetOneSignalIds.length > 0) {
        const appId = process.env.VITE_ONESIGNAL_APP_ID;
        const apiKey = process.env.ONESIGNAL_REST_API_KEY;

        if (appId && apiKey) {
          try {
            const osResponse = await fetch("https://onesignal.com/api/v1/notifications", {
              method: "POST",
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Basic ${apiKey}`
              },
              body: JSON.stringify({
                app_id: appId,
                include_player_ids: targetOneSignalIds,
                contents: { en: message },
                headings: { en: title },
                url: url || "",
                data: data || {}
              })
            });
            results.onesignal = await osResponse.json();
            console.log("[Push] OneSignal success:", results.onesignal);
          } catch (osErr) {
            console.error("[Push] OneSignal direct error:", osErr);
          }
        } else {
          console.warn("[Push] OneSignal keys missing in environment");
        }
      }
  
      // Log to automation_logs safely
      await logAutomationEvent({
        action: 'Push Notification Dispatch',
        title,
        message,
        recipient: userId || (externalIds ? `Bulk: ${externalIds.length}` : 'Broadcast'),
        status: 'dispatched',
        details: `Signals sent: FCM(${targetFcmTokens.length}), OneSignal(${targetOneSignalIds.length})`
      });

      res.status(200).json({ success: true, results });
    } catch (error: any) {
      console.error("[FCM Error]:", error);
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

  // Optimized Email Automation Endpoint (Mobile Ready)
  app.post("/api/send-email", async (req, res) => {
    const { requesterEmail, amount, status, requesterName, message, type, reason } = req.body;

    // 1. Payload Validation
    if (!requesterEmail || !amount || !status) {
      return res.status(400).json({ 
        error: "Missing required fields: requesterEmail, amount, and status are mandatory." 
      });
    }

    if (!resend) {
      return res.status(503).json({ error: "Resend API Key is missing. Configure RESEND_API_KEY." });
    }

    try {
      // 2. Logic: From address handling (Use onboarding@resend.dev for dev)
      const fromEmail = "NGO Mission Control <onboarding@resend.dev>";
      
      // 3. Design: Professional HTML Template
      const htmlContent = `
        <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #f8fafc; border-radius: 24px;">
          <div style="background-color: white; padding: 40px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="margin-bottom: 32px; border-bottom: 2px solid #3b82f6; padding-bottom: 16px;">
              <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em;">Mission Hub <span style="color: #3b82f6;">Automata</span></h1>
            </div>
            
            <div style="margin-bottom: 32px;">
              <p style="color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em; margin-bottom: 8px;">Request Status Update</p>
              <h2 style="color: #0f172a; margin: 0; font-size: 32px; font-weight: 900;">${status === 'Approved' ? '✅ Authorized' : '❌ Declined'}</h2>
            </div>

            <div style="background-color: #f1f5f9; padding: 24px; border-radius: 16px; margin-bottom: 32px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                <span style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Amount</span>
                <span style="color: #0f172a; font-size: 16px; font-weight: 800;">₹${amount}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                <span style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Beneficiary</span>
                <span style="color: #0f172a; font-size: 14px; font-weight: 700;">${requesterName || requesterEmail}</span>
              </div>
              ${message ? `
                <div style="margin-top: 16px;">
                  <span style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Message</span>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 8px 0 0 0; font-style: italic;">"${message}"</p>
                </div>
              ` : ''}
              ${reason ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 2px dashed #cbd5e1;">
                  <span style="color: #e11d48; font-size: 13px; font-weight: 600; text-transform: uppercase;">Notes from Finance</span>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 8px 0 0 0;">${reason}</p>
                </div>
              ` : ''}
            </div>

            <div style="text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; font-weight: 500; margin: 0;">
                Transmission generated by Garad Hub OS v5.2<br/>
                Timestamp: ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      `;

      const response = await resend.emails.send({
        from: fromEmail,
        to: requesterEmail,
        subject: `[MISSION UPDATE] Request ${status}: ₹${amount}`,
        html: htmlContent,
      });

      // Log success to DB safely
      await logAutomationEvent({
        action: 'Email Dispatch',
        status: 'success',
        recipient: requesterEmail || 'Unknown',
        amount: amount || 0,
        resendId: response.data?.id || 'resend-dispatch-confirmed',
        details: `Absolute URL Endpoint Triggered for mobile compatibility.`
      });

      return res.status(200).json({ success: true, id: response.data?.id });
    } catch (error: any) {
      console.error("[Absolute API Error]:", error);
      return res.status(500).json({ error: error.message });
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
