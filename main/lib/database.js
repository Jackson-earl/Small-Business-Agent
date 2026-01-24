import fs from 'fs';

const DB_FILE = './users-db.json';

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }));
}

// Read database
function readDB() {
  const data = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(data);
}

// Write database
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// User operations
export const db = {
  // Create or update user
  saveUser(userId, userData) {
    const data = readDB();
    data.users[userId] = {
      ...data.users[userId],
      ...userData,
      updatedAt: new Date().toISOString()
    };
    writeDB(data);
    return data.users[userId];
  },

  // Get user by ID
  getUser(userId) {
    const data = readDB();
    return data.users[userId] || null;
  },

  // Update Google tokens
  updateGoogleTokens(userId, tokens) {
    const data = readDB();
    if (!data.users[userId]) {
      data.users[userId] = {};
    }
    data.users[userId].google_access_token = tokens.access_token;
    data.users[userId].google_refresh_token = tokens.refresh_token;
    data.users[userId].google_connected = true;
    data.users[userId].updatedAt = new Date().toISOString();
    writeDB(data);
    return data.users[userId];
  },

  // Check if user has connected Google Calendar
  hasGoogleCalendar(userId) {
    const user = this.getUser(userId);
    return user && user.google_connected;
  }
};
