'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle, AlertCircle, Info, Lightbulb } from 'lucide-react';


interface Finding {
    severity: 'critical' | 'major' | 'minor' | 'suggestion';
    category: string;
    line: number;
    message: string;
    suggestion: string;
    explanation: string;
}

const severityConfig = {
    critical: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700' },
    major: { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700' },
    minor: { icon: Info, color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' },
    suggestion: { icon: Lightbulb, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700' },
};

export default function CodeReviewPage() {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [findings, setFindings] = useState<Finding[]>([]);
    const [error, setError] = useState('');
    const [usedContext7, setUsedContext7] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);

    const analyzeCode = async () => {
        if (!code.trim()) {
            setError('Please paste some code to analyze');
            return;
        }

        setIsLoading(true);
        setError('');
        setFindings([]);

        try {
            const res = await fetch('/api/review-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language: 'auto', filename: '' }),
            });

            const contentType = res.headers.get('content-type') || '';
            let data: any = {};

            if (contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 100)}...`);
            }

            if (!res.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            setFindings(data.findings || []);
            setUsedContext7(data.usedContext7);
            setHasAnalyzed(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-200 selection:bg-blue-500/30">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="border-b border-white/5 bg-black/20 backdrop-blur-2xl sticky top-0 z-50">
                <div className="container mx-auto px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="group p-2 -ml-2 rounded-full hover:bg-white/5 transition-all duration-300">
                            <ArrowLeft size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                                Code Review
                            </h1>
                            {usedContext7 && hasAnalyzed && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse"></div>
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400/80">
                                        Context7 Enhanced
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={analyzeCode}
                        disabled={isLoading || !code.trim()}
                        className="relative group overflow-hidden bg-white text-black px-8 py-2.5 rounded-full font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Analyzing
                                </>
                            ) : (
                                <>
                                    Analyze <span className="text-blue-600">Code</span>
                                </>
                            )}
                        </span>
                    </button>
                </div>
            </header>

            <div className="container mx-auto px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]">
                    {/* Code Editor Section */}
                    <div className="group relative flex flex-col bg-[#111418] rounded-2xl border border-white/5 overflow-hidden transition-all duration-500 hover:border-white/10 shadow-2xl">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.3)]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 shadow-[0_0_8px_rgba(234,179,8,0.3)]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.3)]"></div>
                            </div>
                            <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
                            <span className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Input Terminal</span>
                        </div>
                        <div className="flex-1 relative">
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="// Paste your code here..."
                                className="absolute inset-0 w-full h-full bg-transparent text-[#e6edf3] p-6 font-mono text-[13px] leading-relaxed resize-none focus:outline-none placeholder-slate-600 custom-scrollbar"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="flex flex-col bg-[#0d1014]/50 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-md shadow-2xl">
                        <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-white tracking-tight">Analysis Results</h2>
                                {hasAnalyzed && (
                                    <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">
                                        {findings.length === 0
                                            ? 'No issues detected'
                                            : `${findings.length} findings identified`}
                                    </p>
                                )}
                            </div>
                            {findings.length > 0 && (
                                <div className="flex gap-1.5">
                                    {['critical', 'major'].map(sev => {
                                        const count = findings.filter(f => f.severity === sev).length;
                                        if (count === 0) return null;
                                        return (
                                            <span key={sev} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${sev === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                                                }`}>
                                                {count} {sev}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {error && (
                                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 flex gap-4">
                                    <AlertTriangle className="text-red-500 shrink-0" size={20} />
                                    <div>
                                        <p className="text-sm font-bold text-red-400">Error Encountered</p>
                                        <p className="text-xs text-red-400/80 mt-1">{error}</p>
                                    </div>
                                </div>
                            )}

                            {!hasAnalyzed && !isLoading && (
                                <div className="flex flex-col items-center justify-center h-full space-y-4 py-20 px-10 text-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full"></div>
                                        <div className="relative w-24 h-24 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-center mb-6">
                                            <Lightbulb size={40} className="text-slate-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Ready for Analysis</h3>
                                    <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                                        Paste your code in the terminal to get AI-powered insights enhanced with <strong>Context7</strong> documentation.
                                    </p>
                                </div>
                            )}

                            {isLoading && (
                                <div className="flex flex-col items-center justify-center h-full py-20">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full animate-pulse"></div>
                                        <Loader2 className="animate-spin text-white mb-6 relative" size={48} />
                                    </div>
                                    <p className="text-sm font-bold tracking-widest text-white/40 uppercase">Analyzing Pattern</p>
                                </div>
                            )}

                            {hasAnalyzed && findings.length === 0 && !isLoading && (
                                <div className="flex flex-col items-center justify-center h-full py-20 px-10 text-center">
                                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                                        <span className="text-3xl text-green-500">✓</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Code is Clean</h3>
                                    <p className="text-sm text-slate-500 mt-2">No functional or style issues were detected.</p>
                                </div>
                            )}

                            {findings.map((finding, index) => {
                                const config = severityConfig[finding.severity];
                                const IconComponent = config.icon;

                                return (
                                    <div
                                        key={index}
                                        className="group relative bg-white/[0.03] border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/10"
                                    >
                                        <div className="flex items-start gap-5">
                                            <div className={`p-3 rounded-xl ${config.bg.split(' ')[0]} bg-opacity-10 border border-white/5 shrink-0`}>
                                                <IconComponent className={config.color} size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${config.badge.replace('text-', 'text-opacity-90 text-')}`}>
                                                        {finding.severity}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        {finding.category} • Line {finding.line}
                                                    </span>
                                                </div>
                                                <h4 className="text-base font-bold text-white mb-2 leading-tight">
                                                    {finding.message}
                                                </h4>
                                                <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                                                    {finding.explanation}
                                                </p>
                                                {finding.suggestion && (
                                                    <div className="mt-4 rounded-xl bg-black/40 border border-white/5 overflow-hidden">
                                                        <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02]">
                                                            <p className="text-[10px] uppercase tracking-widest font-black text-slate-600">Proposed Modification</p>
                                                        </div>
                                                        <div className="p-4">
                                                            <code className="text-[12px] text-blue-400 font-mono whitespace-pre-wrap leading-relaxed">
                                                                {finding.suggestion}
                                                            </code>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}
