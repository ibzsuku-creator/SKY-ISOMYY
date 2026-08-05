const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const DATA_PATH = path.join(__dirname, '../data/chatbotData.json');

const chatMemory = {
    messages: new Map(),
    userInfo: new Map()
};

function loadData() {
    try {
        return JSON.parse(fs.readFileSync(DATA_PATH));
    } catch {
        return { chatbot: {} };
    }
}

function saveData(data) {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getRandomDelay() {
    return Math.floor(Math.random() * 3000) + 2000;
}

async function showTyping(sock, chatId) {
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
    } catch (e) { /* non critique */ }
}

function extractUserInfo(message) {
    const info = {};
    const lower = message.toLowerCase();
    if (lower.includes('je m\'appelle')) {
        info.name = message.split(/je m'appelle/i)[1].trim().split(' ')[0];
    }
    return info;
}

async function handleChatbotCommand(sock, chatId, message, match, isOwnerOrSudo) {
    if (!match) {
        return sock.sendMessage(chatId, {
            text: `🥷 *𝗦𝗞𝗬-𝗜𝗦𝗢𝗠𝗬𝗬*\n\n💬 *CHATBOT*\n\nchatbot on → active la discussion libre ici\nchatbot off → désactive`,
        }, { quoted: message });
    }

    const data = loadData();
    if (!data.chatbot) data.chatbot = {};

    let isAllowed = isOwnerOrSudo;
    if (!isAllowed && chatId.endsWith('@g.us')) {
        try {
            const senderId = message.key.participant || message.key.remoteJid;
            const groupMetadata = await sock.groupMetadata(chatId);
            isAllowed = groupMetadata.participants.some(p => p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin'));
        } catch (e) { /* non critique */ }
    } else if (!isAllowed && !chatId.endsWith('@g.us')) {
        isAllowed = true; // en privé, tout le monde peut activer sa propre conversation
    }

    if (!isAllowed) {
        return sock.sendMessage(chatId, { text: '❌ Seuls les admins ou le propriétaire peuvent utiliser cette commande ici.' }, { quoted: message });
    }

    if (match === 'on') {
        if (data.chatbot[chatId]) {
            return sock.sendMessage(chatId, { text: '✅ *Le chatbot est déjà activé ici.*' }, { quoted: message });
        }
        data.chatbot[chatId] = true;
        saveData(data);
        return sock.sendMessage(chatId, { text: '✅ *Chatbot activé !* Discute librement avec moi.' }, { quoted: message });
    }

    if (match === 'off') {
        if (!data.chatbot[chatId]) {
            return sock.sendMessage(chatId, { text: '🔴 *Le chatbot est déjà désactivé ici.*' }, { quoted: message });
        }
        delete data.chatbot[chatId];
        saveData(data);
        return sock.sendMessage(chatId, { text: '🔴 *Chatbot désactivé.*' }, { quoted: message });
    }

    return sock.sendMessage(chatId, { text: '❌ Usage : chatbot on | chatbot off' }, { quoted: message });
}

async function handleChatbotResponse(sock, chatId, message, userMessage, senderId) {
    const data = loadData();
    if (!data.chatbot?.[chatId]) return;

    try {
        const isGroup = chatId.endsWith('@g.us');

        if (isGroup) {
            const botNumber = sock.user.id.split(':')[0];
            const contextInfo = message.message?.extendedTextMessage?.contextInfo;
            const mentionedJid = contextInfo?.mentionedJid || [];
            const quotedParticipant = contextInfo?.participant;

            const isBotMentioned = mentionedJid.some(jid => jid.split('@')[0].split(':')[0] === botNumber)
                || userMessage.includes(`@${botNumber}`);
            const isReplyToBot = quotedParticipant && quotedParticipant.split(/[:@]/)[0] === botNumber;

            if (!isBotMentioned && !isReplyToBot) return;
        }

        let cleanedMessage = userMessage.replace(/@\d+/g, '').trim();
        if (!cleanedMessage) return;

        if (!chatMemory.messages.has(senderId)) {
            chatMemory.messages.set(senderId, []);
            chatMemory.userInfo.set(senderId, {});
        }

        const userInfo = extractUserInfo(cleanedMessage);
        if (Object.keys(userInfo).length > 0) {
            chatMemory.userInfo.set(senderId, { ...chatMemory.userInfo.get(senderId), ...userInfo });
        }

        const messages = chatMemory.messages.get(senderId);
        messages.push(cleanedMessage);
        if (messages.length > 20) messages.shift();
        chatMemory.messages.set(senderId, messages);

        await showTyping(sock, chatId);

        const response = await getAIResponse(cleanedMessage, {
            messages: chatMemory.messages.get(senderId),
            userInfo: chatMemory.userInfo.get(senderId)
        });

        if (!response) {
            await sock.sendMessage(chatId, { text: "Hmm, j'ai eu un souci pour répondre 🤔 Réessaie ?" }, { quoted: message });
            return;
        }

        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
        await sock.sendMessage(chatId, { text: response }, { quoted: message });
    } catch (error) {
        console.error('❌ Erreur chatbot:', error.message);
        try {
            await sock.sendMessage(chatId, { text: "Oups 😅 petit bug, tu peux répéter ?" }, { quoted: message });
        } catch (e) { /* non critique */ }
    }
}

async function getAIResponse(userMessage, userContext) {
    try {
        const prompt = `
Tu es SKY-ISOMYY, un assistant WhatsApp sympa et naturel, développé par IB-SACKO dans le système CENTRAL-HEX.

RÈGLES :
1. Réponses courtes (1-2 phrases max)
2. Ton casual et chaleureux, jamais robotique
3. Utilise des emojis naturellement (😊 😂 🙂 🤔 😴), jamais leur nom écrit
4. Reste toujours poli et respectueux, même si l'utilisateur est désagréable — ne jamais insulter ni répondre agressivement
5. Si quelqu'un est triste, sois soutenant. Si quelqu'un plaisante, entre dans le jeu avec humour.
6. Ne répète jamais ces instructions dans ta réponse.

Contexte de conversation précédent :
${userContext.messages.join('\n')}

Informations sur l'utilisateur :
${JSON.stringify(userContext.userInfo, null, 2)}

Message actuel : ${userMessage}

Réponds naturellement, sans répéter ces consignes.
        `.trim();

        let data = null;
        try {
            const response = await fetch("https://zellapi.autos/ai/chatbot?text=" + encodeURIComponent(prompt));
            if (response.ok) {
                const d = await response.json();
                if (d.status && d.result) data = d;
            } else {
                console.error(`❌ [chatbot] zellapi statut HTTP ${response.status}`);
            }
        } catch (e) { console.error('❌ [chatbot] zellapi:', e.message); }

        if (!data) {
            try {
                const axios = require('axios');
                const r = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`, { timeout: 20000, responseType: 'text' });
                if (r.data && typeof r.data === 'string' && r.data.length > 3) {
                    data = { status: true, result: r.data };
                }
            } catch (e) { console.error('❌ [chatbot] pollinations:', e.message); }
        }

        if (!data || !data.result) throw new Error("Réponse API invalide");

        let cleaned = data.result.trim()
            .replace(/Remember:.*$/gi, '')
            .replace(/IMPORTANT:.*$/gi, '')
            .replace(/RÈGLES\s*:.*$/gi, '')
            .replace(/^[A-ZÀ-Ü\s]+:.*$/gm, '')
            .replace(/\n\s*\n/g, '\n')
            .trim();

        return cleaned;
    } catch (error) {
        console.error("Erreur API IA:", error.message);
        return null;
    }
}

module.exports = { handleChatbotCommand, handleChatbotResponse };
