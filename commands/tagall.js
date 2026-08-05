async function tagAllCommand(sock, chatId, senderId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, {
                text: `╔══✦𝐒𝐊𝐘-𝐈𝐒𝐎𝐌𝐘𝐘✦═══>\n\n❌ *Cette commande fonctionne uniquement dans les groupes !*`
            }, { quoted: message });
        }

        const groupMeta = await sock.groupMetadata(chatId);
        const participants = groupMeta.participants;

        if (!participants || participants.length === 0) {
            return await sock.sendMessage(chatId, { text: `❌ *Aucun membre trouvé.*` }, { quoted: message });
        }

        const groupName = groupMeta.subject || 'Groupe';
        const mentions = participants.map(p => p.id);

        let memberList = '';
        participants.forEach((p) => {
            const role = p.admin === 'superadmin' ? '👑' : p.admin === 'admin' ? '⭐' : '👤';
            memberList += `║ ${role} @${p.id.split('@')[0]}\n`;
        });

        const caption = `╔══✦𝐒𝐊𝐘-𝐈𝐒𝐎𝐌𝐘𝐘✦═══>
║»👾 *TAGALL* — ${groupName}
╠══════════════════
${memberList}╚══════════════════>

> 🥷 _by *IB- CENTRAL-HEX*_`;

        await sock.sendMessage(chatId, { text: caption, mentions }, { quoted: message });
    } catch (e) {
        console.error('❌ [tagall]', e.message);
        await sock.sendMessage(chatId, { text: '❌ Erreur lors de l\'exécution de tagall.' }, { quoted: message });
    }
}

module.exports = tagAllCommand;
