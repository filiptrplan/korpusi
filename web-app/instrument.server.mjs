import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: "https://e85456d2e0576460d6fc134afdf2afdf@o4507901585391616.ingest.de.sentry.io/4507901587685456",
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: "0.1",

  // To use Sentry OpenTelemetry auto-instrumentation
  // default: false
  autoInstrumentRemix: true,

  // Optionally capture action formData attributes with errors.
  // This requires `sendDefaultPii` set to true as well.
  captureActionFormDataKeys: {
    key_x: true,
    key_y: true,
  },
  // To capture action formData attributes.
  sendDefaultPii: true
});
