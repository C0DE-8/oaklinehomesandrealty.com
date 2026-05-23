(function () {
  const api = window.OaklineApiConfig;

  window.OaklineAdminApi = {
    login(payload) {
      return api.request("POST", "/auth/login", payload);
    },

    register(payload) {
      return api.request("POST", "/auth/register", payload);
    },

    me() {
      return api.request("GET", "/auth/me");
    },

    updateProfile(payload) {
      return api.request("PATCH", "/admin/profile", payload);
    },

    updatePassword(payload) {
      return api.request("PATCH", "/admin/profile/password", payload);
    },

    getToken: api.getToken,
    setToken: api.setToken,
    clearToken: api.clearToken,
  };
})();
