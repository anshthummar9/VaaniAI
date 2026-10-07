document.addEventListener("DOMContentLoaded", () => {
    const chatBox = document.getElementById("chat-box");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const clearBtn = document.getElementById("clear-btn");
    const newChatBtn = document.getElementById("new-chat-btn");
    const languageChip = document.getElementById("selected-language-chip");
    const languageName = document.getElementById("selected-language-name");
    const languageCopy = document.getElementById("selected-language-copy");
    const loading = document.getElementById("loading");
    const toast = document.getElementById("toast");
    const sidebar = document.getElementById("sidebar");
    const historyKey = "vaaniAIChatHistory";
    let selectedLanguage = localStorage.getItem("vaaniAILanguage") || "English";
    let lastPrompt = "";
    let lastResponse = "";

    const languageCodes = {
        English: "EN", Hindi: "HI", Gujarati: "GU", Marathi: "MR",
        Bengali: "BN", Tamil: "TA", Telugu: "TE", Kannada: "KN", Malayalam: "ML"
    };

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("show");
        window.setTimeout(() => toast.classList.remove("show"), 2200);
    }

    function updateLanguage(language) {
        selectedLanguage = language;
        localStorage.setItem("vaaniAILanguage", language);
        document.querySelectorAll(".language-item").forEach((item) => {
            item.classList.toggle("selected", item.dataset.language === language);
        });
        languageChip.innerHTML = `${language} <b>${languageCodes[language]}</b>`;
        languageName.textContent = language;
        languageCopy.textContent = `Responses are generated in ${language}.`;
        userInput.placeholder = `Message VaaniAI in ${language}...`;
    }

    function hideIntro() {
        const intro = document.getElementById("welcome-msg");
        if (intro) intro.remove();
    }

    function addMessage(text, sender, allowActions = false) {
        hideIntro();
        const row = document.createElement("div");
        row.className = `message-row ${sender}`;
        const avatar = document.createElement("span");
        avatar.className = "message-avatar";
        avatar.textContent = sender === "user" ? "You" : "✦";
        const content = document.createElement("div");
        content.className = "message-content";
        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.textContent = text;
        const meta = document.createElement("div");
        meta.className = "message-meta";
        meta.innerHTML = `<span>${sender === "user" ? "You" : "VaaniAI"} · just now</span>`;
        if (allowActions) {
            const actions = document.createElement("span");
            actions.className = "message-actions";
            actions.innerHTML = '<button class="message-action copy-action" title="Copy response">Copy</button><button class="message-action regenerate-action" title="Regenerate response">Regenerate</button>';
            meta.appendChild(actions);
            actions.querySelector(".copy-action").addEventListener("click", () => {
                navigator.clipboard.writeText(text).then(() => showToast("Response copied to clipboard."));
            });
            actions.querySelector(".regenerate-action").addEventListener("click", () => sendMessage(lastPrompt, true));
        }
        content.append(bubble, meta);
        row.append(avatar, content);
        chatBox.appendChild(row);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function saveHistory(prompt, response) {
        const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
        history.unshift({ prompt, response, language: selectedLanguage, time: new Date().toISOString() });
        localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 20)));
    }

    async function sendMessage(overrideText = null, isRegenerate = false) {
        const text = (overrideText || userInput.value).trim();
        if (!text || loading.classList.contains("active")) return;
        if (!isRegenerate) {
            addMessage(text, "user");
            userInput.value = "";
        }
        lastPrompt = text;
        loading.classList.remove("d-none");
        loading.classList.add("active");
        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, language: selectedLanguage })
            });
            const data = (response.headers.get("content-type") || "").includes("application/json")
                ? await response.json() : { error: await response.text() };
            if (!response.ok) throw new Error(data.error || "The server could not generate a response.");
            lastResponse = data.response;
            addMessage(lastResponse, "bot", true);
            saveHistory(text, lastResponse);
        } catch (error) {
            addMessage(error.message || "Network error. Make sure the backend server is running.", "error");
        } finally {
            loading.classList.remove("d-none", "active");
        }
    }

    function clearChat() {
        chatBox.innerHTML = '<div class="chat-intro" id="welcome-msg"><span class="intro-icon">✦</span><h3>What would you like to explore?</h3><p>Ask VaaniAI anything in your chosen language. Your response will be generated by Gemini.</p><div class="suggestion-grid"><button class="suggestion" data-prompt="Explain natural language processing simply">Explain NLP simply <span>→</span></button><button class="suggestion" data-prompt="Tell me an interesting fact about India">An interesting fact about India <span>→</span></button><button class="suggestion" data-prompt="Help me prepare for my college viva">Help me prepare for my viva <span>→</span></button></div></div>';
        bindSuggestions();
        lastPrompt = "";
    }

    function showHistory() {
        const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
        if (!history.length) {
            showToast("No saved conversations yet.");
            return;
        }
        chatBox.innerHTML = "";
        history.slice(0, 8).forEach((item) => {
            lastPrompt = item.prompt;
            lastResponse = item.response;
            addMessage(item.prompt, "user");
            addMessage(item.response, "bot", true);
        });
        showToast(`${Math.min(history.length, 8)} saved conversation${history.length === 1 ? "" : "s"} loaded.`);
    }

    function bindSuggestions() {
        document.querySelectorAll(".suggestion").forEach((button) => {
            button.addEventListener("click", () => sendMessage(button.dataset.prompt));
        });
    }

    document.querySelectorAll(".language-item").forEach((item) => item.addEventListener("click", () => {
        updateLanguage(item.dataset.language);
        showToast(`Language changed to ${item.dataset.language}.`);
        sidebar.classList.remove("mobile-open");
    }));
    document.querySelectorAll("[data-scroll-chat]").forEach((button) => button.addEventListener("click", (event) => {
        if (button.tagName === "BUTTON") event.preventDefault();
        document.getElementById("chat").scrollIntoView({ behavior: "smooth" });
    }));
    document.querySelectorAll(".topnav a").forEach((link) => link.addEventListener("click", () => document.querySelector(".topnav").classList.remove("open")));
    document.getElementById("mobile-menu-btn").addEventListener("click", () => document.querySelector(".topnav").classList.toggle("open"));
    document.getElementById("settings-btn").addEventListener("click", () => showToast("Settings are ready for your next conversation."));
    clearBtn.addEventListener("click", () => { clearChat(); showToast("Chat cleared."); });
    newChatBtn.addEventListener("click", () => { clearChat(); showToast("New chat started."); });
    document.getElementById("history-btn").addEventListener("click", showHistory);
    sendBtn.addEventListener("click", () => sendMessage());
    userInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); }
    });
    userInput.addEventListener("input", () => {
        userInput.style.height = "auto";
        userInput.style.height = `${Math.min(userInput.scrollHeight, 100)}px`;
    });
    updateLanguage(selectedLanguage);
    bindSuggestions();
});
