import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        # Screenshot 1
        print("Capturando Protagonismo Profissional...")
        await page.goto("http://localhost:8000/LP/protagonismo-profissional/index.html")
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path="preview_protagonismo.png", full_page=True)

        # Screenshot 2
        print("Capturando Desbloqueio Emocional...")
        await page.goto("http://localhost:8000/LP/desbloqueio-emocional/index.html")
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path="preview_desbloqueio.png", full_page=True)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
