import QRCode from "qrcode";
import { Request, Response, Router } from "express";
import PDFDocument from "pdfkit";
import { v4 as uuidv4 } from "uuid";
import { getPublicSiteUrl } from "./config";
import { supabaseAdmin } from "./supabase";
import { sendCertificateMessage } from "./whatsapp";

const router = Router();

const getSiteUrl = (req: Request) => getPublicSiteUrl(`${req.protocol}://${req.get("host")}`);

const isEndDatePassed = (endDate?: string | null) => {
    if (!endDate) return false;
    const parsed = new Date(`${endDate}T23:59:59`);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed.getTime() < Date.now();
};

const syncExpiredFormations = async () => {
    const { data: formations, error } = await supabaseAdmin
        .from("formations")
        .select("id, end_date, is_active");

    if (error) {
        throw error;
    }

    const formationIdsToDisable = (formations || [])
        .filter((formation) => formation.is_active !== false && isEndDatePassed(formation.end_date))
        .map((formation) => formation.id);

    if (formationIdsToDisable.length === 0) {
        return { deactivatedCount: 0 };
    }

    const { error: updateError } = await supabaseAdmin
        .from("formations")
        .update({ is_active: false })
        .in("id", formationIdsToDisable);

    if (updateError) {
        throw updateError;
    }

    return { deactivatedCount: formationIdsToDisable.length };
};

// Middleware de vérification Admin
const requireAdmin = async (req: Request, res: Response, next: Function) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Non autorisé" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const {
            data: { user },
            error,
        } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: "Session invalide" });
        }

        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("id, is_admin")
            .eq("id", user.id)
            .single();

        if (profileError || !profile || profile.is_admin !== true) {
            return res.status(403).json({ error: "Accès refusé" });
        }

        next();
    } catch (err) {
        return res.status(500).json({ error: "Erreur serveur" });
    }
};

router.use(requireAdmin);

router.post("/formations/sync-status", async (_req: Request, res: Response) => {
    try {
        const result = await syncExpiredFormations();
        res.json({ success: true, ...result });
    } catch (err: any) {
        res.status(500).json({ error: err.message || "Impossible de synchroniser les formations" });
    }
});

router.patch("/formations/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body || {};

    const allowedUpdates = {
        start_date: updates.start_date ?? undefined,
        end_date: updates.end_date ?? undefined,
        whatsapp_url: updates.whatsapp_url ?? undefined,
        is_active: typeof updates.is_active === "boolean" ? updates.is_active : undefined,
    };

    const sanitizedUpdates = Object.fromEntries(
        Object.entries(allowedUpdates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(sanitizedUpdates).length === 0) {
        return res.status(400).json({ error: "Aucune modification valide reçue" });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from("formations")
            .update(sanitizedUpdates)
            .eq("id", id)
            .select("*")
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ success: true, formation: data });
    } catch (err: any) {
        res.status(500).json({ error: err.message || "Impossible de mettre à jour la formation" });
    }
});

// GET /api/admin/bot/ping

