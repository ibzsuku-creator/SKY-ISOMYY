const mumaker = require('mumaker');

const STYLES = {
    metallic: "https://en.ephoto360.com/impressive-decorative-3d-metal-text-effect-798.html",
    ice: "https://en.ephoto360.com/ice-text-effect-online-101.html",
    snow: "https://en.ephoto360.com/create-a-snow-3d-text-effect-free-online-621.html",
    neon: "https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html",
    fire: "https://en.ephoto360.com/flame-lettering-effect-372.html",
    matrix: "https://en.ephoto360.com/matrix-text-effect-154.html",
    thunder: "https://en.ephoto360.com/thunder-text-effect-online-97.html",
    glitch: "https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html",
    purple: "https://en.ephoto360.com/purple-text-effect-online-100.html",
    hacker: "https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html",
    light: "https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html",
    sand: "https://en.ephoto360.com/write-names-and-messages-on-the-sand-online-582.html"
};

async function textmakerCommand(sock, chatId, message, parts) {
    if (!parts || parts.length === 0) {
        return await sock.sendMessage(chatId, {
            text: `╔══✦𝐒𝐊𝐘-𝐈𝐒𝐎𝐌𝐘𝐘✦═══>
║»👾 *TEXTE MAKER*
╚══════════════════>

📌 Usage : texte <style> <texte>
📌 Ou juste : texte <texte>  _(style neon par défaut)_

🎨 *Styles disponibles :*
${Object.keys(STYLES).map(s => `║❒ ${s}`).join('\n')}

> 🥷 _by *IB- CENTRAL-HEX*_`
        }, { quoted: message });
    }

    let style = 'neon';
    let text = parts.join(' ');

    if (STYLES[parts[0].toLowerCase()]) {
        style = parts[0].toLowerCase();
        text = parts.slice(1).join(' ');
    }

    if (!text) {
        return await sock.sendMessage(chatId, { text: `❌ Ajoute un texte après le style. Ex : texte ${style} Salut` }, { quoted: message });
    }

    try {
        await sock.sendMessage(chatId, { react: { text: '🎨', key: message.key } });
        const result = await mumaker.ephoto(STYLES[style], text);

        if (!result || !result.image) throw new Error('Pas de résultat reçu');

        await sock.sendMessage(chatId, {
            image: { url: result.image },
            caption: `🥷 *SKY-ISOMYY* — style "${style}"\n\n> 🥷 _by *IB- CENTRAL-HEX*_`
        }, { quoted: message });
    } catch (e) {
        console.error('❌ [texte]', e.message);
        await sock.sendMessage(chatId, { text: `❌ *Erreur lors de la génération.* Réessaie avec un autre style.` }, { quoted: message });
    }
}

module.exports = textmakerCommand;
