const Progress = ({ value, variant = 'primary' }) => {
    const variants = {
      primary: 'bg-blue-600',
      secondary: 'bg-gray-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600'
    };
  
    const barColor = variants[variant] || variants.primary;
  
    return (
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`${barColor} h-full rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
    );
  };
  
  export default Progress;