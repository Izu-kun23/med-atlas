/**
 * OCR Text Extraction Utility
 * 
 * This utility extracts text from images using Google Cloud Vision API.
 * 
 * To use this:
 * 1. Get a Google Cloud Vision API key from: https://cloud.google.com/vision/docs/setup
 * 2. Add it to your .env file: GOOGLE_CLOUD_VISION_API_KEY=your_api_key
 * 3. Or pass it directly to the extractTextFromImage function
 * 
 * Alternative: You can replace this with any other OCR service (Tesseract, Azure, etc.)
 */

export const extractTextFromImage = async (
  imageUri: string,
  apiKey?: string
): Promise<string> => {
  try {
    // If no API key provided, try to get from environment
    // In Expo, environment variables prefixed with EXPO_PUBLIC_ are available
    const visionApiKey = apiKey || process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY;

    if (!visionApiKey) {
      // Return empty string if no API key - user can type manually
      console.warn('Google Cloud Vision API key not found. OCR will be disabled.');
      return '';
    }

    // Convert image URI to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    const base64Data = base64.split(',')[1]; // Remove data:image/...;base64, prefix

    // Call Google Cloud Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              features: [
                {
                  type: 'TEXT_DETECTION',
                },
              ],
              image: {
                content: base64Data,
              },
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const errorData = await visionResponse.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${visionResponse.status}: ${visionResponse.statusText}`;
      
      // Provide helpful error messages for common issues
      if (errorMessage.includes('blocked') || errorMessage.includes('API key')) {
        throw new Error(
          'API access blocked. Please:\n' +
          '1. Enable Cloud Vision API in Google Cloud Console\n' +
          '2. Check API key restrictions include Cloud Vision API\n' +
          '3. Ensure billing is enabled for your project\n' +
          `\nOriginal error: ${errorMessage}`
        );
      }
      
      throw new Error(`OCR API Error: ${errorMessage}`);
    }

    const visionData = await visionResponse.json();

    if (visionData.error) {
      const errorMessage = visionData.error.message || 'OCR extraction failed';
      
      if (errorMessage.includes('blocked') || errorMessage.includes('API key')) {
        throw new Error(
          'API access blocked. Please:\n' +
          '1. Enable Cloud Vision API in Google Cloud Console\n' +
          '2. Check API key restrictions include Cloud Vision API\n' +
          '3. Ensure billing is enabled for your project\n' +
          `\nOriginal error: ${errorMessage}`
        );
      }
      
      throw new Error(errorMessage);
    }

    // Extract text from response
    const textAnnotations = visionData.responses[0]?.textAnnotations;
    if (!textAnnotations || textAnnotations.length === 0) {
      return '';
    }

    // The first annotation contains all detected text
    return textAnnotations[0].description || '';
  } catch (error: any) {
    console.error('OCR Error:', error);
    // Re-throw the error so the calling code can handle it appropriately
    // The error message contains helpful instructions for the user
    throw error;
  }
};

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Alternative: Simple OCR using a mock/fallback
 * This can be replaced with Tesseract.js or other OCR libraries
 */
export const extractTextFromImageFallback = async (imageUri: string): Promise<string> => {
  // This is a placeholder - in a real implementation, you would:
  // 1. Use Tesseract.js for client-side OCR
  // 2. Or use another OCR service
  // 3. Or return empty string and let user type manually
  
  return '';
};

