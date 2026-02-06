import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import * as emailService from "./email-service.tsx";

const app = new Hono();

// Log all incoming requests (before CORS)
app.use('*', async (c, next) => {
  const method = c.req.method;
  const path = c.req.path;
  console.log(`[EDGE FUNCTION] ${method} ${path} - Request received`);
  await next();
});

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase client  
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Health check endpoint
app.get("/make-server-d8ea749c/health", (c) => {
  return c.json({ status: "ok" });
});

// ============ AUTH ROUTES ============

// Sign up - create new user with role
app.post("/make-server-d8ea749c/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role, company } = body;

    console.log(`[SIGNUP] Attempting to create user: email=${email}, role=${role}`);

    if (!email || !password || !name || !role) {
      console.log("[SIGNUP] Missing required fields");
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Create auth user with Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role, company },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (authError) {
      console.log("Error creating user in auth during signup:", authError);
      return c.json({ error: authError.message }, 400);
    }

    console.log(`[SIGNUP] Successfully created auth user: userId=${authData.user.id}`);

    // Store user profile in KV
    const userId = authData.user.id;
    const userProfile = {
      id: userId,
      email,
      name,
      role, // 'client', 'talent', 'admin', 'manager'
      company: company || null,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user:${userId}`, userProfile);
    console.log(`[SIGNUP] Successfully saved user profile to KV store`);

    return c.json({ user: userProfile });
  } catch (error) {
    console.log("Error in signup route:", error);
    return c.json({ error: "Signup failed" }, 500);
  }
});

// Get current user profile
app.get("/make-server-d8ea749c/auth/me", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log("[AUTH/ME] No access token provided");
      return c.json({ error: "No auth token provided" }, 401);
    }

    console.log("[AUTH/ME] Validating token...");
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      console.log("[AUTH/ME] Error getting user:", error?.message || error);
      console.log("[AUTH/ME] Error details:", JSON.stringify(error, null, 2));
      return c.json({ error: "Unauthorized", details: error?.message || "Token validation failed" }, 401);
    }

    console.log("[AUTH/ME] User validated, ID:", user.id);
    const userProfile = await kv.get(`user:${user.id}`);
    
    if (!userProfile) {
      console.log("[AUTH/ME] User profile not found in KV store for user ID:", user.id);
      return c.json({ error: "User profile not found", userId: user.id }, 404);
    }

    console.log("[AUTH/ME] User profile found, role:", userProfile.role);
    return c.json({ user: userProfile });
  } catch (error) {
    console.log("[AUTH/ME] Exception in auth/me route:", error);
    return c.json({ error: "Failed to get user", details: error?.message || String(error) }, 500);
  }
});

// ============ TALENT ROUTES ============

// Create/Update talent application
app.post("/make-server-d8ea749c/talent/apply", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const {
      skills, // ['photo', 'video', 'audio']
      experience,
      gear,
      portfolioLinks,
      coverageParishes,
      bio,
      references,
    } = body;

    const application = {
      id: `talent:${user.id}`,
      userId: user.id,
      skills,
      experience,
      gear,
      portfolioLinks,
      coverageParishes,
      bio,
      references: references || [],
      status: 'pending', // 'pending', 'approved', 'rejected'
      tier: null, // Will be set by manager on approval
      reliabilityScore: 100, // Internal admin metric
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`talent:${user.id}`, application);

    // Send notification to all admins about new talent application
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile) {
      const allAdmins = await kv.getByPrefix('user:');
      const adminEmails = allAdmins
        .filter((u: any) => u.role === 'admin' || u.role === 'manager')
        .map((u: any) => u.email);
      
      if (adminEmails.length > 0) {
        const platformUrl = Deno.env.get('PLATFORM_URL') || 'https://eventcoveragejamaica.com';
        await emailService.sendNewTalentApplicationNotification({
          adminEmails,
          talentId: application.id,
          talentName: userProfile.name,
          email: userProfile.email,
          specialties: skills,
          parishes: coverageParishes,
          platformUrl,
        }).catch(err => console.error('[EMAIL] Error sending talent application notification:', err));
      }
    }

    return c.json({ application });
  } catch (error) {
    console.log("Error in talent apply route:", error);
    return c.json({ error: "Failed to submit application" }, 500);
  }
});

// Get talent profile (ADMIN ONLY - talents are private)
app.get("/make-server-d8ea749c/talent/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    
    // Only admins/managers can view talent profiles, or talent viewing their own
    const talentId = c.req.param('id');
    if (userProfile.role !== 'admin' && userProfile.role !== 'manager' && user.id !== talentId) {
      return c.json({ error: "Forbidden - Talents are private" }, 403);
    }

    const talent = await kv.get(`talent:${talentId}`);
    
    if (!talent) {
      return c.json({ error: "Talent not found" }, 404);
    }

    return c.json({ talent });
  } catch (error) {
    console.log("Error in get talent route:", error);
    return c.json({ error: "Failed to get talent" }, 500);
  }
});

// Approve talent (Manager only)
app.post("/make-server-d8ea749c/talents/:id/approve", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'manager' && userProfile.role !== 'admin') {
      return c.json({ error: "Forbidden - Manager access required" }, 403);
    }

    const talentId = c.req.param('id');
    const talent = await kv.get(talentId);
    
    if (!talent) {
      return c.json({ error: "Talent not found" }, 404);
    }

    talent.status = 'approved';
    talent.tier = 'standard'; // Default tier
    talent.approvedBy = user.id;
    talent.approvedAt = new Date().toISOString();
    talent.updatedAt = new Date().toISOString();

    await kv.set(talentId, talent);

    // Send approval email to talent
    const talentUser = await kv.get(`user:${talent.userId}`);
    if (talentUser && talentUser.email) {
      const platformUrl = Deno.env.get('PLATFORM_URL') || 'https://eventcoveragejamaica.com';
      await emailService.sendTalentApprovalEmail({
        talentEmail: talentUser.email,
        talentName: talentUser.name,
        tier: talent.tier,
        platformUrl,
      }).catch(err => console.error('[EMAIL] Error sending talent approval email:', err));
    }

    return c.json({ talent });
  } catch (error) {
    console.log("Error in approve talent route:", error);
    return c.json({ error: "Failed to approve talent" }, 500);
  }
});

// Reject talent (Manager only)
app.post("/make-server-d8ea749c/talents/:id/reject", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'manager' && userProfile.role !== 'admin') {
      return c.json({ error: "Forbidden - Manager access required" }, 403);
    }

    const talentId = c.req.param('id');
    const talent = await kv.get(talentId);
    
    if (!talent) {
      return c.json({ error: "Talent not found" }, 404);
    }

    const body = await c.req.json();
    const { reason } = body;

    talent.status = 'rejected';
    talent.rejectionReason = reason;
    talent.rejectedBy = user.id;
    talent.rejectedAt = new Date().toISOString();
    talent.updatedAt = new Date().toISOString();

    await kv.set(talentId, talent);

    return c.json({ talent });
  } catch (error) {
    console.log("Error in reject talent route:", error);
    return c.json({ error: "Failed to reject talent" }, 500);
  }
});

// ============ SERVICE ROUTES (NEW) ============

// Create new service (Admin only)
app.post("/make-server-d8ea749c/services", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin access required" }, 403);
    }

    const body = await c.req.json();
    const {
      serviceName,
      category, // 'photography', 'videography', 'audio'
      subType, // 'corporate', 'festival', 'press', etc
      description,
      goodFor, // Use case tags
      deliverables,
      coverageParishes,
      sampleMedia, // ECJ-curated samples
      fulfillmentRules, // Internal: required tier, crew size, gear
      internalNotes,
    } = body;

    const serviceId = `service:${Date.now()}`;
    const service = {
      id: serviceId,
      serviceName,
      category,
      subType,
      description,
      goodFor,
      deliverables,
      coverageParishes,
      sampleMedia: sampleMedia || [],
      fulfillmentRules,
      internalNotes: internalNotes || '',
      status: 'draft', // draft, pending_approval, approved, published, paused, archived
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: null,
      // Aggregate metrics (calculated from completed jobs)
      totalEventsDelivered: 0,
      averageRating: 0,
      onTimeDeliveryRate: 100,
      repeatClientRate: 0,
    };

    await kv.set(serviceId, service);

    return c.json({ service });
  } catch (error) {
    console.log("Error in create service route:", error);
    return c.json({ error: "Failed to create service" }, 500);
  }
});

// Get all published services (Public - for clients)
app.get("/make-server-d8ea749c/services", async (c) => {
  try {
    const allServices = await kv.getByPrefix('service:');
    const publishedServices = allServices
      .filter(s => s.status === 'published')
      .map(s => ({
        id: s.id,
        serviceName: s.serviceName,
        category: s.category,
        subType: s.subType,
        description: s.description,
        goodFor: s.goodFor,
        deliverables: s.deliverables,
        coverageParishes: s.coverageParishes,
        sampleMedia: s.sampleMedia,
        totalEventsDelivered: s.totalEventsDelivered,
        averageRating: s.averageRating,
        onTimeDeliveryRate: s.onTimeDeliveryRate,
        repeatClientRate: s.repeatClientRate,
      }));

    return c.json({ services: publishedServices });
  } catch (error) {
    console.log("Error in list services route:", error);
    return c.json({ error: "Failed to list services" }, 500);
  }
});

// Get single service detail (Public)
app.get("/make-server-d8ea749c/services/:id", async (c) => {
  try {
    const serviceId = c.req.param('id');
    const service = await kv.get(serviceId);
    
    if (!service || service.status !== 'published') {
      return c.json({ error: "Service not found" }, 404);
    }

    // Return only public-facing data
    const publicService = {
      id: service.id,
      serviceName: service.serviceName,
      category: service.category,
      subType: service.subType,
      description: service.description,
      goodFor: service.goodFor,
      deliverables: service.deliverables,
      coverageParishes: service.coverageParishes,
      sampleMedia: service.sampleMedia,
      totalEventsDelivered: service.totalEventsDelivered,
      averageRating: service.averageRating,
      onTimeDeliveryRate: service.onTimeDeliveryRate,
      repeatClientRate: service.repeatClientRate,
    };

    return c.json({ service: publicService });
  } catch (error) {
    console.log("Error in get service route:", error);
    return c.json({ error: "Failed to get service" }, 500);
  }
});

// Update service (Admin only)
app.put("/make-server-d8ea749c/services/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin access required" }, 403);
    }

    const serviceId = c.req.param('id');
    const service = await kv.get(serviceId);
    
    if (!service) {
      return c.json({ error: "Service not found" }, 404);
    }

    const updates = await c.req.json();
    
    // If major changes, reset to draft or pending_approval
    const majorChangeFields = ['serviceName', 'category', 'deliverables', 'fulfillmentRules'];
    const hasMajorChanges = majorChangeFields.some(field => updates[field] !== undefined);
    
    if (hasMajorChanges && service.status === 'published') {
      updates.status = 'pending_approval';
    }

    const updatedService = {
      ...service,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(serviceId, updatedService);

    return c.json({ service: updatedService });
  } catch (error) {
    console.log("Error in update service route:", error);
    return c.json({ error: "Failed to update service" }, 500);
  }
});

// Submit service for approval (Admin)
app.post("/make-server-d8ea749c/services/:id/submit-for-approval", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: "Forbidden" }, 403);
    }

    const serviceId = c.req.param('id');
    const service = await kv.get(serviceId);
    
    if (!service) {
      return c.json({ error: "Service not found" }, 404);
    }

    service.status = 'pending_approval';
    service.updatedAt = new Date().toISOString();

    await kv.set(serviceId, service);

    // Send notification to all managers about new service submission
    const allManagers = await kv.getByPrefix('user:');
    const managerEmails = allManagers
      .filter((u: any) => u.role === 'manager')
      .map((u: any) => u.email);
    
    if (managerEmails.length > 0) {
      const platformUrl = Deno.env.get('PLATFORM_URL') || 'https://eventcoveragejamaica.com';
      const creatorProfile = await kv.get(`user:${service.createdBy}`);
      await emailService.sendNewServiceSubmissionNotification({
        managerEmails,
        serviceId: service.id,
        serviceName: service.serviceName,
        category: service.category,
        createdBy: creatorProfile?.name || 'Unknown',
        platformUrl,
      }).catch(err => console.error('[EMAIL] Error sending service submission notification:', err));
    }

    return c.json({ service });
  } catch (error) {
    console.log("Error in submit for approval route:", error);
    return c.json({ error: "Failed to submit for approval" }, 500);
  }
});

// Approve service (Manager only)
app.post("/make-server-d8ea749c/services/:id/approve", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'manager') {
      return c.json({ error: "Forbidden - Manager access required" }, 403);
    }

    const serviceId = c.req.param('id');
    const service = await kv.get(serviceId);
    
    if (!service) {
      return c.json({ error: "Service not found" }, 404);
    }

    service.status = 'approved';
    service.approvedBy = user.id;
    service.approvedAt = new Date().toISOString();
    service.updatedAt = new Date().toISOString();

    await kv.set(serviceId, service);

    return c.json({ service });
  } catch (error) {
    console.log("Error in approve service route:", error);
    return c.json({ error: "Failed to approve service" }, 500);
  }
});

// Publish service (Admin only - explicit action)
app.post("/make-server-d8ea749c/services/:id/publish", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin access required" }, 403);
    }

    const serviceId = c.req.param('id');
    const service = await kv.get(serviceId);
    
    if (!service) {
      return c.json({ error: "Service not found" }, 404);
    }

    if (service.status !== 'approved') {
      return c.json({ error: "Service must be approved before publishing" }, 400);
    }

    service.status = 'published';
    service.publishedBy = user.id;
    service.publishedAt = new Date().toISOString();
    service.updatedAt = new Date().toISOString();

    await kv.set(serviceId, service);

    // Log publish action
    const logEntry = {
      id: `log:${Date.now()}`,
      action: 'service_published',
      serviceId: service.id,
      userId: user.id,
      timestamp: new Date().toISOString(),
    };
    await kv.set(logEntry.id, logEntry);

    return c.json({ service });
  } catch (error) {
    console.log("Error in publish service route:", error);
    return c.json({ error: "Failed to publish service" }, 500);
  }
});

// Pause service (Admin only - removes from client view)
app.post("/make-server-d8ea749c/services/:id/pause", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: "Forbidden" }, 403);
    }

    const serviceId = c.req.param('id');
    const service = await kv.get(serviceId);
    
    if (!service) {
      return c.json({ error: "Service not found" }, 404);
    }

    service.status = 'paused';
    service.pausedBy = user.id;
    service.pausedAt = new Date().toISOString();
    service.updatedAt = new Date().toISOString();

    await kv.set(serviceId, service);

    return c.json({ service });
  } catch (error) {
    console.log("Error in pause service route:", error);
    return c.json({ error: "Failed to pause service" }, 500);
  }
});

// Get all services (Admin only - includes unpublished)
app.get("/make-server-d8ea749c/admin/services", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin' && userProfile.role !== 'manager') {
      return c.json({ error: "Forbidden" }, 403);
    }

    const services = await kv.getByPrefix('service:');

    return c.json({ services });
  } catch (error) {
    console.log("Error in get all services route:", error);
    return c.json({ error: "Failed to get services" }, 500);
  }
});

// Get all talents (Admin only - talents are private)
app.get("/make-server-d8ea749c/admin/talents", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin' && userProfile.role !== 'manager') {
      return c.json({ error: "Forbidden" }, 403);
    }

    const talents = await kv.getByPrefix('talent:');

    return c.json({ talents });
  } catch (error) {
    console.log("Error in get all talents route:", error);
    return c.json({ error: "Failed to get talents" }, 500);
  }
});

// Get pending talent applications (Admin/Manager only)
app.get("/make-server-d8ea749c/admin/talent/pending", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'admin' && userProfile?.role !== 'manager') {
      return c.json({ error: "Forbidden" }, 403);
    }

    const allTalents = await kv.getByPrefix('talent:');
    const pending = allTalents.filter((t: any) => t.status === 'pending');

    return c.json({ talents: pending });
  } catch (error) {
    console.log("Error in admin/talent/pending:", error);
    return c.json({ error: "Failed to get pending talents" }, 500);
  }
});

// ============ PORTFOLIO ROUTES ============

// Get all portfolio items (public read - no auth required so site portfolio page works)
app.get("/make-server-d8ea749c/portfolio", async (c) => {
  try {
    const items = await kv.getByPrefix('portfolio:');
    return c.json({ items });
  } catch (error) {
    console.log("Error in GET /portfolio:", error);
    return c.json({ error: "Failed to get portfolio" }, 500);
  }
});

// Create portfolio item (admin/manager only)
app.post("/make-server-d8ea749c/portfolio", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'admin' && userProfile?.role !== 'manager') {
      return c.json({ error: "Forbidden" }, 403);
    }

    const body = await c.req.json();
    const id = `portfolio-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const item = {
      id,
      title: body.title ?? '',
      description: body.description ?? '',
      category: body.category ?? 'photography',
      mediaUrl: body.mediaUrl ?? '',
      thumbnailUrl: body.thumbnailUrl ?? '',
      eventType: body.eventType ?? '',
      parish: body.parish ?? '',
      date: body.date ?? '',
      talentName: body.talentName ?? '',
      featured: !!body.featured,
    };

    await kv.set(`portfolio:${id}`, item);
    return c.json({ item });
  } catch (error) {
    console.log("Error in POST /portfolio:", error);
    return c.json({ error: "Failed to create portfolio item" }, 500);
  }
});

