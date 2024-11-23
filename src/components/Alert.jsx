import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const Alert = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
  };

  const icons = {
    info: <AlertCircle className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />
  };

  return (
    <div className={`flex items-center p-4 rounded-lg border ${variants[variant]} ${className}`}>
      <span className="mr-2">{icons[variant]}</span>
      {children}
    </div>
  );
};

export default Alert;