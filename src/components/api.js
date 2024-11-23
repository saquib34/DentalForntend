import axios from 'axios';

// API Configuration
const API_CONFIG = {
  baseURL: 'https://dentalbackend-8hhh.onrender.com',
  timeout: 180000, // 3 minutes
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
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
  // Remove manual Origin header setting as it's automatically handled by the browser
  config.headers = {
    ...config.headers,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Enhanced response interceptor with better error handling
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Log error details for debugging
    console.error('API Error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      code: error.code,
      message: error.message
    });
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
      originalRequest._retry = true;
      // Wait 30 seconds before retrying
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(axiosInstance(originalRequest));
        }, 30000);
      });
    }

    // Handle specific error cases
    if (error.response?.status === 503) {
      // Server is starting up
      return Promise.reject({
        ...error,
        customMessage: 'Server is starting up. Please wait a moment.'
      });
    }

    if (error.code === 'ERR_NETWORK') {
      return Promise.reject({
        ...error,
        customMessage: 'Network error. Please check your connection.'
      });
    }

    return Promise.reject(error);
  }
);

// Enhanced retry function with exponential backoff
const retryWithExponentialBackoff = async (fn, retries = retryConfig.maxRetries) => {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      const shouldRetry = i < retries - 1 && (
        error?.response?.status === 503 || 
        error.code === 'ERR_NETWORK' || 
        error.code === 'ECONNABORTED'
      );

      if (!shouldRetry) throw error;

      const delay = Math.min(
        retryConfig.initialDelay * Math.pow(2, i),
        retryConfig.maxDelay
      );

      console.log(`Attempt ${i + 1} failed, retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw {
    ...lastError,
    message: 'Max retries reached',
    customMessage: 'Server is not responding after multiple attempts. Please try again later.'
  };
};

export { axiosInstance, retryWithExponentialBackoff };