from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Set a consistent viewport size for all screenshots
    page.set_viewport_size({"width": 400, "height": 800})

    def log_console_message(msg):
        print(f"Browser console: {msg.text}")

    page.on("console", log_console_message)

    # Navigate to Add Weightlifting Page
    page.goto("http://localhost:5173/#/log/add-workout/weights")
    page.wait_for_load_state('networkidle')
    page.screenshot(path="jules-scratch/verification/add-weightlifting-page.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)