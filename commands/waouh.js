const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// `viewOnce` = { type: 'image'|'video', content } — déjà vérifié par handler.js
// comme étant une réponse à un média envoyé en "vue unique".
async function waouhCommand(sock, chatId, senderId, viewOnce, message) {
    if (!viewOnce) return;

    try {
        const { type, content } = viewOnce;
        const stream = await downloadContentFromMessage(content, type);
        let buf = Buffer.from([]);
        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);

        await sock.sendMessage(senderId, {
            [type]: buf,
            caption: `🥷 *SKY-ISOMYY* — vue unique récupérée (waouh)`
        });
    } catch (e) {
        console.error('❌ [waouh]', e.message);
        await sock.sendMessage(chatId, { text: `❌ *Erreur lors de la récupération du média.*` }, { quoted: message });
    }
}

module.exports = waouhCommand;
