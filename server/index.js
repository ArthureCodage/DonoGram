const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const ip = require('ip');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDb } = require('./db');

const PORT = process.env.PORT || 4000;
const JWT_SECRET = 'donogram_super_secret_jwt_key_2026';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || (file.mimetype.includes('audio') ? '.webm' : '');
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });

let db;

function getLocalIp() {
  return ip.address() || '127.0.0.1';
}

// Middleware: Authenticate JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requis' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = user;
    next();
  });
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

app.get('/api/network-info', async (req, res) => {
  const localIp = getLocalIp();
  const clientPort = 5173;
  const fullUrl = `http://${localIp}:${clientPort}`;
  
  try {
    const qrDataUrl = await QRCode.toDataURL(fullUrl);
    res.json({
      localIp,
      serverPort: PORT,
      clientPort,
      url: fullUrl,
      qrCode: qrDataUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur QR Code' });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password, display_name } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Le nom d\'utilisateur doit faire au moins 3 caractères' });
  }

  try {
    const existing = await db.get('SELECT id FROM users WHERE username = ?', [cleanUsername]);
    if (existing) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' });
    }

    const userId = 'u_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const hashedPassword = await bcrypt.hash(password, 10);
    const name = display_name?.trim() || cleanUsername;
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`;

    await db.run(
      `INSERT INTO users (id, username, password, display_name, avatar_url, status) VALUES (?, ?, ?, ?, ?, 'online')`,
      [userId, cleanUsername, hashedPassword, name, avatarUrl]
    );

    // Auto join default conversations
    await db.run(`INSERT OR IGNORE INTO conversation_members (conversation_id, user_id) VALUES ('general', ?), ('annonces', ?)`, [userId, userId]);

    const newUser = await db.get('SELECT id, username, display_name, avatar_url, bio, status FROM users WHERE id = ?', [userId]);
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ user: newUser, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Veuillez saisir votre pseudo et mot de passe' });
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', [cleanUsername]);
    if (!user) {
      return res.status(400).json({ error: 'Utilisateur non trouvé. Veuillez créer un compte.' });
    }

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      return res.status(400).json({ error: 'Mot de passe incorrect' });
    }

    await db.run('UPDATE users SET status = "online", last_seen = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    const safeUser = {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      status: 'online'
    };

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get('SELECT id, username, display_name, avatar_url, bio, status FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update Profile
app.post('/api/users/update', authenticateToken, async (req, res) => {
  const { display_name, bio, avatar_url } = req.body;
  try {
    await db.run(
      `UPDATE users SET display_name = COALESCE(?, display_name), bio = COALESCE(?, bio), avatar_url = COALESCE(?, avatar_url) WHERE id = ?`,
      [display_name, bio, avatar_url, req.user.id]
    );

    const updatedUser = await db.get('SELECT id, username, display_name, avatar_url, bio, status FROM users WHERE id = ?', [req.user.id]);
    io.emit('user_updated', updatedUser);
    res.json({ user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: 'Erreur mise à jour' });
  }
});

// Contacts
app.get('/api/contacts/:userId', authenticateToken, async (req, res) => {
  try {
    const contacts = await db.all(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, u.status, u.last_seen
      FROM contacts c
      JOIN users u ON c.contact_user_id = u.id
      WHERE c.user_id = ?
      ORDER BY u.display_name ASC
    `, [req.params.userId]);

    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: 'Erreur contacts' });
  }
});

app.get('/api/users/search', authenticateToken, async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) return res.json({ users: [] });

  try {
    const users = await db.all(`
      SELECT id, username, display_name, avatar_url, bio, status
      FROM users
      WHERE (username LIKE ? OR display_name LIKE ?) AND id != ?
      LIMIT 20
    `, [`%${query}%`, `%${query}%`, req.user.id]);

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Erreur recherche' });
  }
});

