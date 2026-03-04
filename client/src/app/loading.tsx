export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-16 bg-white border-b border-gray-100" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 py-12 sm:py-24 rounded-2xl sm:rounded-3xl mt-4 sm:mt-6 mb-6 sm:mb-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="h-10 sm:h-16 w-3/4 bg-white/20 rounded-xl mx-auto mb-6 animate-pulse" />
            <div className="h-5 sm:h-6 w-2/3 bg-white/15 rounded-lg mx-auto mb-8 animate-pulse" />
            <div className="flex gap-4 justify-center mb-12">
              <div className="h-12 w-36 sm:w-44 bg-white/15 rounded-xl animate-pulse" />
              <div className="h-12 w-36 sm:w-44 bg-white/15 rounded-xl animate-pulse" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 max-w-5xl mx-auto">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 sm:h-32 bg-white/10 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        <div className="py-12 bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-2xl sm:rounded-3xl my-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="h-8 w-48 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse" />
            <div className="h-5 w-72 bg-gray-200 rounded-lg mx-auto mb-10 animate-pulse" />
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-48 sm:h-56 bg-white rounded-2xl shadow-sm animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
