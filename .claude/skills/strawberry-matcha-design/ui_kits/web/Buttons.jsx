// Button — mirrors shadcn cva variants used in the matcha codebase
const Button = ({ variant = 'primary', size = 'default', className = '', children, ...props }) => {
  const v = {
    primary: 'btn-primary',
    gradient: 'strawberry-matcha-btn',
    strawberry: 'strawberry-btn',
    matcha: 'matcha-btn',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    destructive: 'btn-destructive',
    secondary: 'btn-secondary',
  }[variant] || '';
  const s = { default: '', sm: 'btn-sm', lg: 'btn-lg', icon: 'btn-icon' }[size] || '';
  return (
    <button className={`btn ${v} ${s} ${className}`.trim()} {...props}>{children}</button>
  );
};

// Lucide icon helper — uses CDN-loaded global lucide
const Icon = ({ name, className = '', size = 16, fill = 'none', ...rest }) => {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (window.lucide && ref.current) window.lucide.createIcons({ nameAttr: 'data-lucide' });
  });
  return <i ref={ref} data-lucide={name} className={`icon ${className}`} style={{ width: size, height: size }} {...rest}/>;
};

Object.assign(window, { Button, Icon });
