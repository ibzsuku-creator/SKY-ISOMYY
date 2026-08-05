/**
 * SKY-ISOMYY — Serveur de pairing WhatsApp (web)
 * Chaque visiteur entre son numéro sur la page web, reçoit un code (ou
 * scanne un QR), et obtient sa propre instance du bot connectée.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const pino = require('pino');
const QRCode = require('qrcode');
const { Boom } = require('@hapi/boom');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');

const { handleMessages } = require('./handler');
const settings = require('./settings');

const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

// sessions[id] = { sock, status, qr, code, number }
const sessions = {};

function sanitizeId(id) {
    return String(id).replace(/[^0-9a-zA-Z_]/g, '');
}

// ── Démarre (ou reprend) l'instance bot complète pour un numéro donné ──
async function startUserSession(number, { usePairingCode = false } = {}) {
    const id = sanitizeId(number);
    if (sessions[id]?.sock && sessions[id].status === 'connected') return sessions[id];

    const sessionDir = path.join(SESSIONS_DIR, id);
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: usePairingCode ? Browsers.ubuntu('Chrome') : Browsers.macOS('Safari'),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
        },
        syncFullHistory: false,
        markOnlineOnConnect: true
    });

    sessions[id] = {
        sock,
        status: usePairingCode ? 'requesting_code' : 'waiting_qr',
        qr: null,
        code: null,
        number
    };

    if (usePairingCode && !state.creds.registered) {
        try {
            await new Promise(r => setTimeout(r, 1500));
            const rawCode = await sock.requestPairingCode(number.replace(/[^0-9]/g, ''));
            sessions[id].code = rawCode?.match(/.{1,4}/g)?.join('-') || rawCode;
            sessions[id].status = 'waiting_code';
        } catch (e) {
            console.error(`❌ [${id}] Erreur génération pairing code:`, e.message);
            sessions[id].status = 'error';
            sessions[id].error = e.message;
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !usePairingCode) {
            sessions[id].qr = await QRCode.toDataURL(qr);
            sessions[id].status = 'waiting_qr';
        }

        if (connection === 'open') {
            sessions[id].status = 'connected';
            sessions[id].qr = null;
            sessions[id].code = null;
            console.log(`✅ [${id}] SKY-ISOMYY connecté (+${number}) !`);
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error instanceof Boom
                ? lastDisconnect.error.output?.statusCode
                : null;

            // ⚠️ Essentiel : sans ça, sessions[id].status reste bloqué sur 'connected'
            // et startUserSession() refuse alors de recréer un socket → le bot ne
            // se reconnecte jamais après une coupure.
            sessions[id].status = 'reconnecting';

            const loggedOut = statusCode === DisconnectReason.loggedOut;

            if (!loggedOut) {
                console.log(`♻️ [${id}] Connexion fermée (status=${statusCode}) — reconnexion dans 3s...`);
                setTimeout(() => startUserSession(number, { usePairingCode: false }), 3000);
            } else {
                console.log(`🚪 [${id}] Déconnecté (logout). Session supprimée.`);
                sessions[id].status = 'logged_out';
                try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch {}
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try { await handleMessages(sock, chatUpdate); } catch (e) { console.error('handleMessages error:', e.message); }
    });

    return sessions[id];
}

// Utilisé par commands/pair.js pour démarrer une session depuis le chat
global.startUserSession = startUserSession;

function getSession(id) {
    return sessions[sanitizeId(id)];
}

async function resumeAllSessions() {
    const ids = fs.readdirSync(SESSIONS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    for (const id of ids) {
        if (!fs.existsSync(path.join(SESSIONS_DIR, id, 'creds.json'))) continue;
        console.log(`♻️ Reprise automatique de la session : ${id}`);
        try { await startUserSession(id, { usePairingCode: false }); }
        catch (e) { console.error(`❌ Échec reprise ${id}:`, e.message); }
    }
}

// ═══════════════════════════════════════════════════════════
// 🌐 SERVEUR WEB
// ═══════════════════════════════════════════════════════════
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/pair', async (req, res) => {
    try {
        const { number } = req.body;
        const cleanNumber = String(number || '').replace(/[^0-9]/g, '');
        if (!cleanNumber || cleanNumber.length < 8) {
            return res.status(400).json({ error: 'Numéro invalide. Utilise le format international sans + (ex: 621963059).' });
        }

        const sessionId = sanitizeId(cleanNumber);
        await startUserSession(cleanNumber, { usePairingCode: true });

        let tries = 0;
        while (tries < 30) {
            const s = getSession(sessionId);
            if (s?.status === 'waiting_code' && s.code) return res.json({ sessionId, code: s.code });
            if (s?.status === 'error') return res.status(500).json({ error: s.error || 'Erreur génération du code.' });
            if (s?.status === 'connected') return res.json({ sessionId, connected: true });
            await new Promise(r => setTimeout(r, 500));
            tries++;
        }
        return res.status(504).json({ error: 'Le code met trop de temps à être généré, réessaie.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/qr', async (req, res) => {
    try {
        const sessionId = `qr_${Date.now()}`;
        await startUserSession(sessionId, { usePairingCode: false });
        res.json({ sessionId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/status/:sessionId', (req, res) => {
    const s = getSession(req.params.sessionId);
    if (!s) return res.status(404).json({ error: 'Session introuvable' });
    res.json({ status: s.status, qr: s.qr || null, code: s.code || null });
});

app.get('/health', (req, res) => {
    res.json({ ok: true, bot: 'SKY-ISOMYY', sessions: Object.keys(sessions).length });
});

app.listen(PORT, () => {
    console.log(`🥷 SKY-ISOMYY — serveur de pairing lancé sur http://localhost:${PORT}`);
    resumeAllSessions().catch(e => console.error('resumeAllSessions error:', e.message));
});

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));

