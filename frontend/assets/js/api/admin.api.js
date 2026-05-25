(function () {
  const api = window.OaklineApiConfig;

  window.OaklineAdminApi = {
    login(payload) {
      return api.request("POST", "/auth/login", payload);
    },

    loginFromUserSession() {
      return api.requestWithToken("POST", "/auth/from-user-session", null, api.getUserToken());
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

    listingStats() {
      return api.request("GET", "/admin/listings/stats/summary");
    },

    listListings(params) {
      const query = params ? `?${new URLSearchParams(params).toString()}` : "";
      return api.request("GET", `/admin/listings${query}`);
    },

    createListing(payload) {
      return api.request("POST", "/admin/listings", payload);
    },

    updateListing(id, payload) {
      return api.request("PATCH", `/admin/listings/${id}`, payload);
    },

    deleteListing(id) {
      return api.request("DELETE", `/admin/listings/${id}`);
    },

    deleteListingImage(listingId, imageId) {
      return api.request("DELETE", `/admin/listings/${listingId}/images/${imageId}`);
    },

    listAgents() {
      return api.request("GET", "/admin/agents");
    },

    createAgent(payload) {
      return api.request("POST", "/admin/agents", payload);
    },

    updateAgent(id, payload) {
      return api.request("PATCH", `/admin/agents/${id}`, payload);
    },

    deleteAgent(id) {
      return api.request("DELETE", `/admin/agents/${id}`);
    },

    getToken: api.getToken,
    setToken: api.setToken,
    clearToken: api.clearToken,
    getUserToken: api.getUserToken,
    baseURL: api.baseURL,
  };
})();
