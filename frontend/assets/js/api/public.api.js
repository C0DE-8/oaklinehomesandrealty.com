(function () {
  const api = window.OaklineApiConfig;

  window.OaklinePublicApi = {
    listListings(params) {
      const query = params ? `?${new URLSearchParams(params).toString()}` : "";
      return api.requestWithToken("GET", `/listings${query}`, undefined, null);
    },

    getListing(slug) {
      return api.requestWithToken("GET", `/listings/${encodeURIComponent(slug)}`, undefined, null);
    },

    listAgents() {
      return api.requestWithToken("GET", "/agents", undefined, null);
    },

    getAgent(id) {
      return api.requestWithToken("GET", `/agents/${encodeURIComponent(id)}`, undefined, null);
    },

    createLead(data) {
      return api.requestWithToken("POST", "/leads", data, null);
    },

    apiBaseURL: api.baseURL,
  };
})();
