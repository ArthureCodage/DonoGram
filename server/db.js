const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'donogram.db');

let dbInstance = null;

async function initDb() {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await dbInstance.run('PRAGMA foreign_keys = ON;');

  // Create base tables
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT DEFAULT 'Utilisateur DonoGram',
      status TEXT DEFAULT 'offline',
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contacts (
      user_id TEXT NOT NULL,
      contact_user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, contact_user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      type TEXT CHECK(type IN ('direct', 'group', 'channel')) NOT NULL DEFAULT 'direct',
      name TEXT,
      description TEXT,
      avatar_url TEXT,
      created_by TEXT,
      is_public INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversation_members (
      conversation_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT CHECK(role IN ('owner', 'admin', 'member')) DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (conversation_id, user_id),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      text TEXT,
      type TEXT CHECK(type IN ('text', 'image', 'audio', 'file', 'system')) DEFAULT 'text',
      media_url TEXT,
      media_name TEXT,
      media_size INTEGER,
      reply_to_id TEXT,
      is_pinned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(message_id, user_id, emoji),
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migrate column if table existed previously without is_public
  try {
    await dbInstance.run('ALTER TABLE conversations ADD COLUMN is_public INTEGER DEFAULT 1;');
  } catch (err) {
    // Column already exists, safe to ignore
  }

  // Default bot user
  const botExists = await dbInstance.get('SELECT id FROM users WHERE id = ?', ['donobot']);
  if (!botExists) {
    const defaultBotPass = await bcrypt.hash('bot123', 10);
    await dbInstance.run(`
      INSERT INTO users (id, username, password, display_name, avatar_url, bio, status)
      VALUES ('donobot', 'donobot', ?, 'DonoBot 🤖', 'https://api.dicebear.com/7.x/bottts/svg?seed=DonoBot', 'Votre assistant DonoGram auto-hébergé', 'online')
    `, [defaultBotPass]);
  }

  // Default channels
  const generalExists = await dbInstance.get('SELECT id FROM conversations WHERE id = ?', ['general']);
  if (!generalExists) {
    await dbInstance.run(`
      INSERT INTO conversations (id, type, name, description, avatar_url, created_by, is_public)
      VALUES ('general', 'channel', '📢 Canal Général', 'Bienvenue sur DonoGram ! Canal de discussion principal.', 'https://api.dicebear.com/7.x/shapes/svg?seed=General', 'donobot', 1)
    `);

    await dbInstance.run(`
      INSERT INTO messages (id, conversation_id, sender_id, text, type)
      VALUES ('msg_welcome', 'general', 'donobot', '🚀 Bienvenue sur DonoGram !\n\nCréez votre compte, ajoutez vos contacts et découvrez vos canaux !', 'text')
    `);
  }

  const newsExists = await dbInstance.get('SELECT id FROM conversations WHERE id = ?', ['annonces']);
  if (!newsExists) {
    await dbInstance.run(`
      INSERT INTO conversations (id, type, name, description, avatar_url, created_by, is_public)
      VALUES ('annonces', 'channel', '🔔 Nouveautés & Annonces', 'Fil d''annonces publiques DonoGram.', 'https://api.dicebear.com/7.x/shapes/svg?seed=News', 'donobot', 1)
    `);

    await dbInstance.run(`
      INSERT INTO messages (id, conversation_id, sender_id, text, type)
      VALUES ('msg_news_1', 'annonces', 'donobot', '✨ DonoGram v2.0 : Création de comptes sécurisés, carnet de contacts, canaux publics et optimisation iOS !', 'text')
    `);
  }

  return dbInstance;
}

module.exports = { initDb };
