import socket
import threading
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes

# Generate keys
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048
)

public_key = private_key.public_key()

public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
client.connect(("127.0.0.1", 5555))

user_id = input("Enter your ID: ")
client.send(f"ID|{user_id}".encode())
client.send(b"KEY|" + public_pem)

receiver_public_key = None

def receive():
    global receiver_public_key
    while True:
        try:
            data = client.recv(4096)
            print("Data received:", data)   

            if b"-----BEGIN PUBLIC KEY-----" in data:
                uid, pk = data.split(b"||")
                receiver_public_key = serialization.load_pem_public_key(pk)
                print(f"Received public key from {uid.decode()}")

            else:
                """decrypted = private_key.decrypt(
                    data,
                    padding.OAEP(
                        mgf=padding.MGF1(algorithm=hashes.SHA256()),
                        algorithm=hashes.SHA256(),
                        label=None
                    )
                )
                print("\nMessage:", decrypted.decode())"""

                message = data.decode()

                if message.startswith("FROM|"):
                    _, sender_id, msg = message.split("|", 2)
                    print(f"\nMessage from {sender_id}: {msg}")
        except:
            break

threading.Thread(target=receive).start()

while True:
    """msg = input("")
    if receiver_public_key:
        encrypted = receiver_public_key.encrypt(
            msg.encode(),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        receiver_id = input("Send to (ID): ").ljust(20)
        client.send(receiver_id.encode() + encrypted)"""
    receiver_id = input("Send to (ID): ")
    msg = input("Message: ")
    
    full_message = f"MSG|{receiver_id}|{msg}"
    client.send(full_message.encode())