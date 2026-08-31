document.addEventListener('DOMContentLoaded', () => {
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatContainer = document.getElementById('chatContainer');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    let requestPending = false;

    // Toggle Chat
    chatToggleBtn.addEventListener('click', () => {
        chatContainer.classList.add('active');
        chatInput.focus();
    });

    closeChatBtn.addEventListener('click', () => {
        chatContainer.classList.remove('active');
    });

    // Send Message
    const sendMessage = async () => {
        const text = chatInput.value.trim();
        if (!text || requestPending) return;

        // Serialize requests from the same visitor so two messages cannot
        // update the same LangGraph thread concurrently.
        requestPending = true;
        sendBtn.disabled = true;
        chatInput.disabled = true;

        // Add user message
        appendMessage(text, 'user');
        chatInput.value = '';

        // Add typing indicator
        const typingId = showTypingIndicator();

        try {
            // Call API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ content: text })
            });

            removeTypingIndicator(typingId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Try to extract the message from the response
            let assistantMessage = "Sorry, I couldn't understand the response.";
            if (data.content) {
                assistantMessage = data.content;
            } else if (data.response) {
                assistantMessage = data.response;
            } else if (data.message) {
                assistantMessage = data.message;
            } else if (data.answer) {
                assistantMessage = data.answer;
            } else if (typeof data === 'string') {
                assistantMessage = data;
            } else {
                assistantMessage = JSON.stringify(data);
            }

            appendMessage(assistantMessage, 'assistant');

        } catch (error) {
            console.error('Error fetching chat response:', error);
            removeTypingIndicator(typingId);
            appendMessage('Sorry, I encountered an error. Please try again later.', 'assistant');
        } finally {
            requestPending = false;
            sendBtn.disabled = false;
            chatInput.disabled = false;
            chatInput.focus();
        }
    };

    // Listeners for send
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Helpers
    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = id;
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            typingDiv.appendChild(dot);
        }
        chatMessages.appendChild(typingDiv);
        scrollToBottom();
        return id;
    }

    function removeTypingIndicator(id) {
        const typingDiv = document.getElementById(id);
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Modal Booking Logic
    const bookingModal = document.getElementById('bookingModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const bookingForm = document.getElementById('bookingForm');
    const modalRoomId = document.getElementById('modalRoomId');
    const bookingMessage = document.getElementById('bookingMessage');
    const submitBookingBtn = document.getElementById('submitBookingBtn');

    window.openBookingModal = (roomId) => {
        modalRoomId.value = roomId;
        bookingMessage.textContent = '';
        bookingMessage.className = 'booking-message';
        bookingForm.reset();
        bookingModal.classList.add('active');
    };

    closeModalBtn.addEventListener('click', () => {
        bookingModal.classList.remove('active');
    });

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const roomId = modalRoomId.value;
        const guestName = document.getElementById('modalName').value.trim();
        const mobileNumber = document.getElementById('modalMobile').value.trim();
        const nights = parseInt(document.getElementById('modalNights').value, 10);
        
        submitBookingBtn.disabled = true;
        submitBookingBtn.textContent = 'Processing...';
        bookingMessage.textContent = '';
        bookingMessage.className = 'booking-message';

        try {
            const response = await fetch('http://localhost:3001/api/rooms/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, guestName, mobileNumber, nights })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                bookingMessage.textContent = data.message;
                bookingMessage.className = 'booking-message success';
                setTimeout(() => {
                    bookingModal.classList.remove('active');
                }, 3000);
            } else {
                bookingMessage.textContent = data.message || data.detail || 'Booking failed.';
                bookingMessage.className = 'booking-message error';
            }
        } catch (error) {
            bookingMessage.textContent = 'Network error. Please try again.';
            bookingMessage.className = 'booking-message error';
        } finally {
            submitBookingBtn.disabled = false;
            submitBookingBtn.textContent = 'Confirm Booking';
        }
    });

});
