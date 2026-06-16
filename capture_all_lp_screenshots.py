import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        pages = [
            ("hub", ""),
            ("protagonismo", "protagonismo-profissional/"),
            ("desbloqueio", "desbloqueio-emocional/"),
            ("diagnostico", "diagnostico-raiz/"),
            ("diario", "diario-emocional/"),
            ("autonomia", "autonomia-interna/"),
            ("visibilidade", "visibilidade-natural/")
        ]

        for name, path in pages:
            url = f"http://localhost:8000/LP/{path}index.html"
            print(f"Capturando {name} em {url}...")
            try:
                await page.goto(url)
                await page.wait_for_load_state("networkidle")
                await page.screenshot(path=f"preview_{name}.png", full_page=True)
            except Exception as e:
                print(f"Erro ao capturar {name}: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
