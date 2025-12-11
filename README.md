# 🚀 TaskFlow Pro – Smart Task Manager & Priority Scheduler

TaskFlow Pro is a modern, intelligent task-management application built with **React**, **Vite**, and **TailwindCSS**.  
It offers a clean interface, real-time countdown timers, smart alarms, manual drag-and-drop ordering, persistent storage, and a beautifully responsive UI.

Designed with a strong focus on **productivity, UX quality, and long-term clarity**, TaskFlow Pro allows users to create, manage, prioritize, and reorder tasks effortlessly.

🌐 **Live Demo:** [https://pro-taskflow.vercel.app](https://pro-taskflow.vercel.app)

---

## 🌟 Features

### ✅ Smart Task Creation
- Add **title** and **description** for each task.  
- Select **priority level** (Low / Medium / High) with color-coded visual indicators.  
- Set **due date and time** with clear visual labels.  
- Toggle **alarms** for important tasks using a bell icon.  
- Full **validation system** to ensure no empty or invalid tasks are created; errors are highlighted in red.

### 🎨 Beautiful & Responsive UI
- Clean, modern dashboard layout.  
- Zero outer margins between tasks for compact mode.  
- Automatic spacing between cards only at top/bottom.  
- Mobile-first responsive design ensures usability on phones and tablets.  
- Consistent and professional color palette across the app.  
- Smooth animations for interactions like drag-and-drop, task completion, and hover effects.

### ⏳ Real-Time Countdown Timer
- Live countdown until task deadline.  
- Countdown disappears when a task is completed.  
- Automatically stops if a task finishes before the due date.

### 🔔 Smart Alarm System
- Global alarm system works across all pages.  
- Alarm uses a bell icon and optional text label.  
- Plays selected sound automatically.  
- Cannot be muted unintentionally.  
- Stops automatically when:
  - Task is marked as completed.  
  - Deadline passes.  
  - User disables the alarm.  

### 💾 Persistent Storage
- All data is stored automatically using **localStorage**.  
- Persistent items include:
  - Tasks  
  - Completion state  
  - Manual task order  
  - Alarm states  
  - Task metadata (title, description, priority, due date/time)  

### 🔀 Manual Drag-and-Drop Ordering
- Users can manually reorder tasks using drag-and-drop.  
- Order is **saved instantly** and persists across page reloads and browser sessions.  
- New tasks always appear at the top without breaking the saved custom order.  
- Optimized for large task lists to maintain performance and usability.

### 🎯 Task Completion Experience
- Completed tasks are visually distinguished with a **light purple background**.  
- Countdown disappears once completed.  
- Alarms stop automatically.  
- Due date remains visible for reference.  
- “Completed at” timestamp is saved.

---

## 🧭 Pages Included
- **Dashboard** — Task overview and statistics.  
- **Tasks** — Main task management interface.  
- **Archive** — Stores completed or old tasks.  
- **Settings** — Customize app preferences, theme, and alarm options.  
- **Profile** — User information and customization.  
- **NotFound** — Custom 404 page with friendly UI.

---

## 🛠️ Tech Stack

| Technology | Usage |
|-----------|--------|
| **React 18** | App logic & UI |
| **Vite** | Fast development and bundling |
| **Tailwind CSS** | Responsive styling |
| **UUID** | Generate unique task IDs |
| **React Icons** | Icons for UI (FiBell, FiPlay, FiPause, etc.) |
| **LocalStorage** | Persistent storage for tasks and settings |
| **Custom Alarm Engine** | Global sound notifications & timing |

---

## 📁 Project Structure

```
taskflow-pro/
├─ public/
│ └─ vite.svg
├─ src/
│ ├─ assets/
│ │ └─ logo.svg
│ │ react.svg
│ ├─ components/
│ │ ├─ Header.jsx
│ │ ├─ Sidebar.jsx
│ │ ├─ StatCard.jsx
│ │ ├─ ThemeToggle.jsx
│ │ └─ ChartSmall.jsx
│ ├─ pages/
│ │ ├─ Tasks.jsx
│ │ ├─ Settings.jsx
│ │ ├─ Archive.jsx
│ │ ├─ Dashboard.jsx
│ │ ├─ Profile.jsx
│ │ └─ NotFound.jsx
│ ├─ ui/
│ │ ├─ TaskForm.jsx
│ │ └─ TaskList.jsx
│ ├─ utils/
│ │ └─ storage.js
│ ├─ App.jsx
│ ├─ App.css
│ ├─ main.jsx
│ └─ index.css
├─ .gitignore
├─ eslint.config.js
├─ index.html
├─ package.json
├─ package-lock.json
├─ postcss.config.cjs
├─ tailwind.config.js
├─ vite.config.js
└─ README.md
```


---

## 🚀 Installation & Setup

### 1️⃣ Clone the repository

```sh
git clone https://github.com/Said-Amarire/taskflow-pro.git
cd taskflow-pro
```

### 2️⃣ Install dependencies
npm install

### 3️⃣ Start development server
npm run dev

### 4️⃣ Build for production
npm run build

### 🎞️ Demo Video
👉 https://www.youtube.com/watch?v=VFkw6ti6o7U

### 🧠 Best Practices Used
- Clean component architecture
- Modular reusable UI blocks
- Persistent data layer
- Optimized renders (no unnecessary re-renders)
- Semantic HTML + ARIA Labels
- Accessibility-focused UI
- 100% responsive
- Professional commit messages
- Organized Git workflow

### 📌 Future Improvements
- Cloud sync
- User accounts
- Multiple boards
- Task categories
- Subtasks
- AI-based smart suggestions

### 🏆 Author
- Said Amarire
- **GitHub:** https://github.com/Said-Amarire
