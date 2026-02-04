/**
 * Authentication utilities for token validation and management
 */

/**
 * Validates if a token is a properly formatted JWT
 * @param token - The token to validate
 * @returns boolean - True if token is valid JWT format, false otherwise
 */
export function isValidJWTFormat(token: string | null): boolean {
  if (!token) {
    return false;
  }

  // Check for test token (invalid)
  if (token === 'test-token') {
    console.warn('🚫 Test token detected - clearing invalid token');
    return false;
  }

  // JWT should have exactly 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.warn('🚫 Invalid JWT format - token does not have 3 parts');
    return false;
  }

  // Check if each part is base64url encoded (basic validation)
  try {
    parts.forEach((part, index) => {
      if (!part || part.length === 0) {
        throw new Error(`JWT part ${index + 1} is empty`);
      }
      // Try to decode base64url - if it fails, the token is malformed
      atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    });
    return true;
  } catch (error) {
    console.warn('🚫 Invalid JWT format - malformed base64 encoding:', error);
    return false;
  }
}

/**
 * Gets a validated token from localStorage
 * @returns string | null - Valid token or null if invalid/missing
 */
export function getValidatedToken(): string | null {
  const token = localStorage.getItem('ca_flow_token') || localStorage.getItem('token');
  
  if (!isValidJWTFormat(token)) {
    // Clear invalid tokens from localStorage
    if (localStorage.getItem('ca_flow_token')) {
      console.warn('🗑️ Clearing invalid ca_flow_token from localStorage');
      localStorage.removeItem('ca_flow_token');
    }
    if (localStorage.getItem('token')) {
      console.warn('🗑️ Clearing invalid generic token from localStorage');
      localStorage.removeItem('token');
    }
    return null;
  }
  
  return token;
}

/**
 * Sets a token in localStorage after validation
 * @param token - The token to set
 * @returns boolean - True if token was set, false if invalid
 */
export function setValidatedToken(token: string | null): boolean {
  if (!token) {
    localStorage.removeItem('ca_flow_token');
    localStorage.removeItem('token');
    return true;
  }

  if (!isValidJWTFormat(token)) {
    console.error('🚫 Attempted to set invalid JWT token');
    return false;
  }

  localStorage.setItem('ca_flow_token', token);
  localStorage.setItem('token', token);
  return true;
}

/**
 * Clears the token from localStorage
 */
export function clearToken(): void {
  localStorage.removeItem('ca_flow_token');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
  localStorage.removeItem('onboardingComplete');
}

/**
 * Checks if user is authenticated with a valid token
 * @returns boolean
 */
export function isAuthenticated(): boolean {
  return getValidatedToken() !== null;
}