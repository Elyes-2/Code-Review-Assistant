import Link from 'next/link';
import { ArrowRight, CheckCircle, Shield, Zap, Code2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <main className="flex-1 container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">
          AI-Powered <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Code Reviews</span>
        </h1>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
          Analyze your code with Gemini + Context7. Catch bugs, security flaws, and get up-to-date API suggestions instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/review"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105 shadow-xl shadow-blue-500/25"
          >
            <Code2 size={20} />
            Get Started - Review Code
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16 text-left">
          <Feature icon={<Shield className="text-blue-400" />} title="Security First" desc="Detects vulnerabilities like SQLi, XSS, and more using OWASP standards." />
          <Feature icon={<Zap className="text-yellow-400" />} title="Context7 Enhanced" desc="Uses up-to-date library documentation for accurate API suggestions." />
          <Feature icon={<CheckCircle className="text-green-400" />} title="Instant Feedback" desc="Get detailed code reviews in seconds. No credit card required." />
        </div>
      </main>

      <footer className="py-6 text-center text-slate-500 text-sm">
        Built with Next.js, Gemini, and Context7.
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors backdrop-blur-sm">
      <div className="mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2 text-white">{title}</h3>
      <p className="text-slate-400">{desc}</p>
    </div>
  )
}

