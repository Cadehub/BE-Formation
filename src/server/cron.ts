import { Request, Response } from "express";
import { getPublicSiteUrl, serverConfig } from "./config";
import { supabaseAdmin } from "./supabase";

export const runRemindersCron = async (req: Request, res: Response) => {
  // Only allow CRON invoker or verify shared secret if implemented.
  const authHeader = req.headers.authorization;
  if (serverConfig.cronSecret && authHeader !== `Bearer ${serverConfig.cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const { data: pendingInscriptions, error: fetchError } = await supabaseAdmin
        .from("inscriptions")
        .select("*, formations(title)")
        .eq("status", "pending")
        .lt("reminder_count", 3);
        
    if (fetchError) {
        return res.status(500).json({ error: "Failed to fetch pending inscriptions", details: fetchError });
    }

    if (!pendingInscriptions || pendingInscriptions.length === 0) {
        return res.status(200).json({ message: "No pending inscriptions to remind." });
    }
    
    const { sendReminderMessage } = await import("./whatsapp");
    let sentCount = 0;
    
    for (const inscription of pendingInscriptions) {
        if (inscription.phone) {
            const formationTitle = inscription.formations?.title || "votre formation";
            const magicLink = `${getPublicSiteUrl()}/pay/${inscription.id}`;
            const message = `Bonjour ${inscription.full_name},\n\nVous avez une inscription en attente pour "${formationTitle}". Les places partent vite !\n\nFinalisez votre inscription dès maintenant pour réserver votre place : ${magicLink}`;
            
            await sendReminderMessage(inscription.phone, message);
            
            // Increment the reminder count
            await supabaseAdmin
                .from("inscriptions")
                .update({ 
                    reminder_count: (inscription.reminder_count || 0) + 1,
                    last_reminder_at: new Date().toISOString()
                })
                .eq("id", inscription.id);
                
            sentCount++;
        }
    }

    return res.status(200).json({ success: true, remindersSent: sentCount });

  } catch (error: any) {
      console.error("CRON Error:", error);
      return res.status(500).json({ error: "Internal Error" });
  }
};
