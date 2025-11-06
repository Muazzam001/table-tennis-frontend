const Card = ({ children, className = '', variant = 'default', ...props }) => {
  const baseStyles = 'rounded-xl shadow-sm border border-gray-200 bg-white';
  
  const variants = {
    default: '',
    elevated: 'shadow-lg',
    outlined: 'border-2 border-gray-300',
  };
  
  const classes = `${baseStyles} ${variants[variant]} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;

