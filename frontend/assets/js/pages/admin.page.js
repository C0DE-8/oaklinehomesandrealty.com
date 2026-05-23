(function () {
  const body = document.body;
  const status = document.getElementById("admin-status");
  const dashboardStatus = document.getElementById("dashboard-status");
  const dashboardTitle = document.getElementById("dashboard-title");
  const loginForm = document.getElementById("admin-login-form");
  const registerForm = document.getElementById("admin-register-form");
  const profileForm = document.getElementById("admin-profile-form");
  const passwordForm = document.getElementById("admin-password-form");
  const logoutButton = document.getElementById("admin-logout");
  const profileName = document.getElementById("profile-name");
  const profilePhone = document.getElementById("profile-phone");
  const tabs = Array.from(document.querySelectorAll("[data-admin-tab]"));

  function setStatus(element, message, type) {
    element.textContent = message || "";
    element.classList.toggle("is-error", type === "error");
    element.classList.toggle("is-success", type === "success");
  }

  function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function showDashboard(admin) {
    body.classList.add("is-authenticated");
    dashboardTitle.textContent = admin && admin.name ? `Welcome, ${admin.name}` : "Dashboard";
    profileName.value = admin && admin.name ? admin.name : "";
    profilePhone.value = admin && admin.phone ? admin.phone : "";
    setStatus(dashboardStatus, admin && admin.email ? admin.email : "", "success");
  }

  function showAuth(message) {
    body.classList.remove("is-authenticated");
    if (message) {
      setStatus(status, message, "error");
    }
  }

  async function loadCurrentAdmin() {
    if (!window.OaklineAdminApi.getToken()) {
      return;
    }

    try {
      const data = await window.OaklineAdminApi.me();
      showDashboard(data.admin);
    } catch (error) {
      window.OaklineAdminApi.clearToken();
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
      const data = await window.OaklineAdminApi.login(formData(loginForm));
      window.OaklineAdminApi.setToken(data.token);
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
      const data = await window.OaklineAdminApi.register(formData(registerForm));
      window.OaklineAdminApi.setToken(data.token);
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
      const data = await window.OaklineAdminApi.updateProfile(formData(profileForm));
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
      const data = await window.OaklineAdminApi.updatePassword(formData(passwordForm));
      passwordForm.reset();
      setStatus(dashboardStatus, data.message, "success");
    } catch (error) {
      setStatus(dashboardStatus, error.message, "error");
    }
  });

  logoutButton.addEventListener("click", () => {
    window.OaklineAdminApi.clearToken();
    showAuth("");
    setStatus(status, "Logged out.", "success");
  });

  loadCurrentAdmin();
})();
