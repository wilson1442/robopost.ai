export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">
              <span className="text-gradient">robopost.ai</span>
            </h3>
            <p className="text-gray-400 mb-4">
              AI-powered content automation platform.
              <br />
              Your control plane for intelligent content creation.
            </p>
          </div>
          
          {/* Links */}
          <div>
            <h4 className="font-bold text-primary-300 mb-4">Product</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-primary-400 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-400 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-400 transition-colors">
                  Roadmap
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-primary-300 mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-primary-400 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-400 transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-400 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} robopost.ai. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <a href="#" className="text-gray-500 hover:text-primary-400 transition-colors text-sm">
              Privacy
            </a>
            <a href="#" className="text-gray-500 hover:text-primary-400 transition-colors text-sm">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

