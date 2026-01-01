# Security Policy

## 🔒 Reporting Security Vulnerabilities

If you discover a security vulnerability in ExamePad, please report it responsibly:

**DO NOT** create a public GitHub issue.

Instead, send an email to: [your-email@example.com]

We will respond within 48 hours and work with you to address the issue.

---

## 🛡️ Required Environment Variables

This project requires the following environment variables to function:

### Production Environment

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Gemini AI (REQUIRED for AI features)
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### Setup Instructions

1. Copy `.env.example` to `.env.local`
2. Fill in your actual credentials
3. **NEVER** commit `.env.local` to version control

---

## ✅ Security Best Practices

### For Developers

- ✅ Always use `.env.local` for local development
- ✅ Never hardcode credentials in source code
- ✅ Use environment variables for all sensitive data
- ✅ Keep dependencies updated (`npm audit`)
- ✅ Enable 2FA on your GitHub account

### For Deployment

- ✅ Use platform-specific environment variable management (Vercel, Railway, etc.)
- ✅ Rotate API keys periodically
- ✅ Enable Supabase Row Level Security (RLS)
- ✅ Use HTTPS only in production
- ✅ Implement rate limiting

---

## 🔍 What's Protected

- ✅ `.env.local` is in `.gitignore`
- ✅ No credentials in source code
- ✅ Supabase uses RLS policies
- ✅ API keys are environment-specific

---

## 📋 Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < 1.0   | :x:                |

---

## 🚨 Known Security Considerations

### Supabase Anon Key

The `VITE_SUPABASE_ANON_KEY` is safe to expose in client-side code because:
- It's designed for public use
- Row Level Security (RLS) protects data
- It has limited permissions

However, you should still:
- Enable RLS on all tables
- Implement proper authentication
- Use server-side functions for sensitive operations

### Gemini API Key

The `VITE_GEMINI_API_KEY` should be:
- Restricted by domain (in Google Cloud Console)
- Rate-limited
- Monitored for unusual usage

---

## 📞 Contact

For security concerns: [your-email@example.com]  
For general issues: [GitHub Issues](https://github.com/Eldastito/ProvaDigital/issues)

---

**Last Updated**: January 1, 2026
