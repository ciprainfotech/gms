  /**
   * A simple fetch wrapper for making API calls to the backend.
   * It automatically includes credentials (cookies) with every request.
   */
  const API_BASE_URL = 'http://localhost:5001/api'; // Your backend API URL

  const api = {
    /**
     * Performs a POST request.
     * @param {string} endpoint - The API endpoint (e.g., '/auth/login').
     * @param {object} body - The JSON body for the request.
     * @returns {Promise<Response>} The fetch Response object.
     */
    async post(endpoint, body) {
      return await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // IMPORTANT: This tells fetch to send cookies along with the request.
        credentials: 'include', 
        body: JSON.stringify(body),
      });
    },

    /**
     * Performs a GET request.
     * @param {string} endpoint - The API endpoint (e.g., '/auth/me').
     * @returns {Promise<Response>} The fetch Response object.
     */
    async get(endpoint) {
      return await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        // IMPORTANT: This also needs credentials to send the auth cookie.
        credentials: 'include',
      });
    },

    async put(endpoint, body) {
          return await fetch(`${API_BASE_URL}${endpoint}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(body),
          });
      },
    
    // You can add other methods like put, delete etc. here
     
     /**
   * Performs a DELETE request.
   * @param {string} endpoint - The API endpoint to target for deletion.
   * @returns {Promise<Response>} The fetch Response object.
   */
  async delete(endpoint) {
    return await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include', // Important for authentication
    });
  },
};
  

  export default api;