// src/ui/StatCard.jsx
export default function StatCard({ title, value, color='text-indigo-700' }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`text-2xl font-semibold mt-2 ${color}`}>{value}</div>
    </div>
  )
}
