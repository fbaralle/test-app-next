import CryptoDashboard from "./components/CryptoDashboard";
import FavoritesSection from "./components/FavoritesSection";
import FeatureFlagsSection from "./components/FeatureFlagsSection";
import PageViewsSection from "./components/PageViewsSection";
import ExportsSection from "./components/ExportsSection";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="pt-10 pb-6 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
          Webflow Cloud Test App
        </p>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Crypto Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Live market data from CoinGecko
        </p>
      </header>
      <main className="flex-1 px-4 pb-12 space-y-6">
        {/* Cloudflare Bindings Demo Section */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Cloudflare Bindings Demo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FavoritesSection />
            <PageViewsSection />
            <FeatureFlagsSection />
          </div>
          <div className="mt-4">
            <ExportsSection />
          </div>
        </div>
        <CryptoDashboard />
      </main>
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
          <p>Webflow Cloud Test App — for internal testing purposes only</p>
          <p>Next.js + React Query + Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
}
