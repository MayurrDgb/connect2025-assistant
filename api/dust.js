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

// NOUVEAU : Analyser et enregistrer automatiquement les informations
async function analyzeAndSaveInfo(message, partnerCode) {
    if (!partnerCode) return;
    
    try {
        console.log('🔍 Analyse du message:', message);
        
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
