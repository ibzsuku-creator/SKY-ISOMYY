<div align="center">

# 🥷 SKY-ISOMYY

**Bot WhatsApp sans préfixe, connecté via une page web (Code Pairing + QR Code)**

_Système CENTRAL-HEX_

</div>

## 📜 Commandes disponibles (sans préfixe)

| Commande | Description |
|---|---|
| `menu` | Menu illustré |
| `mode public` / `mode private` | Accès |
| `help` | Aide |
| `ping` | Vitesse |
| `waouh` | Save vue unique → MP |
| `owner` | Créateur |
| `humm` | Save vue unique → MP |
| `tagall` | Mention all (groupe) |
| `gpt <question>` | IA |
| `chatbot on/off` | Discussion libre avec l'IA |
| `pair <numéro>` | Connecte un autre numéro depuis le chat |
| `image <texte>` | Génère une image |
| `video <recherche>` | Télécharge une vidéo |
| `song <recherche>` | Télécharge une musique |
| `texte <style> <texte>` | Texte stylé en image (néon, feu, métal...) |
| `save` | Sauvegarde un statut/message (en réponse) |

## 🚀 Installation locale

```bash
npm install --legacy-peer-deps
npm start
```

Le serveur démarre sur `http://localhost:3000`.

## 🔗 Connexion du bot

1. Ouvre la page web
2. **Onglet Code Pair** → entre ton numéro WhatsApp → un code s'affiche
   - WhatsApp → **⋮ → Appareils liés → Lier un appareil → Lier avec un numéro de téléphone** → colle le code
3. **Ou onglet QR Code** → scanne comme sur WhatsApp Web

## 🚀 Déploiement (Render / Railway / Koyeb)

Le projet inclut un **Dockerfile unique** (avec `ffmpeg` installé pour les téléchargements audio) compatible avec les 3 plateformes.

**Dans tous les cas**, il faut un **volume/disque persistant monté sur `/app/sessions`** — sinon la session WhatsApp est effacée à chaque redéploiement.

1. Pousse le repo sur GitHub (repo **privé** conseillé)
2. Sur la plateforme choisie : *New service* → connecte le repo → elle détecte le `Dockerfile` automatiquement
3. Ajoute un volume persistant sur `/app/sessions`
4. Déploie → ouvre l'URL fournie → connecte ton bot via la page web

> 🥷 by IB- CENTRAL-HEX

