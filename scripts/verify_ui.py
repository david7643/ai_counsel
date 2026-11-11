"""Browser smoke checks via the installed Edge, without downloading WebDriver.

Requires websocket-client (available alongside Selenium in the development host).
Run: python scripts/verify_ui.py
"""
from __future__ import annotations

import base64
import json
import os
from pathlib import Path
import socket
import subprocess
import time
import urllib.request

import websocket


ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / 'artifacts'
EDGE = Path(os.environ.get('PROGRAMFILES(X86)', r'C:\Program Files (x86)')) / 'Microsoft/Edge/Application/msedge.exe'


class Browser:
    def __init__(self):
        ARTIFACTS.mkdir(exist_ok=True)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            self.port = sock.getsockname()[1]
        self.process = subprocess.Popen([
            str(EDGE), '--headless=new', '--disable-gpu', '--no-first-run',
            '--no-default-browser-check', '--disable-extensions',
            '--remote-allow-origins=http://localhost',
            f'--remote-debugging-port={self.port}', '--remote-debugging-address=127.0.0.1',
            f'--user-data-dir={ROOT / ".browser-profile"}', 'about:blank',
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=subprocess.CREATE_NO_WINDOW)
        for _ in range(100):
            if self.process.poll() is not None:
                raise RuntimeError('Edge could not start. The local sandbox may require an approved browser run.')
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{self.port}/json', timeout=1) as response:
                    tabs = json.load(response)
                target = next(tab for tab in tabs if tab['type'] == 'page')
                self.ws = websocket.create_connection(target['webSocketDebuggerUrl'], origin='http://localhost', timeout=10)
                break
            except (OSError, StopIteration):
                time.sleep(.1)
        else:
            self.process.terminate()
            raise RuntimeError('Local Edge debugging endpoint did not become ready.')
        self.sequence = 0
        self.errors = []
        self.command('Runtime.enable')
        self.command('Page.enable')

    def command(self, method, params=None):
        self.sequence += 1
        sequence = self.sequence
        self.ws.send(json.dumps({'id': sequence, 'method': method, 'params': params or {}}))
        while True:
            data = json.loads(self.ws.recv())
            if data.get('method') == 'Runtime.exceptionThrown':
                self.errors.append(data['params'])
            if data.get('id') == sequence:
                if 'error' in data:
                    raise RuntimeError(data['error'])
                return data.get('result', {})

    def evaluate(self, expression):
        result = self.command('Runtime.evaluate', {'expression': expression, 'returnByValue': True, 'awaitPromise': True, 'userGesture': True})
        if 'exceptionDetails' in result:
            raise AssertionError(result['exceptionDetails'])
        return result.get('result', {}).get('value')

    def click(self, selector):
        selector_js = json.dumps(selector)
        assert self.evaluate(f'!!document.querySelector({selector_js})'), f'Missing selector {selector}'
        self.evaluate(f'document.querySelector({selector_js}).click()')

    def fill(self, selector, value):
        self.evaluate(f'''(() => {{ const element = document.querySelector({json.dumps(selector)});
        element.value = {json.dumps(value)}; element.dispatchEvent(new Event('input', {{ bubbles: true }})); }})()''')

    def size(self, width, height=1080):
        self.command('Emulation.setDeviceMetricsOverride', {'width': width, 'height': height, 'deviceScaleFactor': 1, 'mobile': False})
        self.evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')

    def screenshot(self, name):
        self.evaluate('window.scrollTo(0, 0)')
        self.evaluate('document.activeElement.blur()')
        self.evaluate('document.querySelector("#toast").style.visibility = "hidden"')
        self.evaluate('new Promise(resolve => setTimeout(resolve, 250))')
        data = self.command('Page.captureScreenshot', {'captureBeyondViewport': True, 'format': 'png'})
        (ARTIFACTS / name).write_bytes(base64.b64decode(data['data']))
        self.evaluate('document.querySelector("#toast").style.visibility = ""')

    def close(self):
        try:
            self.command('Browser.close')
        except Exception:
            pass
        self.ws.close()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.terminate()


def run():
    browser = Browser()
    checks = []

    def check(condition, name):
        assert condition, name
        checks.append(name)
        print(f'PASS: {name}')

    try:
        browser.size(1440, 1100)
        browser.command('Page.navigate', {'url': (ROOT / 'index.html').as_uri()})
        for _ in range(100):
            if browser.evaluate('!!document.querySelector(".hero")'):
                break
            time.sleep(.1)
        browser.evaluate('document.fonts.ready.then(() => true)')
        check('마음 홈' in browser.evaluate('document.title'), 'Application opens directly from index.html')
        check(browser.evaluate('document.querySelectorAll(".nav-item").length') == 4, 'Four client destinations render')
        browser.screenshot('home-desktop.png')

        browser.click('[data-mood="3"]')
        check(browser.evaluate('document.querySelector("[data-mood=\\"3\\"]").getAttribute("aria-pressed")') == 'true', 'Mood check-in selected accessibly')
        check('4점' in browser.evaluate('document.querySelector(".chart").getAttribute("aria-label")'), 'Today mood is reflected in the chart')
        browser.click('[data-page="journal"]')
        browser.fill('#journal-input', '오늘은 산책을 했어요. <script>window.__injected=true</script>')
        browser.evaluate('document.querySelector("#journal-form").requestSubmit()')
        check(browser.evaluate('document.querySelectorAll(".journal-entry").length') == 3, 'Journal entry is added')
        check(browser.evaluate('window.__injected !== true'), 'Journal content is rendered as text, not executable HTML')
        browser.click('[data-delete-entry]')
        browser.click('#delete-entry-confirm')
        check(browser.evaluate('document.querySelectorAll(".journal-entry").length') == 2, 'Entry deletion requires confirmation and removes entry')

        browser.click('[data-page="chat"]')
        browser.fill('#chat-input', '요즘 회사 일 때문에 지쳐요.')
        browser.evaluate('document.querySelector("#chat-form").requestSubmit()')
        browser.evaluate('new Promise(resolve => setTimeout(resolve, 850))')
        check(browser.evaluate('document.querySelectorAll(".message-row").length') == 3, 'Chat sends a message and displays a sample reply')
        check('일에 대한 마음' in browser.evaluate('document.querySelector(".chat-messages").textContent'), 'Sample reply matches the conversation topic')
        browser.screenshot('chat-desktop.png')

        browser.click('[data-role="counselor"]')
        check(browser.evaluate('document.querySelector("[data-client=\\"seoyeon\\"]").disabled'), 'Counselor cannot open Seoyeon report before consent')
        browser.click('[data-role="client"]')
        browser.click('[data-page="report"]')
        browser.fill('#report-note', '처음이라 조금 긴장돼요. 천천히 이야기하고 싶어요.')
        browser.click('[data-action="save-note"]')
        browser.click('[data-action="share"]')
        check(browser.evaluate('document.querySelector("#share-confirm").disabled'), 'Share confirmation is disabled until explicit consent')
        browser.click('#share-consent')
        browser.click('#share-confirm')
        browser.click('[data-role="counselor"]')
        check(not browser.evaluate('document.querySelector("[data-client=\\"seoyeon\\"]").disabled'), 'Consent unlocks Seoyeon report')
        browser.click('[data-client="seoyeon"]')
        check('처음이라 조금 긴장돼요' in browser.evaluate('document.querySelector(".report-paper").textContent'), 'Shared report includes the saved client note')
        check('요즘 회사 일 때문에 지쳐요.' not in browser.evaluate('document.querySelector(".report-paper").textContent'), 'Current chat transcript is excluded from the shared report')
        browser.fill('#report-note', '업무와 휴식의 균형에 대해 먼저 질문하기')
        browser.click('[data-action="save-note"]')
        browser.screenshot('report-desktop.png')
        browser.command('Emulation.setEmulatedMedia', {'media': 'print'})
        check(browser.evaluate('getComputedStyle(document.querySelector(".sidebar")).display') == 'none', 'Print view hides the navigation and app controls')
        check(browser.evaluate('getComputedStyle(document.querySelector(".report-paper")).display') != 'none', 'Print view includes the report content')
        pdf = browser.command('Page.printToPDF', {'printBackground': True, 'paperWidth': 8.27, 'paperHeight': 11.69})
        (ARTIFACTS / 'report-preview.pdf').write_bytes(base64.b64decode(pdf['data']))
        browser.command('Emulation.setEmulatedMedia', {'media': ''})
        browser.click('[data-action="appointment"]')
        browser.click('[data-time="11:00"]')
        browser.click('#appointment-confirm')
        check('11:00' in browser.evaluate('document.querySelector(".schedule-card").textContent'), 'Selected appointment appears on the local schedule')
        browser.click('[data-action="cancel-appointment"]')
        browser.click('[data-action="confirm-cancel-appointment"]')
        check('11:00' not in browser.evaluate('document.querySelector(".schedule-card").textContent'), 'Locally added appointment can be canceled')

        browser.click('[data-page="clients"]')
        browser.fill('#client-search', '김지우')
        check(browser.evaluate('document.querySelectorAll(".client-table tbody tr").length') == 1, 'Client search filters by name')
        browser.fill('#client-search', '없는이름')
        check('검색 결과가 없어요' in browser.evaluate('document.querySelector(".client-table").textContent'), 'Search has an informative empty state')
        browser.fill('#client-search', '')
        browser.click('[data-page="overview"]')
        browser.screenshot('counselor-desktop.png')
        browser.click('[data-action="privacy"]')
        browser.click('[data-action="share-revoke"]')
        check(browser.evaluate('document.querySelector("[data-client=\\"seoyeon\\"]").disabled'), 'Revoking consent locks the report again')

        browser.click('[data-role="client"]')
        for width in [1440, 1024, 768, 390, 360]:
            browser.size(width, 1000)
            check(browser.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Home has no horizontal overflow at {width}px')
        browser.size(390, 844)
        browser.screenshot('home-mobile.png')
        check(browser.evaluate('document.querySelector("#sidebar").inert'), 'Closed mobile navigation is not keyboard-focusable')
        browser.click('[data-action="menu"]')
        check(browser.evaluate('document.querySelector(".workspace").inert'), 'Open mobile menu isolates background content')
        browser.click('[data-page="chat"]')
        check(browser.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile chat has no horizontal overflow')
        browser.screenshot('chat-mobile.png')
        browser.click('[data-action="new-chat"]')
        check(browser.evaluate('document.querySelector("#app").inert'), 'Dialog isolates background content')
        browser.evaluate('document.querySelector(".modal-header button").focus()')
        browser.command('Input.dispatchKeyEvent', {'type': 'keyDown', 'key': 'Tab', 'code': 'Tab', 'windowsVirtualKeyCode': 9, 'modifiers': 8})
        check(browser.evaluate('document.activeElement.dataset.action') == 'confirm-new-chat', 'Shift+Tab wraps to the final dialog control')
        browser.command('Input.dispatchKeyEvent', {'type': 'keyDown', 'key': 'Tab', 'code': 'Tab', 'windowsVirtualKeyCode': 9})
        check(browser.evaluate('document.activeElement.dataset.action') == 'modal-close', 'Tab wraps back to the first dialog control')
        browser.command('Input.dispatchKeyEvent', {'type': 'keyDown', 'key': 'Escape', 'code': 'Escape', 'windowsVirtualKeyCode': 27})
        check(not browser.evaluate('!!document.querySelector(".modal")'), 'Escape dismisses the dialog')
        browser.command('Emulation.setEmulatedMedia', {'features': [{'name': 'prefers-reduced-motion', 'value': 'reduce'}]})
        check(browser.evaluate('getComputedStyle(document.querySelector(".sidebar")).transitionDuration') == '0s', 'Reduced-motion preference disables movement transitions')
        browser.click('[data-action="menu"]')
        browser.click('[data-page="report"]')
        check(browser.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile report has no horizontal overflow')
        browser.screenshot('report-mobile.png')
        browser.click('[data-role="counselor"]')
        check(browser.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile counselor dashboard contains the wide table without page overflow')
        browser.screenshot('counselor-mobile.png')
        browser.click('[data-role="client"]')
        browser.click('[data-action="menu"]')
        browser.click('[data-page="chat"]')
        browser.command('Page.reload')
        browser.evaluate('new Promise(resolve => setTimeout(resolve, 350))')
        check(browser.evaluate('document.querySelectorAll(".message-row").length') == 1, 'Refreshing clears user conversation input')
        check(not browser.errors, f'No uncaught JavaScript errors ({len(browser.errors)})')
        print(f'\n{len(checks)} checks passed. Screenshots: {ARTIFACTS}')
    finally:
        browser.close()


if __name__ == '__main__':
    run()
