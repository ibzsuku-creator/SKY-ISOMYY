const settings = require('../settings');

function getHeure() {
    return new Date().toLocaleTimeString('fr-FR', { timeZone: 'GMT', hour: '2-digit', minute: '2-digit' });
}

async function menuCommand(sock, chatId, message) {
    const caption = `╔══✦𝐒𝐊𝐘-𝐈𝐒𝐎𝐌𝐘𝐘✦═══>
║»👾 *ʙᴏᴛ ɴᴀᴍᴇ* : ${settings.botName}
║»👾 *ᴜsᴇʀɴᴀᴍᴇ* : CENTRAL-HEX
║»👾 *ᴅᴇᴠᴇʟᴏᴘᴇʀ* : ${settings.developer}
║»👾 *⏰ ʜᴇᴜʀᴇ* : ${getHeure()}
╚══════════════════>
                𝐂𝐄𝐍𝐓𝐑𝐀-𝐇𝐄𝐗
╔══════𝗚𝗘𝗡𝗘𝗥𝗔𝗟══════>
║❒ menu → Menu
║❒ mode public/private → Accès
║❒ help → Aide
║❒ ping → Vitesse
║❒ waouh → Save vue unique → MP
║❒ owner → Créateur
║❒ humm → Save vue unique → MP
║❒ tagall → Mention all
║❒ gpt <question> → IA
║❒ chatbot → Discussion libre
║❒ pair → Code connexion
║❒ image → Générer image
║❒ video → Télécharger vidéo
║❒ song → Télécharger musique
║❒ texte → Texte stylé en image
║❒ save → Enregistrer un statut
╚═══════════════════>

> 🥷 _by *IB- CENTRAL-HEX*_`;

    await sock.sendMessage(chatId, {
        image: { url: settings.menuImage },
        caption
    }, { quoted: message });
}

module.exports = menuCommand;
