const settings = require('../settings');

async function ownerCommand(sock, chatId, message) {
    const caption = `╔══✦𝐒𝐊𝐘-𝐈𝐒𝐎𝐌𝐘𝐘✦═══>
║»👾 LE BOT A ÉTÉ CRÉÉ PAR
║»👾 *${settings.developer}*
║»👾 *+${settings.developerNumber}*
╠══════════════════
║»👑 PROPRIÉTAIRE
║»👑 *${settings.ownerName}*
║»📞 *+${settings.ownerContact}*
╠══════════════════
║»🥷 DANS LE SYSTÈME
║»🥷 *${settings.system}*
╚══════════════════>

> 🥷 _by *IB- CENTRAL-HEX*_`;

    const vcardOwner = `BEGIN:VCARD\nVERSION:3.0\nFN:${settings.ownerName}\nTEL;waid=${settings.ownerContact}:${settings.ownerContact}\nEND:VCARD`;

    await sock.sendMessage(chatId, {
        contacts: {
            displayName: settings.ownerName,
            contacts: [{ vcard: vcardOwner }]
        }
    }, { quoted: message });

    await sock.sendMessage(chatId, {
        image: { url: settings.menuImage },
        caption
    }, { quoted: message });
}

module.exports = ownerCommand;
