import { supabase } from "@/lib/supabase";

function cleanResetPasswordUrl() {
  if (typeof window === "undefined") return;
  window.history.replaceState({}, "", "/auth/reset-password");
}

function urlAuthError(): string | null {
  if (typeof window === "undefined") return null;
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return (
    searchParams.get("error_description") ??
    searchParams.get("error") ??
    hashParams.get("error_description") ??
    hashParams.get("error")
  );
}

function waitForRecoveryEvent(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
      resolve(value);
    };

    const timer = setTimeout(() => finish(false), timeoutMs);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        finish(true);
      }
    });
  });
}

/**
 * Establish a recovery session from Supabase email link (PKCE code, OTP, or hash tokens).
 */
export async function establishRecoverySession(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  if (typeof window === "undefined") {
    return { ok: false, message: "Reset must be completed in the browser." };
  }

  const authError = urlAuthError();
  if (authError) {
    return { ok: false, message: decodeURIComponent(authError.replace(/\+/g, " ")) };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  const hasAuthParams =
    searchParams.has("code") ||
    (searchParams.has("token_hash") && searchParams.get("type") === "recovery") ||
    hashParams.get("type") === "recovery" ||
    hashParams.has("access_token");

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return { ok: false, message: error.message };
    cleanResetPasswordUrl();
    return { ok: true };
  }

  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");
  if (tokenHash && otpType === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: tokenHash,
    });
    if (error) return { ok: false, message: error.message };
    cleanResetPasswordUrl();
    return { ok: true };
  }

  if (hasAuthParams) {
    const recovered = await waitForRecoveryEvent(6000);
    if (recovered) {
      cleanResetPasswordUrl();
      return { ok: true };
    }

    for (let attempt = 0; attempt < 30; attempt++) {
      const { data, error } = await supabase.auth.getSession();
      if (error) return { ok: false, message: error.message };
      if (data.session) {
        cleanResetPasswordUrl();
        return { ok: true };
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      ok: false,
      message: "Could not verify your reset link. Please request a new one.",
    };
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) return { ok: false, message: error.message };
  if (data.session) return { ok: true };

  return {
    ok: false,
    message: "This reset link is invalid or has expired. Please request a new one.",
  };
}
