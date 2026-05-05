const Hero = ({ onStart }) => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
    <div className="text-center" style={{ maxWidth: 880 }}>
      <h2 className="strawberry-matcha-gradient" style={{ fontSize: 'clamp(40px, 6vw, 60px)', fontWeight: 700, margin: '24px 0 16px', lineHeight: 1.05 }}>
        Sweet Connections, Fresh Starts
      </h2>
      <p className="muted" style={{ fontSize: 18, maxWidth: 560, margin: '0 auto 40px' }}>
        Like the perfect blend of strawberry and matcha, find your perfect match. Sweet, refreshing, and uniquely yours.
      </p>
      <Button variant="gradient" size="lg" onClick={onStart}>Start Your Journey</Button>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 64 }}>
        <GlassFeatureCard accent="matcha"     icon="users"          title="Sweet Matching"      body="Like finding the perfect matcha blend, we match you with compatible souls"/>
        <GlassFeatureCard accent="strawberry" icon="message-square" title="Fresh Conversations" body="Start sweet conversations that bloom into meaningful connections"/>
        <GlassFeatureCard accent="matcha"     icon="heart"          title="Authentic Love"      body="Build genuine relationships with verified, authentic profiles"/>
      </div>
    </div>
  </div>
);

Object.assign(window, { Hero });
