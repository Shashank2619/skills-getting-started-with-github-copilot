document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const themeToggle = document.getElementById("theme-toggle");

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    themeToggle.textContent = newTheme === "dark" ? "☀️" : "🌙";
    localStorage.setItem("theme", newTheme);
  }

  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
  themeToggle.addEventListener("click", toggleTheme);

  async function fetchWithTimeout(resource, options = {}) {
    const timeout = options.timeout || 5000;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and existing options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "<option value=''>-- Select an activity --</option>"; // Keep default option

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsList = details.participants
          .map((participant) => `<li>• ${participant}</li>`)
          .join("");

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <p style="margin-bottom: 0;"><strong>Participants:</strong></p>
          <ul>${participantsList || "<li>• No participants yet</li>"}</ul>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function validateEmail(email) {
    if (!email.endsWith('@mergington.edu')) {
        throw new Error('Please use your Mergington school email address');
    }
    const emailRegex = /^[^\s@]+@mergington\.edu$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      validateEmail(email);
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Add this line to refresh the activities list
        await fetchActivities();
      } else {
        messageDiv.className = "error";
        messageDiv.textContent = result.detail || "An error occurred";
      }
    } catch (error) {
      console.error("Error signing up:", error);
      messageDiv.className = "error";
      messageDiv.textContent = error.message || "Failed to sign up. Please try again.";
    } finally {
      messageDiv.classList.remove("hidden");
      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    }
  });

  // Initialize app
  fetchActivities();
});
