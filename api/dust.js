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
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message requis' });
        }
        
        // Format EXACT requis par l'API Dust
        const dustPayload = {
            message: {
                content: message,
                context: {
                    timezone: "Europe/Paris",
                    username: "connect2025-user",
                    fullName: "Participant Connect 2025",
                    email: "participant@connect2025.fr",
                    profilePictureUrl: null,
                    origin: "web"
                },
                mentions: [{
                    configurationId: 'Xl8LLukA05'
                }]
            },
            title: "Connect 2025 Chat",
            blocking: true,
            streamGenerationTokens: false
        };
        
        console.log('📤 Payload Dust:', JSON.stringify(dustPayload, null, 2));
        
        const dustResponse = await fetch('https://eu.dust.tt/api/v1/w/v6cPQVVFE1/assistant/conversations', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer sk-a893bcb7af5957be77de21ed265ba2fd',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(dustPayload)
        });
        
        const responseText = await dustResponse.text();
        console.log('📥 Réponse Dust:', responseText);
        
        if (!dustResponse.ok) {
            console.error('❌ Erreur Dust:', dustResponse.status, responseText);
            throw new Error(`Dust API Error ${dustResponse.status}: ${responseText}`);
        }
        
        const data = JSON.parse(responseText);
        
        // Extraction de la réponse
        let assistantResponse = "Je traite votre demande...";
        
        if (data.conversation && data.conversation.content) {
            const messages = data.conversation.content;
            for (let i = messages.length - 1; i >= 0; i--) {
                const msg = messages[i];
                if (msg.type === 'agent_message' && msg.content) {
                    assistantResponse = msg.content;
                    break;
                }
            }
        }
        
        console.log('✅ Réponse extraite:', assistantResponse);
        
        return res.status(200).json({ 
            response: assistantResponse, 
            status: 'success'
        });
        
    } catch (error) {
        console.error('💥 Erreur complète:', error);
        return res.status(500).json({ 
            error: 'Erreur interne du serveur', 
            details: error.message 
        });
    }
}
