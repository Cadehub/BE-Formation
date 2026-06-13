// lib/whatsapp.ts for server-side WhatsApp interaction
import { serverConfig } from "./config";

// 1. Pour ENVOYER DU TEXTE (Uniquement si l'utilisateur a écrit dans les dernières 24h)
export const sendWhatsAppMessage = async (phone: string, message: string): Promise<{success: boolean, error?: any}> => {
    const metaAccessToken = serverConfig.metaAccessToken;
    const phoneId = serverConfig.whatsappPhoneNumberId;
    
    if (!metaAccessToken || !phoneId) {
        console.warn("WhatsApp API credentials missing.");
        return { success: false, error: "Credentials missing. Verify META_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment variables" };
    }

    try {
        const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${metaAccessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: phone,
                type: "text",
                text: { preview_url: false, body: message }
            }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("WhatsApp API Error:", data);
            return { success: false, error: data.error?.message || "Erreur API WhatsApp" };
        }
        
        return { success: true };
    } catch (error: any) {
        console.error("WhatsApp Request Error:", error);
        return { success: false, error: error.message || "Erreur réseau interne" };
    }
};

// 2. Pour ENVOYER UN TEMPLATE (Obligatoire pour initier une discussion ou envoyer des alertes)
export const sendWhatsAppTemplate = async (phone: string, templateName: string, languageCode: string = "en_US"): Promise<{success: boolean, error?: any}> => {
    const metaAccessToken = serverConfig.metaAccessToken;
    const phoneId = serverConfig.whatsappPhoneNumberId;
    
    if (!metaAccessToken || !phoneId) {
        return { success: false, error: "Credentials missing." };
    }

    try {
        const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${metaAccessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: phone,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: languageCode }
                }
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("WhatsApp Template Error:", data);
            return { success: false, error: data.error?.message || "Erreur Template" };
        }
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

// --- FONCTIONS APPLICATIVES ---

export const sendCourseAccess = async (phone: string, groupLink: string) => {
    const message = `Félicitations pour votre inscription chez C&B Services ! Cliquez ici pour rejoindre votre groupe de formation: ${groupLink}`;
    return await sendWhatsAppMessage(phone, message);
};

// Modifié pour utiliser le template de test officiel "hello_world" pour que le bouton PING fonctionne à tous les coups
export const sendAdminAlert = async (message: string) => {
    const adminPhone = serverConfig.adminPhoneNumber;
    if (!adminPhone) {
        return { success: false, error: "ADMIN_PHONE_NUMBER is missing" };
    }
    return await sendWhatsAppTemplate(adminPhone, "hello_world", "en_US");
};

export const sendReminderMessage = async (phone: string, text: string) => {
    return await sendWhatsAppMessage(phone, text);
};

export const sendCertificateMessage = async (
    phone: string,
    certificateUrl: string,
    formationWhatsAppUrl?: string | null
) => {
    const extraGroupLine = formationWhatsAppUrl
        ? `\n\nGroupe WhatsApp de la formation : ${formationWhatsAppUrl}`
        : "";
    const message = `Félicitations pour votre réussite ! Voici le lien vers votre certificat : ${certificateUrl}${extraGroupLine}`;
    return await sendWhatsAppMessage(phone, message);
};
