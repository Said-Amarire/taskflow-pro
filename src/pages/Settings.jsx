// src/pages/Settings.jsx
import React, { useEffect, useRef, useState } from "react";
import { FiUpload, FiPlay, FiPause, FiTrash2 } from "react-icons/fi";
import { v4 as uuidv4 } from "uuid";

// IndexedDB Helper
const DB_NAME = "TaskFlowDB";
const STORE_NAME = "custom_sounds";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function addSoundToDB(sound) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(sound);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}

function removeSoundFromDB(id) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  });
}

function getAllSoundsFromDB() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

// Default Tones
const DEFAULT_TONES = [
  { id: "preset:tone1", label: "Chime Beat", url: "/tones/tone1.mp3" },
  { id: "preset:tone2", label: "Alert Ring", url: "/tones/tone2.mp3" },
  { id: "preset:tone3", label: "Soft Ping", url: "/tones/tone3.mp3" },
  { id: "preset:tone4", label: "Clear Tone", url: "/tones/tone4.mp3" },
  { id: "preset:tone5", label: "Quick Ding", url: "/tones/tone5.mp3" },
  { id: "preset:tone6", label: "Bright Bell", url: "/tones/tone6.mp3" },
  { id: "preset:tone7", label: "Melody Ring", url: "/tones/tone7.mp3" },
  { id: "preset:tone8", label: "Soft Chime", url: "/tones/tone8.mp3" },
  { id: "preset:tone9", label: "Ping Pong", url: "/tones/tone9.mp3" },
  { id: "preset:tone10", label: "Bell Clear", url: "/tones/tone10.mp3" }
];

// LocalStorage Key
const SETTINGS_KEY = "tf_settings_v7";

