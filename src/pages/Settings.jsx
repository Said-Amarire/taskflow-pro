// src/pages/Settings.jsx
import React, { useEffect, useRef, useState } from "react";
import { FiPlay, FiPause } from "react-icons/fi";

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

// Load or initialize settings
function loadSettings() {
  const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY));
  if (stored) return stored;
  const defaultSettings = {
    enabled: true,
    volume: 80,
    selectedTone: DEFAULT_TONES[0].id, // first tone activated
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  return defaultSettings;
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Audio Map
const audioMap = {};

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings());
  const [playingTone, setPlayingTone] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState(null);
  const audioRef = useRef(new Audio());
  const [durations, setDurations] = useState({});

  // Preload tones and read duration
  useEffect(() => {
    DEFAULT_TONES.forEach(tone => {
      const audio = new Audio(tone.url);
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        setDurations(prev => ({ ...prev, [tone.id]: audio.duration }));
      };
      audioMap[tone.id] = audio;
    });
  }, []);

  // Audio setup
  useEffect(() => {
    audioRef.current.loop = false;
    audioRef.current.volume = settings.volume / 100;
    audioRef.current.onended = () => setPlayingTone(null);
    return () => { try { audioRef.current.pause(); } catch {} };
  }, []);

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
      audioRef.current.src = audioMap[tone.id].src;
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
            
            {/* Toggle Button */}
            <label className="flex items-center cursor-pointer select-none">
              <span className="mr-3 text-base font-medium text-gray-700">Enable All Settings</span>
              <div
                className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 ${settings.enabled ? "bg-indigo-600" : "bg-gray-300"}`}
                onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out ${settings.enabled ? "translate-x-6" : "translate-x-0"}`} />
              </div>
            </label>

            {/* Save Button */}
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
          </div>
        </div>

        {/* Preset Tones */}
        <div className="border p-4 rounded-lg bg-gray-50">
          <h2 className="font-semibold text-lg text-gray-700 mb-3">Preset Tones</h2>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-2 ${isDisabledStyle}`}>
            {DEFAULT_TONES.map(t => (
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
                <button onClick={() => playTone(t)} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded flex items-center justify-center" disabled={!settings.enabled}>
                  {playingTone === t.id ? <FiPause /> : <FiPlay />}
                </button>
              </div>
            ))}
          </div>
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

      {/* Message */}
      {message && (
        <div className={`fixed bottom-5 right-5 px-4 py-2 rounded shadow ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
