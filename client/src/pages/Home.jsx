import { Link } from 'react-router-dom';
import { MdRecycling } from 'react-icons/md';
import { FiMapPin, FiZap, FiShield, FiTrendingUp } from 'react-icons/fi';

const WASTE_TYPES = ['Mobile', 'Laptop', 'Battery', 'Television', 'Refrigerator', 'Printer'];

const FEATURES = [
  { icon: <FiMapPin size={24} />, title: 'Location-Aware', desc: 'Finds certified e-waste facilities near you instantly.' },
  { icon: <FiZap size={24} />, title: 'AI Recommendations', desc: 'Smart ranking based on distance, ratings, and your history.' },
  { icon: <FiShield size={24} />, title: 'Certified Facilities', desc: 'Only verified, certified recyclers in our network.' },
  { icon: <FiTrendingUp size={24} />, title: 'Track Disposal', desc: 'Real-time status updates from pickup to recycling.' },
];

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <MdRecycling size={64} className="text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Dispose E-Waste <span className="text-primary">Responsibly</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with certified e-waste recycling facilities near you. Drop off or schedule a pickup — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/facilities" className="btn-primary px-8 py-3 text-base">Find Facilities Near Me</Link>
            <Link to="/register" className="btn-secondary px-8 py-3 text-base">Get Started Free</Link>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Accepted Waste Types</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {WASTE_TYPES.map((w) => (
              <div key={w} className="card text-center py-4 hover:border-primary hover:shadow-md transition-all">
                <MdRecycling size={28} className="text-primary mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-700">{w}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Why EcoWasteFinder?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card text-center">
                <div className="text-primary flex justify-center mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: 1, title: 'Register & Login', desc: 'Create your free account' },
              { step: 2, title: 'Select Waste & Location', desc: 'Tell us what you have and where you are' },
              { step: 3, title: 'Get AI Recommendations', desc: 'We find the best facility for you' },
              { step: 4, title: 'Drop Off or Get Picked Up', desc: 'Choose your disposal method' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center mx-auto mb-3">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-primary text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to recycle responsibly?</h2>
        <p className="mb-6 opacity-90">Join thousands of users disposing e-waste the right way.</p>
        <Link to="/register" className="bg-white text-primary font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
          Create Account
        </Link>
      </section>
    </div>
  );
}
