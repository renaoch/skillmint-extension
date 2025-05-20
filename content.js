// === Feature 1: Wallet/signature bridge (NO CHANGE) ===
window.addEventListener("message", (event) => {
  if (event.data.action === "linkGitHubWallet") {
    chrome.runtime.sendMessage({
      action: "verifyLink",
      githubUsername: event.data.githubUsername,
      wallet_address: event.data.walletAddress,
    });
  }
});

// === Feature 2: Inject "Mint Badge" button (only on github.com, after DOM ready) ===
function injectMintBadgeButton() {
  if (!location.hostname.endsWith("github.com")) return;
  if (document.getElementById("mint-badge-extension-btn")) return;

  const btn = document.createElement("button");
  btn.id = "mint-badge-extension-btn";
  btn.textContent = "Mint Badge";
  btn.style.position = "fixed";
  btn.style.top = "100px";
  btn.style.right = "16px";
  btn.style.zIndex = 10000;
  btn.style.padding = "8px 20px";
  btn.style.background = " #6f42c1"; // purple to green
  btn.style.color = "#fff";
  btn.style.border = "none";
  btn.style.borderRadius = "10px";
  btn.style.boxShadow = "0 4px 16px rgba(34,197,94,0.18)";
  btn.style.fontSize = "17px";
  btn.style.fontWeight = "600";
  btn.style.fontFamily = "inherit";
  btn.style.cursor = "pointer";
  btn.style.letterSpacing = "0.04em";
  btn.style.transition = "background 0.2s, box-shadow 0.2s, transform 0.1s";

  document.body.appendChild(btn);

  btn.addEventListener("click", () => {
    // Parse the URL: https://github.com/{owner}/{repo}/pull/{number}
    const url = window.location.href;
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(\/pull\/(\d+))?/);
    if (!match) return;

    const owner = match[1];
    const repo = match[2];
    const prNumber = match[4] || "";

    // Save info to storage, then open the popup
    chrome.runtime.sendMessage(
      {
        action: "githubInfo",
        owner,
        repo,
        prNumber,
        url,
      },
      () => {
        if (chrome.action && chrome.action.openPopup) {
          chrome.action.openPopup();
        }
      }
    );
  });
}

// Wait for DOM to be ready before injecting button
if (location.hostname.endsWith("github.com")) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectMintBadgeButton);
  } else {
    injectMintBadgeButton();
  }
}
