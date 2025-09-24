export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About Computational Thinking
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Learn about the four core concepts of computational thinking and how they can transform 
              K-5 education across all subject areas.
            </p>
          </div>

          {/* What is CT Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What is Computational Thinking?</h2>
            <p className="text-lg text-gray-600 mb-4">
              Computational thinking (CT) is a problem-solving process that includes a number of characteristics 
              and dispositions. It is the thought process involved in formulating problems and their solutions 
              so that the solutions are represented in a form that can be effectively carried out.
            </p>
            <p className="text-lg text-gray-600">
              CT involves solving problems, designing systems, and understanding human behavior by drawing on 
              the concepts fundamental to computer science. It's a fundamental skill for everyone, not just 
              computer scientists.
            </p>
          </section>

          {/* Four Pillars */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">The Four Pillars of CT</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Decomposition</h3>
                <p className="text-gray-600">
                  Breaking down complex problems into smaller, more manageable parts. This makes 
                  overwhelming tasks achievable and helps students tackle challenges step by step.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-3xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Pattern Recognition</h3>
                <p className="text-gray-600">
                  Looking for similarities and patterns in problems. By recognizing patterns, 
                  students can apply solutions from one problem to solve another similar problem.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-3xl mb-4">💡</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Abstraction</h3>
                <p className="text-gray-600">
                  Focusing on the important information only, ignoring irrelevant details. This 
                  helps students identify what's essential to solve a problem.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-3xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Algorithms</h3>
                <p className="text-gray-600">
                  Developing step-by-step instructions to solve a problem or complete a task. 
                  Algorithms provide a clear path from problem to solution.
                </p>
              </div>
            </div>
          </section>

          {/* Why CT Matters */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why CT Matters in K-5 Education</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-green-500 text-xl mr-3">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Builds Problem-Solving Skills</h4>
                  <p className="text-gray-600">
                    Students learn to approach complex problems systematically and develop confidence 
                    in their ability to find solutions.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-green-500 text-xl mr-3">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Cross-Curricular Application</h4>
                  <p className="text-gray-600">
                    CT concepts apply across all subjects - from analyzing literature to solving 
                    math problems to understanding scientific processes.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-green-500 text-xl mr-3">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Prepares for the Future</h4>
                  <p className="text-gray-600">
                    These skills are essential for success in the 21st century, regardless of 
                    whether students pursue technology careers.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-green-500 text-xl mr-3">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Enhances Critical Thinking</h4>
                  <p className="text-gray-600">
                    Students develop analytical skills and learn to think logically and creatively 
                    about challenges they encounter.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-blue-50 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Integrate CT in Your Classroom?
            </h2>
            <p className="text-gray-600 mb-6">
              Explore our collection of ready-to-use lesson plans that seamlessly integrate 
              computational thinking concepts into your existing curriculum.
            </p>
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Lesson Plans →
            </a>
          </section>
        </div>
      </div>
    </div>
  )
}