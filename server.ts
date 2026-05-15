console.log("🔥 SERVER IS RUNNING - NEW VERSION LOADED");
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.ts";
import { testCases, regressionCycles, executionResults, users, bugs, bugHistory, auditLogs } from "./src/db/schema.ts";
import { eq, and, desc, notInArray } from "drizzle-orm";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '100mb' })); // Further increased limit for larger payloads
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  app.use(cookieParser());

  // --- API Routes ---

  // Auth
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    
    const user = db.select().from(users).where(eq(users.email, email)).get();

    if (!user) {
      console.log(`Login failed: User not found for ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.password !== password) {
      console.log(`Login failed: Password mismatch for ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`Login successful for: ${email}`);
    res.cookie("userId", user.id, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.json(user);
  });

  app.post("/api/logout", (req, res) => {
    res.clearCookie("userId");
    res.json({ success: true });
  });

  app.get("/api/me", async (req, res) => {
    const userId = req.cookies.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    
    const user = db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) return res.status(401).json({ error: "User not found" });
    
    res.json(user);
  });

  // Users
  app.get("/api/users", async (req, res) => {
    const allUsers = db.select().from(users).all();
    res.json(allUsers);
  });

  app.post("/api/users", async (req, res) => {
    const data = req.body;
    db.insert(users).values({ ...data, createdAt: new Date() }).run();
    res.json({ success: true });
  });

  app.put("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const { createdAt, ...updateData } = req.body;
    db.update(users).set(updateData).where(eq(users.id, id)).run();
    res.json({ success: true });
  });

  app.delete("/api/users/:id", async (req, res) => {
    const id = req.params.id.trim();
    try {
      const result = db.delete(users).where(eq(users.id, id)).run();
      if (result.changes === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error(`Failed to delete user ${id}:`, err);
      res.status(500).json({ error: "Could not delete member. They might be linked to existing test cases or bugs." });
    }
  });

  // Test Cases
  app.get("/api/test-cases", async (req, res) => {
    const allCases = db.select().from(testCases).all();
    res.json(allCases);
  });

  app.post("/api/test-cases", async (req, res) => {
    const { createdBy, ...data } = req.body;
    db.insert(testCases).values({ 
      ...data, 
      createdBy: createdBy || null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    }).run();
    res.json({ success: true });
  });

  // Bulk Import Test Cases
  app.post("/api/test-cases/bulk", async (req, res) => {
    const { data, overwrite } = req.body;
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const tc of data) {
      try {
        const existing = db.select().from(testCases).where(eq(testCases.id, tc.id)).get();
        if (existing) {
          if (overwrite) {
            db.update(testCases)
              .set({ ...tc, updatedAt: new Date() })
              .where(eq(testCases.id, tc.id))
              .run();
            successCount++;
          } else {
            failedCount++;
            errors.push(`Test Case ${tc.id} already exists (skipping)`);
          }
        } else {
          db.insert(testCases)
            .values({ ...tc, createdAt: new Date(), updatedAt: new Date() })
            .run();
          successCount++;
        }
      } catch (err: any) {
        failedCount++;
        errors.push(`Error importing ${tc.id}: ${err.message}`);
      }
    }
    res.json({ successCount, failedCount, errors });
  });

  app.put("/api/test-cases/:id", async (req, res) => {
    const { id } = req.params;
    const { createdBy, createdAt, updatedAt, ...updateData } = req.body;
    db.update(testCases)
      .set({ 
        ...updateData, 
        createdBy: createdBy || null,
        updatedAt: new Date() 
      })
      .where(eq(testCases.id, id))
      .run();
    res.json({ success: true });
  });

  app.delete("/api/test-cases/:id", async (req, res) => {
    const id = req.params.id.trim();
    try {
      const result = db.delete(testCases).where(eq(testCases.id, id)).run();
      if (result.changes === 0) {
        return res.status(404).json({ error: "Test Case not found" });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error(`Failed to delete test case ${id}:`, err.message);
      // More specific error handling could be added here if needed
      res.status(500).json({ error: "Could not delete test case due to a server error." });
    }
  });

  // Regression Cycles
  app.get("/api/cycles", async (req, res) => {
    const allCycles = db.select().from(regressionCycles).orderBy(desc(regressionCycles.createdAt)).all();
    res.json(allCycles);
  });

  app.post("/api/cycles", async (req, res) => {
    const { startDate, endDate, ownerId, ...rest } = req.body;
    db.insert(regressionCycles).values({ 
      ...rest, 
      ownerId: ownerId || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdAt: new Date() 
    }).run();
    res.json({ success: true });
  });

  app.put("/api/cycles/:id", async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate, ownerId, createdAt, ...rest } = req.body;
    db.update(regressionCycles)
      .set({ 
        ...rest, 
        ownerId: ownerId || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      })
      .where(eq(regressionCycles.id, id))
      .run();
    res.json({ success: true });
  });

  app.delete("/api/cycles/:id", async (req, res) => {
    const id = req.params.id.trim();
    console.log(`Server: Request to delete cycle [${id}]`);
    try {
      const result = db.delete(regressionCycles).where(eq(regressionCycles.id, id)).run();
      if (result.changes === 0) {
        console.warn(`Server: Cycle [${id}] not found in database`);
        return res.status(404).json({ error: "Cycle not found" });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error(`Failed to delete cycle ${id}:`, err);
      res.status(500).json({ error: "Could not delete cycle due to a server error." });
    }
  });

  // Execution Results
  app.get("/api/results", async (req, res) => {
    const allResults = db.select().from(executionResults).orderBy(desc(executionResults.updatedAt)).all();
    res.json(allResults);
  });

  app.get("/api/results/:cycleId", async (req, res) => {
    const { cycleId } = req.params;
    const results = db.select().from(executionResults).where(eq(executionResults.cycleId, cycleId)).all();
    res.json(results);
  });

  app.post("/api/results", async (req, res) => {
    const { cycleId, testCaseId, status, testerId, remarks, environment, buildVersion } = req.body;
    
    // Find the latest existing result for this test case in this cycle
    const existing = db.select().from(executionResults) 
      .where(and(eq(executionResults.cycleId, cycleId), eq(executionResults.testCaseId, testCaseId)))
      .orderBy(desc(executionResults.updatedAt))
      .get();

    if (existing) {
      db.update(executionResults)
        .set({ status, testerId: testerId || null, remarks, environment, buildVersion, executionDate: new Date(), updatedAt: new Date() })
        .where(eq(executionResults.id, existing.id))
        .run();
    } else {
      db.insert(executionResults)
        .values({ cycleId, testCaseId, status, testerId: testerId || null, remarks, environment, buildVersion, executionDate: new Date() })
        .run();
    }
    res.json({ success: true });
  });

  // Bugs
  app.get("/api/bugs", async (req, res) => {
    const allBugs = db.select().from(bugs).orderBy(desc(bugs.createdAt)).all();
    res.json(allBugs);
  });

  app.post("/api/bugs", async (req, res) => {
    const { closedAt, testCaseId, cycleId, assigneeId, qaId, ...rest } = req.body;
    const data = {
      ...rest,
      testCaseId: testCaseId || null,
      cycleId: cycleId || null,
      assigneeId: assigneeId || null,
      qaId: qaId || null,
      closedAt: closedAt ? new Date(closedAt) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.insert(bugs).values(data).run();
    // Audit Log
    db.insert(auditLogs).values({ 
      userId: data.qaId, 
      action: 'Created Bug', 
      targetType: 'Bug', 
      targetId: data.id, 
      details: data.title 
    }).run();
    res.json({ success: true });
  });

  // Bulk Import Bugs
  app.post("/api/bugs/bulk", async (req, res) => {
    const { data, overwrite } = req.body;
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const bug of data) {
      try {
        const existing = db.select().from(bugs).where(eq(bugs.id, bug.id)).get();
        const bugData = {
          ...bug,
          createdAt: bug.createdAt ? new Date(bug.createdAt) : new Date(),
          updatedAt: bug.updatedAt ? new Date(bug.updatedAt) : new Date(),
          closedAt: bug.closedAt ? new Date(bug.closedAt) : null,
        };

        if (existing) {
          if (overwrite) {
            db.update(bugs)
              .set(bugData)
              .where(eq(bugs.id, bug.id))
              .run();
            successCount++;
          } else {
            failedCount++;
            errors.push(`Bug ${bug.id} already exists (skipping)`);
          }
        } else {
          db.insert(bugs)
            .values(bugData)
            .run();
          successCount++;
        }
      } catch (err: any) {
        failedCount++;
        errors.push(`Error importing ${bug.id}: ${err.message}`);
      }
    }
    res.json({ successCount, failedCount, errors });
  });

  app.put("/api/bugs/:id", async (req, res) => {
    const { id } = req.params;
    const { status, assigneeId, testCaseId, cycleId, qaId, createdAt, updatedAt, closedAt, reopenCount: _rc, ...rest } = req.body;
    
    const existing = db.select().from(bugs).where(eq(bugs.id, id)).get();
    if (!existing) return res.status(404).json({ error: "Bug not found" });

    let reopenCount = existing.reopenCount;
    if (existing.status === 'Done' && status === 'Reopen') {
      reopenCount = (reopenCount || 0) + 1;
    }

    db.update(bugs).set({ 
      status, 
      assigneeId: assigneeId || null, 
      testCaseId: testCaseId || null,
      cycleId: cycleId || null,
      qaId: qaId || null,
      ...rest, 
      reopenCount, 
      updatedAt: new Date(),
      closedAt: status === 'Done' ? new Date() : (closedAt ? new Date(closedAt) : null)
    }).where(eq(bugs.id, id)).run();
    
    // History
    if (existing.status !== status) {
      db.insert(bugHistory).values({
        bugId: id,
        fromStatus: existing.status,
        toStatus: status,
        action: 'Status Change',
        createdAt: new Date()
      }).run();
    }

    res.json({ success: true });
  });

  app.delete("/api/bugs/:id", async (req, res) => {
    const id = req.params.id.trim();
    try {
      const result = db.delete(bugs).where(eq(bugs.id, id)).run();
      if (result.changes === 0) {
        return res.status(404).json({ error: "Bug not found" });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error(`Failed to delete bug ${id}:`, err);
      res.status(500).json({ error: "Could not delete bug due to a server error." });
    }
  });

  // Robust cleanup and seeding
  try {
    const demoUsers = [
      { id: "U001", name: "QA Admin", email: "admin@vibe.qa", password: "admin123", role: "Admin" },
      { id: "U002", name: "Tester One", email: "tester@vibe.qa", password: "tester123", role: "Tester" },
    ];

    const allUserIds = demoUsers.map(u => u.id);
    const currentUsers = db.select().from(users).all();
    
    // We only delete users if they are not in our demo list.
    // If a deletion fails due to foreign keys, we log it and continue.
    for (const u of currentUsers) {
      if (!allUserIds.includes(u.id)) {
        try {
          db.delete(users).where(eq(users.id, u.id)).run();
        } catch (e) {
          console.warn(`Could not delete user ${u.id} due to constraints:`, e);
          // If we can't delete them, maybe we can at least rename them or ignore them
        }
      }
    }

    let needsSeeding = false;
    for (const u of demoUsers) {
      const existing = db.select().from(users).where(eq(users.id, u.id)).get();
      if (!existing) {
        db.insert(users).values(u).run();
        needsSeeding = true;
      } else {
        db.update(users).set(u).where(eq(users.id, u.id)).run();
      }
    }

    if (needsSeeding) {
      console.log("Adding initial data...");
      const tcCount = db.select().from(testCases).all().length;
      if (tcCount === 0) {
        db.insert(testCases).values([
          { id: "TC001", module: "Auth", feature: "Login", title: "Login with valid credentials", steps: "1. Enter email\n2. Enter password\n3. Click Login", expectedResult: "Dashboard visible", priority: "High", severity: "Critical", automationStatus: "Automated", createdBy: "U001" },
          { id: "TC002", module: "Auth", feature: "Login", title: "Forgot Password link", steps: "1. Click Forgot Password", expectedResult: "Email entry form shown", priority: "Medium", severity: "Major", automationStatus: "Manual", createdBy: "U001" },
          { id: "TC003", module: "Checkout", feature: "Payment", title: "Payment with Visa", steps: "1. Add to cart\n2. Checkout\n3. Select Visa", expectedResult: "Payment successful", priority: "High", severity: "Critical", automationStatus: "Automated", createdBy: "U001" },
        ]).run();
      }
      
      const rcCount = db.select().from(regressionCycles).all().length;
      if (rcCount === 0) {
        db.insert(regressionCycles).values([
          { id: "RC-2024-Q1", name: "Q1 Main Release", version: "v2.5.0", status: "In Progress", ownerId: "U001", startDate: new Date() },
          { id: "RC-HOTFIX-1", name: "Auth Patch", version: "v2.5.1", status: "Planned", ownerId: "U001" },
        ]).run();
      }

      const bugCount = db.select().from(bugs).all().length;
      if (bugCount === 0) {
        db.insert(bugs).values([
          { id: "BUG-101", title: "Logo missing on dark mode", status: "Todo", priority: "Low", severity: "Minor", qaId: "U001", assigneeId: "U002", cycleId: "RC-2024-Q1" },
          { id: "BUG-102", title: "Payment timeout after 30s", status: "In Progress", priority: "High", severity: "Major", qaId: "U002", assigneeId: "U001", cycleId: "RC-2024-Q1" },
        ]).run();
      }
    }
  } catch (error) {
    console.error("Critical error during seeding:", error);
  }

  // --- Vite Middleware ---
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
