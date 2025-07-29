export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }
    
    try {
        const { action, message, conversationId, ...otherData } = req.body;
        
        // Router selon l'action
        switch(action) {
            case 'authenticate-and-load':
                return handleAuthenticateAndLoad(req, res, otherData);
            case 'chat':
                return handleChatMessage(req, res, message, conversationId, otherData);
            case 'save-description':
                return handleSaveDescription(req, res, otherData);
            case 'get-partner-data':
                return handleGetPartnerData(req, res, otherData);
            case 'upload-file':
                return handleFileUpload(req, res, otherData);
            // NOUVEAU : Actions admin
            case 'get-all-partners':
                return handleGetAllPartners(req, res);
            case 'add-partner':
                return handleAddPartner(req, res, otherData);
            case 'send-email':
                return handleSendEmail(req, res, otherData);
            case 'export-data':
                return handleExportData(req, res);
            default:
                // Par défaut, traiter comme un message chat (compatibilité)
                return handleChatMessage(req, res, message || req.body.message, conversationId, otherData);
        }
        
    } catch (error) {
        console.error('💥 Erreur:', error);
        return res.status(500).json({ 
            error: 'Erreur interne du serveur',
            details: error.message 
        });
    }
}

// URL de votre Google Apps Script
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzxna-AtuIKEw8VrvliAOCO2A7T-hd2LohZeNQl5Ai02btqpHL9YgPDQmKLm6YwcQEO/exec';

// Template email HTML
const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
	<head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>MBE France | Connect 2025</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
        <style type="text/css">
            @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700');
        </style>
   </head>
<body>  
    <table bgcolor="#949498" cellpadding="0" cellspacing="0" width="100%" style="font-family: Ubuntu, Verdana, Arial, sans-serif; font-size: 15px;  background-image: linear-gradient(#f7f7f7, #f7f7f7); text-align: justify; border-collapse: collapse;">
        <tbody><tr>
            <td style="padding: 20px 0px 20px 0px;"><!-- -->
                <table align="center" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse;">
                    <tbody>
                    <!--Header-->
					<tr>
                        <td align="center" bgcolor="#ffffff" style="padding: 0px;">
                                <a href="https://www.mbefrance.fr?assign=3092" target="_blank"><img src="https://s3.eu-south-1.amazonaws.com/public.eu.printspeak.com/assets/0d11190840a80a5973de8df1b83060ee_Header_Connect%20MBE%20France.png" width="600" height="215" alt="Connect, un évènement de Mail Boxes Etc. France"></a>
                            
                        </td>
                    </tr>
<!-- Contenu Email -->
        <tr>
          <td bgcolor="#ffffff" style="padding: 10px 30px 20px 30px;">
            <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
             {{content}}
            </table>
          </td>
        </tr>
					
					<tr>
                        <td align="center" bgcolor="#ffffff">
							<hr style="border: 0; height: 2px; width: 100%; background-color: #d2d2d2; margin: 0 auto;">
							</td>
                    </tr>
						
<!--FOOTER-->
		<!--Contacts-->
                    <tr>
                        <td bgcolor="#f2f2f2" style="padding: 20px 56px; color: #ffffff; font-family: Ubuntu, Verdana, Arial, sans-serif;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
        <!--Center Name-->
                                <tbody>
                                    <tr>
                                        <td align="center" style="font-size: 18px; font-family: Ubuntu, Verdana, Arial, sans-serif; color: #e2001a;padding: 0 0 20 0;">
                                            <font face=" 'Ubuntu', Verdana, Arial, sans-serif;">
                                                <strong>Mail Boxes Etc. France</strong><br>
												
                                            </font>
                                        </td>
                                    </tr>
        <!--Center Info-->
                                    <tr>
                                        <td align="center" style="color: #000000; font-family: Ubuntu, Verdana, Arial, sans-serif;font-size: 14px;">
                                            <font face=" 'Ubuntu', Verdana, Arial, sans-serif;">
												<span style="color: #000000; text-decoration: none;font-size: 14;line-height: 1.8;">82 Av. du Maine, 75014 Paris
                                                </span>
												<br>
												<span style="color: #000000; text-decoration: none;font-size: 14px;">
                                                <strong> <span style="text-decoration:none; color:#E2001A;">(+33) 01 41 90 12 10</span> | <a href="mailto:events@mbefrance.fr" style="text-decoration:none; color:#E2001A;">events@mbefrance.fr</a></strong>
                                                </span>
                                            </font>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
					<tr>
                        <td align="center" bgcolor="#ffffff">
							<hr style="border: 0; height: 0.25px; width: 100%; background-color: #d2d2d2; margin: 0 auto;">
							</td>
                    </tr>
						
