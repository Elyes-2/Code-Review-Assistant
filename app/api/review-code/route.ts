import { NextRequest, NextResponse } from 'next/server';
import { GeminiCodeReviewer } from '@/lib/langchain/gemini-review-chain';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, language, filename } = body;

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        const reviewer = new GeminiCodeReviewer();

        console.log(`Starting analysis for ${filename || 'snippet'} in ${language}`);

        const findings = await reviewer.analyzeCode(code, language, filename);

        return NextResponse.json({
            success: true,
            findings,
            usedContext7: true // Documentation-aware review is now the default
        });
    } catch (error: any) {
        console.error('Code review error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to analyze code' },
            { status: 500 }
        );
    }
}