// POST /api/admin/certificates/generate
router.post("/certificates/generate", async (req: Request, res: Response) => {
    const { id, inscription_id, student_name, formation_id, formation_title } = req.body;

    try {
        let resolvedInscriptionId: string | null = inscription_id || null;
        let resolvedStudentName: string | undefined = student_name;
        let resolvedFormationId: string | null = formation_id || null;
        let resolvedFormationTitle: string | undefined = formation_title;

        if (resolvedInscriptionId) {
            const { data: inscription, error: inscriptionError } = await supabaseAdmin
                .from("inscriptions")
                .select("id, full_name, formation_id, formations(id, title)")
                .eq("id", resolvedInscriptionId)
                .single();

            if (inscriptionError || !inscription) {
                return res.status(404).json({ error: "Inscription introuvable pour ce certificat" });
            }

            const inscriptionFormation = Array.isArray(inscription.formations)
                ? inscription.formations[0]
                : inscription.formations;

            resolvedStudentName = inscription.full_name;
            resolvedFormationId = inscription.formation_id;
            resolvedFormationTitle = inscriptionFormation?.title || resolvedFormationTitle;
        }

        if (!resolvedStudentName || !resolvedFormationTitle) {
            return res.status(400).json({ error: "inscription_id ou student_name + formation_title sont requis" });
        }

        const certificateId = id || uuidv4();
        const { data: existingCertificate } = await supabaseAdmin
            .from("certificates")
            .select("allow_public_indexing, unique_id")
            .eq("id", certificateId)
            .maybeSingle();

        const uniqueId =
            existingCertificate?.unique_id ||
            `CERT-${new Date().getFullYear()}-${uuidv4().slice(0, 8).toUpperCase()}`;
        const verificationUrl = `${getSiteUrl(req)}/verify/${uniqueId}`;

        const { data: settings } = await supabaseAdmin
            .from("platform_settings")
            .select("logo_url")
            .eq("id", 1)
            .single();
        const logoUrl = settings?.logo_url || "";

        const doc = new PDFDocument({
            layout: "landscape",
            size: "A4",
            margin: 50,
        });

        const buffers: Buffer[] = [];
        doc.on("data", buffers.push.bind(buffers));

        const uploadPromise = new Promise<string>((resolve, reject) => {
            doc.on("end", async () => {
                const pdfData = Buffer.concat(buffers);
                const filePath = `${uniqueId}.pdf`;

                const { error } = await supabaseAdmin.storage
                    .from("certificates")
                    .upload(filePath, pdfData, {
                        contentType: "application/pdf",
                        upsert: true,
                    });

                if (error) {
                    reject(error);
                } else {
                    const { data: publicUrlData } = supabaseAdmin.storage
                        .from("certificates")
                        .getPublicUrl(filePath);
                    resolve(publicUrlData.publicUrl);
                }
            });
        });

        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(4).stroke("#C5A059");
        doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52).lineWidth(1).stroke("#C5A059");

        doc.moveDown(2);
        doc.fillColor("#C5A059").fontSize(24).font("Helvetica-Bold").text(logoUrl ? "C&B SERVICES" : "C&B SERVICES", {
            align: "center",
        });

        doc.moveDown(2);
        doc.fillColor("#111111").fontSize(40).font("Times-Roman").text("Certificat de Réussite", { align: "center" });

        doc.moveDown(1);
        doc.fontSize(16).font("Helvetica").fillColor("#555555").text("est fièrement attribué à", { align: "center" });

        doc.moveDown(1);
        doc.fontSize(32).font("Times-Italic").fillColor("#000000").text(resolvedStudentName, { align: "center" });

        doc.moveDown(1);
        doc.fontSize(16).font("Helvetica").fillColor("#555555").text("pour avoir brillamment complété la formation", {
            align: "center",
        });

        doc.moveDown(1);
        doc.fontSize(24).font("Helvetica-Bold").fillColor("#C5A059").text(resolvedFormationTitle, { align: "center" });

        doc.moveDown(2);
        const dateStr = new Date().toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        doc.fontSize(14).font("Helvetica").fillColor("#333333").text(`Fait le ${dateStr}`, { align: "center" });

        doc.moveDown(3);
        doc.fontSize(10).fillColor("#999999").text(`ID de vérification: ${uniqueId}`, { align: "center" });

        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
            errorCorrectionLevel: "H",
            margin: 1,
            color: { dark: "#000000", light: "#FFFFFF" },
        });

        const qrBase64 = qrCodeDataUrl.split(",")[1];
        doc.image(Buffer.from(qrBase64, "base64"), doc.page.width - 120, doc.page.height - 120, { width: 80 });
        doc.end();

        const fileUrl = await uploadPromise;

        // Only include columns that are present in the certificates table schema.
        const payload: any = {
            id: certificateId,
            inscription_id: resolvedInscriptionId,
            unique_id: uniqueId,
            qr_code_url: verificationUrl,
            allow_public_indexing: existingCertificate?.allow_public_indexing ?? true,
            is_published: false,
            is_sample: !resolvedInscriptionId,
        };

        const { data: certificate, error: upsertError } = await supabaseAdmin
            .from("certificates")
            .upsert(payload, { onConflict: "id" })
            .select("*")
            .single();

        if (upsertError) {
            return res.status(400).json({ error: upsertError.message });
        }

        res.json({ success: true, file_url: fileUrl, certificate });
    } catch (err: any) {
        console.error("Certificate generation error:", err);
        res.status(500).json({ error: "Failed to generate PDF: " + err.message });
    }
});