// Update portfolio item (admin/manager only)
app.put("/make-server-d8ea749c/portfolio/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'admin' && userProfile?.role !== 'manager') {
      return c.json({ error: "Forbidden" }, 403);
    }

    const id = c.req.param('id');
    const existing = await kv.get(`portfolio:${id}`);
    if (!existing) {
      return c.json({ error: "Portfolio item not found" }, 404);
    }

    const body = await c.req.json();
    const item = {
      id,
      title: body.title ?? existing.title,
      description: body.description ?? existing.description,
      category: body.category ?? existing.category,
      mediaUrl: body.mediaUrl ?? existing.mediaUrl,
      thumbnailUrl: body.thumbnailUrl ?? existing.thumbnailUrl,
      eventType: body.eventType ?? existing.eventType,
      parish: body.parish ?? existing.parish,
      date: body.date ?? existing.date,
      talentName: body.talentName ?? existing.talentName,
      featured: body.featured !== undefined ? !!body.featured : existing.featured,
    };

    await kv.set(`portfolio:${id}`, item);
    return c.json({ item });
  } catch (error) {
    console.log("Error in PUT /portfolio/:id:", error);
    return c.json({ error: "Failed to update portfolio item" }, 500);
  }
});

// Delete portfolio item (admin/manager only)
app.delete("/make-server-d8ea749c/portfolio/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile?.role !== 'admin' && userProfile?.role !== 'manager') {
      return c.json({ error: "Forbidden" }, 403);
    }

    const id = c.req.param('id');
    const existing = await kv.get(`portfolio:${id}`);
    if (!existing) {
      return c.json({ error: "Portfolio item not found" }, 404);
    }

    await kv.del(`portfolio:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log("Error in DELETE /portfolio/:id:", error);
    return c.json({ error: "Failed to delete portfolio item" }, 500);
  }
});

// ============ USER MANAGEMENT ROUTES ============

// Helper function to log activity
async function logActivity(data: {
  requestId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details?: any;
  oldValue?: any;
  newValue?: any;
}) {
  const logEntry = {
    id: `activity:${data.requestId}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
    requestId: data.requestId,
    userId: data.userId,
    userName: data.userName,
    userRole: data.userRole,
    action: data.action,
    details: data.details || null,
    oldValue: data.oldValue || null,
    newValue: data.newValue || null,
    timestamp: new Date().toISOString(),
  };
  
  await kv.set(logEntry.id, logEntry);
  console.log(`[ACTIVITY LOG] ${data.action} by ${data.userName} (${data.userRole}) on request ${data.requestId}`);
  return logEntry;
}

