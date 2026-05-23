(function () {
  const tokenKey = "oakline_admin_token";
  const baseURL = window.OAKLINE_API_BASE_URL || "http://localhost:5000/api";

  const client = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  function getToken() {
    return localStorage.getItem(tokenKey);
  }

  function setToken(token) {
    localStorage.setItem(tokenKey, token);
  }

  function clearToken() {
    localStorage.removeItem(tokenKey);
  }

  async function request(method, url, data) {
    try {
      const token = getToken();
      const response = await client({
        method,
        url,
        data,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      return response.data;
    } catch (error) {
      const message =
        error &&
        error.response &&
        error.response.data &&
        error.response.data.message
          ? error.response.data.message
          : error.message || "Request failed.";

      throw new Error(message);
    }
  }

  window.OaklineApiConfig = {
    baseURL,
    getToken,
    setToken,
    clearToken,
    request,
  };
})();
