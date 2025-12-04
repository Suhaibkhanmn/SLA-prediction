import json
import httpx
import asyncio
from asyncio import Semaphore

API_URL = "http://127.0.0.1:8000/predict"
MAX_CONCURRENT = 5   # limit to 5 parallel API calls

sem = Semaphore(MAX_CONCURRENT)

async def send_order(client, order):
    async with sem:
        try:
            response = await client.post(API_URL, json=order)
            data = response.json()

            risk = data["miss_sla_proba"]
            alert = data["will_miss_sla"]

            status = "[WARN]" if alert else "[OK]"
            print(f"{order['order_id']}  risk={risk:.2f}  {status}")

        except Exception as e:
            print(f"[ERROR] Failed for {order['order_id']}: {e}")


async def run_batch():
    with open("data/test_orders.json") as f:
        orders = json.load(f)

    print(f"Processing {len(orders)} orders...\n")

    async with httpx.AsyncClient(timeout=10) as client:
        tasks = [send_order(client, o) for o in orders]
        await asyncio.gather(*tasks)

    print("\nBatch simulation complete.")


if __name__ == "__main__":
    asyncio.run(run_batch())
