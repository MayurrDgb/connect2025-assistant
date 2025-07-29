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
            case 'chat':
                return handleChatMessage(req, res, message, conversationId);
            case 'save-description':
                return handleSaveDescription(req, res, otherData);
            case 'get-partner-data':
                return handleGetPartnerData(req, res, otherData);
            case 'upload-file':
                return handleFileUpload(req, res, otherData);
            default:
                // Par défaut, traiter comme un message chat (compatibilité avec votre code existant)
                return handleChatMessage(req, res, message || req.body.message, conversationId);
        }
        
    } catch (error) {
        console.error('💥 Erreur:', error);
        return res.status(500).json({ 
            error: 'Erreur interne du serveur',
            details: error.message 
        });
    }
}

// Fonction pour gérer les messages chat (votre code existant)
async function handleChatMessage(req, res, message, conversationId) {
    if (!message) {
        return res.status(400).json({ error: 'Message requis' });
    }
    
    console.log('🔍 ConversationId reçu:', conversationId);
    
    let dustUrl, dustPayload;
    
    if (conversationId && conversationId !== null && conversationId !== 'null') {
        // Continuer une conversation existante
        console.log('📝 Continuation de conversation:', conversationId);
        dustUrl = `https://eu.dust.tt/api/v1/w/v6cPQVVFE1/assistant/conversations/${conversationId}/messages`;
        dustPayload = {
            content: message,
            context: {
                username: "connect2025-user",
                timezone: "Europe/Paris",
                fullName: "Participant Connect 2025",
                email: "participant@connect2025.fr",
                profilePictureUrl: null,
                origin: "api"
            },
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
                context: {
                    username: "connect2025-user",
                    timezone: "Europe/Paris",
                    fullName: "Participant Connect 2025",
                    email: "participant@connect2025.fr",
                    profilePictureUrl: null,
                    origin: "api"
                },
                mentions: [{
                    configurationId: 'Xl8LLukA05'
                }]
            },
            title: "Connect 2025 Chat",
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
    
    console.log('✅ Réponse extraite:', assistantResponse);
    console.log('🆔 ConversationId final:', newConversationId);
    
    return res.status(200).json({ 
        response: assistantResponse,
        conversationId: newConversationId,
        status: 'success'
    });
}

// NOUVEAU : Fonction pour sauvegarder le descriptif
async function handleSaveDescription(req, res, data) {
    const { codeUnique, description } = data;
    
    console.log('💾 Sauvegarde descriptif:', { codeUnique, description });
    
    // TODO: Ici vous pourrez connecter à votre vraie base de données
    // Pour l'instant, on simule la sauvegarde
    
    try {
        // Simulation d'une sauvegarde réussie
        // Dans une vraie implémentation, vous feriez :
        // await database.updatePartner(codeUnique, { descriptifEntreprise: description });
        
        return res.status(200).json({ 
            success: true,
            message: 'Descriptif sauvegardé avec succès',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde descriptif:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Erreur lors de la sauvegarde'
        });
    }
}

// NOUVEAU : Fonction pour récupérer les données partenaire
async function handleGetPartnerData(req, res, data) {
    const { codeUnique } = data;
    
    console.log('📊 Récupération données pour:', codeUnique);
    
    try {
        // TODO: Ici vous pourrez connecter à votre vraie base de données
        // const partnerData = await database.getPartnerByCode(codeUnique);
        
        // Pour l'instant, données simulées pour test
        const mockData = {
            codeUnique: codeUnique,
            nomEntreprise: "MBE France Partenaire",
            nomContact: "Jean Dupont",
            emailContact: "jean.dupont@example.com",
            telephone: "01 23 45 67 89",
            descriptifEntreprise: "Entreprise spécialisée dans les solutions digitales innovantes pour les événements professionnels. Nous proposons des services de haute qualité...",
            equipementsApportes: "Écrans LED, système audio, mobilier",
            dimensionsEquipements: "3m x 2m x 1.5m",
            materielEncombrant: "Non",
            dateLivraisonSouhaitee: "2025-09-25",
            instructionsLivraisonSpeciales: "Livraison par l'entrée principale",
            besoinsConnectiviteAdditionnels: "WiFi haut débit, prises électriques",
            statutGlobal: "En cours",
            progression: 75,
            deadline: "2025-09-26",
            joursRestants: 45,
            priorite: "Haute",
            derniereModification: new Date().toISOString()
        };
        
        return res.status(200).json({ 
            success: true,
            data: mockData
        });
        
    } catch (error) {
        console.error('❌ Erreur récupération données:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Erreur lors de la récupération des données'
        });
    }
}

// NOUVEAU : Fonction pour gérer l'upload de fichiers
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
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(contentType)) {
            return res.status(400).json({
                success: false,
                error: 'Type de fichier non autorisé (images uniquement)'
            });
        }
        
        // TODO: Ici vous pourrez implémenter l'upload vers Dust ou votre stockage
        // Pour l'instant, on simule un upload réussi
        
        const uploadResult = {
            fileId: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileName: fileName,
            uploadUrl: `https://example.com/upload/${fileName}`, // URL simulée
            downloadUrl: `https://example.com/files/${fileName}` // URL simulée
        };
        
        return res.status(200).json({
            success: true,
            message: 'Fichier uploadé avec succès',
            data: uploadResult
        });
        
    } catch (error) {
        console.error('❌ Erreur upload fichier:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'upload du fichier'
        });
    }
}
