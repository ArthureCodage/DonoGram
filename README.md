<div align="center">

# 💬 DonoGram

**Ta propre messagerie façon Telegram, hébergée chez toi, pour PC et mobile.**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![Socket.io](https://img.shields.io/badge/Socket.io-temps%20r%C3%A9el-010101?logo=socket.io&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)

</div>

DonoGram est une application de messagerie auto-hébergée : un petit serveur Node.js + SQLite sur ton PC ou ton serveur,
et une interface web React installable sur téléphone (PWA). Tes messages et tes fichiers restent chez toi.

## Fonctionnalités

- 💬 **Discussions privées et de groupe** en temps réel (Socket.io), indicateur « en train d'écrire »
- 📢 **Canaux publics** que les autres utilisateurs peuvent rejoindre
- ✏️ Modifier, supprimer, épingler, transférer des messages, **réactions emoji**
- 🎙️ **Messages vocaux** et envoi de fichiers / images, galerie des médias partagés par discussion
- 👥 Contacts, recherche d'utilisateurs, profils
- 📱 **QR code** affiché par le serveur pour ouvrir l'appli sur ton téléphone en un scan (réseau local)
- 🌙 Interface sombre inspirée de Telegram, installable comme une appli (PWA)

## Installation

Prérequis : [Node.js](https://nodejs.org) 18 ou plus récent.

```bash
git clone https://github.com/ArthureCodage/DonoGram.git
cd DonoGram
npm install
npm --prefix client install
npm run dev
```

`npm run dev` lance le serveur (port **4000**, variable `PORT` pour le changer) et l'interface web.
Les fichiers envoyés sont rangés dans `server/uploads/`.

Pour l'utiliser hors de ton réseau local, passe par un VPN comme [Tailscale](https://tailscale.com) plutôt que d'ouvrir un port.

> ⚠️ Projet personnel : avant de l'exposer sur Internet, remplace la clé `JWT_SECRET` écrite dans `server/index.js` par une valeur secrète à toi.

## Stack

| Partie | Technologies |
|---|---|
| Serveur | Node.js, Express 5, Socket.io, SQLite, JWT, bcrypt, multer |
| Client | React, Vite, PWA |
