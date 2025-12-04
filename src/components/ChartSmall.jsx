import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend)

export default function ChartSmall({ data, type='line' }) {
  const intData = {
    ...data,
    datasets: data.datasets.map(ds => ({
      ...ds,
      data: ds.data.map(val => Math.floor(val))
    }))
  }

  const ChartComp = type==='bar' ? Bar : Line
  return (
    <div className="w-full h-56 p-2 bg-white rounded-xl shadow-lg border border-gray-200">
      <ChartComp data={intData} options={{ maintainAspectRatio: false }} />
    </div>
  )
}
