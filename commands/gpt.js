const axios = require('axios');

function getPrompt() {
    try {
        const fs = require('fs'), path = require('path');
        const p = path.join(__dirname, '../data/prompt.json');
        return JSON.parse(fs.readFileSync(p)).prompt || "Tu es SKY-ISOMYY, assistant WhatsApp créé par IBSACKO. Réponds en français, sois utile et concis.";
    } catch {
        return "Tu es SKY-ISOMYY, assistant WhatsApp créé par IBSACKO. Réponds en français, sois utile et concis.";
    }
}

async function gptCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const query = text.split(' ').slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: `╔═════════════════════╗\n║   🥷 *𝐒𝐊𝐘-𝐈𝐒𝐎𝐌𝐘𝐘* 🥷   ║\n╚═════════════════════╝\n\n🤖 *Usage :* gpt <question>\n💡 _Exemple : gpt C'est quoi Python ?_`,
            }, { quoted: message });
        }

        if (!process.env.GROQ_API_KEY) {
            return await sock.sendMessage(chatId, {
                text: `❌ *IA non configurée.*\n_Il manque la clé GROQ_API_KEY sur le serveur._`,
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '🤖', key: message.key } });

        const systemPrompt = getPrompt();
        let answer = null;

        try {
            const r = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: query }
                    ],
                    temperature: 0.7,
                    max_tokens: 800
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 20000
                }
            );
            answer = r.data?.choices?.[0]?.message?.content?.trim() || null;
        } catch (e) {
            console.error(`❌ [gpt] Groq échoué: ${e.response?.status || ''} ${e.response?.data?.error?.message || e.message}`);
        }

        if (!answer) {
            return await sock.sendMessage(chatId, {
                text: `❌ *L'IA est temporairement indisponible.*\n_Réessayez dans quelques instants._`,
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: `╔═════════════════════╗\n║   🥷 *𝐒𝐊𝐘-𝐈𝐒𝐎𝐌𝐘𝐘* 🥷   ║\n╚═════════════════════╝\n\n❓ *Question :* ${query}\n\n💬 *Réponse :*\n${answer}\n\n> _Propulsé par 🥷 *IB- CENTRAL-HEX*_`,
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (e) {
        console.error('❌ [ai]', e.message);
        await sock.sendMessage(chatId, {
            text: `❌ *L'IA est temporairement indisponible.*\n_Réessaie dans quelques instants._`,
        }, { quoted: message });
    }
}

module.exports = gptCommand;
