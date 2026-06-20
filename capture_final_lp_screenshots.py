import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        pages = [
            ("hub_final", ""),
            ("diario_3d", "diario-emocional/"),
        ]

        for name, path in pages:
            url = f"http://localhost:8000/LP/{path}index.html"
            print(f"Capturando {name} em {url}...")
            try:
                await page.goto(url)
                await page.wait_for_load_state("networkidle")
                await asyncio.sleep(2)
                # Hover to check 3D effect in diario if possible (manual check but good for state)
                if name == "diario_3d":
                    await page.hover("img[alt='O Diário Emocional']")
                    await asyncio.sleep(1)
                await page.screenshot(path=f"{name}_preview.png", full_page=True)
            except Exception as e:
                print(f"Erro ao capturar {name}: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