<!--Disclaimer-->
                    <tr>
                        <td bgcolor="#f7f7f7" style="padding: 5px 0px 10px 0px; font-size: 9px;line-height: 10px;text-align: justify;color: #A4A4A4;">
                            <font face=" 'Ubuntu', Verdana, Arial, sans-serif;"><span style="letter-spacing: -0.1pt;">
								<strong>MBE France SARL</strong> | RCS 539736397 <br><strong>© 2025 Mail Boxes Etc. – Une marque du groupe Fortidia.</strong> Services d'expédition, logistique, impression et domiciliation sous franchise. Les Centres MBE sont exploités par des entrepreneurs indépendants dans le cadre d'un contrat de franchise. MBE est une marque enregistrée utilisée sous licence de Fortidia (anciennement MBE Worldwide S.p.A.) hors États-Unis et Canada.</span>
                            </font>
                        </td>
                    </tr>
                </tbody></table>
            </td>
        </tr>
    </tbody></table>
</body>
</html>`;

// Fonction pour appeler Google Apps Script
async function callGoogleScript(action, data) {
    try {
        console.log('📞 Appel Google Script:', action, data);
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                ...data
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Réponse Google Script:', result);
        
        return result;
    } catch (error) {
        console.error('❌ Erreur Google Script:', error);
        return { success: false, error: error.message };
    }
}

// MODIFIÉ : Analyser et enregistrer automatiquement les informations
async function analyzeAndSaveInfo(message, partnerCode) {
    if (!partnerCode) return;
    
    try {
        console.log('🔍 Analyse du message:', message);
        
        // NOUVEAU : Détecter les descriptifs d'entreprise
        const descriptifPatterns = [
            /descriptif/i,
            /description/i,
            /présentation/i,
            /entreprise/i,
            /société/i,
            /activité/i,
            /spécialisé/i,
            /nous sommes/i,
            /notre entreprise/i,
            /notre société/i,
            /nous faisons/i,
            /nous proposons/i
        ];
        
        // Si le message contient des mots liés au descriptif ET fait plus de 20 caractères
        if (descriptifPatterns.some(pattern => pattern.test(message)) && message.length > 20) {
            console.log('📝 Descriptif détecté');
            
            // Nettoyer le message pour extraire le descriptif
            let descriptif = message;
            
            // Supprimer les phrases d'introduction communes
            descriptif = descriptif
                .replace(/^(voici|voilà|mon|notre|le)\s+(descriptif|description)\s+(de\s+)?(mon|notre|l'|la)?\s*(entreprise|société)\s*:?\s*/i, '')
                .replace(/^(je veux|je souhaite|j'aimerais)\s+(renseigner|donner|ajouter)\s+(le|mon|notre)?\s*(descriptif|description)\s*:?\s*/i, '')
                .replace(/^(pour\s+)?(le|mon|notre)\s*(descriptif|description)\s*:?\s*/i, '')
                .trim();
            
            // Enregistrer dans le Google Sheet
            const result = await callGoogleScript('save-description', {
                codeUnique: partnerCode,
                description: descriptif
            });
            
            if (result.success) {
                console.log('✅ Descriptif enregistré:', descriptif);
            }
        }
        
        // Détecter les équipements/matériels
        const equipmentPatterns = [
            /imprimante[s]?/i,
            /écran[s]?/i,
            /stand[s]?/i,
            /matériel/i,
            /équipement[s]?/i,
            /ordinateur[s]?/i,
            /tablette[s]?/i,
            /projecteur[s]?/i,
            /borne[s]?/i
        ];
        
        let equipmentInfo = '';
        
        // Extraire les informations d'équipements
        if (equipmentPatterns.some(pattern => pattern.test(message))) {
            // Extraire dimensions (ex: 2mx1m, 2m x 1m, etc.)
            const dimensionMatch = message.match(/(\d+(?:\.\d+)?)\s*[mx×]\s*(\d+(?:\.\d+)?)/i);
            // Extraire poids (ex: 100kg, 100 kg, etc.)
            const weightMatch = message.match(/(\d+(?:\.\d+)?)\s*kg/i);
            // Extraire quantité (ex: deux, 2, trois, etc.)
            const quantityMatch = message.match(/(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|\d+)/i);
            
            equipmentInfo = message;
            
            // Si on a des détails, les formater proprement
            if (dimensionMatch || weightMatch || quantityMatch) {
                const parts = [];
                
                // Quantité
                if (quantityMatch) {
                    const qty = quantityMatch[1].toLowerCase();
                    const numberMap = {
                        'deux': '2', 'trois': '3', 'quatre': '4', 'cinq': '5',
                        'six': '6', 'sept': '7', 'huit': '8', 'neuf': '9', 'dix': '10'
                    };
                    parts.push(numberMap[qty] || qty);
                }
                
                // Type d'équipement
                for (const pattern of equipmentPatterns) {
                    const match = message.match(pattern);
                    if (match) {
                        parts.push(match[0]);
                        break;
                    }
                }
                
                // Dimensions
                if (dimensionMatch) {
                    parts.push(`${dimensionMatch[1]}m x ${dimensionMatch[2]}m`);
                }
                
                // Poids
                if (weightMatch) {
                    const unit = quantityMatch && parseInt(quantityMatch[1]) > 1 ? 'kg chacune' : 'kg';
                    parts.push(`${weightMatch[1]}${unit}`);
                }
                
                if (parts.length > 0) {
                    equipmentInfo = parts.join(' ');
                }
            }
            
            // Enregistrer dans le Google Sheet
            const result = await callGoogleScript('save-equipment', {
                codeUnique: partnerCode,
                equipment: equipmentInfo
            });
            
            if (result.success) {
                console.log('✅ Équipement enregistré:', equipmentInfo);
            }
        }
        
        // Détecter les dates de livraison
        const datePatterns = [
            /(\d{1,2})[\/\-](\d{1,2})/,
            /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/i,
            /(\d{1,2})\s+(septembre|october)/i,
            /(22|23|24|25|26)\s+septembre/i
        ];
        
        if (datePatterns.some(pattern => pattern.test(message))) {
            const result = await callGoogleScript('save-delivery-date', {
                codeUnique: partnerCode,
                deliveryDate: message
            });
            
            if (result.success) {
                console.log('✅ Date livraison enregistrée');
            }
        }
        
        // Détecter les logos
        const logoPatterns = [
            /logo\s+(cmjn|cmyk)/i,
            /logo\s+(négatif|negatif|fond\s+sombre)/i,
            /logo\s+(couleur|color)/i
        ];
        
        for (const pattern of logoPatterns) {
            const match = message.match(pattern);
            if (match) {
                const logoType = match[1].toLowerCase();
                let columnName = '';
                
                if (logoType.includes('cmjn') || logoType.includes('cmyk')) {
                    columnName = 'Logo CMJN';
                } else if (logoType.includes('négatif') || logoType.includes('negatif') || logoType.includes('sombre')) {
                    columnName = 'Logo Négatif';
                }
                
                if (columnName) {
                    const result = await callGoogleScript('save-logo-type', {
                        codeUnique: partnerCode,
                        logoType: columnName,
                        status: 'En attente d\'upload'
                    });
                    
                    if (result.success) {
                        console.log('✅ Type de logo enregistré:', columnName);
                    }
                }
                break;
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur analyse automatique:', error);
    }
}

// NOUVEAU : Authentifier ET charger les données en une fois
async function handleAuthenticateAndLoad(req, res, data) {
    const { codeUnique } = data;
    
    console.log('🔐 Authentification et chargement pour:', codeUnique);
    
    try {
        // D'abord authentifier
        const authResult = await callGoogleScript('authenticate', { codeUnique });
        
        if (!authResult.success) {
            return res.status(401).json({
                success: false,
                error: authResult.message || 'Code d\'accès incorrect'
            });
        }
        
        // Ensuite charger les données
        const dataResult = await callGoogleScript('get-partner-data', { codeUnique });
        
        if (!dataResult.success) {
            return res.status(200).json({
                success: true,
                message: 'Authentification réussie mais données non trouvées',
                partnerData: null
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Authentification et chargement réussis',
            partnerData: dataResult.data
        });
        
    } catch (error) {
        console.error('❌ Erreur authentification et chargement:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur technique lors de l\'authentification'
        });
    }
}

// Fonction pour récupérer les données partenaire
async function handleGetPartnerData(req, res, data) {
    const { codeUnique } = data;
    
    console.log('📊 Récupération données pour:', codeUnique);
    
    try {
        const result = await callGoogleScript('get-partner-data', { codeUnique });
        
        if (result.success) {
            return res.status(200).json({
                success: true,
                data: result.data
            });
        } else {
            return res.status(404).json({
                success: false,
                error: result.message || 'Partenaire non trouvé'
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur récupération données:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des données'
        });
    }
}

// NOUVEAU : Récupérer tous les partenaires (admin)
async function handleGetAllPartners(req, res) {
    console.log('📊 Récupération de tous les partenaires (admin)');
    
    try {
        const result = await callGoogleScript('get-all-partners', {});
        
        if (result.success) {
            return res.status(200).json({
                success: true,
                data: result.data
            });
        } else {
            return res.status(500).json({
                success: false,
                error: result.message || 'Erreur lors de la récupération'
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur récupération tous partenaires:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des partenaires'
        });
    }
}

// NOUVEAU : Ajouter un partenaire (admin)
async function handleAddPartner(req, res, data) {
    const { companyName, contactName, contactEmail, contactPhone } = data;
    
    console.log('➕ Ajout partenaire:', { companyName, contactName, contactEmail });
    
    try {
        // Validation
        if (!companyName || !contactName || !contactEmail) {
            return res.status(400).json({
                success: false,
                error: 'Nom entreprise, nom contact et email sont requis'
            });
        }
        
        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactEmail)) {
            return res.status(400).json({
                success: false,
                error: 'Format email invalide'
            });
        }
        
        const result = await callGoogleScript('add-partner', {
            companyName,
            contactName,
            contactEmail,
            contactPhone: contactPhone || ''
        });
        
        if (result.success) {
            // Envoyer l'email de bienvenue
            const welcomeEmailResult = await sendWelcomeEmail(contactEmail, contactName, companyName, result.data.partnerCode);
            
            return res.status(200).json({
                success: true,
                message: 'Partenaire ajouté avec succès',
                data: result.data,
                emailSent: welcomeEmailResult.success
            });
        } else {
            return res.status(500).json({
                success: false,
                error: result.message || 'Erreur lors de l\'ajout'
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur ajout partenaire:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'ajout du partenaire'
        });
    }
}

// NOUVEAU : Envoyer email de bienvenue
// MODIFIÉ : Envoyer email de bienvenue avec lien
async function sendWelcomeEmail(email, contactName, companyName, partnerCode) {
    try {
        const welcomeContent = `
            <tr>
                <td style="padding: 20px 0;">
                    <h2 style="color: #E2001A; font-family: Ubuntu, Verdana, Arial, sans-serif; margin-bottom: 20px;">
                        Bienvenue à Connect 2025 !
                    </h2>
                    <p style="font-family: Ubuntu, Verdana, Arial, sans-serif; font-size: 15px; line-height: 1.6; margin-bottom: 15px;">
                        Bonjour <strong>${contactName}</strong>,
                    </p>
                    <p style="font-family: Ubuntu, Verdana, Arial, sans-serif; font-size: 15px; line-height: 1.6; margin-bottom: 15px;">
                        Nous sommes ravis d'accueillir <strong>${companyName}</strong> parmi nos partenaires pour l'événement Connect 2025 qui se déroulera du <strong>26 au 28 septembre 2025</strong> au Campus de Cély.
                    </p>
                    <p style="font-family: Ubuntu, Verdana, Arial, sans-serif; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                        Votre code d'accès unique est : <strong style="color: #E2001A; font-size: 18px;">${partnerCode}</strong>
                    </p>
                    
                    <!-- NOUVEAU : Bouton d'accès à l'application -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://connect2025-assistant-3bjg4ha2m-mbe-projects.vercel.app/" 
                           style="display: inline-block; background: #E2001A; color: white; padding: 15px 30px; 
                                  text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            🚀 Accéder à votre espace partenaire
                        </a>
                    </div>
                    
                    <p style="font-family: Ubuntu, Verdana, Arial, sans-serif; font-size: 15px; line-height: 1.6; margin-bottom: 15px;">
                        Utilisez ce lien et votre code d'accès pour renseigner vos informations :
                    </p>
                    <ul style="font-family: Ubuntu, Verdana, Arial, sans-serif; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                        <li>Descriptif de votre entreprise</li>
                        <li>Équipements à livrer</li>
                        <li>Date de livraison souhaitée</li>
                        <li>Logos (CMJN et négatif)</li>
                    </ul>
                    <p style="font-family: Ubuntu, Verdana, Arial, sans-serif; font-size: 15px; line-height: 1.6; margin-bottom: 15px;">
                        <strong>Deadline importante :</strong> Toutes vos informations doivent être complétées avant le <strong style="color: #E2001A;">1er septembre 2025</strong>.
                    </p>
                    <p style="font-family: Ubuntu, Verdana, Arial, sans-serif; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                        Pour toute question, n'hésitez pas à nous contacter à <a href="mailto:events@mbefrance.fr" style="color: #E2001A;">events@mbefrance.fr</a> ou au <strong>(+33) 01 41 90 12 10</strong>.
                    </p>
                    <p style="font-family: Ubuntu, Verdana, Arial, sans-serif; font-size: 15px; line-height: 1.6;">
                        À bientôt pour Connect 2025 !<br>
                        <strong>L'équipe MBE France</strong>
                    </p>
                </td>
            </tr>
        `;
        
        const htmlContent = EMAIL_TEMPLATE.replace('{{content}}', welcomeContent);
        
        const result = await callGoogleScript('send-email', {
            to: email,
            subject: 'Préparez votre évènement',
            htmlContent: htmlContent
        });
        
        return result;
        
    } catch (error) {
        console.error('❌ Erreur envoi email bienvenue:', error);
        return { success: false, error: error.message };
    }
}

// NOUVEAU : Envoyer email personnalisé (admin)
async function handleSendEmail(req, res, data) {
    const { recipient, subject, message } = data;
    
    console.log('📧 Envoi email à:', recipient);
    
    try {
        // Validation
        if (!recipient || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'Destinataire, objet et message sont requis'
            });
        }
        
        const recipientData = typeof recipient === 'string' ? JSON.parse(recipient) : recipient;
        
        // Créer le contenu HTML
        const emailContent = `
            <tr>
                <td style="padding: 20px 0;">
                    <p style="font-family: Ubuntu, Verdana, Arial, sans-serif; font-size: 15px; line-height: 1.6; margin-bottom: 15px;">
                        Bonjour <strong>${recipientData.name}</strong>,
                    </p>
                    <div style="font-family: Ubuntu, Verdana, Arial, sans-serif; font-size: 15px; line-height: 1.6;">
                        ${message.replace(/\n/g, '<br>')}
                    </div>
                    <p style="font-family: Ubuntu, Verdana, Arial, sans-serif; font-size: 15px; line-height: 1.6; margin-top: 20px;">
                        Cordialement,<br>
                        <strong>L'équipe MBE France</strong>
                    </p>
                </td>
            </tr>
        `;
        
        const htmlContent = EMAIL_TEMPLATE.replace('{{content}}', emailContent);
        
        const result = await callGoogleScript('send-email', {
            to: recipientData.email,
            subject: subject,
            htmlContent: htmlContent
        });
        
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Email envoyé avec succès'
            });
        } else {
            return res.status(500).json({
                success: false,
                error: result.message || 'Erreur lors de l\'envoi'
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'envoi de l\'email'
        });
    }
}

// NOUVEAU : Exporter les données (admin)
async function handleExportData(req, res) {
    console.log('📥 Export des données');
    
    try {
        const result = await callGoogleScript('export-data', {});
        
        if (result.success) {
            return res.status(200).json({
                success: true,
                data: result.data
            });
        } else {
            return res.status(500).json({
                success: false,
                error: result.message || 'Erreur lors de l\'export'
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur export:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'export des données'
        });
    }
}

// Fonction pour gérer les messages chat (MODIFIÉE avec analyse automatique)
async function handleChatMessage(req, res, message, conversationId, otherData) {
    if (!message) {
        return res.status(400).json({ error: 'Message requis' });
    }
    
    const { isAuthenticated, partnerCode } = otherData;
    
    console.log('🔍 ConversationId reçu:', conversationId);
    console.log('🔐 Authentifié:', isAuthenticated, 'Code:', partnerCode);
    
    // NOUVEAU : Analyser et enregistrer automatiquement AVANT d'envoyer à Dust
    if (isAuthenticated && partnerCode) {
        await analyzeAndSaveInfo(message, partnerCode);
    }
    
    let dustUrl, dustPayload;
    
    // Enrichir le contexte avec les infos partenaire si authentifié
    let contextInfo = {
        username: "connect2025-user",
        timezone: "Europe/Paris",
        fullName: "Participant Connect 2025",
        email: "participant@connect2025.fr",
        profilePictureUrl: null,
        origin: "api"
    };
    
    // Si authentifié, enrichir le contexte
    if (isAuthenticated && partnerCode) {
        try {
            const partnerData = await callGoogleScript('get-partner-data', { codeUnique: partnerCode });
            if (partnerData.success) {
                contextInfo.fullName = partnerData.data['Nom Contact'] || contextInfo.fullName;
                contextInfo.email = partnerData.data['Email Contact'] || contextInfo.email;
                contextInfo.username = `partner-${partnerCode}`;
                
                // Ajouter des infos contextuelles au message pour l'IA
                message = `[CONTEXTE PARTENAIRE: ${partnerData.data['Nom Entreprise']}, Contact: ${partnerData.data['Nom Contact']}, Statut: ${partnerData.data['Statut Global']}] ${message}`;
            }
        } catch (error) {
            console.log('⚠️ Impossible d\'enrichir le contexte:', error.message);
        }
    }
    
    if (conversationId && conversationId !== null && conversationId !== 'null') {
        // Continuer une conversation existante
        console.log('📝 Continuation de conversation:', conversationId);
        dustUrl = `https://eu.dust.tt/api/v1/w/v6cPQVVFE1/assistant/conversations/${conversationId}/messages`;
        dustPayload = {
            content: message,
            context: contextInfo,
            mentions: [{
                configurationId: 'Xl8LLukA05'
            }],
            blocking: true
        };
    } else {
        // Nouvelle conversation
        console.log('🆕 Nouvelle conversation');
        dustUrl = 'https://eu.dust.tt/api/v1/w/v6cPQVVFE1/assistant/conversations';
        dustPayload = {
            message: {
                content: message,
                context: contextInfo,
                mentions: [{
                    configurationId: 'Xl8LLukA05'
                }]
            },
            title: isAuthenticated ? `Connect 2025 - ${partnerCode}` : "Connect 2025 Chat",
            blocking: true
        };
    }
    
    console.log('📤 Envoi à Dust:', JSON.stringify(dustPayload, null, 2));
    console.log('🌐 URL:', dustUrl);
    
    const dustResponse = await fetch(dustUrl, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer sk-a893bcb7af5957be77de21ed265ba2fd',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dustPayload)
    });
    
    if (!dustResponse.ok) {
        const errorText = await dustResponse.text();
        console.error('❌ Erreur Dust:', errorText);
        throw new Error(`Dust API Error ${dustResponse.status}: ${errorText}`);
    }
    
    const data = await dustResponse.json();
    console.log('📥 Réponse Dust:', JSON.stringify(data, null, 2));
    
    // Extraction de la réponse
    let assistantResponse = "Je traite votre demande...";
    let newConversationId = conversationId;
    
    if (data.conversation) {
        // Format nouvelle conversation
        newConversationId = data.conversation.sId;
        
        if (data.conversation.content && data.conversation.content.length > 0) {
            const lastMessageGroup = data.conversation.content[data.conversation.content.length - 1];
            if (lastMessageGroup && lastMessageGroup[0] && lastMessageGroup[0].content) {
                assistantResponse = lastMessageGroup[0].content.trim();
            }
        }
    } else if (data.agentMessages && data.agentMessages.length > 0) {
        // Format continuation de conversation
        const lastAgentMessage = data.agentMessages[data.agentMessages.length - 1];
        if (lastAgentMessage && lastAgentMessage.content) {
            assistantResponse = lastAgentMessage.content
                .replace(/\\n/g, '\n')  // Convertir les \n échappés
                .replace(/^\n+|\n+$/g, '')  // Supprimer les \n au début/fin
                .trim();
        }
    } else if (data.content) {
        // Autre format possible
        assistantResponse = data.content.trim();
    }
    
    // Nettoyer la réponse des infos contextuelles ajoutées
    assistantResponse = assistantResponse.replace(/\[CONTEXTE PARTENAIRE:.*?\]\s*/g, '');
    
    console.log('✅ Réponse extraite:', assistantResponse);
    console.log('🆔 ConversationId final:', newConversationId);
    
    return res.status(200).json({ 
        response: assistantResponse,
        conversationId: newConversationId,
        status: 'success'
    });
}

