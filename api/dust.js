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
        
        // Format minimal - juste le message
        const dustPayload = {
            message: message,
            blocking: true
        };
        
        console.log('📤 Test format minimal:', JSON.stringify(dustPayload));
        
        const dustResponse = await fetch('https://eu.dust.tt/api/v1/w/v6cPQVVFE1/assistant/conversations', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer sk-a893bcb7af5957be77de21ed265ba2fd',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dustPayload)
        });
        
        const responseText = await dustResponse.text();
        console.log('📥 Réponse:', responseText);
        
        if (!dustResponse.ok) {
            // Si ça marche pas, testons un autre format
            console.log('🔄 Essai format alternatif...');
            
            const altPayload = {
                content: message,
                mentions: [{
                    configurationId: 'Xl8LLukA05'
                }],
                blocking: true
            };
            
            const altResponse = await fetch('https://eu.dust.tt/api/v1/w/v6cPQVVFE1/assistant/conversations', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer sk-a893bcb7af5957be77de21ed265ba2fd',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(altPayload)
            });
            
            const altText = await altResponse.text();
            console.log('📥 Réponse alternative:', altText);
            
            if (!altResponse.ok) {
                throw new Error(`Tous les formats échouent: ${altText}`);
            }
            
            const data = JSON.parse(altText);
            return res.status(200).json({ 
                response: "Format alternatif testé avec succès !",
                data: data,
                status: 'success'
            });
        }
        
        const data = JSON.parse(responseText);
        return res.status(200).json({ 
            response: "Format minimal testé avec succès !",
            data: data,
            status: 'success'
        });
        
    } catch (error) {
        console.error('💥 Erreur:', error);
        return res.status(500).json({ 
            error: error.message,
            status: 'error'
        });
    }
}
