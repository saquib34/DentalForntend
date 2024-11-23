import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const LoadingOverlay = ({ progress }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50"
    >
      <div className="text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-blue-500" />
        </motion.div>
        <h3 className="text-lg font-medium text-gray-900">Processing Image</h3>
        <div className="w-64">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">{progress}% Complete</p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingOverlay;