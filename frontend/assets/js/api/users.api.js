(function () {
  const api = window.OaklineApiConfig;

  window.OaklineUsersApi = {
    register(payload) {
      return api.request("POST", "/users/register", payload);
    },

    login(payload) {
      return api.request("POST", "/users/login", payload);
    },

    me() {
      return api.request("GET", "/users/me");
    },
  };
})();
