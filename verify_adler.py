import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        print("--- Testing Login ---")
        await page.goto("http://127.0.0.1:5173")
        await page.wait_for_selector("input[type='email']")
        await page.fill("input[type='email']", "clinica.demo@adler.ai")
        await page.fill("input[type='password']", "demo123")
        await page.click("button:has-text('Entrar no Adler')")

        await page.wait_for_selector("text=Bom dia", timeout=15000)
        print("Successfully logged in to Dashboard")
        await page.screenshot(path="dashboard_success.png")

        print("--- Testing DSM Search ---")
        await page.click("button:has-text('DSM / Psicopatologia')")
        await page.wait_for_selector("input[placeholder*='Buscar por transtorno']", timeout=5000)
        await page.fill("input[placeholder*='Buscar por transtorno']", "Depressão")
        await asyncio.sleep(3)

        try:
            await page.wait_for_selector("text=Depressão Maior", timeout=10000)
            print("DSM Search result for 'Depressão' found")
            await page.screenshot(path="dsm_search_success.png")
        except:
            print("DSM Search result NOT found")
            await page.screenshot(path="dsm_search_error.png")

        print("--- Testing Patient Workspace ---")
        await page.click("button:has-text('Pacientes')")
        await asyncio.sleep(2)
        try:
            # Patients are listed in a table or list
            await page.wait_for_selector("text=Daniel Rocha", timeout=10000)
            await page.click("text=Daniel Rocha")
            print("Opened Daniel Rocha's workspace")
            await page.wait_for_selector("text=WORKSPACE DO PACIENTE", timeout=10000)
        except:
            print("Patient Daniel Rocha not found or workspace didn't open")
            await page.screenshot(path="patients_list_error.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
