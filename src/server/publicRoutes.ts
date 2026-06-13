import { Request, Response, Router } from "express";
import { supabaseAdmin } from "./supabase";

const router = Router();

// GET /api/public/inscriptions?phone=...
router.get("/inscriptions", async (req: Request, res: Response) => {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: "Phone number required" });
    
    try {
        const { data: inscriptions, error } = await supabaseAdmin
            .from("inscriptions")
            .select("*, formations(title, price, registration_fee)")
            .eq("phone", phone as string)
            .neq("status", "fully_paid");
            
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
            
        if (error || !inscription) return res.status(404).json({ error: "Inscription non trouvée" });
        return res.json({ inscription });
    } catch (err) {
        return res.status(500).json({ error: "Internal Error" });
    }
});

export default router;
