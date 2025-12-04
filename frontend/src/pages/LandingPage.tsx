import { Activity, ChevronRight, AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => (
  <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
    {/* Minimal Navbar */}
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50 transition-all duration-300">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm shadow-indigo-200">
            <Activity className="w-3 h-3 text-white" />
          </div>
          SLA Predict
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-6 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-slate-900 transition-colors">Product</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Customers</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Pricing</a>
          </div>
          <button 
            onClick={onLogin}
            className="text-sm font-medium px-4 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
          >
            Sign In
          </button>
        </div>
      </div>
    </nav>

    <main>
      {/* Hero Section - Ultra Minimal */}
      <section className="pt-40 pb-20 px-6 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 text-slate-900 leading-[0.95]">
            Predict delays. <br />
            <span className="text-slate-400">Before they happen.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium tracking-tight">
            Enterprise-grade logistics intelligence. <br />
            Zero integration friction.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button 
              onClick={onLogin}
              className="px-8 py-4 bg-slate-900 text-white rounded-full font-semibold text-lg hover:scale-105 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300"
            >
              Get Started
            </button>
            <button className="px-8 py-4 text-slate-600 font-medium hover:text-slate-900 transition-colors flex items-center gap-2 group">
              View the demo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Abstract UI Representation */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl bg-gradient-to-b from-slate-100 to-white p-1 shadow-2xl ring-1 ring-slate-900/5 overflow-hidden"
        >
          {/* Window Controls */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-white/50 backdrop-blur-sm border-b border-slate-200/50 flex items-center px-4 gap-1.5 z-20">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
          </div>
          
          {/* The Interface Image */}
          <div className="bg-white pt-8 aspect-[16/10] flex items-center justify-center overflow-hidden relative">
            {/* A simplified abstract representation of the dashboard */}
            <div className="absolute inset-0 grid grid-cols-12 gap-4 p-8 bg-slate-50/50">
              <div className="col-span-3 space-y-4 hidden md:block">
                <div className="h-24 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col justify-between">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 mb-2"></div>
                  <div className="w-16 h-2 bg-slate-100 rounded-full"></div>
                </div>
                <div className="h-24 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 mb-2"></div>
                  <div className="w-16 h-2 bg-slate-100 rounded-full"></div>
                </div>
                <div className="h-48 bg-white rounded-xl shadow-sm border border-slate-100"></div>
              </div>
              <div className="col-span-12 md:col-span-9 bg-white rounded-xl shadow-sm border border-slate-100 p-6 overflow-hidden relative">
                <div className="flex justify-between mb-8">
                  <div className="w-32 h-4 bg-slate-100 rounded-full"></div>
                  <div className="w-24 h-4 bg-slate-100 rounded-full"></div>
                </div>
                {/* Animated Bars */}
                <div className="flex items-end gap-2 sm:gap-4 h-64 border-b border-slate-100 pb-4 px-4">
                  {[...Array(12)].map((_, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: '10%' }}
                      animate={{ height: `${20 + Math.random() * 60}%` }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: i * 0.1 }}
                      className="flex-1 bg-indigo-600 rounded-t-sm opacity-80" 
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Floating Alert Card - "The Pop" */}
            <motion.div 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8, ease: "backOut" }}
              className="absolute bottom-8 right-8 md:bottom-12 md:right-12 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] ring-1 ring-slate-900/5 max-w-xs z-10"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 rounded-xl shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">High Risk Detected</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Order #2991 predicted to miss SLA by 20m due to traffic congestion.</p>
                  <button className="mt-3 text-xs font-medium text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors shadow-sm shadow-red-200">
                    Reroute Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Minimal Bento Grid Features */}
      <section className="bg-slate-50 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Built for scale.</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">Advanced telemetry and machine learning for modern logistics teams.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <Activity className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Real-time Sync</h3>
              <p className="text-slate-500 leading-relaxed">Sub-second latency for all carrier updates. Live tracking map included.</p>
            </motion.div>
            
            {/* Card 2 - Wide Dark */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-slate-900 text-white p-8 rounded-[2rem] shadow-sm relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                  <AlertOctagon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Predictive Alerts</h3>
                <p className="text-slate-400 max-w-md leading-relaxed">Our ML model analyzes traffic patterns, weather, and carrier load to predict delays with 94% accuracy.</p>
              </div>
              <div className="absolute -right-10 -top-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-colors"></div>
            </motion.div>

            {/* Card 3 - Wide Light */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col md:flex-row md:items-center gap-8"
            >
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Carrier Agnostic</h3>
                <p className="text-slate-500 leading-relaxed">Works seamlessly with Dunzo, Shadowfax, Delhivery, and your internal fleet APIs.</p>
              </div>
              <div className="flex gap-4 opacity-30 grayscale">
                {/* Abstract Logos */}
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
              </div>
            </motion.div>

            {/* Card 4 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Auto-Correction</h3>
              <p className="text-slate-500 leading-relaxed">Automatically suggest reroutes for high-risk orders.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
            <span className="text-sm font-semibold text-slate-900">SLA Predict Inc.</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </main>
  </div>
);

