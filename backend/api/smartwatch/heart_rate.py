# Live heart-rate
import os
from dotenv import load_dotenv
import asyncio
from bleak import BleakClient

# Load .env
load_dotenv()
DEVICE_ADDRESS = os.getenv("DEVICE_ADDRESS")
CHAR_BATTERY = os.getenv("CHAR_BATTERY")
CHAR_FW_VER = os.getenv("CHAR_FW_VER")
CHAR_MANUFACTURER = os.getenv("CHAR_MANUFACTURER")

async def heart_rate_callback(sender, data):
    print(f"Heart Rate Data: {list(data)}")

async def subscribe_to_heart_rate():
    async with BleakClient(DEVICE_ADDRESS) as client:
        await client.start_notify("00002a37-0000-1000-8000-00805f9b34fb", heart_rate_callback)
        await asyncio.sleep(30)  # Listen for 30 seconds
        await client.stop_notify("00002a37-0000-1000-8000-00805f9b34fb")

asyncio.run(subscribe_to_heart_rate())