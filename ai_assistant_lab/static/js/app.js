document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const promptInput = document.getElementById('prompt-input');
    const chatContainer = document.getElementById('chat-container');
    const chatWrapper = document.getElementById('chat-wrapper');
    const offlineAlert = document.getElementById('offline-alert');

    function updateOnlineStatus() {
        if (navigator.onLine) {
            offlineAlert.classList.add('d-none');
        } else {
            offlineAlert.classList.remove('d-none');
        }
    }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // --- Service Worker ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
        .catch(err => console.error('Service Worker Failed', err));
    }

    promptInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value === '') {
            this.style.height = 'auto';
        }
    });

    // Replaced geminiIcon with nemesisIcon
    const nemesisIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.8 8.5L21.5 8L16.8 12.8L19.5 19.5L12 15.5L4.5 19.5L7.2 12.8L2.5 8L9.2 8.5L12 2Z" fill="#ff4d4d"/></svg>`;

    function addMessage(text, isUser = false) {
        const msgDiv = document.createElement('div');
        
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedText = formattedText.replace(/\n/g, '<br>');

        if (isUser) {
            msgDiv.className = 'message user d-flex gap-3';
            msgDiv.innerHTML = `<div class="content">${formattedText}</div>`;
        } else {
            msgDiv.className = 'message assistant d-flex gap-3';
            msgDiv.innerHTML = `<div class="avatar">${nemesisIcon}</div><div class="content">${formattedText}</div>`;
        }
        
        chatWrapper.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'message assistant d-flex gap-3';
        typingDiv.innerHTML = `
            <div class="avatar">${nemesisIcon}</div>
            <div class="content typing-indicator">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div>
            </div>`;
        chatWrapper.appendChild(typingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function removeTyping() {
        const typingDiv = document.getElementById('typing-indicator');
        if (typingDiv) typingDiv.remove();
    }

    async function sendPrompt(prompt) {
        addMessage(prompt, true);
        promptInput.value = '';
        promptInput.style.height = 'auto'; // Reset input height after sending
        
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        showTyping();

        try {
            const response = await fetch('/api/generate/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ prompt: prompt })
            });

            removeTyping();

            const data = await response.json();
            if (data.response) {
                addMessage(data.response);
            } else {
                addMessage("Error: " + data.error);
            }
        } catch (error) {
            removeTyping();
            addMessage("Network error. Check your connection.");
        }
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const prompt = promptInput.value.trim();
        if (prompt) sendPrompt(prompt);
    });

    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const prompt = promptInput.value.trim();
            if (prompt) sendPrompt(prompt);
        }
    });
});