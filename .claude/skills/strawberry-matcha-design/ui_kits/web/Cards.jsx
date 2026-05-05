const Card = ({ className = '', children, ...rest }) => (
  <div className={`card ${className}`} {...rest}>{children}</div>
);
const CardHeader = ({ children }) => <div className="card-header">{children}</div>;
const CardTitle = ({ children }) => <div className="card-title">{children}</div>;
const CardContent = ({ children }) => <div className="card-content">{children}</div>;

const GlassFeatureCard = ({ icon, title, body, accent = 'matcha' }) => (
  <div className={`glass-card ${accent === 'strawberry' ? '' : 'alt'}`}>
    <Icon name={icon} className={accent === 'strawberry' ? '' : ''} size={48}/>
    <div className={`card-title ${accent === 'matcha' ? 'matcha-gradient' : 'strawberry-gradient'}`}>{title}</div>
    <p className="muted" style={{ margin: 0, fontSize: 14 }}>{body}</p>
  </div>
);

const ProfileCard = ({ name, age, bio, tags, photo, onLike, onPass }) => (
  <div className="profile-card">
    <div className="photo" style={{ backgroundImage: `url(${photo})` }}/>
    <div className="actions">
      <button className="btn btn-circle no" aria-label="Pass" onClick={onPass}>
        <Icon name="x" size={22}/>
      </button>
      <button className="btn btn-circle yes" aria-label="Like" onClick={onLike}>
        <Icon name="heart" size={22}/>
      </button>
    </div>
    <div className="body">
      <div className="name">{name}{age != null ? `, ${age}` : ''}</div>
      <div className="bio">{bio}</div>
      <div className="tags">
        {tags.map((t) => <span key={t} className="tag">#{t}</span>)}
      </div>
    </div>
  </div>
);

Object.assign(window, { Card, CardHeader, CardTitle, CardContent, GlassFeatureCard, ProfileCard });
