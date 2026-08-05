const fs = require('fs');
const path = require('path');

const modeFile = path.join(__dirname, '../data/mode.json');

function readMode() {
    try {
        return JSON.parse(fs.readFileSync(modeFile));
    } catch {
        return { isPublic: true };
    }
}

function writeMode(data) {
    const dir = path.dirname(modeFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(modeFile, JSON.stringify(data, null, 2));
}

async function modeCommand(sock, chatId, userMessage, message, isOwnerOrSudo) {
    const arg = userMessage.toLowerCase().trim();
    const data = readMode();

    if (!arg) {
        const current = data.isPublic ? '🌍 Public' : '🔒 Private';
        return await sock.sendMessage(chatId, {
            text: `╔══✦𝐒𝐊𝐘-𝐈𝐒𝐎𝐌𝐘𝐘✦═══>
║»👾 *Mode actuel* : ${current}
╚══════════════════>

📌 Usage : mode public | mode private
> 🥷 _by *IB- CENTRAL-HEX*_`
        }, { quoted: message });
    }

    if (!isOwnerOrSudo) {
        return await sock.sendMessage(chatId, { text: `❌ *Seul le propriétaire peut changer le mode.*` }, { quoted: message });
    }

    if (arg === 'public') {
        data.isPublic = true;
        writeMode(data);
        return await sock.sendMessage(chatId, { text: `✅ *Mode changé :* 🌍 Public\n_Tout le monde peut utiliser le bot._` }, { quoted: message });
    }

    if (arg === 'private') {
        data.isPublic = false;
        writeMode(data);
        return await sock.sendMessage(chatId, { text: `✅ *Mode changé :* 🔒 Private\n_Seul le propriétaire peut utiliser le bot._` }, { quoted: message });
    }

    return await sock.sendMessage(chatId, { text: `❌ Usage : mode public | mode private` }, { quoted: message });
}

module.exports = { modeCommand, readMode };
