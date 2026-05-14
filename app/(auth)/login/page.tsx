import Image from "next/image";
import { signIn } from "@/lib/auth";
import { Chrome, Github } from "lucide-react";

function getErrorMessage(error: string | undefined): string | null {
  if (!error) return null;
  const messages: Record<string, string> = {
    Configuration: "Auth configuration error. Check AUTH_SECRET and AUTH_URL.",
    AccessDenied: "Access denied. Your account may not be authorized.",
    Verification: "The verification link expired or is invalid.",
    OAuthSignin: "Error starting OAuth sign-in. Try again.",
    OAuthCallback: "OAuth callback failed. Check your Google redirect URI matches exactly.",
    OAuthCreateAccount: "Could not create account. Database may be unreachable.",
    EmailCreateAccount: "Could not create account with email.",
    Callback: "Callback error. Check AUTH_URL matches your domain.",
    OAuthAccountNotLinked: "This email is already used with another sign-in method.",
    EmailSignin: "Error sending sign-in email.",
    CredentialsSignin: "Invalid email or password.",
    SessionRequired: "Please sign in to access this page.",
  };
  return messages[error] ?? `Sign-in error: ${error}`;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const error = getErrorMessage(params?.error);
  const baseUrl = process.env.AUTH_URL ?? "https://founder-arena-pi.vercel.app";
  const rawCallback = params?.callbackUrl ?? "/dashboard";
  const callbackUrl = rawCallback.startsWith("http")
    ? rawCallback
    : `${baseUrl}${rawCallback.startsWith("/") ? "" : "/"}${rawCallback}`;

  return (
    <div className="relative min-h-screen bg-[#05050a] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(0,240,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />
      </div>

      <div
        className="relative z-10 w-full max-w-md px-6"
       
       
       
      >
        <div className={`relative p-8 border ${error ? "border-rose-400/60" : "border-cyan-400/20"} bg-black/40 backdrop-blur-sm`}>
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/50" />
          <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/50" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400/50" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/50" />

          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto">
              <Image src="/logo.png" alt="Founder Arena" width={80} height={80} priority />
            </div>

            <div>
              <h1 className="text-2xl font-black text-white tracking-wider" style={{ textShadow: "0 0 20px rgba(0,240,255,0.3)" }}>
                AUTHENTICATE
              </h1>
              <p className="text-xs text-cyan-400/40 tracking-[0.3em] mt-2">SECURE ACCESS REQUIRED</p>
            </div>

            {error && (
              <div
                className="p-3 border border-rose-400/30 bg-rose-400/10"
               
               
              >
                <p className="text-sm text-rose-400 font-medium text-center">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: callbackUrl });
                }}
              >
                <button
                  type="submit"
                  className="w-full relative p-4 border border-white/10 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all group"
                 
                 
                >
                  <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/20 group-hover:border-cyan-400/40 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/20 group-hover:border-cyan-400/40 transition-colors" />
                  <span className="flex items-center justify-center gap-3 text-sm font-bold tracking-wider text-white/60 group-hover:text-cyan-400 transition-colors">
                    <Chrome className="w-5 h-5" />
                    GOOGLE ID
                  </span>
                </button>
              </form>

              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: callbackUrl });
                }}
              >
                <button
                  type="submit"
                  className="w-full relative p-4 border border-white/10 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all group"
                 
                 
                >
                  <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-white/20 group-hover:border-cyan-400/40 transition-colors" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-white/20 group-hover:border-cyan-400/40 transition-colors" />
                  <span className="flex items-center justify-center gap-3 text-sm font-bold tracking-wider text-white/60 group-hover:text-cyan-400 transition-colors">
                    <Github className="w-5 h-5" />
                    GITHUB ID
                  </span>
                </button>
              </form>
            </div>

            {process.env.DEMO_MODE_ENABLED === "true" && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-[#05050a] text-[10px] text-white/20 tracking-[0.3em]">OR</span>
                  </div>
                </div>
                <div className="p-3 border border-dashed border-cyan-400/20 bg-cyan-400/5 text-center">
                  <p className="text-xs text-cyan-400/60 font-medium">Demo mode is enabled</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
