/**
 * Login Session Types
 */

export interface LoginSession {
  sessionId: string;
  userId: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser?: string;
  os?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
  };
  isActive: boolean;
}

export interface ParsedUserAgent {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser?: string;
  os?: string;
}

/**
 * Parse user agent string to extract device and browser info
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';
  if (ua.includes('mobile') || ua.includes('android') && !ua.includes('tablet')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  } else if (ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
    deviceType = 'desktop';
  }
  
  // Detect browser
  let browser: string | undefined;
  if (ua.includes('edg/')) {
    browser = 'Edge';
  } else if (ua.includes('chrome/')) {
    browser = 'Chrome';
  } else if (ua.includes('safari/') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('firefox/')) {
    browser = 'Firefox';
  }
  
  // Detect OS
  let os: string | undefined;
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac os x') || ua.includes('macintosh')) {
    os = 'macOS';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }
  
  return { deviceType, browser, os };
}
