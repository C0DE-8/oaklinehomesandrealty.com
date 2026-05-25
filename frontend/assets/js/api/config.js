(function () {
  const adminTokenKey = "oakline_admin_token";
  const userTokenKey = "oakline_user_token";
  const baseURL = "http://localhost:5000/api";

  const client = axios.create({
    baseURL,
  });

  function getToken() {
    return localStorage.getItem(adminTokenKey);
  }

  function setToken(token) {
    localStorage.setItem(adminTokenKey, token);
  }

  function clearToken() {
    localStorage.removeItem(adminTokenKey);
  }

  function getUserToken() {
    return localStorage.getItem(userTokenKey);
  }

  function setUserToken(token) {
    localStorage.setItem(userTokenKey, token);
  }

  function clearUserToken() {
    localStorage.removeItem(userTokenKey);
  }

  async function requestWithToken(method, url, data, token) {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (!(typeof FormData !== "undefined" && data instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      const response = await client({
        method,
        url,
        data,
        headers,
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

  async function request(method, url, data) {
    return requestWithToken(method, url, data, getToken());
  }

  window.OaklineApiConfig = {
    baseURL,
    getToken,
    setToken,
    clearToken,
    getUserToken,
    setUserToken,
    clearUserToken,
    request,
    requestWithToken,
  };
})();
