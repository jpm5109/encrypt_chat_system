# Contributing to VaultChat

Thank you for your interest in contributing to VaultChat! This document provides guidelines and instructions for contributing.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Reporting Issues](#reporting-issues)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. We pledge to:

- Be respectful and inclusive
- Welcome people of all backgrounds
- Create a harassment-free environment
- Value constructive feedback

### Unacceptable Behavior

The following behaviors are unacceptable:
- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing private information without consent
- Any form of abuse

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8+ or Node.js 16+
- Git
- GitHub account
- Basic knowledge of Python/JavaScript

### Fork & Clone

```bash
# Fork the repository on GitHub

# Clone your fork
git clone https://github.com/your-username/vaultchat.git
cd vaultchat

# Add upstream remote
git remote add upstream https://github.com/original-owner/vaultchat.git

# Create feature branch
git checkout -b feature/your-feature-name
```

---

## 🛠️ Development Setup

### Python Version Setup

```bash
cd python-version

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install pytest pytest-cov pylint black

# Run tests
pytest

# Format code
black *.py
```

### Web Version Setup

```bash
cd web-version

# Install dependencies
npm install

# Install dev dependencies (included in package.json)

# Start development server
npm run dev

# Build for testing
npm run build

# Run linting
npm run lint  # if configured
```

---

## 💻 Coding Standards

### Python Version

#### Style Guide
- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/)
- Use 4 spaces for indentation
- Max line length: 88 characters
- Use type hints where applicable

#### Example
```python
from typing import List, Optional

def handle_client(self, client: socket.socket, nickname: str) -> None:
    """
    Handle communication with a single client.
    
    Args:
        client: Socket connection to client
        nickname: Client's chosen nickname
    
    Returns:
        None
    """
    while self.running:
        try:
            message: bytes = client.recv(4096)
            if not message:
                break
            self.broadcast(message, client)
        except Exception as e:
            self.logger.error(f"Error handling client: {e}")
            break
```

#### Code Quality Tools
```bash
# Format code
black python-version/

# Check style
pylint python-version/*.py

# Type checking
mypy python-version/

# Run tests with coverage
pytest --cov=python-version python-version/
```

### Web Version (JavaScript/React)

#### Style Guide
- Use ES6+ syntax
- Functional components and hooks
- Proper prop typing with PropTypes or TypeScript
- 2 spaces for indentation

#### Example
```jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * ChatMessage component displaying a single message
 * @param {Object} props - Component props
 * @param {string} props.text - Message text
 * @param {string} props.sender - Sender's user ID
 * @param {number} props.timestamp - Message timestamp
 * @returns {JSX.Element}
 */
function ChatMessage({ text, sender, timestamp }) {
  return (
    <div className="message">
      <p>{text}</p>
      <time>{new Date(timestamp).toLocaleTimeString()}</time>
    </div>
  );
}

ChatMessage.propTypes = {
  text: PropTypes.string.isRequired,
  sender: PropTypes.string.isRequired,
  timestamp: PropTypes.number.isRequired,
};

export default ChatMessage;
```

#### ESLint Configuration
```javascript
// .eslintrc.json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  }
}
```

---

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, missing semicolons, etc)
- `refactor`: Code refactoring without feature changes
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, etc
- `ci`: CI/CD configuration

### Examples

```bash
# Feature
git commit -m "feat(web): add message reactions support"

# Bug fix
git commit -m "fix(python): resolve encryption key mismatch

Fixes issue where different encryption keys in client and server
prevented message decryption. Now validates keys match on connection."

# Documentation
git commit -m "docs: update deployment guide for AWS"

# Refactor
git commit -m "refactor(web): extract message component to separate file"
```

### Commit Best Practices

1. Keep commits atomic (one logical change per commit)
2. Write meaningful commit messages
3. Reference issue numbers when applicable: `Fixes #123`
4. Don't commit sensitive data (.env files, keys)
5. Ensure tests pass before committing

---

## 🔄 Pull Request Process

### Before Creating a PR

1. **Update your fork**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/descriptive-name
   ```

3. **Make your changes**
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation

4. **Test locally**
   ```bash
   # Python
   pytest python-version/
   
   # Web
   npm run build
   npm run lint
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/descriptive-name
   ```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #(issue number)

## Changes Made
- Change 1
- Change 2

## Testing
- [ ] Added/updated tests
- [ ] All tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows style guidelines
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
```

### Review Process

1. **Automated Checks**
   - Tests must pass
   - Code quality checks (linting)
   - Coverage requirements met

2. **Code Review**
   - At least one approval required
   - Address feedback promptly
   - Keep PR updated with main branch

