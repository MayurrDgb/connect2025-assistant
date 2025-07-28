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
        const { message, conversationId } = req.body;
        
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
            newConversationId = data.conversation.sId;
            
            if (data.conversation.content && data.conversation.content.length > 0) {
                const lastMessageGroup = data.conversation.content[data.conversation.content.length - 1];
                if (lastMessageGroup && lastMessageGroup[0] && lastMessageGroup[0].content) {
                    assistantResponse = lastMessageGroup[0].content.trim();
                }
            }
        } else if (data.content) {
            // Format pour message dans conversation existante
            assistantResponse = data.content.trim();
        }
        
        console.log('✅ Réponse extraite:', assistantResponse);
        console.log('🆔 ConversationId final:', newConversationId);
        
        return res.status(200).json({ 
            response: assistantResponse,
            conversationId: newConversationId,
            status: 'success'
        });
        
    } catch (error) {
        console.error('💥 Erreur:', error);
        return res.status(500).json({ 
            error: 'Erreur interne du serveur',
            details: error.message 
        });
    }
}