router.post("/certificates/:id/publish", async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const { data: certificate, error: certificateError } = await supabaseAdmin
            .from("certificates")
            .select("*")
            .eq("id", id)
            .single();

        if (certificateError || !certificate) {
            return res.status(404).json({ error: "Certificat introuvable" });
        }

        // Set published flag even if the DB row doesn't include a `file_url` column.
        const { data: updatedCertificate, error: updateError } = await supabaseAdmin
            .from("certificates")
            .update({ is_published: true })
            .eq("id", id)
            .select("*")
            .single();

        if (updateError) {
            return res.status(400).json({ error: updateError.message });
        }

        res.json({ success: true, certificate: updatedCertificate });
    } catch (err: any) {
        res.status(500).json({ error: "Impossible de publier le certificat: " + err.message });
    }
});

// DELETE /api/admin/certificates/:id
router.delete("/certificates/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const { data: certificate } = await supabaseAdmin
            .from("certificates")
            .select("unique_id")
            .eq("id", id)
            .maybeSingle();

        const storageFileName = certificate?.unique_id ? `${certificate.unique_id}.pdf` : `${id}.pdf`;
        await supabaseAdmin.storage.from("certificates").remove([storageFileName]);
        await supabaseAdmin.from("certificates").delete().eq("id", id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: "Failed to delete: " + err.message });
    }
});

router.get("/enrollments", async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin
            .from("inscriptions")
            .select(
                "*, profiles(id, email, student_id, is_attested), formations(id, title, places_max, current_students)"
            )
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({ enrollments: data });
    } catch (err: any) {
        res.status(500).json({ error: err.message || "Impossible de charger les inscriptions" });
    }
});

