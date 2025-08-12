export default function SupabaseError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-gray-200/50 dark:border-gray-700/50">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Configuration Required
        </h1>
        
        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          This website requires Supabase configuration to function properly. The environment variables for database connection are not set.
        </p>
        
        {/* Technical Details */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
            Missing Environment Variables:
          </h3>
          <div className="space-y-1 text-xs font-mono text-gray-600 dark:text-gray-400">
            <div>• VITE_SUPABASE_URL</div>
            <div>• VITE_SUPABASE_ANON_KEY</div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">
            To fix this:
          </h3>
          <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Go to your Netlify dashboard</li>
            <li>Navigate to Site settings → Environment variables</li>
            <li>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
            <li>Redeploy your site</li>
          </ol>
        </div>
        
        {/* Contact Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          If you need help, check the deployment logs or contact your developer.
        </div>
      </div>
    </div>
  )
}
