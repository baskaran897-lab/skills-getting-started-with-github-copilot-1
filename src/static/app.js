document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select to the default option to avoid duplicates on refresh
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section (bulleted list)
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsHeader = document.createElement("p");
        // include a small count badge for accessibility/visibility
        participantsHeader.innerHTML = `<strong>Participants</strong> <span class="participant-count">(${details.participants.length})</span>`;

        participantsDiv.appendChild(participantsHeader);

        const ul = document.createElement("ul");
        ul.className = "participants-list";
        ul.setAttribute("aria-label", `${name} participants`);
        ul.setAttribute("role", "list");

        if (details.participants && details.participants.length > 0) {
          details.participants.forEach((p) => {
            // create participant item with avatar (initials) + full name + delete icon
            const li = document.createElement("li");
            li.className = "participant-item";
            li.setAttribute("role", "listitem");

            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";
            const initials = p
              .split(" ")
              .map((s) => (s ? s[0] : ""))
              .join("")
              .toUpperCase()
              .slice(0, 2);
            avatar.textContent = initials || "👤";

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = p;

            // delete button (icon)
            const delBtn = document.createElement("button");
            delBtn.className = "participant-delete";
            delBtn.setAttribute("aria-label", `Unregister ${p} from ${name}`);
            delBtn.title = "Unregister participant";
            delBtn.innerHTML = "&times;"; // simple × icon

            // click handler to unregister
            delBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );

                const json = await res.json();
                if (res.ok) {
                  // remove the li from the DOM
                  li.remove();
                  // update the participant count badge
                  const countSpan = activityCard.querySelector(".participant-count");
                  if (countSpan) {
                    const current = parseInt(countSpan.textContent.replace(/[^0-9]/g, ""), 10) || 0;
                    countSpan.textContent = `(${Math.max(0, current - 1)})`;
                  }
                } else {
                  console.error('Failed to unregister:', json.detail || json);
                }
              } catch (err) {
                console.error("Error unregistering participant:", err);
              }
            });

            li.appendChild(avatar);
            li.appendChild(nameSpan);
            li.appendChild(delBtn);
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.textContent = "No participants yet.";
          li.className = "no-participants";
          ul.appendChild(li);
        }

        participantsDiv.appendChild(ul);
        activityCard.appendChild(participantsDiv);

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

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = signupForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        // keep the base "message" class so the message box styling is applied
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities so participants list updates
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    } finally {
      submitButton.disabled = false;
    }
  });

  // Initialize app
  fetchActivities();
});
