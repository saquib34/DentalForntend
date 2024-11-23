import axios from 'axios';

// API Configuration
const API_CONFIG = {
  baseURL: 'https://dentalbackend-8hhh.onrender.com',
  timeout: 180000, // 3 minutes
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://dental.saquib.in'
  },
  withCredentials: false
};

// Retry configuration
const retryConfig = {
  maxRetries: 3,
  initialDelay: 30000, // 30 seconds
  maxDelay: 60000     // 1 minute
};

const axiosInstance = axios.create(API_CONFIG);

// Add request interceptor
axiosInstance.interceptors.request.use((config) => {
  // Ensure headers are properly set
  config.headers = {
    ...config.headers,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': typeof window !== 'undefined' ? window.location.origin : 'https://dental.saquib.in'
  };
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Enhanced response interceptor
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    console.error('API Error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      code: error.code,
      message: error.message
    });
    
    if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
      originalRequest._retry = true;
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(axiosInstance(originalRequest));
        }, 30000);
      });
    }

    return Promise.reject(error);
  }
);

// Enhanced retry function with exponential backoff
const retryWithExponentialBackoff = async (fn, retries = retryConfig.maxRetries) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const shouldRetry = i < retries - 1 && 
        (error?.response?.status === 503 || 
         error.code === 'ERR_NETWORK' || 
         error.code === 'ECONNABORTED');

      if (!shouldRetry) throw error;

      const delay = Math.min(
        retryConfig.initialDelay * Math.pow(2, i),
        retryConfig.maxDelay
      );

      console.log(`Attempt ${i + 1} failed, retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries reached');
};

export { axiosInstance, retryWithExponentialBackoff };