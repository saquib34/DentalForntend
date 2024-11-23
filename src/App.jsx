import { motion } from 'framer-motion';
import DentalClassifier from './components/DentalClassifier';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Dental Condition Classifier
        </h1>
        <p className="text-gray-600">
          Upload a dental image for AI-powered analysis
        </p>
      </motion.div>
      <DentalClassifier />
    </div>
  );
}

export default App;