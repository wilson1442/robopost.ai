const steps = [
  {
    number: "01",
    title: "Configure Your Sources",
    description: "Select your industry and add RSS feeds. We store the configuration, robopost.ai handles the fetching.",
  },
  {
    number: "02",
    title: "Trigger AI Agents",
    description: "Send structured webhooks to robopost.ai. AI agents process content, synthesize, and format outputs.",
  },
  {
    number: "03",
    title: "Receive & Distribute",
    description: "Get results back via webhook. Display, store, and optionally forward to your destinations.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-950">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
            <span className="text-gradient">How It Works</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Simple three-step process. You control the configuration, robopost.ai handles the intelligence.
          </p>
        </div>
        
        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative"
            >
              {/* Connector line (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 transform translate-x-1/2 z-0" />
              )}
              
              <div className="relative z-10 text-center">
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-accent text-white text-3xl font-bold mb-6 shadow-lg shadow-primary-500/50">
                  {step.number}
                </div>
                
                {/* Step content */}
                <h3 className="text-2xl font-bold mb-4 text-primary-300">
                  {step.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Architecture note */}
        <div className="mt-16 text-center">
          <div className="glass-effect rounded-xl p-6 max-w-3xl mx-auto">
            <p className="text-gray-300">
              <span className="font-bold text-primary-400">Architecture:</span>{" "}
              This app is a control plane. All AI processing happens in robopost.ai workflows
              triggered via webhooks. No AI models run in the Next.js application.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

