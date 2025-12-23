import axios from 'axios';
// We don't import Logger to call methods, we just rely on console.error
// or we can import Logger.internalError if we want to be explicit.
// Given the requirement "log error in every axios error automatically", 
// we will simply use console.error, which is now intercepted.

export const api = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com', // Example API
  timeout: 5000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMeta = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    };

    // By calling console.error, our Global Logger intercepts it and saves to IDB.
    console.error(`Axios Error: ${error.message}`, errorMeta);

    return Promise.reject(error);
  }
);
