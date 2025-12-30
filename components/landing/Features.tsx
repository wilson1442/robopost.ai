const features = [
  {
    title: "RSS Aggregation",
    description: "Collect content from industry feeds and your custom sources. Centralize everything in one place.",
    icon: "📡",
  },
  {
    title: "AI Synthesis",
    description: "Powerful AI agents process and synthesize content. All intelligence runs in n8n workflows.",
    icon: "🤖",
  },
  {
    title: "Multi-Format Output",
    description: "Generate blog posts, social media content, emails, and webhook payloads from a single run.",
    icon: "📝",
  },
  {
    title: "Automated Distribution",
    description: "Schedule runs and automatically post to your chosen destinations. Set it and forget it.",
    icon: "🚀",
  },
  {
    title: "Industry Agnostic",
    description: "Works across any industry. Configure prompts, sources, and outputs to match your needs.",
    icon: "🌐",
  },
  {
    title: "Full Control",
    description: "You own the configuration. Custom prompts, source selection, and output formatting.",
    icon: "⚙️",
  },
];

export default function Features() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
            <span className="text-gradient">Powerful Features</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to automate content creation at scale
          </p>
        </div>
        
        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-effect rounded-xl p-8 hover-lift hover-glow group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3 text-primary-300">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

