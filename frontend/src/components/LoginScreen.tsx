import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { BRANDING } from '../constants/branding';

export default function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/generated/ofs-logo-transparent.dim_200x200.png"
            alt={BRANDING.appName}
            className="w-24 h-24 object-contain"
            loading="eager"
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {BRANDING.appName}
            </h1>
            <p className="text-base text-muted-foreground mt-2">
              {BRANDING.tagline}
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">
                Welcome Back
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to start sharing files securely
              </p>
            </div>

            <button
              onClick={() => login()}
              disabled={isLoggingIn}
              className="
                w-full min-h-[52px] rounded-xl
                bg-primary text-primary-foreground
                text-base font-semibold
                flex items-center justify-center gap-2
                transition-opacity duration-150
                disabled:opacity-60
                active:scale-[0.98]
              "
            >
              {isLoggingIn ? (
                <>
                  <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-sm text-muted-foreground text-center px-4">
          Secure, decentralized file sharing powered by the Internet Computer
        </p>
      </div>
    </div>
  );
}
