import { MdRecycling } from 'react-icons/md';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-lg mb-2">
            <MdRecycling size={22} /> EcoWasteFinder
          </div>
          <p className="text-sm text-gray-400">Connecting consumers to certified e-waste facilities for responsible disposal.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">Quick Links</h4>
          <ul className="space-y-1 text-sm">
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/facilities" className="hover:text-white transition-colors">Find Facilities</Link></li>
            <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">About</h4>
          <p className="text-sm text-gray-400">Not a real-time project. Built for academic/demo purposes using MERN stack.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-6 pt-4 border-t border-gray-700 text-xs text-gray-500 text-center">
        © {new Date().getFullYear()} EcoWasteFinder. All rights reserved.
      </div>
    </footer>
  );
}
