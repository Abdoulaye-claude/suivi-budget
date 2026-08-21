import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useModalDialog } from '../lib/useModalDialog';

interface Props {
  onClose: () => void;
}

type Mode = 'signin' | 'signup';

export function AuthModal({ onClose }: Props) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const modalRef = useModalDialog<HTMLDivElement>(onClose);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onClose();
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setConfirmationSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? translateAuthError(err.message) : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal--narrow"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        tabIndex={-1}
      >
        <div className="modal__header">
          <h3 className="panel-title" id="auth-modal-title">
            {mode === 'signin' ? 'Se connecter' : 'Créer un compte'}
          </h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        {confirmationSent ? (
          <p className="modal__text">
            📧 Un e-mail de confirmation a été envoyé à <strong>{email}</strong>. Cliquez sur le lien
            qu'il contient pour activer votre compte, puis revenez vous connecter.
          </p>
        ) : (
          <form className="auth-modal__form" onSubmit={handleSubmit}>
            <label className="field">
              <span>E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label className="field">
              <span>Mot de passe</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </label>

            {error && (
              <p className="form-error" role="alert">
                ⚠️ {error}
              </p>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                {isSubmitting ? 'Un instant…' : mode === 'signin' ? 'Se connecter' : "Créer mon compte"}
              </button>
            </div>
          </form>
        )}

        <button
          type="button"
          className="auth-modal__switch"
          onClick={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
            setError(null);
            setConfirmationSent(false);
          }}
        >
          {mode === 'signin' ? "Pas de compte ? Créez-en un" : 'Déjà un compte ? Connectez-vous'}
        </button>
      </div>
    </div>
  );
}

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou mot de passe incorrect.';
  if (message.includes('User already registered')) return 'Un compte existe déjà avec cet e-mail.';
  if (message.includes('Password should be at least')) return 'Le mot de passe doit faire au moins 6 caractères.';
  return message;
}