// Fonction pour sauvegarder le descriptif
async function handleSaveDescription(req, res, data) {
    const { codeUnique, description } = data;
    
    console.log('💾 Sauvegarde descriptif:', { codeUnique, description });
    
    try {
        const result = await callGoogleScript('save-description', {
            codeUnique,
            description
        });
        
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Descriptif sauvegardé avec succès',
                timestamp: new Date().toISOString()
            });
        } else {
            return res.status(500).json({
                success: false,
                error: result.message || 'Erreur lors de la sauvegarde'
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde descriptif:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Erreur lors de la sauvegarde'
        });
    }
}

// Fonction pour gérer l'upload de fichiers
async function handleFileUpload(req, res, data) {
    const { fileName, fileSize, contentType, codeUnique } = data;
    
    console.log('📁 Demande upload fichier:', { fileName, fileSize, contentType, codeUnique });
    
    try {
        // Validation basique
        if (!fileName || !fileSize || !contentType) {
            return res.status(400).json({
                success: false,
                error: 'Informations fichier manquantes'
            });
        }
        
        // Vérifier la taille (max 10MB)
        if (fileSize > 10 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                error: 'Fichier trop volumineux (max 10MB)'
            });
        }
        
        // Vérifier le type de fichier (images seulement pour les logos)
        const allowedTypes = [
            'image/jpeg', 
            'image/jpg', 
            'image/png', 
            'image/gif', 
            'image/webp',
            'image/svg+xml'
        ];
        
        if (!allowedTypes.includes(contentType)) {
            return res.status(400).json({
                success: false,
                error: 'Type de fichier non autorisé (images uniquement : JPG, PNG, GIF, WEBP, SVG)'
            });
        }
        
        // Appeler Google Apps Script pour gérer l'upload
        const result = await callGoogleScript('upload-file', {
            fileName,
            fileSize,
            contentType,
            codeUnique
        });
        
        if (result.success) {
            console.log('✅ Fichier uploadé:', result.data?.fileId);
            
            return res.status(200).json({
                success: true,
                message: 'Fichier uploadé avec succès',
                data: result.data
            });
        } else {
            return res.status(500).json({
                success: false,
                error: result.message || 'Erreur lors de l\'upload'
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur upload fichier:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'upload du fichier'
        });
    }
}

// Fonction utilitaire pour formater les dates
function formatDate(date) {
    if (!date) return '';
    
    try {
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        return date.toString();
    }
}

// Fonction utilitaire pour nettoyer les données
function sanitizeData(data) {
    if (typeof data !== 'object' || data === null) return data;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            // Nettoyer les chaînes
            sanitized[key] = value.trim().replace(/\s+/g, ' ');
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

// Fonction utilitaire pour logger les erreurs
function logError(context, error, additionalData = {}) {
    console.error(`❌ [${context}] ${error.message}`, {
        error: error.stack,
        timestamp: new Date().toISOString(),
        ...additionalData
    });
}

// Fonction utilitaire pour valider les codes partenaires
function isValidPartnerCode(code) {
    if (!code || typeof code !== 'string') return false;
    
    // Code doit faire entre 3 et 20 caractères, lettres et chiffres uniquement
    return /^[A-Z0-9]{3,20}$/.test(code.toUpperCase());
}

// Middleware de validation pour les requêtes
function validateRequest(requiredFields, data) {
    const missing = requiredFields.filter(field => !data[field]);
    
    if (missing.length > 0) {
        throw new Error(`Champs manquants: ${missing.join(', ')}`);
    }
    
    return true;
}
