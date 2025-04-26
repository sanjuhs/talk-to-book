import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-8 h-8 bg-yellow-200 rounded-full opacity-40 animate-twinkle"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-yellow-200 rounded-full opacity-30 animate-twinkle-delayed"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 bg-yellow-200 rounded-full opacity-20 animate-twinkle"></div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 sm:py-24 relative">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center lg:text-left space-y-8 max-w-2xl">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              Bring Your <span className="text-indigo-600 dark:text-indigo-400">Books</span> to Life
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Have meaningful conversations with your favorite books. Let AI unlock new perspectives and insights from every page.
            </p>
            
            {/* Main CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a 
                href="/read-it" 
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                Start Reading
              </a>
              <button 
                className="px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-full hover:bg-indigo-50 transition-all duration-300 font-semibold hover:scale-105 transform"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="flex-1 relative">
            <div className="relative w-full max-w-lg mx-auto">
              <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
              <div className="relative">
                <Image
                  src="/hero.png"
                  alt="Book conversation illustration"
                  width={500}
                  height={500}
                  className="relative rounded-lg shadow-2xl transform hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Interactive Reading</h3>
            <p className="text-gray-600 dark:text-gray-300">Engage with characters and stories through natural conversations.</p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">AI-Powered Insights</h3>
            <p className="text-gray-600 dark:text-gray-300">Get deeper understanding with real-time AI analysis and explanations.</p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Natural Dialogue</h3>
            <p className="text-gray-600 dark:text-gray-300">Have meaningful conversations with your favorite book characters.</p>
          </div>
        </div>

        {/* Demo Section */}
        <div className="mt-24 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 max-w-[80%]">
                  <p className="text-gray-800 dark:text-gray-200">Tell me about the main themes in Pride and Prejudice.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 justify-end">
                <div className="bg-blue-600 rounded-lg p-4 max-w-[80%]">
                  <p className="text-white">The main themes in Pride and Prejudice revolve around marriage, social class, and prejudice in 19th century England. Would you like me to elaborate on any of these themes?</p>
                </div>
                <div className="flex-shrink-0 bg-blue-600 rounded-full p-2">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Ask your question..."
                  className="flex-1 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
