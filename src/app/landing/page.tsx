import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Discover
              <span className="text-blue-600"> Computational Thinking</span>
              <br />
              Lesson Plans
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Access a comprehensive collection of CT lesson plans designed to integrate computational thinking 
              into K-5 classrooms across all subject areas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search Lessons
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Learn More →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for CT Integration
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides educators with ready-to-use lesson plans that seamlessly integrate 
              computational thinking concepts into existing curricula.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Grade-Specific Content</h3>
              <p className="text-gray-600">
                Lessons tailored for K-5 students with age-appropriate activities and concepts.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">4 CT Concepts</h3>
              <p className="text-gray-600">
                Decomposition, Pattern Recognition, Abstraction, and Algorithms integrated naturally.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cross-Curricular</h3>
              <p className="text-gray-600">
                Lessons span ELA, Math, Science, Social Studies, SEL, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Lessons Preview */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sample Lesson Plans
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get a preview of our computational thinking lessons with these examples from different grades and subjects.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">Grade K</span>
                <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">✓ Ready</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Algorithm: From Farm to Table</h3>
              <p className="text-gray-600 mb-3">Grade K • ELA, Science</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Algorithms</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">By Jeni Hawkins</p>
              <a href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                View All Lessons →
              </a>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">Grade 4</span>
                <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">✓ Ready</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Equivalent Fraction Sort</h3>
              <p className="text-gray-600 mb-3">Grade 4 • Math</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Pattern Recognition</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">By Anne Collonge</p>
              <a href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                View All Lessons →
              </a>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">Grade 5</span>
                <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">✓ Ready</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Patterns in Poetry</h3>
              <p className="text-gray-600 mb-3">Grade 5 • ELA</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Pattern Recognition</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">By Charlie Henry</p>
              <a href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
                View All Lessons →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">Ready Lesson Plans</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">K-5</div>
              <div className="text-gray-600">Grade Levels</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">8+</div>
              <div className="text-gray-600">Subject Areas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
              <div className="text-gray-600">Free Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Teaching CT?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Explore our collection of lesson plans and find the perfect fit for your classroom today.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Browse Lessons
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xl font-bold text-white">SOCS4AI</span>
              </div>
              <p className="text-gray-400">
                Empowering educators with computational thinking resources.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white">Search Lessons</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white">About CT</Link></li>
                <li><Link href="/community" className="text-gray-400 hover:text-white">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white">Help Center</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white">Contact Us</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white">Feedback</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SOCS4AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
