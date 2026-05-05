const SAMPLE_CONVS = [
  { id: 'a', name: 'Aria', last: 'matcha at 11 sounds perfect', time: '2m', unread: 2, photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', online: true,
    messages: [
      { who: 'them', text: 'hey! glad we matched 🍓' },
      { who: 'me', text: 'haha hi! I see you also love matcha' },
      { who: 'them', text: 'always. tea spot in the park on saturday?' },
      { who: 'me', text: 'yes please. 11?' },
      { who: 'them', text: 'matcha at 11 sounds perfect' },
    ]},
  { id: 'b', name: 'Yui', last: 'making mochi this weekend!', time: '1h', unread: 0, photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80', online: false,
    messages: [
      { who: 'them', text: 'okay your record collection?? unreal' },
      { who: 'me', text: 'come over, we can spin the new pressing' },
      { who: 'them', text: 'making mochi this weekend!' },
    ]},
  { id: 'c', name: 'Leo',  last: 'trail or bakery first?', time: 'yesterday', unread: 0, photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', online: false,
    messages: [
      { who: 'me', text: 'date plan?' },
      { who: 'them', text: 'trail or bakery first?' },
    ]},
];

const ConversationList = ({ activeId, onPick }) => (
  <div className="conv-list">
    <div className="conv-header">Messages</div>
    {SAMPLE_CONVS.map((c) => (
      <div key={c.id} className={`conv-row ${c.id === activeId ? 'active' : ''}`} onClick={() => onPick(c.id)}>
        <div className="av" style={{ backgroundImage: `url(${c.photo})` }}/>
        <div className="meta">
          <div className="name"><span>{c.name}</span><span className="time">{c.time}</span></div>
          <div className="preview">{c.last}</div>
        </div>
        {c.unread > 0 && <span className="badge unread">{c.unread}</span>}
      </div>
    ))}
  </div>
);

const ChatThread = ({ conv }) => {
  const [msgs, setMsgs] = React.useState(conv.messages);
  const [draft, setDraft] = React.useState('');
  const bodyRef = React.useRef(null);
  React.useEffect(() => { setMsgs(conv.messages); }, [conv.id]);
  React.useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs]);
  const send = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setMsgs((m) => [...m, { who: 'me', text: draft.trim() }]);
    setDraft('');
  };
  return (
    <div className="thread">
      <div className="thread-header">
        <div className="av" style={{ backgroundImage: `url(${conv.photo})` }}/>
        <div>
          <div className="name">{conv.name}</div>
          {conv.online && <div className="status">online now</div>}
        </div>
      </div>
      <div className="thread-body" ref={bodyRef}>
        {msgs.map((m, i) => <div key={i} className={`bubble ${m.who}`}>{m.text}</div>)}
      </div>
      <form className="thread-composer" onSubmit={send}>
        <div className="input-row">
          <Icon name="message-square"/>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Say something sweet..."/>
        </div>
        <Button variant="gradient" type="submit"><Icon name="send"/></Button>
      </form>
    </div>
  );
};

const ChatScreen = () => {
  const [active, setActive] = React.useState(SAMPLE_CONVS[0].id);
  const conv = SAMPLE_CONVS.find((c) => c.id === active);
  return (
    <div className="chat-shell">
      <ConversationList activeId={active} onPick={setActive}/>
      <ChatThread conv={conv}/>
    </div>
  );
};

Object.assign(window, { ConversationList, ChatThread, ChatScreen, SAMPLE_CONVS });
