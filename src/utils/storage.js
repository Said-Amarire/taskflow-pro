// src/utils/storage.js

// Load data from localStorage
export const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

// Save data to localStorage
export const save = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.error("Storage save error:", err)
  }
}

// Increment permanently deleted tasks counter
export const incrementPermanentDeleted = () => {
  const key = 'tf_permanent_deleted_count'
  const current = load(key, 0)
  save(key, current + 1)
}

// Get permanently deleted tasks count
export const getPermanentDeletedCount = () => load('tf_permanent_deleted_count', 0)
