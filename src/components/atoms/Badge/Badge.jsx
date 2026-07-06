const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center px-1.5 py-0.5 rounded-full text-2xs font-medium';

  const variants = {
    default: 'bg-gray-200 text-gray-800',
    primary: 'bg-red-100 text-red-800',
    secondary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    expert: 'bg-purple-100 text-purple-800',
    intermediate: 'bg-blue-100 text-blue-800',
    tier1: 'bg-amber-100 text-amber-900 border border-amber-300',
    tier2: 'bg-slate-100 text-slate-800 border border-slate-300',
    tier3: 'bg-orange-100 text-orange-900 border border-orange-300',
  };

  const classes = `${baseStyles} ${variants[variant]} ${className}`;

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export default Badge;


