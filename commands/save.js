const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function saveCommand(sock, chatId, senderId, replyMessage, message) {
    if (!replyMessage) {
        return await sock.sendMessage(chatId, {
            text: `🥷 *𝗦𝗞𝗬-𝗜𝗦𝗢𝗠𝗬𝗬*\n\n💾 *Sauvegarder un statut/message*\n\n💡 *Usage :* réponds à un statut ou un message avec *save*\n_Fonctionne avec : texte, image, vidéo, audio, sticker_`,
        }, { quoted: message });
    }

    try {
        // Texte
        if (replyMessage.conversation || replyMessage.extendedTextMessage) {
            const text = replyMessage.conversation || replyMessage.extendedTextMessage?.text;
            await sock.sendMessage(senderId, {
                text: `🥷 *SKY-ISOMYY* — message sauvegardé\n\n📝 *Contenu :*\n${text}`
            });
            return await sock.sendMessage(chatId, { text: `✅ *Sauvegardé dans ton MP !*` }, { quoted: message });
        }

        // Image
        if (replyMessage.imageMessage) {
            const stream = await downloadContentFromMessage(replyMessage.imageMessage, 'image');
            let buf = Buffer.from([]);
            for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
            await sock.sendMessage(senderId, { image: buf, caption: `🥷 *SKY-ISOMYY* — image sauvegardée` });
            return await sock.sendMessage(chatId, { text: `✅ *Sauvegardé dans ton MP !*` }, { quoted: message });
        }

        // Vidéo
        if (replyMessage.videoMessage) {
            const stream = await downloadContentFromMessage(replyMessage.videoMessage, 'video');
            let buf = Buffer.from([]);
            for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
            await sock.sendMessage(senderId, { video: buf, caption: `🥷 *SKY-ISOMYY* — vidéo sauvegardée` });
            return await sock.sendMessage(chatId, { text: `✅ *Sauvegardé dans ton MP !*` }, { quoted: message });
        }

        // Audio
        if (replyMessage.audioMessage) {
            const stream = await downloadContentFromMessage(replyMessage.audioMessage, 'audio');
            let buf = Buffer.from([]);
            for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
            await sock.sendMessage(senderId, { audio: buf, mimetype: 'audio/mp4' });
            return await sock.sendMessage(chatId, { text: `✅ *Sauvegardé dans ton MP !*` }, { quoted: message });
        }

        // Sticker
        if (replyMessage.stickerMessage) {
            const stream = await downloadContentFromMessage(replyMessage.stickerMessage, 'sticker');
            let buf = Buffer.from([]);
            for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
            await sock.sendMessage(senderId, { sticker: buf });
            return await sock.sendMessage(chatId, { text: `✅ *Sauvegardé dans ton MP !*` }, { quoted: message });
        }

        await sock.sendMessage(chatId, { text: `❌ *Type de message non supporté.*` }, { quoted: message });
    } catch (e) {
        console.error('❌ [save]', e.message);
        await sock.sendMessage(chatId, { text: `❌ *Erreur lors de la sauvegarde.*` }, { quoted: message });
    }
}

module.exports = saveCommand;
