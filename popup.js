document.addEventListener("DOMContentLoaded", () => {
  // Views
  const infoView = document.getElementById("info-view");
  const mintView = document.getElementById("mint-view");
  const openMintBtn = document.getElementById("open-mint");
  const closeMintBtn = document.getElementById("close-mint");

  // Info elements
  const walletDiv = document.getElementById("wallet-info");
  const githubDiv = document.getElementById("github-info");

  // Mint context display
  const receiverGithubDisplay = document.getElementById(
    "receiverGithubDisplay"
  );
  const prLinkDisplay = document.getElementById("prLinkDisplay");
  const reviewerDisplay = document.getElementById("reviewerDisplay");

  // Mint form elements
  const mintForm = document.getElementById("mintForm");
  const mintResult = document.getElementById("mintResult");
  const templateSelect = document.getElementById("templateName");
  const templatePreview = document.getElementById("templatePreview");
  const badgeNameInput = document.getElementById("badgeName");
  const levelInput = document.getElementById("level");

  let templates = [];
  let receiverGithub = "";
  let prLink = "";
  let reviewer = "You"; // You are always the reviewer

  // Helper for status
  function setMintStatus(msg, type = "info") {
    mintResult.innerHTML = msg;
    mintResult.className =
      "mt-4 text-sm min-h-[24px] transition-all " +
      (type === "success"
        ? "text-green-400"
        : type === "error"
        ? "text-red-400"
        : type === "loading"
        ? "text-yellow-400 animate-pulse"
        : "text-blue-400");
  }

  // Load wallet and GitHub info and pre-fill fields
  chrome.storage.local.get(
    [
      "wallet_address",
      "githubUsername",
      "github_owner",
      "github_repo",
      "github_prNumber",
      "github_url",
      "githubUsername",
    ],
    (data) => {
      // Display wallet info
      if (data?.wallet_address && data?.githubUsername) {
        walletDiv.innerHTML = `
          <strong>Wallet Address:</strong> ${data.wallet_address}<br>
          <strong>Your Github Username:</strong> ${data.githubUsername}
        `;
      } else {
        walletDiv.innerText = "No wallet info available";
      }

      // Display GitHub info
      if (data.github_owner && data.github_repo) {
        githubDiv.innerHTML = `
          <strong>Repo:</strong> ${data.github_owner}/${data.github_repo}<br>
          ${
            data.github_prNumber
              ? `<strong>PR #:</strong> ${data.github_prNumber}<br>`
              : ""
          }
          <strong>Link:</strong> <a href="${
            data.github_url
          }" target="_blank" class="underline text-green-400">${
          data.github_url
        }</a>
        `;
        receiverGithub = data.github_owner || "";
        prLink = data.github_url || "";
      } else {
        githubDiv.innerText = "No GitHub info available";
      }
    }
  );

  // Show/hide mint badge form
  openMintBtn.onclick = () => {
    infoView.classList.add("hidden");
    mintView.classList.remove("hidden");
    setMintStatus("", "info");
    mintForm.reset();
    templatePreview.innerHTML = "";
    // Display context (receiver, pr, reviewer)
    chrome.storage.local.get(["github_owner", "github_url"], (data) => {
      receiverGithubDisplay.textContent = data.github_owner || "";
      prLinkDisplay.innerHTML = data.github_url
        ? `<a href="${data.github_url}" target="_blank" class="underline text-green-400">${data.github_url}</a>`
        : "";
      reviewerDisplay.textContent = "You";
    });
    // Fetch templates if not loaded yet
    if (templates.length === 0) fetchTemplates();
  };
  closeMintBtn.onclick = () => {
    mintView.classList.add("hidden");
    infoView.classList.remove("hidden");
  };

  // Fetch templates for dropdown
  function fetchTemplates() {
    templateSelect.innerHTML = '<option value="">Loading templates...</option>';
    fetch("https://skillmint-lyart.vercel.app/api/templates")
      .then((res) => res.json())
      .then((data) => {
        templates = Array.isArray(data) ? data : [];
        templateSelect.innerHTML = '<option value="">Select Template</option>';
        templates.forEach((t) => {
          const opt = document.createElement("option");
          opt.value = t.templateName;
          opt.textContent = t.templateName;
          templateSelect.appendChild(opt);
        });
      })
      .catch(() => {
        templateSelect.innerHTML =
          '<option value="">Failed to load templates</option>';
      });
  }

  // Show template preview when selected
  templateSelect.addEventListener("change", () => {
    const selected = templates.find(
      (t) => t.templateName === templateSelect.value
    );
    if (selected && selected.imageUrl) {
      templatePreview.innerHTML = `
        <img src="${selected.imageUrl}" alt="${
        selected.templateName
      }" class="rounded shadow mb-2 max-h-20 border border-gray-700 mx-auto" />
        <div class="text-xs text-gray-400 text-center">${
          selected.description || ""
        }</div>
      `;
    } else {
      templatePreview.innerHTML = "";
    }
  });

  // Handle badge minting
  mintForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMintStatus("⏳ Minting...", "loading");
    mintForm.querySelector('button[type="submit"]').disabled = true;

    // Get latest wallet address, GitHub username, and PR link
    chrome.storage.local.get(
      ["wallet_address", "github_owner", "github_url", "githubUsername"],
      async (data) => {
        const badgeName = badgeNameInput.value;
        const templateName = templateSelect.value;
        const level = levelInput.value;
        const receiver = data.wallet_address || "";
        const receiverGithub = data.github_owner || "";
        const pr = data.github_url || "";

        if (!receiver) {
          setMintStatus(
            "❌ Wallet address not found. Please connect your wallet.",
            "error"
          );
          mintForm.querySelector('button[type="submit"]').disabled = false;
          return;
        }
        if (!templateName) {
          setMintStatus("❌ Please select a template.", "error");
          mintForm.querySelector('button[type="submit"]').disabled = false;
          return;
        }

        try {
          const uniqueSeed = Date.now();
          setMintStatus("🚀 Sending mint request...", "loading");
          console.log(badgeName);
          const response = await fetch(
            "https://skillmint-lyart.vercel.app/api/mint-badge-ex",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                badgeName,
                templateName,
                receiver,
                receiverGithub,
                reviewer: data.githubUsername,
                prLink: pr,
                level,
                uniqueSeed,
              }),
            }
          );
          const respData = await response.json();
          if (response.ok) {
            setMintStatus(
              `✅ Badge minted!<br><span class="text-xs break-all">Tx: ${
                respData.txSignature || ""
              }</span>`,
              "success"
            );
            mintForm.reset();
            templatePreview.innerHTML = "";
          } else {
            setMintStatus(`❌ ${respData.error || "Mint failed"}`, "error");
          }
        } catch (err) {
          setMintStatus(`❌ ${err.message}`, "error");
        }
        mintForm.querySelector('button[type="submit"]').disabled = false;
      }
    );
  });
});
