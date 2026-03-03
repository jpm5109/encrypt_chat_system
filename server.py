import socket
import threading

clients = {}
public_keys = {}

def handle_client(conn, addr):
    print(f"Connected: {addr}")

    data = conn.recv(4096)

    if data.startswith(b"ID|"):
        user_id = data[3:].decode()
        print("User ID received:", user_id)

    data = conn.recv(4096)

    if data.startswith(b"KEY|"):
        public_key = data[4:]
        print("Public key received from", user_id)

    clients[user_id] = conn
    public_keys[user_id] = public_key

    for uid, client_conn in clients.items():
        if uid != user_id:
            print(f"Sending {user_id}'s public key to {uid}")
            client_conn.send(user_id.encode() + b"||" + public_key)

    for uid, pk in public_keys.items():
        if uid != user_id:
            print(f"Sending {uid}'s public key to {user_id}")
            conn.send(uid.encode() + b"||" + pk)

    while True:
        try:
            data = conn.recv(4096)
            if not data:
                break

            message = data.decode()

            if message.startswith("MSG|"):
                _, receiver_id, msg = message.split("|", 2)
    
                if receiver_id in clients:
                    clients[receiver_id].send(f"FROM|{user_id}|{msg}".encode())

        except:
            break

    conn.close()

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(("127.0.0.1", 5555))
server.listen()

print("Server started...")

try:
    while True:
        conn, addr = server.accept()
        threading.Thread(target=handle_client, args=(conn, addr)).start()
except KeyboardInterrupt:
    print("\nServer shutting down...")
    server.close()