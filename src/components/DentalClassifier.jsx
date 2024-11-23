import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Activity, AlertCircle, Loader2, Camera, RefreshCcw } from 'lucide-react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import Progress from './Progress';
import Alert from './Alert';

// API Configuration
const API_CONFIG = {
  baseURL: 'https://dentalbackend-8hhh.onrender.com',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
};

const axiosInstance = axios.create(API_CONFIG);

// Add interceptor to handle CORS preflight
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ERR_NETWORK') {
      console.error('CORS or Network Error:', error);
      return Promise.reject(new Error('Network error. Please try again later.'));
    }
    return Promise.reject(error);
  }
);

const DentalClassifier = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [serverStarting, setServerStarting] = useState(false);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const validateImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(img.src);

        // Check dimensions
        if (img.width < 100 || img.height < 100) {
          reject('Image dimensions too small. Minimum 100x100 pixels required.');
          return;
        }
        if (img.width > 4096 || img.height > 4096) {
          reject('Image dimensions too large. Maximum 4096x4096 pixels allowed.');
          return;
        }

        // Check file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          reject('Image size should be less than 5MB');
          return;
        }

        resolve(true);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject('Invalid image file');
      };
    });
  };

  const retryWithDelay = async (fn, retries = 5, delay = 10000) => {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      if (error?.response?.status === 503) {
        setServerStarting(true);
        await sleep(delay);
        return retryWithDelay(fn, retries - 1, delay);
      }
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      try {
        await validateImage(file);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        const newPreviewUrl = URL.createObjectURL(file);
        setSelectedImage(file);
        setPreviewUrl(newPreviewUrl);
        setError('');
        setResults(null);
        setProgress(0);
      } catch (err) {
        setError(err);
      }
    }
  }, [previewUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: false
  });

  const classifyImage = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError('');
    setProgress(0);
    setServerStarting(false);

    try {
      const reader = new FileReader();
      await new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            // Start progress animation
            const progressInterval = setInterval(() => {
              setProgress(prev => Math.min(prev + 2, 90));
            }, 1000);

            // Make API call with retries
            const response = await retryWithDelay(async () => {
              return await axiosInstance.post('/api/classify', {
                image: reader.result
              });
            });

            clearInterval(progressInterval);
            setProgress(100);
            setResults(response.data.predictions);
          } catch (err) {
            clearInterval(progressInterval);
            if (err?.response?.status === 503) {
              setError('Server is starting up. Please wait a moment and try again.');
            } else if (err?.response?.status === 413) {
              setError('Image size is too large. Please use a smaller image.');
            } else if (err?.code === 'ECONNABORTED') {
              setError('Request timed out. Please try again.');
            } else if (err?.code === 'ERR_NETWORK') {
              setError('Network error. Please check your connection and try again.');
            } else {
              setError('Failed to classify image. Please try again.');
              console.error('Error:', err);
            }
          } finally {
            setLoading(false);
            setServerStarting(false);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });
    } catch (err) {
      setError('Failed to process image');
      setLoading(false);
      setServerStarting(false);
    }
  };

  const resetClassifier = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl('');
    setResults(null);
    setError('');
    setProgress(0);
  }, [previewUrl]);

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          {/* Upload Section */}
          <div className="space-y-6">
            <motion.div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <input {...getInputProps()} />
              <div className="text-center">
                <Upload className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700">
                  {isDragActive ? 'Drop image here' : 'Upload Dental Image'}
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  Drag & drop or click to browse
                </p>
              </div>
            </motion.div>

            {previewUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="relative rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover"
                  />
                </div>

                <button
                  onClick={classifyImage}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg 
                           disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>
                        {serverStarting ? 'Starting server...' : 'Analyzing...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5" />
                      <span>Analyze Image</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {error && (
              <Alert variant="error" className="animate-fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
                {error.includes('Server is starting up') && (
                  <p className="text-sm mt-2 text-gray-600">
                    This might take up to 50 seconds as we're using a free server that needs to wake up.
                  </p>
                )}
              </Alert>
            )}
          </div>

          {/* Results Section */}
          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              {!results && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex items-center justify-center text-gray-500"
                >
                  <div className="text-center">
                    <Camera className="w-16 h-16 mx-auto mb-4" />
                    <p>Upload an image to see analysis results</p>
                  </div>
                </motion.div>
              )}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex items-center justify-center"
                >
                  <div className="text-center space-y-4">
                    <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin" />
                    <p className="text-gray-600">
                      {serverStarting ? 'Starting server...' : 'Analyzing dental image...'}
                    </p>
                    {serverStarting && (
                      <p className="text-sm text-gray-500">
                        This might take up to 50 seconds
                      </p>
                    )}
                    <div className="w-64 mx-auto">
                      <Progress value={progress} />
                      <p className="text-sm text-gray-500 mt-2">{progress}%</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {results && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Analysis Results
                    </h3>
                    <button
                      onClick={resetClassifier}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <RefreshCcw className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <motion.div
                        key={result.class}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-800">
                            {result.class}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-white text-sm
                            ${result.confidence >= 0.9 ? 'bg-green-500' : 
                              result.confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          >
                            {(result.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={result.confidence * 100} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DentalClassifier;