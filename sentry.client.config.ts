import * as Sentry from '@sentry/nextjs'

// UGANDA FRONTEND — Sentry client config (mirrors main pharmacy_front).
// Captures ACTIVE runtime errors: unhandled exceptions, console errors,
// session replays on error. Requires NEXT_PUBLIC_SENTRY_DSN in .env.

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    debug: false,
    replaysSessionSampleRate: 0.1, // Records 10% of all sessions
    replaysOnErrorSampleRate: 1.0, // Records 100% of sessions that hit an error
    integrations: [
        Sentry.replayIntegration({
            // Strict privacy mode: masks all text with *** to protect patient data
            maskAllText: true,
            blockAllMedia: true,
        }),
        Sentry.feedbackIntegration({
            // Adds a "Report a Bug" popup automatically when an error occurs
            colorScheme: "system",
            autoInject: true,
        }),
        Sentry.captureConsoleIntegration({ levels: ["warn", "error"] })
    ],
})
