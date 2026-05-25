(function () {
  if (window.axios) {
    return;
  }

  function mergeHeaders(baseHeaders, requestHeaders) {
    return Object.assign({}, baseHeaders || {}, requestHeaders || {});
  }

  function buildUrl(baseURL, url) {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return `${String(baseURL || "").replace(/\/$/, "")}/${String(url || "").replace(/^\//, "")}`;
  }

  async function request(config) {
    const method = String(config.method || "GET").toUpperCase();
    const headers = mergeHeaders(config.headers, {});
    const fetchOptions = {
      method,
      headers,
    };

    if (method === "GET" || method === "HEAD") {
      delete headers["Content-Type"];
    } else if (config.data !== undefined && typeof FormData !== "undefined" && config.data instanceof FormData) {
      delete headers["Content-Type"];
      fetchOptions.body = config.data;
    } else if (config.data !== undefined) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
      fetchOptions.body = typeof config.data === "string" ? config.data : JSON.stringify(config.data);
    }

    const response = await fetch(buildUrl(config.baseURL, config.url), fetchOptions);
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : await response.text();
    const axiosResponse = {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config,
    };

    if (!response.ok) {
      const error = new Error(data && data.message ? data.message : response.statusText || "Request failed.");
      error.response = axiosResponse;
      error.config = config;
      throw error;
    }

    return axiosResponse;
  }

  function create(defaults) {
    const instance = function (config) {
      return request(Object.assign({}, defaults || {}, config || {}, {
        headers: mergeHeaders(defaults && defaults.headers, config && config.headers),
      }));
    };

    ["get", "delete"].forEach((method) => {
      instance[method] = function (url, config) {
        return instance(Object.assign({}, config || {}, { method, url }));
      };
    });

    ["post", "put", "patch"].forEach((method) => {
      instance[method] = function (url, data, config) {
        return instance(Object.assign({}, config || {}, { method, url, data }));
      };
    });

    instance.defaults = defaults || {};
    return instance;
  }

  window.axios = {
    create,
    request,
  };
})();
