#!/bin/bash

#################################################################
# VaultChat - Automated Setup & Deployment Script
# Purpose: Simplify installation and configuration of both
#          Python CLI and Web versions of VaultChat
#################################################################

set -e  # Exit on any error

# Color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check system requirements
check_requirements() {
    print_header "Checking System Requirements"
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    print_success "Git found"
    
    # Check Python version
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8 or higher."
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version | awk '{print $2}')
    print_success "Python $PYTHON_VERSION found"
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Web version won't work without it."
        NODEJS_INSTALLED=false
    else
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION found"
        NODEJS_INSTALLED=true
    fi
}

# Setup Python Version
setup_python_version() {
    print_header "Setting Up Python CLI Version"
    
    if [ ! -d "python-version" ]; then
        print_error "python-version directory not found!"
        return 1
    fi
    
    cd python-version
    
    # Create virtual environment
    print_info "Creating virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
    
    # Activate virtual environment
    print_info "Activating virtual environment..."
    source venv/bin/activate
    
    # Upgrade pip
    print_info "Upgrading pip..."
    pip install --upgrade pip setuptools wheel > /dev/null 2>&1
    
    # Install requirements
    print_info "Installing dependencies..."
    pip install -r requirements.txt
    print_success "Dependencies installed"
    
    # Test encryption key generation
    print_info "Testing encryption..."
    if python3 -c "from cryptography.fernet import Fernet; Fernet.generate_key()" 2>/dev/null; then
        print_success "Encryption module working correctly"
    else
        print_error "Encryption test failed!"
        return 1
    fi
    
    # Check if SHARED_KEY needs to be changed
    if grep -q "7_WzY-B8K3-Xq1u4vHqW_E0-m8y5-Z6x1n3vA9uB2c8=" client.py; then
        print_warning "Using default SHARED_KEY - Security risk!"
        read -p "Generate new encryption key? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            NEW_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
            print_info "New encryption key: $NEW_KEY"
            print_warning "Update both client.py and server.py with this key before deployment!"
        fi
    fi
    
    cd ..
    print_success "Python version setup complete"
}

# Setup Web Version
setup_web_version() {
    print_header "Setting Up Web Version"
    
    if [ ! -d "web-version" ]; then
        print_error "web-version directory not found!"
        return 1
    fi
    
    if [ "$NODEJS_INSTALLED" = false ]; then
        print_error "Node.js is required for web version. Please install Node.js 16+ first."
        return 1
    fi
    
    cd web-version
    
    # Install dependencies
    print_info "Installing Node.js dependencies..."
    npm install
    print_success "Dependencies installed"
    
    # Setup .env file
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_info "Creating .env file from template..."
            cp .env.example .env
            print_warning "Please configure Firebase credentials in web-version/.env"
            print_info "Get credentials from: Firebase Console > Project Settings"
        else
            print_error ".env.example not found!"
            return 1
        fi
    else
        print_success ".env file already exists"
    fi
    
    # Test build
    print_info "Testing build process..."
    if npm run build > /dev/null 2>&1; then
        print_success "Build successful"
    else
        print_warning "Build had warnings (this may be normal)"
    fi
    
    cd ..
    print_success "Web version setup complete"
}

# Display usage information
show_usage() {
    print_header "VaultChat Setup Complete!"
    
    echo -e "${BLUE}Python CLI Version:${NC}"
    echo "  cd python-version"
    echo "  source venv/bin/activate"
    echo "  python server.py         # Start server"
    echo "  python client.py         # Start client"
    echo ""
    
    echo -e "${BLUE}Web Version:${NC}"
    echo "  cd web-version"
    echo "  npm run dev    # Development server"
    echo "  npm run build  # Production build"
    echo ""
    
    echo -e "${YELLOW}Important Security Notes:${NC}"
    echo "  1. Change SHARED_KEY in python-version/server.py and client.py"
    echo "  2. Configure Firebase credentials in web-version/.env"
    echo "  3. Never commit .env files with real credentials"
    echo "  4. Review SECURITY.md for security best practices"
    echo ""
    
    echo -e "${BLUE}Documentation:${NC}"
    echo "  - README.md        : Project overview"
    echo "  - DEPLOYMENT.md    : Production deployment guide"
    echo "  - SECURITY.md      : Security guidelines"
    echo "  - CONTRIBUTING.md  : Contribution guidelines"
    echo ""
    
    echo -e "${GREEN}Happy Coding!${NC}\n"
}

# Main setup flow
main() {
    print_header "VaultChat - Automated Setup"
    
    # Get current directory
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    cd "$SCRIPT_DIR"
    
    print_info "Setup directory: $SCRIPT_DIR"
    echo ""
    
    # Check requirements
    check_requirements
    
    # Ask which version to setup
    echo ""
    echo -e "${BLUE}Which version would you like to setup?${NC}"
    echo "1) Python CLI Version (server + client)"
    echo "2) Web Version (React + Firebase)"
    echo "3) Both versions"
    echo "4) Exit"
    
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            setup_python_version || exit 1
            ;;
        2)
            setup_web_version || exit 1
            ;;
        3)
            setup_python_version || exit 1
            setup_web_version || exit 1
            ;;
        4)
            print_info "Setup cancelled"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    # Show usage information
    show_usage
}

# Run main function
main
