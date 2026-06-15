import { Request, Response, Router } from "express";
import { supabaseAdmin } from "./supabase";
import { serverConfig } from "./config";

const router = Router();

// Helper: Generate unique student_id (BEF-2026-XXXX format)
function generateStudentId(): string {
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BEF-2026-${randomPart}`;
}

// POST /api/public/enroll - Handle student enrollment
router.post("/enroll", async (req: Request, res: Response) => {
  const {
    formation_id,
    full_name,
    email,
    phone,
    user_id,
  } = req.body;

  if (!formation_id || !full_name || !email || !phone) {
    return res.status(400).json({
      error: "Missing required fields: formation_id, full_name, email, phone",
    });
  }

  try {
    let studentId: string | null = null;

    // Check if user exists and has student_id
    if (user_id) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, student_id, email")
        .eq("id", user_id)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError);
        return res.status(500).json({ error: "Failed to fetch user profile" });
      }

      if (!profile) {
        // Create a minimal profile for this user
        studentId = generateStudentId();
        const { error: insertError } = await supabaseAdmin.from("profiles").insert([
          { id: user_id, email: email || null, student_id: studentId },
        ]);
        if (insertError) {
          console.error("Error creating profile:", insertError);
          return res.status(500).json({ error: "Failed to create user profile" });
        }
      } else {
        if (profile.student_id) {
          studentId = profile.student_id;
        } else {
          studentId = generateStudentId();
          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({ student_id: studentId })
            .eq("id", user_id);
          if (updateError) {
            console.error("Error updating profile:", updateError);
            return res.status(500).json({ error: "Failed to update user profile" });
          }
        }
      }
    } else {
      // Generate student_id even for non-authenticated users
      studentId = generateStudentId();
    }

    // Get formation details
    const { data: formation, error: formationError } = await supabaseAdmin
      .from("formations")
      .select("title")
      .eq("id", formation_id)
      .single();

    if (formationError || !formation) {
      return res.status(404).json({ error: "Formation not found" });
    }

    // Insert enrollment into inscriptions table (acts as enrollments)
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from("inscriptions")
      .insert({
        formation_id,
        full_name,
        email,
        phone,
        status: "pending",
        payment_status: "pending",
        payment_method: "cash",
        payment_timing: "later",
        user_id: user_id || null,
        amount_paid: 0,
        reminder_count: 0,
      })
      .select("id")
      .single();

    if (enrollError || !enrollment) {
      console.error("Error creating enrollment:", enrollError);
      return res.status(500).json({ error: "Failed to create enrollment" });
    }

    // Get WhatsApp number from platform_settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("platform_settings")
      .select("whatsapp_number")
      .eq("id", 1)
      .single();

    const adminPhone = settings?.whatsapp_number || serverConfig.adminPhoneNumber || "237699999999";
    const whatsappMessage = `Bonjour, je souhaite m'inscrire à la formation ${formation.title}. Voici mes informations :\nNom: ${full_name}\nEmail: ${email}\nTéléphone: ${phone}\nID Étudiant: ${studentId}`;
    const whatsappUrl = `https://wa.me/${adminPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

    return res.status(200).json({
      success: true,
      enrollment_id: enrollment.id,
      student_id: studentId,
      whatsapp_url: whatsappUrl,
    });
  } catch (err: any) {
    console.error("Enrollment error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/public/inscriptions?phone=...
router.get("/inscriptions", async (req: Request, res: Response) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: "Phone number required" });

  try {
    const { data: inscriptions, error } = await supabaseAdmin
      .from("inscriptions")
      .select("*, formations(title, price, registration_fee)")
      .eq("phone", phone as string)
      .neq("status", "participating");

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ inscriptions });
  } catch (err) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

// GET /api/public/inscriptions/:id
router.get("/inscriptions/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data: inscription, error } = await supabaseAdmin
      .from("inscriptions")
      .select("*, formations(*)")
      .eq("id", id)
      .single();

    if (error || !inscription)
      return res.status(404).json({ error: "Inscription non trouvée" });
    return res.json({ inscription });
  } catch (err) {
    return res.status(500).json({ error: "Internal Error" });
  }
});

// GET /api/public/menu
router.get("/menu", async (_req: Request, res: Response) => {
  try {
    const [attestedRes, blogRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_attested", true),
      supabaseAdmin
        .from("blogs")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
    ]);

    const hasStudents = Boolean(attestedRes.count && attestedRes.count > 0);
    const hasBlog = Boolean(blogRes.count && blogRes.count > 0);

    return res.json({ hasStudents, hasBlog });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal Error" });
  }
});

// GET /api/public/profiles/:studentId
router.get("/profiles/:studentId", async (req: Request, res: Response) => {
  const { studentId } = req.params;
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("student_id", studentId)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: "Profil introuvable" });
    }

    return res.json({ profile });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal Error" });
  }
});

// POST /api/public/reviews - Submit a formation review
router.post("/reviews", async (req: Request, res: Response) => {
  const { user_id, formation_id, rating, comment } = req.body;

  if (!user_id || !formation_id || typeof rating !== "number") {
    return res.status(400).json({ error: "Champs requis manquants : user_id, formation_id, rating" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("formation_reviews")
      .insert({
        user_id,
        formation_id,
        rating,
        comment: comment || "",
      })
      .select("*")
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, review: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal Error" });
  }
});

// GET /api/public/settings/whatsapp - Get WhatsApp number from platform_settings
router.get("/settings/whatsapp", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("platform_settings")
      .select("whatsapp_number")
      .eq("id", 1)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Platform settings not found" });
    }

    return res.json({ whatsapp_number: data.whatsapp_number || "" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal Error" });
  }
});

// GET /api/public/settings - Get all platform settings for Footer/UI
router.get("/settings", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("platform_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error || !data) {
      // Return safe defaults if not found
      return res.json({
        whatsapp_number: "",
        phone_number: "",
        email: "",
        website: "",
        address: "",
        social_facebook: "",
        social_github: "",
        social_linkedin: "",
      });
    }

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal Error" });
  }
});

// GET /api/public/student/dashboard - Secure dashboard data for authenticated students
router.get("/student/dashboard", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Session invalide" });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from("inscriptions")
      .select("*, formations(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (enrollmentsError) {
      return res.status(500).json({ error: enrollmentsError.message });
    }

    return res.json({ user, profile, enrollments });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal Error" });
  }
});

export default router;

