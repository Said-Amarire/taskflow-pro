# 🚀 TaskFlow Pro – Smart Task Manager & Priority Scheduler

TaskFlow Pro is a modern, intelligent task-management application built with **React**, **Vite**, and **TailwindCSS**.  
It offers a clean interface, real-time countdown timers, smart alarms, manual drag-and-drop ordering, persistent storage, and a beautifully responsive UI.

Designed with a strong focus on **productivity, UX quality, and long-term clarity**, TaskFlow Pro allows users to create, manage, prioritize, and reorder tasks effortlessly.

---

## 🌟 Features

### ✅ **Smart Task Creation**
- Title + description  
- Priority selector (Low / Medium / High) with colors  
- Due date + due time (with visual labels)  
- Alarm toggle with clear bell icon  
- Full validation (priority required, errors highlighted in red)

---

### 🎨 **Beautiful & Responsive UI**
- Clean modern dashboard layout  
- Zero outer margins between tasks (compact mode)  
- Auto-spacing only top/bottom between cards  
- Mobile-first responsive design  
- Consistent color palette across the app  
- Smooth animations

---

### 🔥 **Real-Time Countdown Timer**
- Each task shows a live countdown until the deadline  
- Countdown disappears when task is completed  
- Countdown also stops if task is finished before time  

---

### 🔔 **Smart Alarm System**
- Runs above all pages (global)  
- Bell icon + alarm label  
- Plays the selected sound automatically  
- Cannot be muted  
- Works even if user navigates between pages  
- Alarm stops automatically when:
  - Task is completed  
  - Deadline passes  
  - User disables alarm  

---

### 💾 **Persistent Storage**
Everything is saved automatically:
- Tasks  
- Completion state  
- Manual order  
- Alarm states  
- Task metadata  

Stored using **localStorage** via a custom storage utility.

---

### 🔀 **Manual Drag-and-Drop Ordering (Saved Permanently)**
- User can drag tasks manually  
- Order is saved instantly  
- Even if user refreshes the page or leaves  
- New tasks always appear **at the top**, without breaking the saved custom order  
- Perfect for large task lists

---

### 🎯 **Task Completion Experience**
When user completes a task:
- Background color becomes **light purple**  
- Countdown disappears  
- Alarm stops  
- Due date stays visible  
- “Completed at” timestamp is saved  

---

### 🧭 **Pages Included**
- **Dashboard** — stats & overview  
- **Tasks** — full task management system  
- **Archive** — old/finished tasks  
- **Settings** — theme + preferences  
- **Profile** — user info  
- **NotFound** — beautiful custom 404 page  

---

## 🛠️ Tech Stack

| Technology | Usage |
|-----------|--------|
| **React 18** | App logic & UI |
| **Vite** | Development environment |
| **Tailwind CSS** | Styling |
| **UUID** | Unique task IDs |
| **React Icons** | Icons (FiBell, etc.) |
| **LocalStorage** | Persistent data |
| **Custom Alarm Engine** | Sound + timing |

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
git clone https://github.com/YOUR-USERNAME/taskflow-pro.git
cd taskflow-pro
```

### 2️⃣ Install dependencies
npm install

### 3️⃣ Start development server
npm run dev

### 4️⃣ Build for production
npm run build

### 🎞️ Demo Video
👉 https://your-demo-video-link.com

### 🎨 UI/UX Design (Figma)
👉 https://your-figma-design-link.com

### 🎤 Presentation Slides
👉 https://your-slides-link.com

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
