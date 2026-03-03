import socket
import threading
import sys

# Server Configuration
HOST = '127.0.0.1'  # Localhost
PORT = 55555        # Port to listen on

class ChatServer:
    def __init__(self):
        self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        # Allow immediate reuse of the port after shutdown
        self.server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server.bind((HOST, PORT))
        self.server.listen()
        self.clients = []
        self.nicknames = []
        self.running = True
        print(f"[STARTING] Server is listening on {HOST}:{PORT}")
        print("[INFO] Press Ctrl+C to stop the server.")

    def broadcast(self, message, sender_client=None):
        """Sends a message to all connected clients except the sender."""
        for client in self.clients:
            if client != sender_client:
                try:
                    client.send(message)
                except:
                    self.remove_client(client)

    def handle_client(self, client):
        """Handles the continuous communication with a single client."""
        while self.running:
            try:
                # The server doesn't decrypt; it just forwards encrypted blobs
                message = client.recv(4096)
                if not message:
                    break
                self.broadcast(message, client)
            except:
                break
        
        self.remove_client(client)

    def remove_client(self, client):
        """Cleans up when a client disconnects."""
        if client in self.clients:
            index = self.clients.index(client)
            nickname = self.nicknames[index]
            print(f"[DISCONNECTED] {nickname} left the chat.")
            self.clients.pop(index)
            self.nicknames.pop(index)
            try:
                client.close()
            except:
                pass

    def stop(self):
        """Gracefully stops the server and disconnects clients."""
        print("\n[SHUTTING DOWN] Closing all connections...")
        self.running = False
        for client in self.clients:
            try:
                client.close()
            except:
                pass
        self.server.close()
        print("[OFFLINE] Server has stopped.")
        sys.exit(0)

    def receive(self):
        """Main loop to accept new connections."""
        try:
            while self.running:
                try:
                    # Set timeout so it checks the 'running' flag periodically
                    self.server.settimeout(1.0)
                    client, address = self.server.accept()
                except socket.timeout:
                    continue

                print(f"[CONNECTED] Connected with {str(address)}")

                client.send("NICK".encode('utf-8'))
                try:
                    nickname = client.recv(1024).decode('utf-8')
                    self.nicknames.append(nickname)
                    self.clients.append(client)
                    print(f"[NICKNAME] Nickname of client is {nickname}")
                    
                    thread = threading.Thread(target=self.handle_client, args=(client,))
                    thread.daemon = True # Thread dies when main process dies
                    thread.start()
                except:
                    client.close()

        except KeyboardInterrupt:
            self.stop()

if __name__ == "__main__":
    chat_server = ChatServer()
    chat_server.receive()