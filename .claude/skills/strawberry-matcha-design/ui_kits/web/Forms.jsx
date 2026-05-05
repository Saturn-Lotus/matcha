// FormInputRow — icon + input + inline error (mirrors codebase form-input-row.tsx)
const FormInputRow = ({ icon, name, type = 'text', placeholder, validate, error, defaultValue }) => {
  const [err, setErr] = React.useState(null);
  const onBlur = (e) => {
    const v = e.target.value;
    if (!validate) return;
    setErr(validate(v) ? null : (error || 'Invalid'));
  };
  return (
    <div className="field">
      <div className={`input-row ${err ? 'error' : ''}`}>
        <Icon name={icon}/>
        <input name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} onBlur={onBlur}/>
      </div>
      <div style={{ height: 14 }}>{err && <p className="field-error">{err}</p>}</div>
    </div>
  );
};

const Alert = ({ children }) => (
  <div className="alert alert-error">
    <Icon name="alert-circle"/><span>{children}</span>
  </div>
);

const LoginForm = ({ onSubmit, onNav }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const submit = (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTimeout(() => { setLoading(false); onSubmit && onSubmit(); }, 600);
  };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 32 }}>
      <div className="text-center" style={{ marginBottom: 24 }}>
        <h1 className="strawberry-matcha-gradient" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 26, margin: 0 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#f472b6" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          Strawberry Matcha
        </h1>
        <p className="muted">Welcome back! Let&apos;s brew some sweet connections.</p>
      </div>
      <Card style={{ width: 400, maxWidth: '100%', alignSelf: 'center' }}>
        <CardHeader><CardTitle>Sign In</CardTitle></CardHeader>
        <form onSubmit={submit}>
          <CardContent>
            {error && <Alert>{error}</Alert>}
            <FormInputRow icon="user" name="username" placeholder="Username"/>
            <FormInputRow icon="lock" name="password" type="password" placeholder="Password"/>
            <Button variant="gradient" type="submit" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
              {loading ? <><Icon name="loader-2" className="spin"/>Signing in...</> : 'Sign In'}
            </Button>
            <a className="link-alt" style={{ textAlign: 'center', fontSize: 13 }} onClick={() => onNav('reset-password')}>Forgot your password?</a>
          </CardContent>
          <hr className="separator"/>
          <div className="text-center muted" style={{ fontSize: 13 }}>
            Don&apos;t have an account? <a className="link" onClick={() => onNav('register')}>Sign up here</a>
          </div>
        </form>
      </Card>
    </div>
  );
};

const RegisterForm = ({ onSubmit, onNav }) => {
  const [loading, setLoading] = React.useState(false);
  const submit = (e) => { e.preventDefault(); setLoading(true); setTimeout(() => { setLoading(false); onSubmit && onSubmit(); }, 600); };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 32 }}>
      <div className="text-center" style={{ marginBottom: 16 }}>
        <h1 className="strawberry-matcha-gradient" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 26, margin: 0 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#f472b6" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          Strawberry Matcha
        </h1>
        <p className="muted">Join thousands finding love every day!</p>
      </div>
      <Card style={{ width: 400, maxWidth: '100%', alignSelf: 'center' }}>
        <CardHeader><CardTitle>Sign Up</CardTitle></CardHeader>
        <form onSubmit={submit}>
          <CardContent>
            <FormInputRow icon="user" name="firstName" placeholder="First Name"/>
            <FormInputRow icon="user" name="lastName" placeholder="Last Name"/>
            <FormInputRow icon="user" name="username" placeholder="Username"/>
            <FormInputRow icon="mail" name="email" type="email" placeholder="Email"/>
            <FormInputRow icon="lock" name="password" type="password" placeholder="Password"/>
            <FormInputRow icon="lock" name="confirmedPassword" type="password" placeholder="Confirm Password"/>
            <Button variant="gradient" type="submit" disabled={loading} style={{ width: '100%', height: 40, marginTop: 4 }}>
              {loading ? <><Icon name="loader-2" className="spin"/>Creating account...</> : 'Sign Up'}
            </Button>
          </CardContent>
          <div className="text-center muted" style={{ fontSize: 13, paddingTop: 16, borderTop: '1px solid var(--sm-gray-200)', marginTop: 8 }}>
            Already have an account? <a className="link" onClick={() => onNav('login')}>Sign in here</a>
          </div>
        </form>
      </Card>
    </div>
  );
};

Object.assign(window, { FormInputRow, Alert, LoginForm, RegisterForm });
