"""Browser checks with installed Chrome/Edge (no WebDriver download).

Requires websocket-client or websockets. Run: python scripts/verify_ui.py
Set BROWSER to override the browser executable.
"""
from __future__ import annotations

import base64
import json
import os
from pathlib import Path
import socket
import shutil
import tempfile
import subprocess
import time
import urllib.request

try:
    import websocket
    connect = lambda url: websocket.create_connection(url, origin='http://localhost', timeout=10)
except ImportError:
    from websockets.sync.client import connect as ws_connect
    connect = lambda url: ws_connect(url, origin='http://localhost', open_timeout=10, max_size=None)


ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / 'artifacts'
BROWSER = os.environ.get('BROWSER') or shutil.which('google-chrome-stable') or shutil.which('google-chrome') or shutil.which('chromium') or str(Path(os.environ.get('PROGRAMFILES(X86)', r'C:\Program Files (x86)')) / 'Microsoft/Edge/Application/msedge.exe')


class Browser:
    def __init__(self):
        ARTIFACTS.mkdir(exist_ok=True)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            self.port = sock.getsockname()[1]
        self.profile = tempfile.TemporaryDirectory(prefix="maeumgyeol-browser-")
        self.process = subprocess.Popen([
            BROWSER, '--headless=new', '--disable-gpu', '--no-first-run',
            *(['--no-sandbox'] if os.name != 'nt' else []),
            '--no-default-browser-check', '--disable-extensions',
            '--remote-allow-origins=http://localhost',
            f'--remote-debugging-port={self.port}', '--remote-debugging-address=127.0.0.1',
            f'--user-data-dir={self.profile.name}', 'about:blank',
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        for _ in range(100):
            if self.process.poll() is not None:
                raise RuntimeError('Browser could not start. The local sandbox may require an approved browser run.')
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{self.port}/json', timeout=1) as response:
                    tabs = json.load(response)
                target = next(tab for tab in tabs if tab['type'] == 'page')
                self.ws = connect(target['webSocketDebuggerUrl'])
                break
            except (OSError, StopIteration):
                time.sleep(.1)
        else:
            self.process.terminate()
            raise RuntimeError('Local browser debugging endpoint did not become ready.')
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
        self.profile.cleanup()


def run():
    browser = Browser()
    checks = []

    def check(condition, name):
        assert condition, name
        checks.append(name)
        print(f'PASS: {name}', flush=True)

    def open_page(file, fragment='', selector='.main-content'):
        browser.command('Page.navigate', {'url': (ROOT / file).as_uri() + fragment})
        for _ in range(100):
            if browser.evaluate(f'!!document.querySelector({json.dumps(selector)})'):
                break
            time.sleep(.05)
        else:
            raise AssertionError(f'{file} did not render: {browser.errors}')
        browser.evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')

    def key(name):
        browser.command('Input.dispatchKeyEvent', {'type': 'keyDown', 'key': name})

    def submit():
        browser.evaluate('document.querySelector("#appointment-form").requestSubmit()')

    try:
        browser.size(1440, 1100)
        open_page('index.html', selector='.hero')
        check('내담자 공간' in browser.evaluate('document.title'), 'Legacy index opens client workspace')
        check(browser.evaluate('document.querySelectorAll("[data-role], .role-switch").length') == 0, 'No role switch is exposed')
        check(browser.evaluate('document.querySelector("#toast").inert'), 'Hidden feedback cannot receive keyboard focus')
        check(browser.evaluate('document.querySelectorAll(".nav-item").length') == 4, 'Four client destinations render')
        browser.screenshot('home-desktop.png')
        browser.evaluate('location.hash = "schedule"')
        browser.evaluate('new Promise(resolve => setTimeout(resolve, 100))')
        check(browser.evaluate('location.hash') == '#home', 'Client hash cannot open counselor calendar')
        check(browser.evaluate('document.querySelector(".workspace-identity").textContent') == '내담자 전용 공간', 'Workspace identity stays client')
        browser.click('[data-mood="3"]')
        check(browser.evaluate('document.querySelector("[data-mood=\\"3\\"]").getAttribute("aria-pressed")') == 'true', 'Mood check-in selected accessibly')
        check('4점' in browser.evaluate('document.querySelector(".chart").getAttribute("aria-label")'), 'Mood is reflected in the chart')
        browser.click('[data-page="journal"]')
        browser.fill('#journal-input', '산책했어요. <script>window.__injected=true</script>')
        browser.evaluate('document.querySelector("#journal-form").requestSubmit()')
        check(browser.evaluate('document.querySelectorAll(".journal-entry").length') == 3, 'Journal entry is added')
        check(browser.evaluate('window.__injected !== true'), 'Journal is escaped safely')
        browser.click('[data-delete-entry]')
        browser.click('#delete-entry-confirm')
        check(browser.evaluate('document.querySelectorAll(".journal-entry").length') == 2, 'Journal deletion works')
        browser.click('[data-page="chat"]')
        browser.fill('#chat-input', '요즘 회사 일 때문에 지쳐요.')
        browser.evaluate('document.querySelector("#chat-form").requestSubmit()')
        browser.evaluate('new Promise(resolve => setTimeout(resolve, 850))')
        check(browser.evaluate('document.querySelectorAll(".message-row").length') == 3, 'Chat still sends and replies')
        browser.click('[data-page="report"]')
        browser.click('[data-action="share"]')
        check(browser.evaluate('document.querySelector("#share-confirm").disabled'), 'Explicit consent required')
        browser.click('#share-consent')
        browser.click('#share-confirm')
        check('동의됨' in browser.evaluate('document.querySelector(".report-sidebar").textContent'), 'Client consent updates the client screen')
        browser.click('[data-action="privacy"]')
        browser.click('[data-action="share-revoke"]')
        check('미공유' in browser.evaluate('document.querySelector(".report-sidebar").textContent'), 'Client can revoke consent')
        browser.screenshot('report-client-desktop.png')

        open_page('client.html', '#overview', '.hero')
        check(browser.evaluate('location.hash') == '#home', 'Explicit client entry also blocks counselor routes')
        for width in [1440, 1024, 768, 390, 360]:
            browser.size(width, 1000)
            check(browser.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Client home fits {width}px')
        browser.size(390, 844)
        browser.screenshot('home-mobile.png')
        check(browser.evaluate('document.querySelector("#sidebar").inert'), 'Hidden mobile menu cannot receive focus')
        browser.click('[data-action="menu"]')
        check(browser.evaluate('document.querySelector(".workspace").inert'), 'Mobile menu isolates content')
        browser.click('[data-page="chat"]')
        browser.click('[data-action="new-chat"]')
        check(browser.evaluate('document.querySelector("#app").inert'), 'Modal isolates background')
        browser.evaluate('document.querySelector(".modal-header button").focus()')
        browser.command('Input.dispatchKeyEvent', {'type': 'keyDown', 'key': 'Tab', 'modifiers': 8, 'windowsVirtualKeyCode': 9})
        check(browser.evaluate('document.activeElement.dataset.action') == 'confirm-new-chat', 'Dialog Shift+Tab wraps')
        key('Escape')
        check(not browser.evaluate('!!document.querySelector(".modal")'), 'Escape dismisses dialog')

        browser.size(1440, 1100)
        open_page('counselor.html', selector='.stats-row')
        check('상담사 공간' in browser.evaluate('document.title'), 'Counselor entry opens its own dashboard')
        check(browser.evaluate('document.querySelector("[data-client=\\"seoyeon\\"]").disabled'), 'Pending sample report remains locked')
        browser.evaluate('location.hash = "chat"')
        browser.evaluate('new Promise(resolve => setTimeout(resolve, 100))')
        check(browser.evaluate('location.hash') == '#overview', 'Counselor hash cannot open client chat')
        browser.screenshot('counselor-desktop.png')
        browser.click('[data-page="schedule"]')
        check(browser.evaluate('document.querySelectorAll(".calendar-day").length') == 42, 'Month grid includes 42 dates')
        check(browser.evaluate('document.querySelectorAll(".agenda-item").length') == 2, 'Today shows both example sessions')
        check(browser.evaluate('document.querySelectorAll(".calendar-day[tabindex=\\"0\\"]").length') == 1, 'Calendar has one keyboard entry point')
        today_key = browser.evaluate('document.querySelector(".calendar-day.is-today").dataset.calendarDate')
        browser.screenshot('calendar-desktop.png')
        for width in [1440, 1280, 1190, 1024, 768, 760, 390, 360]:
            browser.size(width, 1000)
            check(browser.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Calendar and agenda fit {width}px')
        browser.size(390, 844)
        check(browser.evaluate('getComputedStyle(document.querySelector(".calendar-events")).display') == 'none', 'Mobile calendar uses compact event dots')
        browser.click('[data-action="agenda-focus"]')
        check(browser.evaluate('document.activeElement.id') == 'agenda-title', 'Mobile shortcut focuses selected day details')
        check(browser.evaluate('document.querySelector("#agenda-title").getBoundingClientRect().top >= 69'), 'Selected day details remain below sticky header')
        browser.screenshot('calendar-mobile.png')
        browser.size(1440, 1100)
        browser.click('[data-calendar-filter="video"]')
        check(browser.evaluate('document.querySelectorAll(".agenda-item").length') == 0, 'Type filter applies to agenda')
        check('해당 유형' in browser.evaluate('document.querySelector(".agenda-empty").textContent'), 'Filtered empty state explains the result')
        check(browser.evaluate('document.querySelectorAll(".calendar-event:not(.type-video)").length') == 0, 'Type filter also applies to month grid')
        browser.click('.calendar-filter[data-calendar-filter="all"]')
        browser.click('[data-action="calendar-next"]')
        check(not browser.evaluate('!!document.querySelector(".calendar-day.is-today.is-selected")'), 'Next month changes date selection')
        browser.click('[data-action="calendar-today"]')
        check(browser.evaluate('document.activeElement.dataset.calendarDate') == today_key, 'Today restores and focuses today')
        key('ArrowRight')
        check(browser.evaluate('document.activeElement.dataset.calendarDate') != today_key, 'Arrow key moves day focus and selection')
        check(browser.evaluate('document.querySelectorAll(".agenda-item").length') == 0, 'Selected empty day has no sessions')
        browser.screenshot('calendar-empty-desktop.png')
        browser.click('[data-action="calendar-today"]')
        browser.click('[data-action="new-appointment"]')
        check(browser.evaluate('document.querySelector("#appointment-date").value') == today_key, 'New session uses selected date')
        browser.fill('#appointment-time', '14:20')
        check('겹칩니다' in browser.evaluate('document.querySelector("#appointment-error").textContent'), 'Overlapping time is explained inline')
        submit()
        check(browser.evaluate('!!document.querySelector(".modal")'), 'Overlapping appointment cannot save')
        browser.fill('#appointment-time', '23:30')
        check('자정' in browser.evaluate('document.querySelector("#appointment-error").textContent'), 'Session crossing midnight is rejected')
        browser.fill('#appointment-time', '15:00')
        browser.fill('#appointment-duration', '60')
        browser.fill('#appointment-type', 'video')
        browser.fill('#appointment-client', 'seoyeon')
        browser.fill('#appointment-note', '<img src=x onerror="window.__noteInjected=true"> 상담 준비')
        check(browser.evaluate('document.querySelector("#appointment-error").textContent') == '', 'Adjacent sessions are allowed')
        browser.screenshot('calendar-form-desktop.png')
        submit()
        check(browser.evaluate('document.querySelectorAll(".agenda-item").length') == 3, 'New session is added alongside existing sessions')
        check(browser.evaluate('document.querySelectorAll(".calendar-day.is-selected .calendar-more").length') == 1, 'Crowded dates show a more count')
        check(browser.evaluate('document.querySelectorAll(".agenda-note img").length') == 0, 'Appointment note HTML is escaped')
        check(browser.evaluate('window.__noteInjected !== true'), 'Appointment note cannot execute script')
        check('동의 대기' in browser.evaluate('document.querySelector(".agenda-item.type-video").textContent'), 'Pending consent does not block schedule management')
        new_id = browser.evaluate('document.querySelector(".agenda-item.type-video [data-edit-appointment]").dataset.editAppointment')
        browser.click(f'[data-edit-appointment="{new_id}"]')
        browser.fill('#appointment-time', '11:00')
        browser.fill('#appointment-duration', '50')
        browser.fill('#appointment-note', '변경된 준비 메모')
        submit()
        check('11:00' in browser.evaluate('document.querySelector(".agenda-item.type-video .agenda-time").textContent'), 'Appointment editing changes time')
        check('변경된 준비 메모' in browser.evaluate('document.querySelector(".agenda-note").textContent'), 'Edited note is retained')
        check(browser.evaluate('document.querySelectorAll(".agenda-item").length') == 3, 'Editing does not duplicate an appointment')
        browser.click(f'[data-cancel-appointment="{new_id}"]')
        check(browser.evaluate('document.querySelectorAll(".agenda-item").length') == 2, 'Appointment cancellation removes session')
        check(not browser.evaluate('document.querySelector("#toast").inert'), 'Undo feedback is interactive while visible')
        browser.click('[data-action="undo-cancel-appointment"]')
        check(browser.evaluate('document.querySelectorAll(".agenda-item").length') == 3, 'Undo restores canceled appointment')
        browser.click('[data-edit-appointment="sample-1"]')
        browser.fill('#appointment-date', '2028-02-29')
        browser.fill('#appointment-time', '10:00')
        submit()
        check(browser.evaluate('document.querySelector(".calendar-day.is-selected").dataset.calendarDate') == '2028-02-29', 'Date edit moves calendar to leap day')
        browser.click('[data-action="calendar-next"]')
        check(browser.evaluate('document.querySelector(".calendar-day.is-selected").dataset.calendarDate') == '2028-03-29', 'Month navigation preserves selected day')
        browser.click('[data-action="calendar-prev"]')
        browser.click('[data-calendar-date="2028-02-29"]')
        key('ArrowRight')
        check(browser.evaluate('document.activeElement.dataset.calendarDate') == '2028-03-01', 'Keyboard handles leap-day boundary')
        key('PageUp')
        check(browser.evaluate('document.activeElement.dataset.calendarDate') == '2028-02-01', 'PageUp moves one month and keeps focus in calendar')
        browser.click('[data-action="calendar-today"]')
        browser.click('[data-page="overview"]')
        check(browser.evaluate('document.querySelectorAll(".schedule-item").length') == 2, 'Dashboard uses updated calendar data')
        browser.click('[data-page="clients"]')
        browser.fill('#client-search', '김지우')
        check(browser.evaluate('document.querySelectorAll(".client-table tbody tr").length') == 1, 'Client search still works')
        browser.click('[data-client="jiwoo"]')
        browser.command('Emulation.setEmulatedMedia', {'media': 'print'})
        check(browser.evaluate('getComputedStyle(document.querySelector(".topbar")).display') == 'none', 'Print hides sticky navigation')
        check(browser.evaluate('getComputedStyle(document.querySelector(".report-paper")).display') != 'none', 'Print keeps report content')
        browser.command('Emulation.setEmulatedMedia', {'media': ''})
        browser.click('[data-action="appointment"]')
        check(browser.evaluate('document.querySelector("#appointment-client").value') == 'jiwoo', 'Report opens calendar form with correct client')
        key('Escape')
        browser.click('[data-page="schedule"]')
        browser.command('Emulation.setEmulatedMedia', {'features': [{'name': 'prefers-reduced-motion', 'value': 'reduce'}, {'name': 'prefers-reduced-transparency', 'value': 'reduce'}]})
        check(browser.evaluate('getComputedStyle(document.querySelector(".calendar-day")).transitionDuration') == '0s', 'Reduced motion disables calendar motion')
        check(browser.evaluate('getComputedStyle(document.querySelector(".topbar")).backdropFilter') == 'none', 'Reduced transparency removes blur')
        browser.command('Emulation.setEmulatedMedia', {'features': [{'name': 'prefers-contrast', 'value': 'more'}]})
        check(browser.evaluate('getComputedStyle(document.querySelector(".calendar-card")).borderTopColor') == 'rgb(82, 105, 88)', 'Increased contrast adds defined borders')
        browser.command('Emulation.setEmulatedMedia', {'features': []})
        browser.size(390, 844)
        browser.click('[data-action="new-appointment"]')
        check(browser.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Appointment dialog fits mobile screen')
        browser.screenshot('calendar-form-mobile.png')
        key('Escape')
        open_page('counselor.html', '#schedule', '.calendar-card')
        check(browser.evaluate('document.querySelectorAll(".agenda-item").length') == 2, 'Refresh resets prototype schedules to sample data')
        check(not browser.errors, f'No uncaught JavaScript errors ({len(browser.errors)})')
        print(f'\n{len(checks)} checks passed. Screenshots: {ARTIFACTS}')
    finally:
        browser.close()


if __name__ == '__main__':
    run()
