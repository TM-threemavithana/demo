require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:8000';

app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

let cachedToken = null;

const VISITOR_SESSION_COOKIE = 'echo_visitor_session';
const VISITOR_SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

function parseCookies(cookieHeader = '') {
    return Object.fromEntries(
        cookieHeader
            .split(';')
            .map(cookie => cookie.trim())
            .filter(Boolean)
            .map(cookie => {
                const separator = cookie.indexOf('=');
                const key = separator >= 0 ? cookie.slice(0, separator) : cookie;
                const value = separator >= 0 ? cookie.slice(separator + 1) : '';
                return [key, decodeURIComponent(value)];
            })
    );
}

/**
 * Return one opaque conversation identifier per website visitor.
 * The identifier is stored in an HTTP-only cookie, so browser JavaScript
 * cannot alter or read the LangGraph thread identity.
 */
function getVisitorSession(req, res) {
    const cookies = parseCookies(req.headers.cookie);
    const existing = cookies[VISITOR_SESSION_COOKIE];

    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) {
        return existing;
    }

    const sessionId = crypto.randomUUID();
    const attributes = [
        `${VISITOR_SESSION_COOKIE}=${encodeURIComponent(sessionId)}`,
        'HttpOnly',
        'SameSite=Lax',
        'Path=/',
        `Max-Age=${VISITOR_SESSION_MAX_AGE_SECONDS}`,
    ];

    if (process.env.NODE_ENV === 'production') {
        attributes.push('Secure');
    }

    res.setHeader('Set-Cookie', attributes.join('; '));
    return sessionId;
}

// Helper to login and cache the token
async function authenticate() {
    try {
        console.log("Authenticating with external API...");
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
            email: process.env.OWNER_EMAIL,
            password: process.env.OWNER_PASSWORD
        });

        // Assuming the token is in response.data.token or response.data.access_token
        cachedToken = response.data.token || response.data.access_token || response.data;
        console.log("Authentication successful.");
    } catch (error) {
        console.error("Authentication failed:", error.response ? error.response.data : error.message);
        throw new Error("Failed to authenticate with external API");
    }
}

app.post('/api/chat', async (req, res) => {
    const { content } = req.body;

    if (typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: 'Content is required' });
    }

    // The owner identity selects the shared business knowledge base, while
    // this random session ID isolates each visitor's LangGraph checkpoint.
    const sessionId = getVisitorSession(req, res);

    const callPublicChat = () => axios.post(
        `${API_BASE_URL}/api/v1/public-chat/`,
        {
            content: content.trim(),
            session_id: sessionId,
        },
        {
            headers: {
                'Authorization': `Bearer ${cachedToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    try {
        // Authenticate if we don't have a token
        if (!cachedToken) {
            await authenticate();
        }

        // Call the external API
        try {
            const chatResponse = await callPublicChat();
            return res.json(chatResponse.data);
        } catch (apiError) {
            // If unauthorized, token might be expired. Refresh and retry once.
            if (apiError.response && (apiError.response.status === 401 || apiError.response.status === 403)) {
                console.log("Token might be expired, re-authenticating...");
                await authenticate();
                const retryResponse = await callPublicChat();
                return res.json(retryResponse.data);
            }
            throw apiError;
        }

    } catch (error) {
        console.error('Chat API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'An error occurred while communicating with the chatbot.' });
    }
});

// Keep a strong reference to the HTTP server for the lifetime of this process.
const server = app.listen(PORT, (error) => {
    if (error) {
        console.error(`Could not start server on port ${PORT}:`, error.message);
        return;
    }

    console.log(`Server is running on http://localhost:${PORT}`);
});

server.on('close', () => {
    console.log('Server stopped.');
});
