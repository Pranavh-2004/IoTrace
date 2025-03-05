import hashlib

def compute_hash(data):
    return hashlib.sha256(data.encode()).hexdigest()