"use client";

export default function Hero() {
  const scrollToEarlyAccess = () => {
    const element = document.getElementById("early-access");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-primary opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.3),transparent_50%)]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Main headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-in">
          <span className="text-gradient">robopost.ai</span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 mb-8 max-w-3xl mx-auto animate-slide-up">
          AI-Powered Content Automation
          <br />
          <span className="text-primary-400">Across Every Industry</span>
        </p>
        
        {/* Description */}
        <p className="text-lg sm:text-xl text-gray-400 mb-12 max-w-2xl mx-auto animate-slide-up">
          Aggregate RSS feeds, synthesize with AI agents, and distribute content
          automatically. Your control plane for intelligent content creation.
        </p>
        
        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
          <button 
            onClick={scrollToEarlyAccess}
            className="px-8 py-4 bg-gradient-accent text-white font-bold text-lg rounded-lg hover-lift hover-glow shadow-lg shadow-primary-500/50"
          >
            Get Early Access
          </button>
          <button className="px-8 py-4 glass-effect text-gray-200 font-semibold text-lg rounded-lg hover-lift border-2 border-primary-500/30">
            Learn More
          </button>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
    </section>
  );
}

