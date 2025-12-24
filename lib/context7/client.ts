/**
 * Context7 API Client
 * Fetches up-to-date library documentation for AI-powered code reviews
 */

export class Context7Client {
    private apiKey: string;
    private baseUrl = 'https://context7.com/api/v1';

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.CONTEXT7_API_KEY || '';
    }

    /**
     * Resolve a library name to a Context7 ID
     * @param libraryName - e.g., "Supabase", "Next.js"
     */
    async resolveLibraryId(libraryName: string): Promise<string | null> {
        // v1 search endpoint based on research
        const url = new URL(`${this.baseUrl}/search`);
        url.searchParams.set('query', libraryName);

        try {
            console.log(`Context7: Resolving library "${libraryName}" at ${url.toString()}`);
            const response = await fetch(url.toString(), {
                headers: this.apiKey ? {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json',
                } : {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                console.warn(`Context7: Resolve failed with status ${response.status}`);
                return null;
            }

            const contentType = response.headers.get('content-type') || '';
            const text = await response.text();

            if (!contentType.includes('application/json')) {
                console.error(`Context7: Resolve returned non-JSON response (${contentType}): ${text.substring(0, 100)}...`);
                return null;
            }

            try {
                const data = JSON.parse(text);
                // v1 search results usually contain a list of libraries
                if (data && data.results && data.results.length > 0) {
                    return data.results[0].id || data.results[0].library_id;
                }
                if (data && data.libraries && data.libraries.length > 0) {
                    return data.libraries[0].id;
                }
                if (data && data.id) return data.id;

                return null;
            } catch (e) {
                console.error('Context7: Failed to parse resolve JSON');
                return null;
            }
        } catch (error: any) {
            console.error('Context7 resolve error:', error.message);
            return null;
        }
    }

    /**
     * Get documentation for a library by its Context7 ID
     * @param libraryId - e.g., "/supabase/supabase" or "supabase/supabase"
     */
    async getLibraryDocsById(libraryId: string): Promise<string> {
        // IDs might need to be clean of leading slash for the URL path
        const cleanId = libraryId.startsWith('/') ? libraryId.substring(1) : libraryId;
        const url = new URL(`${this.baseUrl}/${cleanId}`);

        try {
            console.log(`Context7: Fetching docs for "${libraryId}" at ${url.toString()}`);
            const response = await fetch(url.toString(), {
                headers: this.apiKey ? {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json, text/markdown, text/plain',
                } : {
                    'Accept': 'application/json, text/markdown, text/plain',
                },
            });

            if (!response.ok) {
                console.warn(`Context7: Docs fetch failed with status ${response.status}`);
                return '';
            }

            const contentType = response.headers.get('content-type') || '';
            const text = await response.text();

            if (contentType.includes('application/json')) {
                try {
                    const data = JSON.parse(text);
                    return data.content || data.docs || data.markdown || '';
                } catch {
                    return '';
                }
            }

            // Return text directly if it's already markdown or plain text
            return text;
        } catch (error: any) {
            console.error('Context7 fetch error:', error.message);
            return '';
        }
    }

    /**
     * Get legacy documentation for a library (using path/topic)
     * @param libraryPath - e.g., "vercel/next.js", "facebook/react"
     * @param topic - specific topic to search for, e.g., "routing", "hooks"
     */
    async getLibraryDocs(libraryPath: string, topic?: string): Promise<string> {
        const url = new URL(`${this.baseUrl}/${libraryPath}`);
        if (topic) {
            url.searchParams.set('topic', topic);
        }

        try {
            const response = await fetch(url.toString(), {
                headers: this.apiKey ? {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json, text/plain',
                } : {
                    'Accept': 'application/json, text/plain',
                },
            });

            if (!response.ok) return '';

            const contentType = response.headers.get('content-type') || '';
            const text = await response.text();

            if (contentType.includes('application/json')) {
                try {
                    const data = JSON.parse(text);
                    return data.content || data.docs || '';
                } catch {
                    return '';
                }
            }

            return text;
        } catch (error: any) {
            console.error('Context7 legacy fetch error:', error.message);
            return '';
        }
    }

    /**
     * Detect libraries from code and fetch relevant documentation
     */
    /*async getDocsForCode(code: string, language: string): Promise<string> {
        const libraries = this.detectLibraries(code, language);
        const docsPromises = libraries.map(lib => this.getLibraryDocs(lib.path, lib.topic));
        const docs = await Promise.all(docsPromises);
        return docs.filter(Boolean).join('\n\n---\n\n');
    }*/

    /**
     * Simple library detection from import statements
     */
    /*  private detectLibraries(code: string, language: string): Array<{ path: string; topic?: string }> {
          const libraries: Array<{ path: string; topic?: string }> = [];
  
          // JavaScript/TypeScript imports
          if (['javascript', 'typescript', 'jsx', 'tsx'].includes(language.toLowerCase())) {
              // React
              if (/import\s+.*from\s+['"]react['"]/i.test(code) || /require\(['"]react['"]\)/.test(code)) {
                  libraries.push({ path: 'facebook/react', topic: 'hooks' });
              }
              // Next.js
              if (/import\s+.*from\s+['"]next/i.test(code) || /from\s+['"]@next/i.test(code)) {
                  libraries.push({ path: 'vercel/next.js' });
              }
              // Express
              if (/require\(['"]express['"]\)|from\s+['"]express['"]/i.test(code)) {
                  libraries.push({ path: 'expressjs/express' });
              }
          }
  
          // Python imports
          if (language.toLowerCase() === 'python') {
              if (/import\s+pandas|from\s+pandas/i.test(code)) {
                  libraries.push({ path: 'pandas-dev/pandas' });
              }
              if (/import\s+numpy|from\s+numpy/i.test(code)) {
                  libraries.push({ path: 'numpy/numpy' });
              }
              if (/import\s+flask|from\s+flask/i.test(code)) {
                  libraries.push({ path: 'pallets/flask' });
              }
              if (/import\s+django|from\s+django/i.test(code)) {
                  libraries.push({ path: 'django/django' });
              }
          }
  
          return libraries;
      } */
}
