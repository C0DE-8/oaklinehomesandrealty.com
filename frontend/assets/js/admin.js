(function () {
  const apiBase = "http://localhost:5000/api";
  const tokenKey = "oakline_admin_token";

  const body = document.body;
  const status = document.getElementById("admin-status");
  const dashboardStatus = document.getElementById("dashboard-status");
  const dashboardTitle = document.getElementById("dashboard-title");
  const loginForm = document.getElementById("admin-login-form");
  const registerForm = document.getElementById("admin-register-form");
  const profileForm = document.getElementById("admin-profile-form");
  const passwordForm = document.getElementById("admin-password-form");
  const logoutButton = document.getElementById("admin-logout");
  const tabs = Array.from(document.querySelectorAll("[data-admin-tab]"));

  function setStatus(element, message, type) {
    element.textContent = message || "";
    element.classList.toggle("is-error", type === "error");
    element.classList.toggle("is-success", type === "success");
  }

  function getToken() {
    return localStorage.getItem(tokenKey);
  }

  function setToken(token) {
    localStorage.setItem(tokenKey, token);
  }

  function clearToken() {
    localStorage.removeItem(tokenKey);
  }

  function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  async function apiRequest(path, options) {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(options && options.headers ? options.headers : {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  function showDashboard(admin) {
    body.classList.add("is-authenticated");
    dashboardTitle.textContent = admin && admin.name ? `Welcome, ${admin.name}` : "Dashboard";
    profileForm.name.value = admin && admin.name ? admin.name : "";
    profileForm.phone.value = admin && admin.phone ? admin.phone : "";
    setStatus(dashboardStatus, admin && admin.email ? admin.email : "", "success");
  }

  function showAuth(message) {
    body.classList.remove("is-authenticated");
    if (message) {
      setStatus(status, message, "error");
    }
  }

  async function loadCurrentAdmin() {
    if (!getToken()) {
      return;
    }

    try {
      const data = await apiRequest("/auth/me");
      showDashboard(data.admin);
    } catch (error) {
      clearToken();
      showAuth("Please login again.");
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const mode = tab.dataset.adminTab;
      tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      loginForm.classList.toggle("is-hidden", mode !== "login");
      registerForm.classList.toggle("is-hidden", mode !== "register");
      setStatus(status, "", "");
    });
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(status, "Logging in...", "");

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(formData(loginForm)),
      });
      setToken(data.token);
      loginForm.reset();
      showDashboard(data.admin);
    } catch (error) {
      setStatus(status, error.message, "error");
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(status, "Creating admin...", "");

    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(formData(registerForm)),
      });
      setToken(data.token);
      registerForm.reset();
      showDashboard(data.admin);
    } catch (error) {
      setStatus(status, error.message, "error");
    }
  });

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(dashboardStatus, "Saving profile...", "");

    try {
      const data = await apiRequest("/admin/profile", {
        method: "PATCH",
        body: JSON.stringify(formData(profileForm)),
      });
      showDashboard(data.admin);
      setStatus(dashboardStatus, "Profile saved.", "success");
    } catch (error) {
      setStatus(dashboardStatus, error.message, "error");
    }
  });

  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(dashboardStatus, "Updating password...", "");

    try {
      const data = await apiRequest("/admin/profile/password", {
        method: "PATCH",
        body: JSON.stringify(formData(passwordForm)),
      });
      passwordForm.reset();
      setStatus(dashboardStatus, data.message, "success");
    } catch (error) {
      setStatus(dashboardStatus, error.message, "error");
    }
  });

  logoutButton.addEventListener("click", () => {
    clearToken();
    showAuth("");
    setStatus(status, "Logged out.", "success");
  });

  loadCurrentAdmin();
})();
