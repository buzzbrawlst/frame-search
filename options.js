const input = document.getElementById("quality");
chrome.storage.local.get({jpegQuality:92}).then(v => input.value = v.jpegQuality);
input.addEventListener("change", () => {
  const value = Math.max(50, Math.min(100, Number(input.value) || 92));
  input.value = value;
  chrome.storage.local.set({jpegQuality:value});
});