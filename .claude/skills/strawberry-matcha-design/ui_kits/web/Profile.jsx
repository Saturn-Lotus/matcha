const ALL_TAGS = ['vegan','hiking','tea','coffee','vinyl','baking','design','books','cats','dogs','running','film-photo','cycling','yoga'];

const ProfileEdit = () => {
  const [tags, setTags] = React.useState(new Set(['vegan','hiking','film-photo']));
  const toggle = (t) => setTags((s) => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n; });
  const photos = [
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80',
    'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=300&q=80',
    'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=300&q=80',
    null, null,
  ];
  return (
    <div className="edit-shell">
      <div className="edit-header">
        <h1 className="strawberry-matcha-gradient" style={{ fontSize: 28, margin: 0 }}>
          <svg className="heart" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          Edit Profile
        </h1>
        <p className="muted" style={{ margin: 0 }}>Keep your profile up to date to find better matches</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Pictures</CardTitle></CardHeader>
        <CardContent>
          <div className="photo-grid">
            {photos.map((p, i) => p
              ? <div key={i} className={`photo-tile ${i === 0 ? 'primary' : ''}`} style={{ backgroundImage: `url(${p})` }}/>
              : <div key={i} className="photo-tile empty"><Icon name="camera" size={20}/></div>
            )}
          </div>
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>Up to 5 photos. Tap one to set it as your profile picture.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent>
          <FormInputRow icon="user" name="firstName" placeholder="First Name" defaultValue="You"/>
          <FormInputRow icon="mail" name="email" placeholder="Email" defaultValue="you@matcha.app"/>
          <div className="field">
            <div className="input-row" style={{ height: 'auto', padding: 8, alignItems: 'flex-start' }}>
              <Icon name="edit-3"/>
              <textarea placeholder="A short bio…" defaultValue="Matcha-leaning, strawberry-curious. Love a long walk and a longer dinner." style={{ flex: 1, border: 0, outline: 0, resize: 'vertical', minHeight: 80, fontFamily: 'inherit', fontSize: 14, color: 'var(--sm-gray-700)' }}/>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Interests</CardTitle></CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ALL_TAGS.map((t, idx) => (
              <button key={t} className={`tag ${idx % 3 === 0 ? 'matcha' : ''} ${tags.has(t) ? 'selected' : ''}`} onClick={() => toggle(t)}>#{t}</button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Button variant="gradient" size="lg" style={{ alignSelf: 'center' }}>Save changes</Button>
    </div>
  );
};

Object.assign(window, { ProfileEdit });
