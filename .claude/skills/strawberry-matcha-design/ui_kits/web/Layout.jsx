// Brand wordmark + nav + footer
const Wordmark = ({ size = 22 }) => (
  <span className="nav-brand">
    <svg className="heart" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
    <span className="word strawberry-matcha-gradient" style={{ fontSize: size }}>Strawberry Matcha</span>
  </span>
);

const NavigationBar = ({ isAuthenticated, onNav, current }) => {
  // No header on auth/onboarding routes (mirrors codebase)
  const NO_HEADER = ['login', 'register', 'reset-password', 'onboarding'];
  if (NO_HEADER.includes(current)) return null;
  return (
    <header className="nav">
      <a className="nav-brand" href="#" onClick={(e) => { e.preventDefault(); onNav('home'); }}>
        <svg className="heart" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
        <span className="word strawberry-matcha-gradient">Strawberry Matcha</span>
      </a>
      {isAuthenticated ? (
        <div className="nav-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => onNav('browse')}>Browse</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav('chat')}>Messages</button>
          <button className="nav-avatar" onClick={() => onNav('profile')} aria-label="Profile">
            <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=you" alt=""/>
          </button>
        </div>
      ) : (
        <div className="nav-actions">
          <button className="btn btn-ghost" onClick={() => onNav('login')}>Login</button>
          <button className="btn strawberry-matcha-btn" onClick={() => onNav('register')}>Sign Up</button>
        </div>
      )}
    </header>
  );
};

const Footer = () => (
  <footer className="footer">
    <p>© 2025 Strawberry Matcha. Made with 🍓 and 🍵 for finding love.</p>
  </footer>
);

Object.assign(window, { Wordmark, NavigationBar, Footer });
