import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur non gérée :', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__card">
            <h1 className="error-boundary__title">😕 Une erreur est survenue</h1>
            <p className="error-boundary__text">
              Désolé, quelque chose s'est mal passé dans l'application. Vos données restent en
              sécurité sur cet appareil — rien n'a été perdu.
            </p>
            <button type="button" className="btn btn--primary" onClick={this.handleReload}>
              🔄 Recharger la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