3. **Merge**
   - Squash commits if needed
   - Delete branch after merge
   - Update related issues

---

## 🧪 Testing

### Python Version Tests

```python
# test_server.py
import pytest
from server import ChatServer

def test_server_initialization():
    """Test server starts correctly"""
    server = ChatServer()
    assert server.running is True
    assert server.clients == []
    server.stop()

def test_encryption_decryption():
    """Test message encryption/decryption"""
    from cryptography.fernet import Fernet
    
    key = Fernet.generate_key()
    cipher = Fernet(key)
    
    message = b"Test message"
    encrypted = cipher.encrypt(message)
    decrypted = cipher.decrypt(encrypted)
    
    assert decrypted == message
```

**Run tests:**
```bash
# All tests
pytest

# With coverage
pytest --cov=.

# Specific test
pytest test_server.py::test_server_initialization

# Verbose output
pytest -v
```

### Web Version Tests

```javascript
// App.test.jsx
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  test('renders login form when not authenticated', () => {
    render(<App />);
    const heading = screen.getByText(/Identity Setup/i);
    expect(heading).toBeInTheDocument();
  });
});
```

**Run tests:**
```bash
npm test
npm test -- --coverage
npm test -- ChatMessage.test.jsx
```

### Test Coverage Requirements

- Minimum 70% code coverage
- All public functions must have tests
- Edge cases should be covered
- Integration tests for critical paths

---

## 🐛 Reporting Issues

### Security Issues

**Do NOT create public issues for security vulnerabilities!**

Email: `jeetprasadmandal@gmail.com` with:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Bug Reports

**Title:** Brief description of bug

**Description:**
```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happened

## Environment
- OS: Windows/Mac/Linux
- Python version: 3.8/3.9/etc
- Node version: 16/18/etc
- Browser: Chrome/Firefox/etc

## Logs/Screenshots
[Attach error logs or screenshots]
```

### Feature Requests

**Title:** Brief feature description

**Description:**
```markdown
## Problem
The problem this solves

## Proposed Solution
How this feature would work

## Alternative Solutions
Other ways to solve this

## Use Case
Why this feature is needed

## Additional Context
Any other relevant information
```

---

## 📚 Documentation

When contributing:

1. **Update README.md** if adding major features
2. **Add docstrings** to all functions/classes
3. **Update DEPLOYMENT.md** if deployment changes
4. **Update SECURITY.md** if security-related changes
5. **Add code comments** for complex logic

### Documentation Format

```python
def send_message(self, message: str, recipient_id: str) -> bool:
    """
    Send encrypted message to recipient.
    
    Args:
        message: Plain text message to encrypt and send
        recipient_id: UID of the recipient
    
    Returns:
        bool: True if message sent successfully, False otherwise
    
    Raises:
        ValueError: If message is empty
        ConnectionError: If connection to recipient fails
    
    Example:
        >>> client.send_message("Hello", "user123")
        True
    """
```

---

## 🎯 Contribution Ideas

### Features We'd Love Help With

- [ ] End-to-end encryption for web version
- [ ] Video/audio calling support
- [ ] File sharing capabilities
- [ ] User presence indicators
- [ ] Message reactions/reactions
- [ ] Dark mode toggle (web)
- [ ] Multiple language support
- [ ] Mobile app (React Native)
- [ ] Database persistence (web)
- [ ] Rate limiting improvements

### Good First Issues

Look for issues tagged `good-first-issue` or `help-wanted`

---

## 💡 Development Tips

### Debugging Python
```python
import pdb; pdb.set_trace()  # Breakpoint
print(f"Debug: {variable}")   # Print debugging
```

### Debugging JavaScript
```javascript
debugger;                      // Breakpoint
console.log('Debug:', variable); // Print debugging
```

### Git Tips
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Stash changes temporarily
git stash

# Rebase on latest main
git rebase upstream/main

# Interactive rebase
git rebase -i HEAD~3
```

---

## ✅ Contribution Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines
- [ ] Changes include tests
- [ ] Documentation updated
- [ ] All tests pass locally
- [ ] No new linting errors
- [ ] Commit messages are clear
- [ ] No sensitive data committed
- [ ] Breaking changes documented
- [ ] CHANGELOG updated (if applicable)

---

## 📞 Need Help?

- 📧 Email: jeetprasadmandal@gmail.com
- 💬 Discussions: [GitHub Discussions](https://github.com/jpm5109/vaultchat/discussions)
- 🐛 Issues: [GitHub Issues](https://github.com/jpm5109/vaultchat/issues)

---

## 🙏 Thank You!

Your contributions make VaultChat better for everyone. We appreciate your time and effort!

**Happy coding! 🚀**

---

**Last Updated:** March 2026
