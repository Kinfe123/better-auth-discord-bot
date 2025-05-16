import fetch from 'node-fetch';

const API_URL = 'https://context7.com/api/v1/better-auth/better-auth';

export interface ApiResponse {
    title: string;
    description: string;
    source: string;
    language: string;
    code: string;
}

function parseApiResponse(text: string): ApiResponse[] {
    const sections = text.split('----------------------------------------').filter(Boolean);
    
    return sections.map(section => {
        const lines = section.trim().split('\n');
        const response: Partial<ApiResponse> = {};
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('TITLE:')) {
                response.title = line.replace('TITLE:', '').trim();
            } else if (line.startsWith('DESCRIPTION:')) {
                response.description = line.replace('DESCRIPTION:', '').trim();
            } else if (line.startsWith('SOURCE:')) {
                response.source = line.replace('SOURCE:', '').trim();
            } else if (line.startsWith('LANGUAGE:')) {
                response.language = line.replace('LANGUAGE:', '').trim();
            } else if (line.startsWith('CODE:')) {
                // Collect all code lines until the next section
                const codeLines: string[] = [];
                i++; // Skip the CODE: line
                while (i < lines.length && !lines[i].startsWith('TITLE:') && !lines[i].startsWith('DESCRIPTION:') && !lines[i].startsWith('SOURCE:') && !lines[i].startsWith('LANGUAGE:')) {
                    codeLines.push(lines[i]);
                    i++;
                }
                i--; // Adjust index for the next iteration
                response.code = codeLines.join('\n').trim();
            }
        }

        return {
            title: response.title || 'Untitled',
            description: response.description || '',
            source: response.source || '',
            language: response.language || 'typescript',
            code: response.code || ''
        };
    });
}

export async function fetchDocs(query: string): Promise<ApiResponse[]> {
    try {
        const response = await fetch(API_URL + '?query=' + encodeURIComponent(query), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const text = await response.text();
        return parseApiResponse(text);
    } catch (error) {
        console.error('Error fetching documentation:', error);
        return [];
    }
}

export function formatResponse(responses: ApiResponse[]): string {
    if (!responses || responses.length === 0) {
        return 'I couldn\'t find any relevant information in the documentation.';
    }

    let formattedResponse = 'Here\'s what I found in the documentation:\n\n';

    responses.forEach((response, index) => {
        formattedResponse += `**${response.title}**\n`;
        formattedResponse += `${response.description}\n\n`;

        if (response.code) {
            formattedResponse += '```' + response.language + '\n';
            formattedResponse += response.code;
            formattedResponse += '\n```\n\n';
        }

        formattedResponse += `Source: ${response.source}\n\n`;

        if (index < responses.length - 1) {
            formattedResponse += '---\n\n';
        }
    });

    return formattedResponse;
}