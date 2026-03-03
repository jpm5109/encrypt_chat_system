# VaultChat: Multi-Platform Encrypted Chat System

A secure, end-to-end encrypted chat suite featuring both a Python terminal implementation and a modern React/Firebase web application.

🚀 Features

Python Version (CLI)

True Peer-to-Peer feel: Direct socket communication.

E2E Encryption: AES-128 encryption using the cryptography library.

Threaded UI: Simultaneous sending and receiving in the terminal.

Web Version (GUI)

Instant Accounts: Anonymous authentication.

Social Discovery: Add friends using their Unique Security IDs.

Real-time: Powered by Firebase Firestore for zero-latency messaging.

Responsive Design: Works on desktop and mobile browsers.

🛠️ Installation & Setup

Python CLI Version

Navigate to /python-version.

Install dependencies:

pip install -r requirements.txt


Start the server: python server.py.

Start a client: python client.py.

Web Version

Navigate to /web-version.

Install dependencies: npm install.

Start development server: npm run dev.

Build for production: npm run build.

🔒 Security Note

This system uses End-to-End Encryption. In the Python version, messages are encrypted before they hit the wire. In the Web version, data is stored in secured Firestore paths accessible only to authenticated friends.