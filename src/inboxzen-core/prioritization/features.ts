/**
 * Feature Extraction
 * Extracts features from emails for prioritization
 */

export interface EmailFeatures {
  // Sender features
  fromVIP: boolean;
  senderFrequency: number;
  replyRate: number;
  
  // Content features
  hasDeadline: boolean;
  hasQuestion: boolean;
  hasAttachment: boolean;
  wordCount: number;
  
  // Thread features
  isThread: boolean;
  threadLength: number;
  
  // Temporal features
  hourOfDay: number;
  dayOfWeek: number;
  recencyHours: number;
  
  // Engagement features
  isPersonalized: boolean;
  mentionsUserName: boolean;
}

/**
 * Extracts all features from an email
 */
export function extractFeatures(
  email: {
    from: string;
    subject: string;
    body: string;
    timestamp: Date;
    threadId?: string;
  },
  userContext?: {
    name?: string;
    vipSenders?: string[];
  }
): EmailFeatures {
  // TODO: Implement comprehensive feature extraction
  const now = new Date();
  const hoursSinceReceived = (now.getTime() - email.timestamp.getTime()) / (1000 * 60 * 60);
  
  return {
    fromVIP: userContext?.vipSenders?.includes(email.from) ?? false,
    senderFrequency: 0, // TODO: Calculate from history
    replyRate: 0, // TODO: Calculate from history
    
    hasDeadline: /deadline|due|by \d|before/i.test(email.subject + email.body),
    hasQuestion: /\?/.test(email.body),
    hasAttachment: false, // TODO: Detect attachments
    wordCount: email.body.split(/\s+/).length,
    
    isThread: !!email.threadId,
    threadLength: 1, // TODO: Fetch actual thread length
    
    hourOfDay: email.timestamp.getHours(),
    dayOfWeek: email.timestamp.getDay(),
    recencyHours: hoursSinceReceived,
    
    isPersonalized: false, // TODO: Detect personalization
    mentionsUserName: userContext?.name 
      ? email.body.includes(userContext.name)
      : false,
  };
}

/**
 * Normalizes features for ML model input
 */
export function normalizeFeatures(features: EmailFeatures): number[] {
  // TODO: Implement feature normalization
  // - Scale to 0-1 range
  // - Handle categorical variables
  // - Return feature vector
  return [];
}
