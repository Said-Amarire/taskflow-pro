import { Link } from "react-router-dom"
import { FiAlertTriangle } from "react-icons/fi"

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">

      <div className="bg-indigo-100 p-6 rounded-full shadow-md mb-6">
        <FiAlertTriangle className="text-indigo-600 w-14 h-14" />
      </div>

      <h2 className="text-3xl font-bold text-gray-800 mb-3">
        Page Not Found
      </h2>

      <p className="text-gray-600 max-w-md text-center mb-8">
        The page you are looking for doesn't exist or may have been moved.
      </p>

      <Link
        to="/"
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow transition-all"
      >
        Go Back Home
      </Link>
    </div>
  )
}
