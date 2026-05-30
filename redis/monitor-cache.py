#!/usr/bin/env python3
import redis
import sys
from datetime import datetime

def log(message):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] {message}", flush=True)

def main():
    try:
        r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        log("Redis Cache Monitor started...")
        
        # Subscribe to keyspace notifications
        pubsub = r.pubsub()
        pubsub.psubscribe('__keyspace@0__:products::*')
        
        log("Listening for cache operations on products::*")
        
        for message in pubsub.listen():
            if message['type'] == 'pmessage':
                key = message['channel'].split(':')[-1]
                operation = message['data']
                
                if operation == 'set':
                    log(f"[CACHE SAVE] Luu cache: products::{key}")
                elif operation == 'get':
                    log(f"[CACHE READ] Doc cache: products::{key}")
                elif operation == 'del' or operation == 'expired':
                    log(f"[CACHE DELETE] Xoa cache: products::{key}")
                    
    except Exception as e:
        log(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
