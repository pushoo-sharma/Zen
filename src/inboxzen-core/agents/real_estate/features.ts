/**
 * Real Estate Feature Extraction
 * Extracts real estate-specific features from emails
 */

export type Message = { 
  subject: string; 
  body: string; 
  from?: string; 
  to?: string[]; 
  date?: string; 
};

export type Features = { 
  hasOffer: boolean; 
  hasEscrow: boolean; 
  hasInspection: boolean; 
  hasAppraisal: boolean; 
  hasAddress: boolean; 
  hasDateTime: boolean; 
};

const rxOffer = /(offer|counter[- ]offer)/i;
const rxEscrow = /(escrow|title|wire)/i;
const rxInspection = /(inspection|inspector)/i;
const rxAppraisal = /(appraisal|appraiser)/i;
const rxAddress = /(\d+\s+[A-Za-z0-9\.\-\s]+(St|Street|Ave|Avenue|Rd|Road|Blvd|Lane|Ln|Dr|Drive))/i;
const rxDateTime = /(\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?\b.*\b\d{1,2}[:\.]?\d{0,2}\s?(AM|PM)?|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b)/i;

/**
 * Extracts real estate features from a message
 */
export function extractFeatures(msg: Message): Features {
  const text = `${msg.subject} ${msg.body}`;
  
  return {
    hasOffer: rxOffer.test(text),
    hasEscrow: rxEscrow.test(text),
    hasInspection: rxInspection.test(text),
    hasAppraisal: rxAppraisal.test(text),
    hasAddress: rxAddress.test(text),
    hasDateTime: rxDateTime.test(text),
  };
}
