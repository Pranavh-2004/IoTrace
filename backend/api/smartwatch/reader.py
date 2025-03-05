# Read-Write available data
import os
from dotenv import load_dotenv
import asyncio
from bleak import BleakClient

# Load .env
load_dotenv()
DEVICE_ADDRESS = os.getenv("DEVICE_ADDRESS")

async def discover_services():
    async with BleakClient(DEVICE_ADDRESS) as client:
        services = await client.get_services()
        for service in services:
            print(f"Service: {service.uuid}")
            for char in service.characteristics:
                print(f"  Characteristic: {char.uuid} | Properties: {char.properties}")

asyncio.run(discover_services())