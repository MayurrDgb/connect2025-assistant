export default async function handler(req, res) {
    // CORS pour permettre les appels depuis n'importe où
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Gestion des requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Seules les requêtes POST sont acceptées
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }
    
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message requis' });
        }
        
        // Appel à l'API Dust
        const dustResponse = await fetch('https://eu.dust.tt/api/v1/w/v6cPQVVFE1/assistant/conversations', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer sk-a893bcb7af5957be77de21ed265ba2fd',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: {
                    content: message,
                    mentions: [{
                        configurationId: 'Xl8LLukA05'
                    }]
                },
                title: "Connect 2025 Chat",
                blocking: true
            })
        });
        
        if (!dustResponse.ok) {
            const errorText = await dustResponse.text();
            throw new Error(`Dust API Error ${dustResponse.status}: ${errorText}`);
        }
        
        const data = await dustResponse.json();
        
        // Extraction de la réponse de l'assistant
        let assistantResponse = "Je réfléchis à votre question...";
        
        if (data.conversation && data.conversation.content) {
            const messages = data.conversation.content;
            // Chercher le dernier message de l'assistant
            for (let i = messages.length - 1; i >= 0; i--) {
                const msg = messages[i];
                if (msg.type === 'agent_message' && msg.content) {
                    assistantResponse = msg.content;
                    break;
                }
            }
        }
        
        // Retour de la réponse
        return res.status(200).json({ 
            response: assistantResponse, 
            status: 'success',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erreur API:', error);
        return res.status(500).json({ 
            error: 'Erreur interne du serveur', 
            details: error.message 
        });
    }
}
