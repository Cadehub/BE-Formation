import { Request, Response } from "express";
import { getPublicSiteUrl } from "./config";
import { supabaseAdmin } from "./supabase";

export const handleChariowWebhook = async (req: Request, res: Response) => {
  try {
    const { status, reference, metadata, amount } = req.body;
    
    if (status === "PAID" && metadata?.inscription_id) {
        
        // 1. Get the current inscription
        const { data: inscription, error: inscriptionError } = await supabaseAdmin
            .from("inscriptions")
            .select("*, formations(title, total_price, price, registration_fee, whatsapp_url)")
            .eq("id", metadata.inscription_id)
            .single();

        if (inscriptionError || !inscription) {
            return res.status(404).json({ error: "Inscription not found" });
        }

        const total_due = inscription.formations?.price || 0;
        
        // Ensure paidAmount is correctly added up (assuming 'amount' in webhook is what was paid)
        const newlyPaidAmount = Number(amount) || 0;
        let newAmountPaid = (inscription.amount_paid || 0) + newlyPaidAmount;
        
        let newStatus = inscription.status;
        let whatsappMsg = "";
        let adminMsg = "";
        
        const registration_fee = inscription.formations?.registration_fee || 0;

        const formationTitle = inscription.formations?.title || "votre formation";
        const formationWhatsAppUrl = inscription.formations?.whatsapp_url;

        if (newAmountPaid >= total_due) {
            newStatus = "fully_paid";
            whatsappMsg = formationWhatsAppUrl
                ? `Félicitations ${inscription.full_name} ! Vous avez réglé la totalité de votre formation "${formationTitle}". Voici votre lien d'accès au groupe : ${formationWhatsAppUrl}`
                : `Félicitations ${inscription.full_name} ! Vous avez réglé la totalité de votre formation "${formationTitle}". Votre accès est bien confirmé.`;
            adminMsg = `🎉 Nouvel élève soldé ! ${inscription.full_name} a complètement payé sa formation.`;
        } else {
            // Either they paid just the registration fee or partially paid the rest
            newStatus = "registered";
            const remainder = total_due - newAmountPaid;
            whatsappMsg = `Merci ${inscription.full_name} ! Votre acompte pour "${formationTitle}" a été reçu. Votre place est confirmée. \n\nLien pour régler le solde restant (${remainder} FCFA) : ${getPublicSiteUrl()}/pay/${inscription.id}`;
            adminMsg = `✅ Nouvel acompte ! ${inscription.full_name} a validé sa place (Solde restant: ${remainder} FCFA).`;
        }

        // 2. Update Inscription in DB
        const { error: updateError } = await supabaseAdmin
            .from("inscriptions")
            .update({ status: newStatus, amount_paid: newAmountPaid })
            .eq("id", metadata.inscription_id);
            
        if (updateError) {
            return res.status(500).json({ error: "Failed to update inscription status" });
        }
        
        return res.status(200).json({ success: true });
    }
    
    return res.status(400).json({ error: "Unhandled status or missing metadata" });
  } catch (err: any) {
    console.error("Webhook Error:", err);
    return res.status(500).json({ error: "Internal Error" });
  }
};
