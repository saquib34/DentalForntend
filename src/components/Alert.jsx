import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const Alert = ({ variant = 'info', children, className = '' }) => {
  const variants = {
    error: {
      wrapper: 'bg-red-50 border-red-200',
      text: 'text-red-700',
      icon: AlertCircle
    },
    warning: {
      wrapper: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-700',
      icon: AlertTriangle
    },
    success: {
      wrapper: 'bg-green-50 border-green-200',
      text: 'text-green-700',
      icon: CheckCircle
    },
    info: {
      wrapper: 'bg-blue-50 border-blue-200',
      text: 'text-blue-700',
      icon: Info
    }
  };

  const { wrapper, text, icon: Icon } = variants[variant] || variants.info;

  return (
    <div className={`${wrapper} ${text} border rounded-lg p-4 ${className}`}>
      <div className="flex">
        <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Alert;