// ============ REQUEST ROUTES ============

// Create new request (Client only)
app.post("/make-server-d8ea749c/requests", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile) {
      return c.json({ error: "User profile not found" }, 404);
    }

    // Only clients can create requests
    if (userProfile.role !== 'client') {
      return c.json({ error: "Forbidden - Only clients can create requests" }, 403);
    }

    const body = await c.req.json();
    const {
      eventName,
      eventDate,
      eventTime,
      parish,
      venue,
      venueType,
      selectedServices,
      turnaround,
      budget,
      notes,
    } = body;

    // Validate required fields
    if (!eventName || !eventDate || !parish || !venue || !selectedServices || selectedServices.length === 0) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Get service details
    const serviceDetails = await kv.mget(selectedServices);

    // Create request
    const requestId = `request:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const request = {
      id: requestId,
      clientId: user.id,
      clientName: userProfile.name,
      clientEmail: userProfile.email,
      eventName,
      eventDate,
      eventTime: eventTime || null,
      parish,
      venue,
      venueType: venueType || null,
      selectedServices, // Array of service IDs
      serviceDetails: serviceDetails.map((s: any) => ({
        id: s.id,
        serviceName: s.serviceName,
        category: s.category,
        deliverables: s.deliverables,
      })),
      turnaround: turnaround || 'standard',
      budget: budget || null,
      notes: notes || null,
      status: 'pending', // pending, reviewing, assigned, in_progress, completed, cancelled
      assignedTalents: [], // Will be populated by admin
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(requestId, request);

    // Log activity
    await logActivity({
      requestId,
      userId: user.id,
      userName: userProfile.name,
      userRole: userProfile.role,
      action: 'request_created',
      details: {
        eventName,
        eventDate,
        parish,
        serviceCount: selectedServices.length,
      },
    });

    // Send email confirmation to client
    const platformUrl = Deno.env.get('PLATFORM_URL') || 'https://eventcoveragejamaica.com';
    await emailService.sendRequestCreatedEmail({
      clientEmail: userProfile.email,
      clientName: userProfile.name,
      requestId,
      eventName,
      eventDate,
      platformUrl,
    }).catch(err => console.error('[EMAIL] Error sending request created email:', err));

    // Send notification to all admins
    const allAdmins = await kv.getByPrefix('user:');
    const adminEmails = allAdmins
      .filter((u: any) => u.role === 'admin' || u.role === 'manager')
      .map((u: any) => u.email);
    
    if (adminEmails.length > 0) {
      await emailService.sendNewRequestNotificationToAdmins({
        adminEmails,
        requestId,
        clientName: userProfile.name,
        eventName,
        eventDate,
        parish,
        platformUrl,
      }).catch(err => console.error('[EMAIL] Error sending admin notification:', err));
    }

    console.log(`[CREATE REQUEST] Request ${requestId} created by ${userProfile.name}`);
    return c.json({ request });
  } catch (error) {
    console.error("Error in create request route:", error);
    return c.json({ error: "Failed to create request" }, 500);
  }
});

// Get all requests (Role-based access)
app.get("/make-server-d8ea749c/requests", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile) {
      return c.json({ error: "User profile not found" }, 404);
    }

    let requests = await kv.getByPrefix('request:');

    // Filter by role
    if (userProfile.role === 'client') {
      // Clients only see their own requests
      requests = requests.filter((r: any) => r.clientId === user.id);
    } else if (userProfile.role === 'talent') {
      // Talents only see requests assigned to them
      requests = requests.filter((r: any) => 
        r.assignedTalents?.some((t: any) => t.talentId === user.id)
      );
    }
    // Admins and managers see all requests

    return c.json({ requests });
  } catch (error) {
    console.error("Error in get requests route:", error);
    return c.json({ error: "Failed to get requests" }, 500);
  }
});

// Get single request with activity log
app.get("/make-server-d8ea749c/requests/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    const requestId = c.req.param('id');
    const request = await kv.get(requestId);
    
    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }

    // Check access permissions
    const isClient = userProfile.role === 'client' && request.clientId === user.id;
    const isTalent = userProfile.role === 'talent' && request.assignedTalents?.some((t: any) => t.talentId === user.id);
    const isAdminOrManager = userProfile.role === 'admin' || userProfile.role === 'manager';

    if (!isClient && !isTalent && !isAdminOrManager) {
      return c.json({ error: "Forbidden - You don't have access to this request" }, 403);
    }

    // Get activity log for this request
    const allActivities = await kv.getByPrefix(`activity:${requestId}:`);
    const activityLog = allActivities.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return c.json({ request, activityLog });
  } catch (error) {
    console.error("Error in get single request route:", error);
    return c.json({ error: "Failed to get request" }, 500);
  }
});

// Update request status (Admin/Manager only)
app.put("/make-server-d8ea749c/requests/:id/status", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin' && userProfile.role !== 'manager') {
      return c.json({ error: "Forbidden" }, 403);
    }

    const requestId = c.req.param('id');
    const request = await kv.get(requestId);
    
    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }

    const body = await c.req.json();
    const { status, note } = body;

    const validStatuses = ['pending', 'reviewing', 'assigned', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return c.json({ error: "Invalid status" }, 400);
    }

    const oldStatus = request.status;
    request.status = status;
    request.updatedAt = new Date().toISOString();

    await kv.set(requestId, request);

    // Log activity
    await logActivity({
      requestId,
      userId: user.id,
      userName: userProfile.name,
      userRole: userProfile.role,
      action: 'status_changed',
      oldValue: oldStatus,
      newValue: status,
      details: note ? { note } : null,
    });

    // Send status update email to client
    const platformUrl = Deno.env.get('PLATFORM_URL') || 'https://eventcoveragejamaica.com';
    await emailService.sendStatusUpdateEmail({
      clientEmail: request.clientEmail,
      clientName: request.clientName,
      requestId,
      eventName: request.eventName,
      oldStatus,
      newStatus: status,
      note,
      platformUrl,
    }).catch(err => console.error('[EMAIL] Error sending status update email:', err));

    // Special handling: Send completion email if status is completed
    if (status === 'completed') {
      await emailService.sendRequestCompletedEmail({
        clientEmail: request.clientEmail,
        clientName: request.clientName,
        requestId,
        eventName: request.eventName,
        platformUrl,
      }).catch(err => console.error('[EMAIL] Error sending completion email:', err));
    }

    return c.json({ request });
  } catch (error) {
    console.error("Error in update request status route:", error);
    return c.json({ error: "Failed to update request status" }, 500);
  }
});

// Assign talents to request (Admin/Manager only)
app.post("/make-server-d8ea749c/requests/:id/assign", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin' && userProfile.role !== 'manager') {
      return c.json({ error: "Forbidden" }, 403);
    }

    const requestId = c.req.param('id');
    const request = await kv.get(requestId);
    
    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }

    const body = await c.req.json();
    const { talentIds, serviceMapping } = body; // serviceMapping: { serviceId: talentId }

    // Get talent details
    const talents = await kv.mget(talentIds);
    
    const assignments = talents.map((talent: any, index: number) => ({
      talentId: talent.id,
      talentName: talent.name || talent.businessName,
      assignedAt: new Date().toISOString(),
      assignedBy: user.id,
      serviceIds: serviceMapping[talent.id] || [],
    }));

    request.assignedTalents = assignments;
    request.status = 'assigned';
    request.updatedAt = new Date().toISOString();

    await kv.set(requestId, request);

    // Log activity
    await logActivity({
      requestId,
      userId: user.id,
      userName: userProfile.name,
      userRole: userProfile.role,
      action: 'talents_assigned',
      details: {
        talentCount: talents.length,
        talentNames: talents.map((t: any) => t.name || t.businessName),
      },
    });

    // Send assignment email to each assigned talent
    const platformUrl = Deno.env.get('PLATFORM_URL') || 'https://eventcoveragejamaica.com';
    for (const assignment of assignments) {
      // Get the talent's user profile to get their email
      const talentUserId = assignment.talentId.replace('talent:', '');
      const talentUser = await kv.get(`user:${talentUserId}`);
      
      if (talentUser && talentUser.email) {
        await emailService.sendTalentAssignmentEmail({
          talentEmail: talentUser.email,
          talentName: talentUser.name,
          requestId,
          eventName: request.eventName,
          eventDate: request.eventDate,
          eventLocation: `${request.venue}, ${request.parish}`,
          role: assignment.serviceIds.length > 0 ? assignment.serviceIds.join(', ') : 'Event Coverage',
          platformUrl,
        }).catch(err => console.error('[EMAIL] Error sending assignment email:', err));
      }
    }

    return c.json({ request });
  } catch (error) {
    console.error("Error in assign talents route:", error);
    return c.json({ error: "Failed to assign talents" }, 500);
  }
});

// Add note to request (All roles)
app.post("/make-server-d8ea749c/requests/:id/notes", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    const requestId = c.req.param('id');
    const request = await kv.get(requestId);
    
    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }

    // Check access
    const isClient = userProfile.role === 'client' && request.clientId === user.id;
    const isTalent = userProfile.role === 'talent' && request.assignedTalents?.some((t: any) => t.talentId === user.id);
    const isAdminOrManager = userProfile.role === 'admin' || userProfile.role === 'manager';

    if (!isClient && !isTalent && !isAdminOrManager) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const body = await c.req.json();
    const { note, isInternal } = body; // isInternal: only visible to admin/manager/talent

    if (!note) {
      return c.json({ error: "Note is required" }, 400);
    }

    // Initialize notes array if it doesn't exist
    if (!request.notes) {
      request.notes = [];
    }

    const noteEntry = {
      id: `note:${Date.now()}`,
      userId: user.id,
      userName: userProfile.name,
      userRole: userProfile.role,
      note,
      isInternal: isInternal || false,
      createdAt: new Date().toISOString(),
    };

    request.notes.push(noteEntry);
    request.updatedAt = new Date().toISOString();

    await kv.set(requestId, request);

    // Log activity
    await logActivity({
      requestId,
      userId: user.id,
      userName: userProfile.name,
      userRole: userProfile.role,
      action: 'note_added',
      details: {
        notePreview: note.substring(0, 100),
        isInternal,
      },
    });

    return c.json({ request });
  } catch (error) {
    console.error("Error in add note route:", error);
    return c.json({ error: "Failed to add note" }, 500);
  }
});

// Cancel request (Client or Admin)
app.post("/make-server-d8ea749c/requests/:id/cancel", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    const requestId = c.req.param('id');
    const request = await kv.get(requestId);
    
    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }

    // Only client who created it or admin can cancel
    const isOwner = request.clientId === user.id;
    const isAdmin = userProfile.role === 'admin';

    if (!isOwner && !isAdmin) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const body = await c.req.json();
    const { reason } = body;

    request.status = 'cancelled';
    request.cancellationReason = reason || 'No reason provided';
    request.cancelledBy = user.id;
    request.cancelledAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();

    await kv.set(requestId, request);

    // Log activity
    await logActivity({
      requestId,
      userId: user.id,
      userName: userProfile.name,
      userRole: userProfile.role,
      action: 'request_cancelled',
      details: {
        reason: reason || 'No reason provided',
      },
    });

    return c.json({ request });
  } catch (error) {
    console.error("Error in cancel request route:", error);
    return c.json({ error: "Failed to cancel request" }, 500);
  }
});

// Get activity log for a request (All authorized users)
app.get("/make-server-d8ea749c/requests/:id/activity", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    const requestId = c.req.param('id');
    const request = await kv.get(requestId);
    
    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }

    // Check access
    const isClient = userProfile.role === 'client' && request.clientId === user.id;
    const isTalent = userProfile.role === 'talent' && request.assignedTalents?.some((t: any) => t.talentId === user.id);
    const isAdminOrManager = userProfile.role === 'admin' || userProfile.role === 'manager';

    if (!isClient && !isTalent && !isAdminOrManager) {
      return c.json({ error: "Forbidden" }, 403);
    }

    // Get all activity logs for this request
    const allActivities = await kv.getByPrefix(`activity:${requestId}:`);
    const activityLog = allActivities.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return c.json({ activityLog });
  } catch (error) {
    console.error("Error in get activity log route:", error);
    return c.json({ error: "Failed to get activity log" }, 500);
  }
});

// ============ USER MANAGEMENT ROUTES ============

// Get all users (Admin/Manager only)
app.get("/make-server-d8ea749c/admin/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user has admin or manager role
    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'manager')) {
      return c.json({ error: "Forbidden - Admin or Manager access required" }, 403);
    }

    // Get all user profiles from KV store
    const allUsers = await kv.getByPrefix('user:');
    
    // Format users for response
    const users = allUsers.map((userData: any) => ({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      company: userData.company || null,
      createdAt: userData.createdAt,
    }));

    console.log(`[GET /admin/users] Retrieved ${users.length} users`);
    return c.json({ users });
  } catch (error) {
    console.error('[GET /admin/users] Error fetching users:', error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Update user role (Admin only)
app.put("/make-server-d8ea749c/admin/users/:userId/role", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user has admin role (only admins can change roles)
    const adminProfile = await kv.get(`user:${user.id}`);
    if (!adminProfile || adminProfile.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin access required" }, 403);
    }

    const userId = c.req.param('userId');
    const body = await c.req.json();
    const { role } = body;

    // Validate role
    const validRoles = ['client', 'talent', 'manager', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return c.json({ error: "Invalid role. Must be one of: client, talent, manager, admin" }, 400);
    }

    // Prevent admin from changing their own role
    if (userId === user.id) {
      return c.json({ error: "Cannot change your own role" }, 400);
    }

    // Get the user to update
    const targetUser = await kv.get(`user:${userId}`);
    if (!targetUser) {
      return c.json({ error: "User not found" }, 404);
    }

    // Update user role in KV store
    const updatedUser = {
      ...targetUser,
      role,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`user:${userId}`, updatedUser);

    // Also update user metadata in Supabase Auth
    try {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...targetUser,
          role,
        },
      });
      console.log(`[PUT /admin/users/:userId/role] Updated Supabase Auth metadata for user ${userId}`);
    } catch (authError) {
      console.error('[PUT /admin/users/:userId/role] Error updating Supabase Auth metadata:', authError);
      // Continue even if auth update fails, as KV store was updated
    }

    console.log(`[PUT /admin/users/:userId/role] Updated user ${userId} role to ${role}`);
    return c.json({ 
      success: true, 
      user: updatedUser,
      message: `User role updated to ${role}` 
    });
  } catch (error) {
    console.error('[PUT /admin/users/:userId/role] Error updating user role:', error);
    return c.json({ error: "Failed to update user role" }, 500);
  }
});

Deno.serve(app.fetch);