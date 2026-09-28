import Axios, { isAxiosError } from "axios";


const axios = Axios.create({
  baseURL: `${import.meta.env.VITE_DEVE_URL}/`,
});

axios.interceptors.response.use(
  (response) => {
    console.log("Response:", response);
    return response;
  },
  (error) => {
    if (isAxiosError(error)) {
      // Axios-specific error handling
      console.error("Axios error:", error.message);
    } else {
      // Non-Axios error
      console.error("Unknown error:", error);
    }
    return Promise.reject(error);
  }
);

export default axios;