router.post("/enrollments/:id/validate-participation", async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const { data: enrollment, error: enrollmentError } = await supabaseAdmin
            .from("inscriptions")
            .select("id, formation_id, status")
            .eq("id", id)
            .single();

        if (enrollmentError || !enrollment) {
            return res.status(404).json({ error: "Inscription introuvable" });
        }

        const { data: formation, error: formationError } = await supabaseAdmin
            .from("formations")
            .select("current_students, places_max")
            .eq("id", enrollment.formation_id)
            .single();

        if (formationError || !formation) {
            return res.status(404).json({ error: "Formation introuvable" });
        }

        const currentStudents = formation.current_students ?? 0;
        const maxPlaces = formation.places_max ?? Infinity;
        const updatedStudents = Math.min(maxPlaces, currentStudents + 1);

        const { error: updateEnrollmentError } = await supabaseAdmin
            .from("inscriptions")
            .update({ status: "participating" })
            .eq("id", id);

        if (updateEnrollmentError) {
            return res.status(500).json({ error: "Impossible de valider l'inscription" });
        }

        const { error: updateFormationError } = await supabaseAdmin
            .from("formations")
            .update({ current_students: updatedStudents })
            .eq("id", enrollment.formation_id);

        if (updateFormationError) {
            return res.status(500).json({ error: "Impossible de mettre à jour le compteur d'étudiants" });
        }

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/enrollments/:id/validate-inscription-only", async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const { error } = await supabaseAdmin
            .from("inscriptions")
            .update({ status: "validated" })
            .eq("id", id);

        if (error) {
            return res.status(500).json({ error: "Impossible de valider l'inscription" });
        }

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/enrollments/:id/cancel", async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const { data: enrollment, error: enrollmentError } = await supabaseAdmin
            .from("inscriptions")
            .select("id, formation_id, status")
            .eq("id", id)
            .single();

        if (enrollmentError || !enrollment) {
            return res.status(404).json({ error: "Inscription introuvable" });
        }

        const { error: cancelError } = await supabaseAdmin
            .from("inscriptions")
            .update({ status: "cancelled" })
            .eq("id", id);

        if (cancelError) {
            return res.status(500).json({ error: "Impossible d'annuler l'inscription" });
        }

        if (enrollment.status === "participating") {
            const { data: formation, error: formationError } = await supabaseAdmin
                .from("formations")
                .select("current_students, places_max")
                .eq("id", enrollment.formation_id)
                .single();

            if (!formation || formationError) {
                return res.status(404).json({ error: "Formation introuvable" });
            }

            const currentStudents = formation.current_students ?? 0;
            const updatedStudents = Math.max(0, currentStudents - 1);

            const { error: updateFormationError } = await supabaseAdmin
                .from("formations")
                .update({ current_students: updatedStudents })
                .eq("id", enrollment.formation_id);

            if (updateFormationError) {
                return res.status(500).json({ error: "Impossible de mettre à jour le compteur d'étudiants" });
            }
        }

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/enrollments/:id", async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const { data: enrollment, error: enrollmentError } = await supabaseAdmin
            .from("inscriptions")
            .select("id, formation_id, status")
            .eq("id", id)
            .single();

        if (enrollmentError || !enrollment) {
            return res.status(404).json({ error: "Inscription introuvable" });
        }

        const { error: deleteError } = await supabaseAdmin
            .from("inscriptions")
            .delete()
            .eq("id", id);

        if (deleteError) {
            return res.status(500).json({ error: "Impossible de supprimer l'inscription" });
        }

        if (enrollment.status === "participating") {
            const { data: formation, error: formationError } = await supabaseAdmin
                .from("formations")
                .select("current_students, places_max")
                .eq("id", enrollment.formation_id)
                .single();

            if (!formation || formationError) {
                return res.status(404).json({ error: "Formation introuvable" });
            }

            const currentStudents = formation.current_students ?? 0;
            const updatedStudents = Math.max(0, currentStudents - 1);

            const { error: updateFormationError } = await supabaseAdmin
                .from("formations")
                .update({ current_students: updatedStudents })
                .eq("id", enrollment.formation_id);

            if (updateFormationError) {
                return res.status(500).json({ error: "Impossible de mettre à jour le compteur d'étudiants" });
            }
        }

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/enrollments/:id/certificate-link
router.post("/enrollments/:id/certificate-link", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { certificate_link } = req.body;

    if (!certificate_link || typeof certificate_link !== 'string') {
        return res.status(400).json({ error: 'certificate_link is required' });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('inscriptions')
            .update({ certificate_link })
            .eq('id', id)
            .select('*')
            .single();

        if (error) return res.status(400).json({ error: error.message });

        res.json({ success: true, inscription: data });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal Error' });
    }
});

router.post("/profiles/:userId/attest", async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const { error } = await supabaseAdmin
            .from("profiles")
            .update({ is_attested: true })
            .eq("id", userId);

        if (error) {
            return res.status(500).json({ error: "Impossible d'attester l'étudiant" });
        }

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/inscriptions/:id/validate-payment", async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const { data: inscription, error: inscriptionError } = await supabaseAdmin
            .from("inscriptions")
            .select("id, formation_id, amount_paid, payment_status, payment_method, payment_timing")
            .eq("id", id)
            .single();

        if (inscriptionError || !inscription) {
            return res.status(404).json({ error: "Inscription introuvable" });
        }

        const { data: formation, error: formationError } = await supabaseAdmin
            .from("formations")
            .select("price")
            .eq("id", inscription.formation_id)
            .single();

        if (formationError || !formation) {
            return res.status(404).json({ error: "Formation introuvable" });
        }

        const { data: updatedInscription, error: updateError } = await supabaseAdmin
            .from("inscriptions")
            .update({
                status: "participating",
                payment_status: "paid",
                amount_paid: formation.price,
            })
            .eq("id", id)
            .select("*")
            .single();

        if (updateError || !updatedInscription) {
            return res.status(400).json({ error: updateError?.message || "Impossible de valider l'inscription" });
        }

        res.json({ success: true, inscription: updatedInscription });
    } catch (err: any) {
        res.status(500).json({ error: "Erreur serveur: " + err.message });
    }
});

export default router;
