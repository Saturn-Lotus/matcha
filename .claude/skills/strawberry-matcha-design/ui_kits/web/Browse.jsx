const SAMPLE_PROFILES = [
  { name: 'Aria', age: 26, bio: 'Matcha latte loyalist, weekend hiker, looking for someone to share strawberry season with.', tags: ['vegan','hiking','film-photo'], photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80' },
  { name: 'Yui', age: 28, bio: 'Tea ceremony curious, vinyl collector, makes the best mochi in the city.', tags: ['tea','vinyl','baking'], photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80' },
  { name: 'Leo', age: 30, bio: 'Trail runner who plans dates around bakeries. Strawberry tart > most things.', tags: ['running','bakery','dogs'], photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80' },
  { name: 'Mei', age: 25, bio: 'Architecture student. I will redesign your bookshelf for fun.', tags: ['design','books','cats'], photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80' },
];

const Browse = ({ onMatch }) => {
  const [i, setI] = React.useState(0);
  const next = () => setI((x) => (x + 1) % SAMPLE_PROFILES.length);
  const onLike = () => { onMatch && onMatch(SAMPLE_PROFILES[i]); next(); };
  const p = SAMPLE_PROFILES[i];
  return (
    <div style={{ flex: 1, display: 'flex' }}>
      <aside style={{ width: 240, background: '#fff', borderRight: '1px solid var(--sm-gray-200)', padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--sm-gray-500)' }}>Filters</div>
        <div className="field"><div className="input-row"><Icon name="map-pin"/><input placeholder="Within 25 km"/></div></div>
        <div className="field"><div className="input-row"><Icon name="users"/><input placeholder="Ages 22 – 32"/></div></div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--sm-gray-500)', marginTop: 8 }}>Interests</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['vegan','hiking','tea','vinyl','design','cats','dogs','baking'].map((t,idx) =>
            <span key={t} className={`tag ${idx % 3 === 0 ? 'matcha' : ''} ${idx === 0 ? 'selected' : ''}`}>#{t}</span>)}
        </div>
        <div style={{ marginTop: 'auto', fontSize: 12, color: 'var(--sm-gray-500)' }}>Fame rating · 142</div>
      </aside>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sm-strawberry-50)' }}>
        <ProfileCard {...p} onLike={onLike} onPass={next}/>
      </div>
    </div>
  );
};

Object.assign(window, { Browse, SAMPLE_PROFILES });
