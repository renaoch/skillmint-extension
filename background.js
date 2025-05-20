chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // === Feature 1: Wallet/Signature Bridge ===
  if (request.action === "verifyLink") {
    chrome.storage.local.set(
      {
        githubUsername: request.githubUsername,
        wallet_address: request.wallet_address,
      },
      () => {
        // Open the popup (if possible)
        if (chrome.action && chrome.action.openPopup) {
          chrome.action.openPopup();
        }
        sendResponse({ status: "success", message: "Verification succeeded!" });
      }
    );
    return true; // async response
  }

  // === Feature 2: GitHub Info for Mint Badge ===
  if (request.action === "githubInfo") {
    chrome.storage.local.set(
      {
        github_owner: request.owner,
        github_repo: request.repo,
        github_prNumber: request.prNumber,
        github_url: request.url,
      },
      () => {
        // Open the popup (if possible)
        if (chrome.action && chrome.action.openPopup) {
          chrome.action.openPopup();
        }
        sendResponse({ status: "success", message: "GitHub info stored!" });
      }
    );
    return true; // async response
  }
});
