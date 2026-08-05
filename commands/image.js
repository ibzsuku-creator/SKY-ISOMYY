// image.js — SKY-ISOMYY-V2
// Recherche d'images via Pinterest API
const axios = require('axios');

async function imageCommand(sock, chatId, message, args) {
    const query = args.join(' ').trim();

    if (!query) {
        return sock.sendMessage(chatId, {
            image: { url: 'https://i.ibb.co/xSScX4bP/file-0000000060a471fd918d46d4c7c69a21.png' },
            caption: `🖼️ *IMAGE SEARCH — SKY-ISOMYY*\n\n❌ Donne des mots-clés !\n\n💡 *Usage :* image <texte>\n📌 *Exemple :* image hacker setup\n\n> 🥷 IB- CENTRAL-HEX · CENTRAL-HEX`,
        }, { quoted: message });
    }

    try {
        await sock.sendMessage(chatId, {
            react: { text: '🔍', key: message.key }
        });
        await sock.sendMessage(chatId, {
            text: `🔍 Recherche d'images pour *"${query}"*...`
        }, { quoted: message });

        const apiUrl = `https://christus-api.vercel.app/image/Pinterest?query=${encodeURIComponent(query)}&limit=10`;
        const response = await axios.get(apiUrl, { timeout: 15000 });

        if (!response.data?.status || !Array.isArray(response.data?.results) || response.data.results.length === 0) {
            // Fallback API
            const r2 = await axios.get(
                `https://api.giftedtech.my.id/api/search/pinterest?apikey=gifted&query=${encodeURIComponent(query)}`,
                { timeout: 15000 }
            );
            const results2 = r2.data?.result || [];
            if (!results2.length) throw new Error('Aucune image trouvée');

            for (const item of results2.slice(0, 5)) {
                const imgUrl = item.url || item.image;
                if (!imgUrl) continue;
                try {
                    await sock.sendMessage(chatId, {
                        image: { url: imgUrl },
                        caption: `📷 *${query}*\n> 🥷 IB- CENTRAL-HEX · CENTRAL-HEX`,
                    });
                    await new Promise(r => setTimeout(r, 1000));
                } catch {}
            }
            return;
        }

        const images = response.data.results
            .filter(item => item.imageUrl && /\.(jpg|jpeg|png|webp)/i.test(item.imageUrl))
            .slice(0, 5);

        if (images.length === 0) {
            return sock.sendMessage(chatId, {
                text: '❌ Aucune image valide trouvée.'
            }, { quoted: message });
        }

        for (const image of images) {
            try {
                await sock.sendMessage(chatId, {
                    image: { url: image.imageUrl },
                    caption: `📷 *${query}*${image.title && image.title !== 'No title' ? '\n' + image.title : ''}\n> 🥷 IB- CENTRAL-HEX · CENTRAL-HEX`,
                });
                await new Promise(r => setTimeout(r, 1000));
            } catch {}
        }

        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

    } catch (error) {
        console.error('IMG ERROR:', error.message);
        await sock.sendMessage(chatId, {
            text: `❌ Erreur recherche image: ${error.message}`
        }, { quoted: message });
    }
}

module.exports = imageCommand;
