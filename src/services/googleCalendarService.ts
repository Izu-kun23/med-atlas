import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Complete the auth session - call this once when module loads
if (typeof WebBrowser.maybeCompleteAuthSession === 'function') {
  WebBrowser.maybeCompleteAuthSession();
}

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET || '';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@google_calendar_access_token',
  REFRESH_TOKEN: '@google_calendar_refresh_token',
  TOKEN_EXPIRY: '@google_calendar_token_expiry',
};

export interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

class GoogleCalendarService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  /**
   * Initialize and load stored tokens
   */
  async initialize() {
    try {
      this.accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      this.refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const expiry = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      this.tokenExpiry = expiry ? parseInt(expiry, 10) : null;
    } catch (error) {
      console.error('Error initializing Google Calendar service:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    await this.initialize();
    if (!this.accessToken || !this.refreshToken) {
      return false;
    }

    // Check if token is expired
    if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
      // Try to refresh token
      const refreshed = await this.refreshAccessToken();
      return refreshed;
    }

    return true;
  }

  /**
   * Authenticate with Google OAuth
   */
  async authenticate(): Promise<boolean> {
    try {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error('Google Client ID is not configured. Please set EXPO_PUBLIC_GOOGLE_CLIENT_ID in your .env file.');
      }

      console.log('Starting Google Calendar authentication...');
      console.log('Client ID:', GOOGLE_CLIENT_ID.substring(0, 20) + '...');

      // Generate redirect URI - use Expo proxy for web OAuth compatibility
      let redirectUri: string;
      try {
        // For Google OAuth, we need to use a web-compatible URI
        // Use the Expo proxy URI which works with Google's OAuth
        redirectUri = AuthSession.makeRedirectUri({
          useProxy: true,
        });
        
        // Fallback to custom scheme if proxy doesn't work
        if (!redirectUri || redirectUri.startsWith('exp://')) {
          redirectUri = `https://auth.expo.io/@izu/med-atlas`;
        }
        
        console.log('Redirect URI:', redirectUri);
        console.log('Make sure this URI is added to your Google OAuth client authorized redirect URIs!');
      } catch (uriError: any) {
        console.error('Error generating redirect URI:', uriError);
        // Fallback to known working URI
        redirectUri = 'https://auth.expo.io/@izu/med-atlas';
        console.log('Using fallback redirect URI:', redirectUri);
      }

      // Create discovery document fresh each time
      const discoveryDoc = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
      };

      // Create auth request configuration object first
      const requestConfig = {
        clientId: GOOGLE_CLIENT_ID,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
        ],
        responseType: AuthSession.ResponseType.Code,
        redirectUri: redirectUri,
        usePKCE: true,
      };

      console.log('Creating AuthRequest...');
      let request: AuthSession.AuthRequest;
      try {
        // Create auth request - let expo-auth-session handle PKCE automatically
        request = new AuthSession.AuthRequest(requestConfig);
        console.log('AuthRequest created successfully');
      } catch (requestError: any) {
        console.error('Error creating AuthRequest:', requestError);
        console.error('Error details:', {
          message: requestError.message,
          stack: requestError.stack,
          name: requestError.name,
        });
        throw new Error(`Failed to create auth request: ${requestError.message}`);
      }

      console.log('Prompting for authentication...');
      let result: AuthSession.AuthRequestPromptOptions;
      try {
        // Prompt for authentication with proxy enabled for web compatibility
        result = await request.promptAsync(discoveryDoc, {
          useProxy: true,
        });
        console.log('Authentication result type:', result.type);
      } catch (promptError: any) {
        console.error('Error during authentication prompt:', promptError);
        console.error('Error details:', {
          message: promptError.message,
          stack: promptError.stack,
          name: promptError.name,
          property: promptError.property,
        });
        
        // Check if it's the configurable property error
        if (promptError.message?.includes('not configurable') || promptError.message?.includes('configurable')) {
          console.error('PROPERTY ERROR DETECTED - This is likely an expo-auth-session internal issue');
          console.error('Try: 1) Restart app with cleared cache, 2) Update expo-auth-session, 3) Check Expo SDK version');
        }
        throw promptError;
      }

      if (result.type === 'success' && result.params.code) {
        console.log('Authorization code received, exchanging for tokens...');
        // Exchange authorization code for tokens
        const tokenResult = await this.exchangeCodeForTokens(
          result.params.code,
          request.codeVerifier || undefined,
          redirectUri
        );
        return tokenResult;
      }

      if (result.type === 'error') {
        console.error('Authentication error:', result.error);
        throw new Error(result.error?.message || 'Authentication failed');
      }

      if (result.type === 'cancel') {
        console.log('User cancelled authentication');
        return false;
      }

      return false;
    } catch (error: any) {
      console.error('Google Calendar authentication error:', error);
      console.error('Full error object:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        property: error.property,
        code: error.code,
      });
      
      // Provide more helpful error message
      if (error.message?.includes('property is not configurable') || error.message?.includes('not configurable')) {
        throw new Error(
          `Authentication configuration error: ${error.message}. This is often caused by expo-auth-session internal state. Try: 1) Restart app with 'npm start -- --clear', 2) Update packages with 'npx expo install expo-auth-session@latest', 3) Check if you're using the correct Expo SDK version.`
        );
      }
      throw error;
    }
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    codeVerifier?: string,
    redirectUri?: string
  ): Promise<boolean> {
    try {
      const finalRedirectUri = redirectUri || AuthSession.makeRedirectUri({ scheme: 'med-atlas' });
      
      const params: any = {
        code,
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: finalRedirectUri,
        grant_type: 'authorization_code',
      };

      // Add PKCE code verifier if available
      if (codeVerifier) {
        params.code_verifier = codeVerifier;
      } else if (GOOGLE_CLIENT_SECRET) {
        // Fallback to client secret if PKCE is not used
        params.client_secret = GOOGLE_CLIENT_SECRET;
      }

      const response = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      // Store tokens
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, this.accessToken);
      if (this.refreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, this.refreshToken);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, this.tokenExpiry.toString());

      return true;
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      return false;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    try {
      if (!this.refreshToken) {
        return false;
      }

      const response = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: this.refreshToken,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET || '',
          grant_type: 'refresh_token',
        }).toString(),
      });

      if (!response.ok) {
        // Refresh token is invalid, need to re-authenticate
        await this.logout();
        return false;
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, this.accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, this.tokenExpiry.toString());

      return true;
    } catch (error: any) {
      console.error('Error refreshing access token:', error);
      return false;
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<string | null> {
    await this.initialize();

    if (!this.accessToken) {
      return null;
    }

    // Check if token is expired
    if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        return null;
      }
    }

    return this.accessToken;
  }

  /**
   * Create an event in Google Calendar
   */
  async createEvent(event: GoogleCalendarEvent): Promise<string | null> {
    try {
      const token = await this.ensureValidToken();
      if (!token) {
        throw new Error('Not authenticated. Please connect your Google Calendar first.');
      }

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create event: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error: any) {
      console.error('Error creating Google Calendar event:', error);
      throw error;
    }
  }

  /**
   * Get events from Google Calendar
   */
  async getEvents(timeMin?: string, timeMax?: string): Promise<any[]> {
    try {
      const token = await this.ensureValidToken();
      if (!token) {
        throw new Error('Not authenticated. Please connect your Google Calendar first.');
      }

      const params = new URLSearchParams({
        timeMin: timeMin || new Date().toISOString(),
        maxResults: '2500',
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      if (timeMax) {
        params.append('timeMax', timeMax);
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch events: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error: any) {
      console.error('Error fetching Google Calendar events:', error);
      throw error;
    }
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const token = await this.ensureValidToken();
      if (!token) {
        throw new Error('Not authenticated. Please connect your Google Calendar first.');
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.ok;
    } catch (error: any) {
      console.error('Error deleting Google Calendar event:', error);
      return false;
    }
  }

  /**
   * Logout and clear stored tokens
   */
  async logout(): Promise<void> {
    try {
      if (this.accessToken) {
        // Revoke token
        try {
          await fetch(discovery.revocationEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              token: this.accessToken,
            }).toString(),
          });
        } catch (error) {
          console.error('Error revoking token:', error);
        }
      }

      // Clear stored tokens
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.TOKEN_EXPIRY,
      ]);

      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();

