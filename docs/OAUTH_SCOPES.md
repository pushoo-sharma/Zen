# OAuth 2.0 Scopes & Permissions

## Overview
InboxZen follows the principle of **least privilege** - requesting only the minimum permissions needed to provide functionality.

## Gmail OAuth Scopes

### Read-Only Access (Default)
```
https://www.googleapis.com/auth/gmail.readonly
```
**Permissions:**
- Read all emails and metadata
- Access message bodies
- View labels and threads
- Search mailbox

**Does NOT allow:**
- ❌ Sending emails
- ❌ Deleting emails
- ❌ Modifying labels
- ❌ Creating drafts

### Metadata Only (Recommended)
```
https://www.googleapis.com/auth/gmail.metadata
```
**Permissions:**
- Read email headers (from, to, subject)
- Access message IDs and thread IDs
- View timestamps
- See label associations

**Does NOT allow:**
- ❌ Reading email body content
- ❌ Accessing attachments
- ❌ Sending emails
- ❌ Modifying anything

## Outlook/Microsoft 365 OAuth Scopes

### Read-Only Access (Default)
```
Mail.Read
```
**Permissions:**
- Read all emails in all folders
- Access message metadata
- View attachments

**Does NOT allow:**
- ❌ Sending emails
- ❌ Deleting emails
- ❌ Moving emails
- ❌ Creating folders

### Basic Read Access (Recommended)
```
Mail.ReadBasic
```
**Permissions:**
- Read email metadata only
- Access sender, subject, timestamps
- View message IDs

**Does NOT allow:**
- ❌ Reading email body content
- ❌ Accessing attachments
- ❌ Sending emails
- ❌ Modifying anything

## InboxZen Default Configuration

By default, InboxZen requests **metadata-only** scopes:
- Gmail: `gmail.metadata`
- Outlook: `Mail.ReadBasic`

This ensures:
✅ We never access email body content by default
✅ Maximum privacy protection
✅ Compliance with data minimization principles

## Upgrading Permissions

If a user needs features that require full email access (e.g., AI content analysis), InboxZen will:

1. **Explain the need** - Show why the additional permission is required
2. **Request consent** - User must explicitly approve
3. **Log the request** - Audit log records permission upgrade
4. **Allow downgrade** - User can revoke at any time

## Scope Validation

All OAuth requests are validated server-side to ensure:
```typescript
// Only read-only scopes are allowed
const ALLOWED_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.metadata',
  'Mail.Read',
  'Mail.ReadBasic',
];

function validateScopes(requestedScopes: string[]): boolean {
  return requestedScopes.every(scope => ALLOWED_SCOPES.includes(scope));
}
```

## Revoking Access

Users can revoke InboxZen's access at any time:

### Gmail
1. Go to Google Account → Security
2. Click "Third-party apps with account access"
3. Find "InboxZen" and click "Remove Access"

### Outlook
1. Go to Microsoft Account → Privacy
2. Click "Apps & services"
3. Find "InboxZen" and click "Revoke"

### InboxZen Settings
1. Go to Settings → Email Connections
2. Click "Disconnect" next to the connected account
3. Confirm deletion

## Security Best Practices

### For Developers
1. **Never request write permissions** without explicit user need
2. **Always use metadata-only scopes** when possible
3. **Log all scope changes** in audit logs
4. **Validate scopes server-side** on every request
5. **Rotate tokens regularly** (every 90 days)

### For Users
1. **Review permissions** before connecting
2. **Start with metadata-only** access
3. **Audit connected apps** regularly
4. **Revoke unused connections** immediately
5. **Enable 2FA** on email accounts

## Compliance

### GDPR
- ✅ Data minimization (metadata-only by default)
- ✅ Explicit consent required
- ✅ Right to revoke access
- ✅ Audit trail of permissions

### SOC 2
- ✅ Least privilege access
- ✅ Access control logging
- ✅ Regular permission audits
- ✅ User education on permissions

## FAQ

**Q: Why can't InboxZen send emails on my behalf?**  
A: We intentionally do NOT request send permissions for security. If you need to send emails, you'll be redirected to your email client.

**Q: Can InboxZen delete my emails?**  
A: No. We only request read-only access. We cannot delete, move, or modify your emails.

**Q: What happens to my tokens if I disconnect?**  
A: All OAuth tokens are immediately revoked and deleted from our systems.

**Q: How often do I need to reauthorize?**  
A: Gmail tokens last 7 days (renewable), Outlook tokens last 90 days. We'll prompt you to reauthorize when needed.

**Q: Can InboxZen access my calendar or contacts?**  
A: No. We only request email-related scopes. Calendar and contacts require separate permissions we don't ask for.

---

**Last Updated**: 2025-10-14  
**Version**: 1.0
