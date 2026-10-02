import { createServerFn } from "@tanstack/react-start";

/**
 * Creates an isolated, pre-confirmed demo account and returns its
 * credentials so the browser can sign in. Each guest gets their own data.
 */
export const createGuestAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const rand = crypto.randomUUID().replace(/-/g, "");
  const email = `guest-${rand.slice(0, 12)}@demo.tasknest.app`;
  const password = `${rand}Aa1!`;
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Guest", is_guest: true },
  });
  if (error) throw new Error("Could not start a demo session. Please try again.");
  return { email, password };
});
