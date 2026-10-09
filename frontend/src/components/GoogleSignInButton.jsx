import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT_ID = 'google-identity-services';

/* White G logo for use on coloured background */
const GoogleLogoWhite = () => (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <circle cx="24" cy="24" r="24" fill="rgba(255,255,255,0.18)" />
    <path fill="#fff" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
    <path fill="#fff" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.64 5.93c4.47-4.13 7.13-10.2 7.13-17.58Z" />
    <path fill="#fff" d="M10.53 28.59A14.5 14.5 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" />
    <path fill="#fff" d="M24 48c6.48 0 11.93-2.13 15.9-5.87l-7.64-5.93c-2.13 1.43-4.86 2.27-8.26 2.27-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
  </svg>
);

const GoogleSignInButton = ({ onCredential, text = 'signin_with', onError }) => {
  const buttonRef = useRef(null);
  const handlersRef = useRef({ onCredential, onError });
  const [scriptReady, setScriptReady] = useState(Boolean(window.google?.accounts?.id));
  const [configError, setConfigError] = useState('');
  const [hovered, setHovered] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  handlersRef.current = { onCredential, onError };

  useEffect(() => {
    if (!clientId) return undefined;

    let active = true;
    const renderGoogleButton = () => {
      if (!active || !window.google?.accounts?.id || !buttonRef.current) return;
      setScriptReady(true);
      buttonRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setConfigError('');
          try {
            await handlersRef.current.onCredential(credential);
          } catch (error) {
            handlersRef.current.onError?.(error.message || 'Google sign in failed. Please try again.');
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'filled_blue',
        size: 'large',
        text,
        shape: 'pill',
        logo_alignment: 'left',
        width: Math.min(buttonRef.current.clientWidth || 360, 400),
      });
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else if (existingScript) {
      existingScript.addEventListener('load', renderGoogleButton);
    } else {
      const script = document.createElement('script');
      script.id = GOOGLE_SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', renderGoogleButton);
      script.addEventListener('error', () => {
        if (active) setConfigError('Google sign in could not load. Check your connection and try again.');
      });
      document.head.appendChild(script);
    }

    return () => {
      active = false;
      existingScript?.removeEventListener('load', renderGoogleButton);
    };
  }, [clientId, text]);

  const showConfigurationError = () => {
    setConfigError('Google sign in is not configured yet. Add VITE_GOOGLE_CLIENT_ID to frontend/.env.local.');
  };

  return (
    <div style={{ width: '100%' }}>
      {clientId ? (
        /* Native Google button — use filled_blue pill theme to match app style */
        <div
          ref={buttonRef}
          style={{ minHeight: '50px', display: 'flex', justifyContent: 'center', width: '100%' }}
        />
      ) : (
        /* Fallback: custom button matching the app's gradient button style */
        <button
          type="button"
          id="google-signin-btn"
          onClick={showConfigurationError}
          aria-label="Continue with Google"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: '100%',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '0 24px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: hovered
              ? 'linear-gradient(135deg, #1a73e8, #d93025)'
              : 'linear-gradient(135deg, #4285F4, #EA4335)',
            color: '#fff',
            fontSize: '0.95rem',
            fontWeight: 700,
            fontFamily: 'inherit',
            letterSpacing: '0.01em',
            cursor: 'pointer',
            boxShadow: hovered
              ? '0 8px 28px rgba(66,133,244,0.45)'
              : '0 4px 16px rgba(66,133,244,0.30)',
            transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'all 0.22s ease',
          }}
        >
          <GoogleLogoWhite />
          <span>Continue with Google</span>
        </button>
      )}

      {configError && (
        <p
          role="alert"
          style={{
            margin: '8px 0 0',
            color: 'var(--color-danger)',
            fontSize: '0.78rem',
            lineHeight: 1.45,
            textAlign: 'center',
          }}
        >
          {configError}
        </p>
      )}
      {clientId && !scriptReady && (
        <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
          Loading Google sign in
        </span>
      )}
    </div>
  );
};

export default GoogleSignInButton;
