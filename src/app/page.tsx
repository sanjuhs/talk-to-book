import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 overflow-hidden relative">
      <Navbar />

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-8 h-8 bg-indigo-200 rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-purple-200 rounded-full opacity-30 animate-pulse delay-700"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 bg-pink-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 sm:py-28 relative">
        <div className="max-w-5xl mx-auto text-center space-y-8 mb-16">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
            <span className="text-gray-900 dark:text-white">You </span>
            <span className="text-pink-600 dark:text-pink-400">Read</span>
            <span className="text-gray-900 dark:text-white">, </span>
            <span className="text-indigo-600 dark:text-indigo-400">Digest</span>
            <span className="text-gray-900 dark:text-white"> and </span>
            <span className="text-purple-600 dark:text-purple-400">
              Get Insight
            </span>
            <span className="text-gray-900 dark:text-white">.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Bring your entire library to your fingertips. Read seamlessly across
            all your devices with our cross-platform book reader.
          </p>

          {/* Main CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a
              href="/read-it"
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg transition-all duration-300 font-semibold shadow-md"
            >
              Start Reading
            </a>
            <button className="px-8 py-4 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 rounded-full hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-300 font-semibold">
              Learn More
            </button>
          </div>
        </div>

        {/* Platform Icons */}
        <div className="flex justify-center space-x-8 mb-20">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
            <svg
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M22.5 10.5c0-1.32-.55-2.16-1.5-2.7V5.45c0-2.39-2.01-4.35-4.5-4.35-1.54 0-2.88.71-3.76 1.83C11.85 1.81 10.52 1.1 9 1.1c-2.49 0-4.5 1.96-4.5 4.35v2.35c-.95.54-1.5 1.38-1.5 2.7 0 1.56.88 2.54 1.5 2.95v1.75C4.5 17.6 6.51 19.5 9 19.5c1.52 0 2.85-.71 3.74-1.83.87 1.12 2.21 1.83 3.76 1.83 2.49 0 4.5-1.9 4.5-4.3v-1.75c.62-.41 1.5-1.39 1.5-2.95z" />
            </svg>
          </div>
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
            <svg
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.74 3.51 7.59 8.42 7.31c1.33.07 2.25.78 3.05.78.8 0 2.04-.82 3.44-.7 4.1.3 5.9 5.11 4.14 8.55a5.3 5.3 0 01-2 3.34zm-3.49-14.67c-2.53-.26-4.67 1.86-4.42 4.28 2.43.17 4.66-1.87 4.42-4.28z" />
            </svg>
          </div>
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
            <svg
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3 5.5A2.5 2.5 0 015.5 3h13A2.5 2.5 0 0121 5.5v13a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 18.5v-13zM5.5 5a.5.5 0 00-.5.5v13a.5.5 0 00.5.5h13a.5.5 0 00.5-.5v-13a.5.5 0 00-.5-.5h-13z" />
              <path d="M10 16V8l6 4-6 4z" />
            </svg>
          </div>
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
            <svg
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 21h10v-1H7v1zM7 3v1h10V3H7z" />
              <path d="M17 6H7v12h10V6zm-7 8l3-2-3-2v4z" />
            </svg>
          </div>
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
            <svg
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.5 10.5l-6-6.5-6 6.5L12 17l6.5-6.5z" />
            </svg>
          </div>
        </div>

        {/* Feature Section */}
        <div id="features" className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Powerful Features
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Everything you need to enhance your reading experience
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-600">
                <div className="h-14 w-14 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center mb-6">
                  <svg
                    className="h-7 w-7 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  PDF Reader
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Upload and read any PDF document with a clean,
                  distraction-free interface designed for focus.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-600">
                <div className="h-14 w-14 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-6">
                  <svg
                    className="h-7 w-7 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  AI-Powered Insights
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Get deeper understanding with real-time AI analysis that
                  explains complex concepts in simple terms.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-600">
                <div className="h-14 w-14 bg-pink-100 dark:bg-pink-900 rounded-xl flex items-center justify-center mb-6">
                  <svg
                    className="h-7 w-7 text-pink-600 dark:text-pink-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  Natural Dialogue
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Have meaningful conversations with your books through an
                  intuitive chat interface powered by AI.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  See It In Action
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Experience the power of AI-assisted reading
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900 rounded-full p-3">
                      <svg
                        className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 max-w-[80%] shadow-sm">
                      <p className="text-gray-800 dark:text-gray-200">
                        Tell me about the main themes in Pride and Prejudice.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 justify-end">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 max-w-[80%] shadow-sm">
                      <p className="text-white">
                        The main themes in Pride and Prejudice revolve around
                        marriage, social class, and prejudice in 19th century
                        England. Would you like me to elaborate on any of these
                        themes?
                      </p>
                    </div>
                    <div className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-3">
                      <svg
                        className="h-6 w-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      placeholder="Ask your question..."
                      className="flex-1 p-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300">
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to transform your reading experience?
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Join thousands of readers who are discovering new dimensions in
              their favorite books.
            </p>
            <a
              href="/read-it"
              className="px-8 py-4 bg-white text-indigo-600 rounded-full hover:bg-gray-100 transition-all duration-300 font-semibold shadow-md inline-block"
            >
              Get Started Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
