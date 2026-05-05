const App = () => {
  const [route, setRoute] = React.useState('home');
  const [authed, setAuthed] = React.useState(false);
  const nav = (r) => {
    if (r === 'home') setAuthed(false);
    if (r === 'browse' || r === 'chat' || r === 'profile') setAuthed(true);
    setRoute(r);
  };
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  let view;
  if (route === 'home')          view = <Hero onStart={() => nav('register')}/>;
  else if (route === 'login')    view = <LoginForm onSubmit={() => nav('browse')} onNav={nav}/>;
  else if (route === 'register') view = <RegisterForm onSubmit={() => nav('onboarding')} onNav={nav}/>;
  else if (route === 'onboarding') view = (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Card style={{ width: 460 }}>
        <CardHeader><CardTitle>Welcome — let&apos;s set up your profile</CardTitle></CardHeader>
        <CardContent>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>A few quick questions and you&apos;re ready to brew some sweet connections.</p>
          <FormInputRow icon="user" name="display" placeholder="What should people call you?"/>
          <FormInputRow icon="map-pin" name="city" placeholder="City"/>
          <Button variant="gradient" style={{ width: '100%' }} onClick={() => nav('browse')}>Start matching</Button>
        </CardContent>
      </Card>
    </div>
  );
  else if (route === 'browse')  view = <Browse onMatch={() => nav('chat')}/>;
  else if (route === 'chat')    view = <ChatScreen/>;
  else if (route === 'profile') view = <ProfileEdit/>;

  return (
    <div className="app-shell strawberry-matcha-bg">
      <NavigationBar isAuthenticated={authed} onNav={nav} current={route}/>
      <main>{view}</main>
      <Footer/>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
