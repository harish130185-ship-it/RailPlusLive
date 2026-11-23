import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve('data');
const USER_MASTERS_FILE = path.join(DATA_DIR, 'user-masters.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

// In-memory store: { [userId: string]: { passengers: Array, journeys?: Array, updatedAt: string } }
let store = {};

try {
  if (fs.existsSync(USER_MASTERS_FILE)) {
    const raw = fs.readFileSync(USER_MASTERS_FILE, 'utf8');
    store = JSON.parse(raw);
    if (!store || typeof store !== 'object') store = {};
  }
} catch {
  store = {};
}

let saveTimeout = null;
function persistStore() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(USER_MASTERS_FILE, JSON.stringify(store, null, 2), 'utf8');
    } catch (e) {
      console.error('[UserMaster] Failed to persist user masters to disk:', e.message);
    }
  }, 500);
}

function cleanUserId(userId) {
  if (!userId || typeof userId !== 'string') return '';
  return userId.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}

export function getUserPassengers(userId) {
  const uid = cleanUserId(userId);
  if (!uid || !store[uid]) return [];
  return Array.isArray(store[uid].passengers) ? store[uid].passengers : [];
}

export function setUserPassengers(userId, passengers) {
  const uid = cleanUserId(userId);
  if (!uid) return [];
  if (!Array.isArray(passengers)) passengers = [];

  const sanitized = passengers.slice(0, 50).map(p => ({
    id: String(p.id || 'pax_' + Date.now() + Math.random().toString(36).slice(2, 6)),
    name: String(p.name || '').trim().slice(0, 60),
    age: Math.min(125, Math.max(1, Number(p.age) || 0)),
    gender: ['Male', 'Female', 'Transgender', 'M', 'F', 'T'].includes(p.gender) ? p.gender : 'Male',
    berth: String(p.berth || 'No Preference').slice(0, 30),
    food: String(p.food || 'Veg').slice(0, 30),
    nickname: String(p.nickname || '').trim().slice(0, 40),
    boarding: String(p.boarding || '').trim().toUpperCase().slice(0, 10),
    createdAt: p.createdAt || new Date().toISOString()
  })).filter(p => p.name && p.age);

  if (!store[uid]) store[uid] = {};
  store[uid].passengers = sanitized;
  store[uid].updatedAt = new Date().toISOString();
  persistStore();
  return sanitized;
}

export function addUserPassenger(userId, passenger) {
  const uid = cleanUserId(userId);
  if (!uid) return null;
  const current = getUserPassengers(uid);

  const name = String(passenger?.name || '').trim().slice(0, 60);
  const age = Math.min(125, Math.max(1, Number(passenger?.age) || 0));
  if (!name || !age) return null;

  // Prevent duplicate passenger name & age for the same user
  const exists = current.some(p => p.name.toLowerCase() === name.toLowerCase() && Number(p.age) === age);
  if (exists) {
    return { error: 'DUPLICATE', message: 'A passenger with this name and age is already saved.' };
  }

  const newPax = {
    id: String(passenger.id || 'pax_' + Date.now() + Math.random().toString(36).slice(2, 6)),
    name,
    age,
    gender: ['Male', 'Female', 'Transgender', 'M', 'F', 'T'].includes(passenger.gender) ? passenger.gender : 'Male',
    berth: String(passenger.berth || 'No Preference').slice(0, 30),
    food: String(passenger.food || 'Veg').slice(0, 30),
    nickname: String(passenger.nickname || '').trim().slice(0, 40),
    boarding: String(passenger.boarding || '').trim().toUpperCase().slice(0, 10),
    createdAt: new Date().toISOString()
  };

  current.push(newPax);
  setUserPassengers(uid, current);
  return newPax;
}

export function deleteUserPassenger(userId, passengerId) {
  const uid = cleanUserId(userId);
  if (!uid) return false;
  const current = getUserPassengers(uid);
  const filtered = current.filter(p => p.id !== passengerId);
  setUserPassengers(uid, filtered);
  return true;
}

export function clearUserMasterData(userId) {
  const uid = cleanUserId(userId);
  if (!uid) return;
  delete store[uid];
  persistStore();
}
