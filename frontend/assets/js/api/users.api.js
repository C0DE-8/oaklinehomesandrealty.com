(function () {
  const api = window.OaklineApiConfig;

  window.OaklineUsersApi = {
    register(payload) {
      return api.requestWithToken("POST", "/users/register", payload, api.getUserToken()).then((data) => {
        if (data.token) {
          api.setUserToken(data.token);
        }

        return data;
      });
    },

    login(payload) {
      return api.requestWithToken("POST", "/users/login", payload, api.getUserToken()).then((data) => {
        if (data.token) {
          api.setUserToken(data.token);
        }

        return data;
      });
    },

    me() {
      return api.requestWithToken("GET", "/users/me", null, api.getUserToken());
    },

    getToken: api.getUserToken,
    setToken: api.setUserToken,
    clearToken: api.clearUserToken,
  };
})();
