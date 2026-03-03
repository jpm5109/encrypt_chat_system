import socket
import threading
import sys
from cryptography.fernet import Fernet

# Client Configuration
HOST = '127.0.0.1'
PORT = 55555

# Encryption Key (Must match server's SHARED_KEY)
SHARED_KEY = b'7_WzY-B8K3-Xq1u4vHqW_E0-m8y5-Z6x1n3vA9uB2c8='
cipher = Fernet(SHARED_KEY)

# Terminal Colors
COLOR_RESET = "\033[0m"
COLOR_CYAN = "\033[96m"
COLOR_GREEN = "\033[92m"
COLOR_RED = "\033[91m"

class ChatClient:
    def __init__(self):
        self.nickname = input("Choose your nickname: ")
        self.client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.running = True
        
        try:
            self.client.connect((HOST, PORT))
        except ConnectionRefusedError:
            print(f"{COLOR_RED}[ERROR] Could not connect to server at {HOST}:{PORT}{COLOR_RESET}")
            sys.exit(1)

    def receive(self):
        """Thread function to handle incoming messages."""
        while self.running:
            try:
                message = self.client.recv(4096)
                if not message:
                    if self.running:
                        print(f"\n{COLOR_RED}[SERVER ERROR] Connection closed by server.{COLOR_RESET}")
                    break
                
                if message.decode('utf-8', errors='ignore') == 'NICK':
                    self.client.send(self.nickname.encode('utf-8'))
                else:
                    decrypted_message = cipher.decrypt(message).decode('utf-8')
                    # Clear the current prompt line and print the new message
                    print(f"\r{decrypted_message}\n{COLOR_CYAN}You: {COLOR_RESET}", end="")
            except Exception:
                if self.running:
                    print(f"\n{COLOR_RED}[DISCONNECTED] Lost connection.{COLOR_RESET}")
                break
        
        self.running = False
        self.client.close()

    def write(self):
        """Function to handle user input and encryption."""
        print(f"{COLOR_GREEN}Joined! Type /quit to exit.{COLOR_RESET}")
        while self.running:
            try:
                text = input(f"{COLOR_CYAN}You: {COLOR_RESET}")
                if text.lower() == '/quit':
                    print(f"{COLOR_CYAN}Goodbye!{COLOR_RESET}")
                    self.running = False
                    self.client.close()
                    break
                
                if text.strip():
                    full_message = f"{self.nickname}: {text}"
                    encrypted_message = cipher.encrypt(full_message.encode('utf-8'))
                    self.client.send(encrypted_message)
            except (EOFError, KeyboardInterrupt):
                self.running = False
                self.client.close()
                break
            except Exception:
                break
        
        print("\n[INFO] Exiting application...")
        sys.exit(0)

    def start(self):
        # Using daemon threads so they don't block the program exit
        receive_thread = threading.Thread(target=self.receive, daemon=True)
        receive_thread.start()

        # Input loop runs on the main thread
        self.write()

if __name__ == "__main__":
    client = ChatClient()
    client.start()