/**
 * Utility functions for handling API responses
 */

/**
 * Cleans PHP API response by removing HTML error output that corrupts JSON
 * @param responseText - Raw response text from PHP API
 * @returns Clean JSON string
 */
export function cleanPhpApiResponse(responseText: string): string {
  // Remove common PHP error/warning HTML tags and text
  const cleanText = responseText
    // Remove <br> tags (with or without closing slash)
    .replace(/<br\s*\/?>/gi, '')
    // Remove <b> tags and their content (used in PHP error messages)
    .replace(/<b>.*?<\/b>/gi, '')
    // Remove PHP Warning messages
    .replace(/Warning:.*?on line.*?(\n|$)/gi, '')
    // Remove PHP Notice messages  
    .replace(/Notice:.*?on line.*?(\n|$)/gi, '')
    // Remove PHP Fatal error messages
    .replace(/Fatal error:.*?on line.*?(\n|$)/gi, '')
    // Remove any remaining PHP error traces
    .replace(/in \/.*?\.php on line \d+/gi, '')
    // Clean up extra whitespace and newlines
    .trim();

  // Find the actual JSON start (first opening brace)
  const jsonStart = cleanText.indexOf('{');
  if (jsonStart >= 0) {
    return cleanText.substring(jsonStart);
  }

  // If no JSON object found, try array format
  const arrayStart = cleanText.indexOf('[');
  if (arrayStart >= 0) {
    return cleanText.substring(arrayStart);
  }

  // Return the cleaned text as-is if no JSON markers found
  return cleanText;
}

/**
 * Safely parses JSON from PHP API response with error handling
 * @param responseText - Raw response text from PHP API
 * @returns Parsed JSON object or throws descriptive error
 */
export async function parsePhpApiResponse(responseText: string): Promise<any> {
  try {
    const cleanJson = cleanPhpApiResponse(responseText);
    
    if (!cleanJson) {
      throw new Error('Empty response after cleaning');
    }

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Failed to parse PHP API response:', {
      originalText: responseText.substring(0, 500) + '...',
      cleanedText: cleanPhpApiResponse(responseText).substring(0, 500) + '...',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw new Error(
      `Invalid JSON response from PHP API: ${
        error instanceof Error ? error.message : 'Unknown parsing error'
      }`
    );
  }
}

/**
 * Enhanced fetch wrapper for PHP API endpoints
 * Automatically handles response cleaning and parsing
 */
export async function fetchFromPhpApi(url: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
  }

  const responseText = await response.text();
  return parsePhpApiResponse(responseText);
}

/**
 * Type guard to check if API response has expected structure
 */
export function isValidApiResponse(data: any): data is { success: boolean; data: any[]; meta?: any } {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.success === 'boolean' &&
    Array.isArray(data.data)
  );
}