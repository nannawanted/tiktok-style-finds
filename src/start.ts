import { createStart, createMiddleware } from "@tanstack/react-start";
import {
  sentryGlobalFunctionMiddleware,
  sentryGlobalRequestMiddleware,
} from "@sentry/tanstackstart-react";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { initServerSentry, captureServerError } from "./lib/sentry-server";

initServerSentry();

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    // Le middleware Sentry ne capture pas les exceptions de rendu SSR
    // (voir doc officielle) — on les remonte donc explicitement ici, au
    // seul endroit où elles sont interceptées avant d'être avalées.
    await captureServerError(error, { boundary: "start_error_middleware" });
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  // Le middleware Sentry doit être en premier pour capturer un maximum d'erreurs.
  functionMiddleware: [sentryGlobalFunctionMiddleware, attachSupabaseAuth],
  requestMiddleware: [sentryGlobalRequestMiddleware, errorMiddleware],
}));
