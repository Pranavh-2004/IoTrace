# Battery, firmware and mnufacturer info
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

async def read_characteristic(uuid):
    async with BleakClient(DEVICE_ADDRESS) as client:
        data = await client.read_gatt_char(uuid)
        return data.decode("utf-8") if isinstance(data, bytes) else data

async def main():
    battery = await read_characteristic(CHAR_BATTERY)
    firmware = await read_characteristic(CHAR_FW_VER)
    manufacturer = await read_characteristic(CHAR_MANUFACTURER)

    print(f"Battery Level: {battery}%")
    print(f"Firmware Version: {firmware}")
    print(f"Manufacturer: {manufacturer}")

asyncio.run(main())
