import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT_ID = 'google-identity-services';

const GoogleSignInButton = ({ onCredential, text = 'signin_with', onError }) => {
  const buttonRef = useRef(null);
  const handlersRef = useRef({ onCredential, onError });
  const [scriptReady, setScriptReady] = useState(Boolean(window.google?.accounts?.id));
  const [configError, setConfigError] = useState('');
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
        theme: 'outline',
        size: 'large',
        text,
        shape: 'rect',
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
    <div>
      {clientId ? (
        <div ref={buttonRef} style={{ minHeight: '44px', display: 'flex', justifyContent: 'center' }} />
      ) : (
        <button
          type="button"
          onClick={showConfigurationError}
          aria-label="Continue with Google"
          style={{
            width: '100%',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: 'var(--text-main)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.64 5.93c4.47-4.13 7.13-10.2 7.13-17.58Z" />
            <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.87l-7.64-5.93c-2.13 1.43-4.86 2.27-8.26 2.27-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
          </svg>
          Continue with Google
        </button>
      )}
      {configError && (
        <p role="alert" style={{ margin: '8px 0 0', color: 'var(--color-danger)', fontSize: '0.78rem', lineHeight: 1.45 }}>
          {configError}
        </p>
      )}
      {clientId && !scriptReady && <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>Loading Google sign in</span>}
    </div>
  );
};

export default GoogleSignInButton;
