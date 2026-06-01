import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            url = "http://127.0.0.1:5174"
            print(f"Acessando {url}...")
            await page.goto(url)
            await asyncio.sleep(5)

            await page.screenshot(path="login_screen.png")
            print("Screenshot da tela de login salva.")

            # Tenta clicar no botao 'Usar demo'
            print("Tentando login via demo...")
            await page.click("button:has-text('Usar demo')")
            await asyncio.sleep(10) # Espera carregar a dashboard

            await page.screenshot(path="dashboard_screen.png")
            print("Screenshot da dashboard salva.")

            # Tenta ir para a lista de pacientes
            print("Tentando acessar lista de pacientes...")
            await page.click("button:has-text('Pacientes')")
            await asyncio.sleep(5)
            await page.screenshot(path="patients_list_screen.png")
            print("Screenshot da lista de pacientes salva.")

        except Exception as e:
            print(f"Erro ao capturar: {e}")
        finally:
            await browser.close()

asyncio.run(run())
