interface Props {
  onLoadSample: () => void;
  onDismiss: () => void;
}

export function WelcomeBanner({ onLoadSample, onDismiss }: Props) {
  return (
    <div className="welcome-banner">
      <div className="welcome-banner__text">
        <h2 className="welcome-banner__title">👋 Bienvenue sur Suivi de Budget</h2>
        <p className="welcome-banner__subtitle">
          Vos données restent uniquement sur cet appareil — rien n'est envoyé à un serveur.
          Vous pouvez essayer l'appli avec des exemples, ou partir d'une page blanche.
        </p>
      </div>
      <div className="welcome-banner__actions">
        <button type="button" className="btn btn--primary" onClick={onLoadSample}>
          ✨ Voir avec des exemples
        </button>
        <button type="button" className="btn" onClick={onDismiss}>
          Commencer à zéro
        </button>
      </div>
    </div>
  );
}
