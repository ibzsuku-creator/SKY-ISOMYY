const settings = require('./settings');
const isAdmin = require('./lib/isAdmin');

const menuCommand = require('./commands/menu');
const helpCommand = require('./commands/help');
const pingCommand = require('./commands/ping');
const waouhCommand = require('./commands/waouh');
const ownerCommand = require('./commands/owner');
const hummCommand = require('./commands/humm');
const tagAllCommand = require('./commands/tagall');
const { modeCommand, readMode } = require('./commands/mode');
const gptCommand = require('./commands/gpt');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/chatbot');
const pairCommand = require('./commands/pair');
const imageCommand = require('./commands/image');
const videoCommand = require('./commands/video');
const songCommand = require('./commands/song');
const textmakerCommand = require('./commands/textmaker');
const saveCommand = require('./commands/save');

function getText(message) {
    return (
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption ||
        message.message?.videoMessage?.caption ||
        ''
    ).trim();
}

// Déballe un message cité et renvoie le média SEULEMENT s'il s'agit d'une "vue unique".
function extractViewOnceMedia(quotedMessage) {
    if (!quotedMessage) return null;
    const unwrapped =
        quotedMessage.viewOnceMessageV2?.message ||
        quotedMessage.viewOnceMessageV2Extension?.message ||
        quotedMessage.viewOnceMessage?.message ||
        quotedMessage;

    if (unwrapped.imageMessage && (unwrapped.imageMessage.viewOnce || quotedMessage.viewOnceMessageV2 || quotedMessage.viewOnceMessage)) {
        return { type: 'image', content: unwrapped.imageMessage };
    }
    if (unwrapped.videoMessage && (unwrapped.videoMessage.viewOnce || quotedMessage.viewOnceMessageV2 || quotedMessage.viewOnceMessage)) {
        return { type: 'video', content: unwrapped.videoMessage };
    }
    return null;
}

async function handleMessages(sock, { messages, type }) {
    let chatId = null;
    try {
        if (type !== 'notify') return;
        const message = messages[0];
        if (!message?.message) return;

        chatId = message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwnerOrSudo = message.key.fromMe || senderId.split('@')[0] === settings.developerNumber || senderId.split('@')[0] === settings.ownerContact;

        const rawText = getText(message);
        if (!rawText) return;

        const parts = rawText.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const rest = parts.slice(1).join(' ');

        const KNOWN_COMMANDS = new Set([
            'menu', 'help', 'ping', 'waouh', 'owner', 'humm', 'tagall', 'mode',
            'gpt', 'chatbot', 'pair', 'image', 'video', 'song', 'texte', 'save'
        ]);

        const modeData = readMode();
        const isPublic = modeData.isPublic !== false;
        if (!isPublic && !isOwnerOrSudo) return;

        // ── Pas une commande connue → tenter une réponse chatbot (si activé), puis stop ──
        if (!KNOWN_COMMANDS.has(cmd)) {
            try { await handleChatbotResponse(sock, chatId, message, rawText, senderId); } catch (e) { console.error('chatbot response error:', e.message); }
            return;
        }

        console.log(`📝 Commande reçue [${isGroup ? 'groupe' : 'privé'}] : ${cmd}`);

        switch (cmd) {
            case 'menu':
                return await menuCommand(sock, chatId, message);

            case 'help':
                return await helpCommand(sock, chatId, message);

            case 'ping':
                return await pingCommand(sock, chatId, message);

            case 'waouh': {
                if (rawText.trim().toLowerCase() !== 'waouh') return;
                const quotedInfo = message.message?.extendedTextMessage?.contextInfo;
                const viewOnce = extractViewOnceMedia(quotedInfo?.quotedMessage);
                if (!viewOnce) return;
                return await waouhCommand(sock, chatId, senderId, viewOnce, message);
            }

            case 'owner':
                return await ownerCommand(sock, chatId, message);

            case 'humm': {
                if (rawText.trim().toLowerCase() !== 'humm') return;
                const quotedInfo = message.message?.extendedTextMessage?.contextInfo;
                const viewOnce = extractViewOnceMedia(quotedInfo?.quotedMessage);
                if (!viewOnce) return;
                return await hummCommand(sock, chatId, senderId, viewOnce, message);
            }

            case 'tagall':
                return await tagAllCommand(sock, chatId, senderId, message);

            case 'mode':
                return await modeCommand(sock, chatId, rest, message, isOwnerOrSudo);

            case 'gpt':
                return await gptCommand(sock, chatId, message);

            case 'chatbot':
                return await handleChatbotCommand(sock, chatId, message, rest.toLowerCase().trim(), isOwnerOrSudo);

            case 'pair':
                return await pairCommand(sock, chatId, message, parts.slice(1));

            case 'image':
                return await imageCommand(sock, chatId, message, parts.slice(1));

            case 'video':
                return await videoCommand(sock, chatId, message);

            case 'song':
                return await songCommand(sock, chatId, message);

            case 'texte':
                return await textmakerCommand(sock, chatId, message, parts.slice(1));

            case 'save': {
                const quotedInfo = message.message?.extendedTextMessage?.contextInfo;
                const replyMessage = quotedInfo?.quotedMessage;
                return await saveCommand(sock, chatId, senderId, replyMessage, message);
            }

            default:
                return; // commande inconnue → silence
        }
    } catch (error) {
        console.error('❌ Erreur handler:', error.message);
        if (chatId) {
            try {
                await sock.sendMessage(chatId, { text: '❌ Une erreur est survenue lors du traitement de la commande.' });
            } catch (e2) { console.error("Impossible d'envoyer le message d'erreur:", e2.message); }
        }
    }
}

module.exports = { handleMessages };

