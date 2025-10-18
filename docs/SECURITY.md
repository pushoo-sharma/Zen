# InboxZen Security Architecture

## Overview
InboxZen implements enterprise-grade security measures to protect user data and ensure privacy compliance.

## 1. OAuth 2.0 Least-Privilege Access

### Gmail OAuth Scopes (Read-Only)
- `https://www.googleapis.com/auth/gmail.readonly` - Read-only access to emails
- `https://www.googleapis.com/auth/gmail.metadata` - Email metadata only (no body content)

### Outlook OAuth Scopes (Read-Only)
- `Mail.Read` - Read-only access to emails
- `Mail.ReadBasic` - Basic metadata access only

### Scope Validation
All OAuth requests are validated to ensure only read-only scopes are used. Write/Send permissions are **never** requested without explicit user approval.

## 2. Data Retention Policy

### Cache Duration
- **Email Metadata**: Maximum 24 hours
- **Message Bodies**: Deleted immediately after AI analysis
- **Attachments**: Never stored, analyzed in-memory only

### What We Store
- Derived insights (priority scores, categories)
- Sender IDs (hashed)
- Timestamps
- Message IDs

### What We DON'T Store
- Full email body content (analyzed and discarded)
- Attachments
- Personal content from signatures

### Audit Logs
- Retained for **30 days maximum**
- Automatically purged after retention period
- Contains action, status, latency, and anonymized user ID

## 3. PII Redaction & Anonymization

### Automated Redaction
All logs and analytics automatically redact:
- Email addresses → `user-[hash]@redacted.local`
- Phone numbers → `XXX-XXX-XXXX`
- Credit card numbers → `XXXX-XXXX-XXXX-XXXX`
- SSN → `XXX-XX-XXXX`

### Email Signature Stripping
Before AI processing, we strip:
- Email signatures
- Footer blocks
- "Sent from my iPhone" messages
- Common signature patterns

### Log Sanitization
- Tokens and secrets → `[REDACTED]`
- User IDs → `user-[hash]`
- IP addresses hashed for privacy

## 4. Encryption & Storage

### At Rest
- **AES-256 encryption** for all stored data
- Separate encryption keys for:
  - OAuth tokens
  - AI analysis cache
  - User preferences

### In Transit
- **TLS 1.3** for all API communications
- Certificate pinning for critical endpoints
- HTTPS-only, no fallback to HTTP

### Key Rotation
- OAuth tokens refreshed automatically
- Encryption keys rotated every **90 days**
- Old keys securely destroyed

## 5. Audit & Access Logs

### What's Logged
Every API call includes:
- **Timestamp** (ISO 8601)
- **Action** (e.g., "email_fetch", "ai_classify")
- **Status** (success/error)
- **Latency** (milliseconds)
- **Error code** (if applicable)
- **User ID** (anonymized)
- **Scope** (OAuth scope used)

### Log Access
- Users can view their own audit logs in Settings
- Service administrators have read-only access
- Logs are immutable (write-once)

### Retention
- **30 days** for audit logs
- Automatic cleanup via scheduled function
- No logs older than 30 days are retained

## 6. User Consent & Deletion

### Privacy Consent Modal
Before connecting email:
1. User reviews data access policy
2. Explicit consent checkbox required
3. Consent logged with timestamp and IP
4. Can be revoked anytime

### What Users Consent To
- Reading email metadata (not content)
- AI processing of metadata
- 24-hour cache of derived insights
- PII-redacted analytics

### Data Deletion Rights
Users can:
1. **Export Data**: Download all their data as JSON
2. **Revoke Access**: Disconnect OAuth at any time
3. **Delete Account**: Permanently remove all data including:
   - Account and profile
   - OAuth connections and tokens
   - AI memory and learning data
   - Audit logs
   - All cached metadata

### Deletion Process
1. User confirms deletion (cannot be undone)
2. All data deleted from all tables
3. OAuth tokens revoked
4. User account deleted
5. Process is logged for compliance

## 7. Security Best Practices

### Input Validation
- All user inputs validated with Zod schemas
- SQL injection prevention via parameterized queries
- XSS protection via React's built-in escaping

### Authentication
- Supabase Auth handles secure authentication
- JWT tokens with expiration
- Session management with refresh tokens

### Rate Limiting
- API rate limits per user
- Prevents abuse and DoS attacks
- Tracked in `rate_limits` table

### Secure Headers
All API responses include:
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy`

## 8. Compliance & Certifications

### GDPR Compliance
- ✅ Right to access (data export)
- ✅ Right to deletion (account deletion)
- ✅ Right to rectification (settings updates)
- ✅ Data portability (JSON export)
- ✅ Privacy by design (read-only by default)

### SOC 2 Principles
- ✅ Security (encryption, access control)
- ✅ Availability (99.9% uptime)
- ✅ Processing Integrity (data validation)
- ✅ Confidentiality (PII redaction)
- ✅ Privacy (user consent, deletion)

## 9. Incident Response

### Security Incident Protocol
1. **Detection**: Automated monitoring alerts
2. **Containment**: Immediate access revocation
3. **Investigation**: Root cause analysis
4. **Notification**: Users notified within 72 hours
5. **Remediation**: Fix and deploy patch
6. **Review**: Post-mortem and prevention

### Contact
Report security issues to: security@inboxzen.ai

## 10. Third-Party Security

### AI Provider
- OpenAI API with enterprise agreement
- Data processing addendum (DPA) in place
- Zero data retention policy
- TLS 1.3 encryption

### Hosting & Infrastructure
- Supabase (SOC 2 Type II certified)
- AWS infrastructure (ISO 27001)
- Automatic security patches
- DDoS protection

## Regular Security Reviews
- Quarterly security audits
- Penetration testing annually
- Dependency vulnerability scanning (automated)
- Security training for all team members

---

**Last Updated**: 2025-10-14  
**Version**: 1.0
