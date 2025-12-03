export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">404 - Page Not Found</h2>
        <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
        <a
          href="/dashboard"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 inline-block"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}


