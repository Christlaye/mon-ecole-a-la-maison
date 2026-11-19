import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import '@fontsource/andika/latin-700.css';
import '@fontsource/andika/latin-ext-700.css';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });
class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidUpdate(_, prev) { if (prev.err && this.state.err) window.addEventListener('hashchange', () => this.setState({ err: null }), { once: true }); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <main style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>🙈</div>
        <p style={{ fontSize: 22, fontWeight: 800 }}>Oups ! Petit souci.</p>
        <a href="#/" onClick={() => this.setState({ err: null })} style={{ display: 'inline-block', marginTop: 16, padding: '14px 24px', background: '#0E7C66', color: '#fff', borderRadius: 16, fontWeight: 800 }}>🏠 Retour à l’accueil</a>
      </main>
    );
  }
}

createRoot(document.getElementById('root')).render(<Boundary><App /></Boundary>);
