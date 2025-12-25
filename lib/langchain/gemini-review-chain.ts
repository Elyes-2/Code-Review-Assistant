import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { Context7Client } from '../context7/client';

const reviewSchema = z.object({
    findings: z.array(
        z.object({
            severity: z.enum(['critical', 'major', 'minor', 'suggestion']),
            category: z.enum(['bug', 'security', 'performance', 'style', 'best-practice']),
            line: z.number(),
            message: z.string(),
            suggestion: z.string(),
            explanation: z.string(),
        })
    ),
});

export class GeminiCodeReviewer {
    private detectionModel: ChatGoogleGenerativeAI;
    private reviewModel: ChatGoogleGenerativeAI;
    private parser: StructuredOutputParser<typeof reviewSchema>;
    private context7: Context7Client;

    constructor() {
        // Phase 1: Detection Model (Fast, low-cost)
        this.detectionModel = new ChatGoogleGenerativeAI({
            model: 'gemini-2.5-flash',
            temperature: 0.1,
            apiKey: process.env.GOOGLE_API_KEY,
        });

        // Phase 3: Review Model (High precision, flagship)
        this.reviewModel = new ChatGoogleGenerativeAI({
            model: 'gemini-3-flash-preview',
            temperature: 0.3,
            maxOutputTokens: 8192,
            apiKey: process.env.GOOGLE_API_KEY,
        });

        this.parser = StructuredOutputParser.fromZodSchema(reviewSchema);

        // Initialize Context7 for documentation lookup
        this.context7 = new Context7Client();
    }

    /**
     * Phase 1: Framework Detection
     * Identifies libraries and versions from the code
     */
    private async detectFrameworks(code: string, language: string): Promise<string[]> {
        const prompt = PromptTemplate.fromTemplate(`
Identify the libraries, frameworks, and their versions used in the following {language} code.
Return ONLY a comma-separated list of library names. If no specific libraries are detected, return "None".

CODE:
\`\`\`{language}
{code}
\`\`\`

Result:`);

        try {
            const chain = prompt.pipe(this.detectionModel);
            const result = await chain.invoke({ language, code });
            const content = (result.content as string).trim();

            if (content.toLowerCase() === 'none') return [];
            return content.split(',').map(lib => lib.trim());
        } catch (error) {
            console.error('Framework detection error:', error);
            return [];
        }
    }

    /**
     * Phase 2: Context7 Phase
     * Fetches documentation for detected frameworks
     */
    private async fetchDocumentation(frameworks: string[]): Promise<string> {
        if (frameworks.length === 0) return '';

        const docs = await Promise.all(
            frameworks.map(async (lib) => {
                const id = await this.context7.resolveLibraryId(lib);
                if (id) {
                    return this.context7.getLibraryDocsById(id);
                }
                return '';
            })
        );

        return docs.filter(Boolean).join('\n\n---\n\n');
    }

    /**
     * Analyze a single code snippet (not a diff) with Context7 documentation enhancement
     */
    async analyzeCode(code: string, language: string, filename?: string) {
        let detectedLanguage = language;

        // 0. Language Detection Phase (if needed)
        if (!detectedLanguage || detectedLanguage.toLowerCase() === 'auto' || detectedLanguage.toLowerCase() === 'unknown') {
            const langPrompt = PromptTemplate.fromTemplate(`
Identify the programming language of the following code.
Return ONLY the name of the language (e.g., "TypeScript", "Python", "Go"). 
If you cannot identify it, return "Unknown".

CODE:
\`\`\`
{code}
\`\`\`

Result:`);
            try {
                const chain = langPrompt.pipe(this.detectionModel);
                const result = await chain.invoke({ code });
                detectedLanguage = (result.content as string).trim();
            } catch (error) {
                console.error('Language detection error:', error);
                detectedLanguage = 'Unknown';
            }
        }

        // 1. Detection Phase (Libraries)
        const frameworks = await this.detectFrameworks(code, detectedLanguage);

        // 2. Context7 Phase
        const context7Docs = await this.fetchDocumentation(frameworks);

        const prompt = PromptTemplate.fromTemplate(`
You are an expert code reviewer with deep knowledge of {language} and software engineering best practices.
You have access to the latest library documentation to ensure your suggestions use current APIs.

Analyze the following code and provide detailed, actionable feedback.

FILE: {fileName}
LANGUAGE: {language}

CODE:
\`\`\`{language}
{code}
\`\`\`

${context7Docs ? `
RELEVANT LIBRARY DOCUMENTATION (from Context7):
{libraryDocs}
` : ''}

Review criteria:
1. **Bugs & Logic Errors**: Identify potential runtime errors, logic flaws, edge cases not handled
2. **Security Vulnerabilities**: Check for SQL injection, XSS, authentication issues, data exposure
3. **Performance Issues**: Look for inefficient algorithms, unnecessary computations, memory leaks
4. **Code Quality**: Assess readability, maintainability, adherence to best practices
5. **Style & Standards**: Check naming conventions, formatting, documentation
6. **API Usage**: Verify correct usage of libraries and frameworks (use the documentation provided)

For EACH issue found, provide:
- severity: critical/major/minor/suggestion
- category: bug/security/performance/style/best-practice
- line: exact line number in the code
- message: concise description (1 sentence)
- suggestion: specific code fix or improvement
- explanation: detailed reasoning (2-3 sentences)

If no issues are found, return an empty findings array.

{formatInstructions}
`);

        try {
            const chain = prompt.pipe(this.reviewModel);

            const result = await chain.invoke({
                fileName: filename || 'code-snippet',
                language: detectedLanguage,
                code,
                libraryDocs: context7Docs || 'No additional documentation available.',
                formatInstructions: this.parser.getFormatInstructions(),
            });

            const content = result.content as string;
            const parsed = (await this.parser.parse(content)) as { findings: any[] };
            return parsed.findings;
        } catch (error: any) {
            console.error('Error analyzing code:', error);
            throw new Error(`Failed to analyze code: ${error.message}`);
        }
    }

}