app.post('/api/contacts/add', authenticateToken, async (req, res) => {
  const { contact_user_id } = req.body;
  try {
    await db.run(
      `INSERT OR IGNORE INTO contacts (user_id, contact_user_id) VALUES (?, ?)`,
      [req.user.id, contact_user_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur ajout contact' });
  }
});

app.post('/api/contacts/remove', authenticateToken, async (req, res) => {
  const { contact_user_id } = req.body;
  try {
    await db.run(`DELETE FROM contacts WHERE user_id = ? AND contact_user_id = ?`, [req.user.id, contact_user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur suppression contact' });
  }
});

// Channels
app.get('/api/channels/public', authenticateToken, async (req, res) => {
  try {
    const channels = await db.all(`
      SELECT c.*,
        (SELECT COUNT(*) FROM conversation_members WHERE conversation_id = c.id) as members_count,
        EXISTS(SELECT 1 FROM conversation_members WHERE conversation_id = c.id AND user_id = ?) as is_joined
      FROM conversations c
      WHERE c.type = 'channel' AND c.is_public = 1
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    res.json({ channels });
  } catch (err) {
    res.status(500).json({ error: 'Erreur canaux' });
  }
});

app.post('/api/chats/:chatId/join', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  try {
    await db.run(
      `INSERT OR IGNORE INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`,
      [chatId, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur adhésion' });
  }
});

app.get('/api/chats/user/:userId', authenticateToken, async (req, res) => {
  try {
    const chats = await db.all(`
      SELECT DISTINCT c.*,
        (SELECT text FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT type FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_type,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
      FROM conversations c
      JOIN conversation_members cm ON c.id = cm.conversation_id
      WHERE cm.user_id = ?
      ORDER BY COALESCE(last_message_at, c.created_at) DESC
    `, [req.user.id]);

    for (let chat of chats) {
      if (chat.type === 'direct') {
        const otherUser = await db.get(`
          SELECT u.display_name, u.avatar_url, u.status
          FROM conversation_members cm
          JOIN users u ON cm.user_id = u.id
          WHERE cm.conversation_id = ? AND cm.user_id != ?
        `, [chat.id, req.user.id]);
        
        if (otherUser) {
          chat.name = otherUser.display_name;
          chat.avatar_url = otherUser.avatar_url;
          chat.status = otherUser.status;
        }
      }
    }

    res.json({ chats });
  } catch (err) {
    res.status(500).json({ error: 'Erreur chargement chats' });
  }
});

app.post('/api/chats/create', authenticateToken, async (req, res) => {
  const { type, name, description, target_user_id } = req.body;
  const created_by = req.user.id;

  try {
    let chatId;

    if (type === 'direct') {
      const existing = await db.get(`
        SELECT c.id FROM conversations c
        JOIN conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = ?
        JOIN conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = ?
        WHERE c.type = 'direct'
      `, [created_by, target_user_id]);

      if (existing) return res.json({ chat: await db.get('SELECT * FROM conversations WHERE id = ?', [existing.id]) });

      chatId = 'dm_' + Date.now();
      await db.run(`INSERT INTO conversations (id, type, created_by) VALUES (?, 'direct', ?)`, [chatId, created_by]);
      await db.run(`INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?), (?, ?)`, [chatId, created_by, chatId, target_user_id]);
    } else {
      chatId = (type === 'channel' ? 'ch_' : 'grp_') + Date.now();
      const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`;
      
      await db.run(
        `INSERT INTO conversations (id, type, name, description, avatar_url, created_by, is_public) VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [chatId, type || 'group', name, description || '', avatarUrl, created_by]
      );

      await db.run(`INSERT INTO conversation_members (conversation_id, user_id, role) VALUES (?, ?, 'owner')`, [chatId, created_by]);
    }

    const createdChat = await db.get('SELECT * FROM conversations WHERE id = ?', [chatId]);
    io.emit('chat_created', createdChat);
    res.json({ chat: createdChat });
  } catch (err) {
    res.status(500).json({ error: 'Erreur création chat' });
  }
});

app.get('/api/chats/:chatId/messages', authenticateToken, async (req, res) => {
  const { chatId } = req.params;
  try {
    const messages = await db.all(`
      SELECT m.*, u.display_name as sender_name, u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `, [chatId]);

    for (let msg of messages) {
      const reactions = await db.all(`
        SELECT r.emoji, r.user_id, u.display_name
        FROM reactions r
        JOIN users u ON r.user_id = u.id
        WHERE r.message_id = ?
      `, [msg.id]);
      msg.reactions = reactions;
    }

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Erreur messages' });
  }
});

app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });

  const localIp = getLocalIp();
  const fileUrl = `http://${localIp}:${PORT}/uploads/${req.file.filename}`;

  res.json({
    url: fileUrl,
    filename: req.file.originalname || req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// ----------------------------------------------------
// SOCKET.IO REALTIME EVENTS
// ----------------------------------------------------

io.on('connection', (socket) => {
  socket.on('user_connected', async (userId) => {
    socket.userId = userId;
    if (userId && db) {
      await db.run('UPDATE users SET status = "online", last_seen = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
      io.emit('user_status_changed', { userId, status: 'online' });
    }
  });

  socket.on('join_room', (chatId) => {
    socket.join(chatId);
    // Auto-ensure user is member of general chat
    if (socket.userId && db) {
      db.run('INSERT OR IGNORE INTO conversation_members (conversation_id, user_id) VALUES (?, ?)', [chatId, socket.userId]);
    }
  });

  socket.on('leave_room', (chatId) => socket.leave(chatId));

  socket.on('send_message', async (data) => {
    const { conversation_id, sender_id, text, type, media_url, media_name, media_size } = data;
    
    if (!conversation_id || !sender_id) {
      return socket.emit('error_message', { error: 'Données de message incomplètes.' });
    }

    // Check channel posting permissions (except for general channel or groups or DMs)
    const chat = await db.get('SELECT type, created_by FROM conversations WHERE id = ?', [conversation_id]);
    if (chat && chat.type === 'channel' && conversation_id !== 'general') {
      const member = await db.get('SELECT role FROM conversation_members WHERE conversation_id = ? AND user_id = ?', [conversation_id, sender_id]);
      if (!member || (member.role !== 'owner' && member.role !== 'admin' && chat.created_by !== sender_id)) {
        return socket.emit('error_message', { error: 'Seuls les administrateurs peuvent publier dans ce canal.' });
      }
    }

    const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    try {
      await db.run(`
        INSERT INTO messages (id, conversation_id, sender_id, text, type, media_url, media_name, media_size)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [msgId, conversation_id, sender_id, text || '', type || 'text', media_url || null, media_name || null, media_size || null]);

      const savedMsg = await db.get(`
        SELECT m.*, u.display_name as sender_name, u.avatar_url as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `, [msgId]);

      savedMsg.reactions = [];

      io.to(conversation_id).emit('new_message', savedMsg);
      io.emit('chat_updated', { conversation_id, last_message: savedMsg.text, last_message_at: savedMsg.created_at });
    } catch (err) {
      console.error('Send message socket error:', err);
      socket.emit('error_message', { error: 'Erreur lors de l\'envoi du message.' });
    }
  });

  socket.on('typing_start', ({ conversation_id, username, userId }) => {
    socket.to(conversation_id).emit('user_typing', { conversation_id, username, userId, isTyping: true });
  });

  socket.on('typing_stop', ({ conversation_id, userId }) => {
    socket.to(conversation_id).emit('user_typing', { conversation_id, userId, isTyping: false });
  });

  socket.on('toggle_reaction', async ({ message_id, conversation_id, user_id, emoji }) => {
    try {
      const existing = await db.get('SELECT id FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?', [message_id, user_id, emoji]);
      if (existing) {
        await db.run('DELETE FROM reactions WHERE id = ?', [existing.id]);
      } else {
        const reactId = 'react_' + Date.now();
        await db.run('INSERT INTO reactions (id, message_id, user_id, emoji) VALUES (?, ?, ?, ?)', [reactId, message_id, user_id, emoji]);
      }

      const reactions = await db.all(`
        SELECT r.emoji, r.user_id, u.display_name
        FROM reactions r
        JOIN users u ON r.user_id = u.id
        WHERE r.message_id = ?
      `, [message_id]);

      io.to(conversation_id).emit('reactions_updated', { message_id, reactions });
    } catch (err) {
      console.error('Reaction error:', err);
    }
  });

  socket.on('disconnect', async () => {
    if (socket.userId && db) {
      await db.run('UPDATE users SET status = "offline", last_seen = CURRENT_TIMESTAMP WHERE id = ?', [socket.userId]);
      io.emit('user_status_changed', { userId: socket.userId, status: 'offline' });
    }
  });
});

// START
initDb().then((database) => {
  db = database;
  // Update general channel type to 'group' so all users can talk freely
  db.run("UPDATE conversations SET type = 'group' WHERE id = 'general'");

  server.listen(PORT, '0.0.0.0', async () => {
    const localIp = getLocalIp();
    console.log(`\n🚀 DONOGRAM BACKEND RUNNING ON http://${localIp}:${PORT}\n`);
  });
}).catch((err) => console.error('DB error:', err));