function loadSettings() {
  return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
    enabled: true,
    volume: 80,
    selectedTone: DEFAULT_TONES[0].id,
    repeatCount: 2,
  };
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Settings Component
export default function Settings() {
  const [settings, setSettings] = useState(loadSettings());
  const [customSounds, setCustomSounds] = useState([]);
  const [allTones, setAllTones] = useState([...DEFAULT_TONES]);
  const [playingTone, setPlayingTone] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [message, setMessage] = useState(null);
  const audioRef = useRef(new Audio());
  const defaultAudiosRef = useRef({});
  const [durations, setDurations] = useState({});

  // Load custom sounds and merge
  useEffect(() => {
    getAllSoundsFromDB().then(sounds => {
      const reversed = sounds.reverse();
      setCustomSounds(reversed);

      const merged = [...DEFAULT_TONES, ...reversed.map(s => ({ id: `custom:${s.id}`, label: s.name, url: s.data }))];
      setAllTones(merged);

      merged.forEach(item => {
        const audio = new Audio(item.url);
        audio.onloadedmetadata = () => {
          setDurations(prev => ({ ...prev, [item.id]: audio.duration }));
        };
      });
    });
  }, []);

  useEffect(() => {
    DEFAULT_TONES.forEach(tone => {
      const audio = new Audio(tone.url);
      audio.preload = "auto";
      defaultAudiosRef.current[tone.id] = audio;
      audio.onloadedmetadata = () => {
        setDurations(prev => ({ ...prev, [tone.id]: audio.duration }));
      };
    });
  }, []);

  useEffect(() => {
    audioRef.current.preload = "auto";
    audioRef.current.loop = false;
    audioRef.current.volume = settings.volume / 100;
    audioRef.current.onended = () => {
      if (settings.repeatCount > 1) {
        let count = 1;
        const repeat = () => {
          if (count < settings.repeatCount) {
            count++;
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          } else {
            setPlayingTone(null);
          }
        };
        repeat();
      } else {
        setPlayingTone(null);
      }
    };
    return () => { try { audioRef.current.pause(); } catch {} };
  }, [settings.repeatCount]);

  useEffect(() => { audioRef.current.volume = settings.volume / 100; }, [settings.volume]);

  const playTone = async (tone) => {
    if (!settings.enabled) return;
    try {
      if (playingTone === tone.id) {
        audioRef.current.pause();
        setPlayingTone(null);
        return;
      }
      audioRef.current.pause();
      if (tone.id.startsWith("custom:")) {
        const id = tone.id.split(":")[1];
        const item = customSounds.find(s => s.id === id);
        if (!item) return;
        audioRef.current.src = item.data;
      } else {
        audioRef.current.src = defaultAudiosRef.current[tone.id].src;
      }
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setPlayingTone(tone.id);
    } catch (err) {
      console.log("Cannot play sound:", err);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  const onUpload = (e) => {
    if (!settings.enabled) return;
    const file = e.target.files[0];
    if (!file) return;

    // Max size 3MB
    const maxSizeMB = 3;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setMessage({ type: "error", text: `File exceeds ${maxSizeMB}MB limit.` });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataURL = reader.result;
      const newId = uuidv4();
      const newItem = { id: newId, name: file.name, data: dataURL };
      try {
        await addSoundToDB(newItem);
        setCustomSounds(prev => [newItem, ...prev]);
        setAllTones(prev => [...prev, { id: `custom:${newId}`, label: file.name, url: dataURL }]);
        setSettings(prev => ({ ...prev, selectedTone: `custom:${newId}` }));

        const audio = new Audio(dataURL);
        audio.onloadedmetadata = () => {
          setDurations(prev => ({ ...prev, [newId]: audio.duration }));
        };

        playTone({ id: `custom:${newId}` });
        setMessage({ type: "success", text: "Sound uploaded and saved!" });
      } catch (err) {
        console.log(err);
        setMessage({ type: "error", text: "Upload failed!" });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeCustom = async (id) => {
    try {
      await removeSoundFromDB(id);
      setCustomSounds(prev => prev.filter(s => s.id !== id));
      setAllTones(prev => prev.filter(s => s.id !== `custom:${id}`));

      if (settings.selectedTone === `custom:${id}`) {
        setSettings(prev => ({ ...prev, selectedTone: DEFAULT_TONES[0].id }));
      }
      if (playingTone === `custom:${id}`) {
        audioRef.current.pause();
        setPlayingTone(null);
      }
      setMessage({ type: "success", text: "Sound removed!" });
    } catch (err) {
      console.log(err);
      setMessage({ type: "error", text: "Remove failed!" });
    }
  };

  const confirmSave = () => {
    saveSettings(settings);
    setShowConfirm(false);
    setMessage({ type: "success", text: "Settings saved!" });
  };

  const isDisabledStyle = !settings.enabled ? "opacity-50 pointer-events-none" : "";

  return (
    <div className="w-full min-h-screen flex justify-center px-0 md:px-6 py-2">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md border border-indigo-50 p-4 flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-indigo-700">Notification Settings</h1>

        {/* General Settings */}
        <div className="border p-4 rounded-lg bg-gray-50">
          <h2 className="font-semibold text-lg text-gray-700 mb-3">General Settings</h2>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <label className="flex items-center gap-2 text-base">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="accent-indigo-600"
              />
              Enable All Settings
            </label>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Save
            </button>
          </div>

          <div className={`flex flex-col gap-2 ${isDisabledStyle}`}>
            <label className="text-base font-medium text-gray-700">Volume</label>
            <div className="flex items-center gap-3 w-full">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={settings.volume}
                onChange={(e) => {
                  const vol = Number(e.target.value);
                  setSettings(prev => ({ ...prev, volume: vol }));
                  audioRef.current.volume = vol / 100;
                }}
                className="w-full accent-indigo-600"
              />
              <span className="w-14 text-right">{settings.volume}%</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-gray-700">Repeat Count:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.repeatCount}
                onChange={(e) => setSettings(prev => ({ ...prev, repeatCount: Number(e.target.value) }))}
                className="w-16 border rounded px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* All Tones */}
        <div className="border p-4 rounded-lg bg-gray-50">
          <h2 className="font-semibold text-lg text-gray-700 mb-3">All Tones</h2>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-2 ${isDisabledStyle}`}>
            {allTones.map(t => (
              <div key={t.id} className={`flex items-center justify-between p-3 rounded ${settings.selectedTone === t.id ? "bg-indigo-50" : "bg-slate-50"}`}>
                <label className="flex items-center gap-2 w-full" style={{ wordBreak: "break-word", whiteSpace: "normal" }}>
                  <input
                    type="radio"
                    name="tone"
                    checked={settings.selectedTone === t.id}
                    onChange={() => setSettings(prev => ({ ...prev, selectedTone: t.id }))}
                    disabled={!settings.enabled}
                  />
                  <span className="w-full">{t.label} ({formatTime(durations[t.id])})</span>
                </label>
                <div className="flex items-center gap-2">
                  <button onClick={() => playTone(t)} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded flex items-center justify-center" disabled={!settings.enabled}>
                    {playingTone === t.id ? <FiPause /> : <FiPlay />}
                  </button>
                  {t.id.startsWith("custom:") && (
                    <button onClick={() => setShowDeleteConfirm(t.id.split(":")[1])} className="px-2 py-1 bg-red-100 text-red-700 rounded" disabled={!settings.enabled}>
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Custom */}
        <div className="border p-4 rounded-lg bg-gray-50">
          <h2 className="font-semibold text-lg text-gray-700 mb-3">Upload Custom Sound</h2>
          <label className={`inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded cursor-pointer mb-3 ${isDisabledStyle}`}>
            <FiUpload /> Upload
            <input type="file" className="hidden" accept="audio/*" onChange={onUpload} disabled={!settings.enabled}/>
          </label>
        </div>
      </div>

      {/* Save Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 md:w-1/3 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-indigo-700">Confirm Save</h2>
            <p className="text-sm text-gray-600">Are you sure you want to save these changes?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
              <button onClick={confirmSave} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 md:w-1/3 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-red-700">Confirm Delete</h2>
            <p className="text-sm text-gray-600">Are you sure you want to delete this sound?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
              <button onClick={() => { removeCustom(showDeleteConfirm); setShowDeleteConfirm(null); }} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`fixed bottom-5 right-5 px-4 py-2 rounded shadow ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
