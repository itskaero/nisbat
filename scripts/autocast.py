#!/usr/bin/env python3
"""
Keep Nisbat Home on a Chromecast — the "auto cast" part of using Nisbat as the
Chromecast dashboard.

Every --interval seconds this checks the Chromecast. When it is idle (showing
the stock backdrop/ambient mode, or nothing), it launches Nisbat. It never
interrupts something else that is casting (YouTube, Netflix, …).

Two ways to launch:
  * --app-id XXXXXXXX  Your own registered Nisbat receiver (recommended): the
                       /cast page of your Nisbat server, registered as a Custom
                       Receiver in the Google Cast SDK Developer Console.
  * no --app-id        Uses the open-source DashCast receiver to show
                       <url>/?tv=1. Quickest to try, but depends on a
                       third-party receiver page.

It only shows Nisbat when the Chromecast is the TV's current input: if the
family is watching cable/dish on another HDMI input, it leaves the TV alone.

Run it on an always-on machine on the same network as the Chromecast (the PC,
NAS or Raspberry Pi that runs Nisbat is ideal), or with docker compose:

  pip install pychromecast
  python3 scripts/autocast.py --device "Living Room TV" --host 192.168.1.44 --url http://192.168.1.20:3080

Every option can also be set with an environment variable (CAST_DEVICE,
CAST_HOST, NISBAT_URL, CAST_APP_ID, CAST_INTERVAL, CAST_QUIET).
"""
import argparse
import datetime as dt
import logging
import json
import os
import queue
import socket
import sys
import threading
import time
import urllib.parse
import urllib.request

try:
    import pychromecast
    from pychromecast.config import APP_BACKDROP, APP_DASHCAST
    from pychromecast.controllers.dashcast import DashCastController
except ImportError:  # pragma: no cover
    sys.exit("pychromecast is required: pip install pychromecast")

log = logging.getLogger("nisbat-autocast")


def find_device(name: str, known_hosts: list[str] | None):
    log.info('Looking for "%s"%s…', name, f" at {', '.join(known_hosts)}" if known_hosts else " on the network (use --host <ip> if this is slow)")
    casts, browser = pychromecast.get_listed_chromecasts(friendly_names=[name], known_hosts=known_hosts, timeout=15)
    if not casts:
        browser.stop_discovery()
        return None, None
    cast = casts[0]
    cast.wait(timeout=15)
    log.info("Connected to %s at %s; it is showing %s", name, cast.cast_info.host, cast.app_display_name or "nothing")
    return cast, browser


def decide(app_id: str | None, status_text: str | None, active_input: bool | None, take_over_input: bool) -> str:
    """What to do this round: "launch", "relaunch" or a reason to leave the TV alone.

    pychromecast's cast.is_idle is deliberately not used: it is also True when
    the TV is on another HDMI input, which would pull the TV away from cable.
    """
    if active_input is False and not take_over_input:
        return "TV is on another input; leaving it alone"
    if app_id is None or app_id == APP_BACKDROP:
        return "launch"
    if app_id == APP_DASHCAST:
        # DashCast left on "Waiting for address" (e.g. an earlier attempt was cut off).
        return "ok" if "nisbat" in (status_text or "").lower() else "relaunch"
    return "busy"


def in_quiet_hours(spec: str | None, now: dt.time) -> bool:
    """spec like "23:00-06:00" (may wrap past midnight)."""
    if not spec:
        return False
    start_s, end_s = spec.split("-")
    start, end = (dt.time.fromisoformat(x.strip()) for x in (start_s, end_s))
    return start <= now < end if start < end else now >= start or now < end


def server_up(url: str) -> bool:
    try:
        with urllib.request.urlopen(url.rstrip("/") + "/api/health", timeout=5) as res:
            return res.status == 200
    except Exception:
        return False


DASHCAST_NS = "urn:x-cast:com.madmod.dashcast"


def wait_until(check, timeout: float) -> bool:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if check():
            return True
        time.sleep(0.5)
    return False


def dashcast_ready(cast) -> bool:
    """DashCast is running AND its message channel is connected (sending earlier is silently lost)."""
    sc = cast.socket_client
    return cast.app_id == APP_DASHCAST and DASHCAST_NS in (sc.app_namespaces or []) and sc.destination_id is not None


def entry_url(url: str, path: str = "/") -> str:
    """The TV frontend (/tv/) when the server has it, else the website in TV mode."""
    base = url.rstrip("/")
    try:
        with urllib.request.urlopen(base + "/tv/", timeout=5) as res:
            if res.status == 200:
                return f"{base}/tv/#{path}"
    except Exception:
        pass
    return f"{base}{path}{'&' if '?' in path else '?'}tv=1"


def listen_for_cast_requests(url: str, requests: "queue.Queue[dict]"):
    """Follow /api/cast/events ("Show on TV" from the app/website); reconnect forever."""
    while True:
        try:
            with urllib.request.urlopen(url.rstrip("/") + "/api/cast/events", timeout=60) as res:
                log.info("Listening for 'Show on TV' requests")
                event = None
                for raw in res:
                    line = raw.decode("utf-8", "replace").strip()
                    if line.startswith("event: "):
                        event = line[7:]
                    elif line.startswith("data: ") and event == "cast":
                        try:
                            requests.put(json.loads(line[6:]))
                        except ValueError:
                            pass
                    elif not line:
                        event = None
        except Exception as e:  # server restarting, network blip, idle timeout
            log.debug("Cast request feed: %s", e)
        time.sleep(5)


def advertise(url: str):
    """Announce the server as _nisbat._tcp so the Android app finds it on Wi-Fi."""
    try:
        from zeroconf import ServiceInfo, Zeroconf
    except ImportError:
        return None
    u = urllib.parse.urlparse(url)
    try:
        ip = socket.gethostbyname(u.hostname or "")
    except OSError:
        log.warning("Could not resolve %s for discovery", u.hostname)
        return None
    name = os.environ.get("NISBAT_NAME", "Nisbat Home")
    info = ServiceInfo(
        "_nisbat._tcp.local.",
        f"{name}._nisbat._tcp.local.",
        addresses=[socket.inet_aton(ip)],
        port=u.port or 80,
        properties={"path": "/", "v": "2"},
        server=f"nisbat-{ip.replace('.', '-')}.local.",
    )
    zc = Zeroconf()
    try:
        zc.register_service(info, allow_name_change=True)
    except Exception as e:
        log.warning("Discovery announcement failed: %s", e)
        zc.close()
        return None
    log.info("Announcing %s at %s:%s for the Android app", name, ip, u.port or 80)
    return zc


def launch(cast, url: str, app_id: str | None, path: str = "/"):
    if app_id:
        log.info("Launching Nisbat receiver %s", app_id)
        cast.start_app(app_id, force_launch=True)
        if not wait_until(lambda: cast.app_id == app_id, 30):
            raise RuntimeError("The Chromecast did not start the Nisbat receiver")
        log.info("Nisbat receiver is running")
        return

    target = entry_url(url, path)
    dash = DashCastController()
    cast.register_handler(dash)
    if cast.app_id != APP_DASHCAST:
        log.info("Starting DashCast on the Chromecast")
        cast.start_app(APP_DASHCAST)
    # Wait for DashCast's page to load and register its message channel; the
    # URL sent before that never arrives and the TV stays on "Waiting for address".
    log.info("Waiting for DashCast to be ready…")
    if not wait_until(lambda: dashcast_ready(cast), 30):
        sc = cast.socket_client
        raise RuntimeError(
            f"DashCast did not become ready (app={cast.app_id}, namespaces={sc.app_namespaces}, transport={sc.destination_id})"
        )
    for attempt in range(1, 4):
        log.info("Sending %s to DashCast (attempt %d)", target, attempt)
        try:
            # force=True: DashCast navigates the whole screen to the URL, which also
            # works for plain-http LAN addresses (an iframe would be blocked).
            dash.send_message({"url": target, "force": True, "reload": False, "reload_time": 0}, inc_session_id=True)
        except Exception as e:  # channel not connected yet: wait and retry
            log.warning("Send failed: %s", e)
            time.sleep(3)
            continue
        log.info("URL sent; the TV should show Nisbat within a few seconds")
        time.sleep(5)  # let the message leave before we disconnect
        return
    raise RuntimeError("Could not send the URL to DashCast")


def main():
    env = os.environ.get
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--device", default=env("CAST_DEVICE"), help='Chromecast name as shown in Google Home, e.g. "Living Room TV"')
    p.add_argument("--url", default=env("NISBAT_URL"), help="Base URL of your Nisbat server as the Chromecast sees it")
    p.add_argument("--app-id", default=env("CAST_APP_ID") or None, help="Cast App ID of your registered Nisbat receiver (/cast)")
    p.add_argument("--host", action="append", help="Chromecast IP (repeatable); faster and works where mDNS is blocked")
    p.add_argument("--interval", type=int, default=int(env("CAST_INTERVAL") or 60), help="Seconds between checks (default 60)")
    p.add_argument("--quiet", default=env("CAST_QUIET") or None, help='Do not launch during these hours, e.g. "23:00-06:00"')
    p.add_argument("--take-over-input", action="store_true", help="Launch even when the TV is on another HDMI input")
    p.add_argument("--once", action="store_true", help="Cast once (if idle) and exit")
    p.add_argument("-v", "--verbose", action="store_true")
    args = p.parse_args()
    if not args.host and env("CAST_HOST"):
        args.host = [h.strip() for h in env("CAST_HOST").split(",") if h.strip()]
    if not args.device:
        p.error("--device (or CAST_DEVICE) is required")
    if not args.app_id and not args.url:
        p.error("--url (or NISBAT_URL) is required when --app-id is not given")
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO, format="%(asctime)s %(message)s")

    requests: "queue.Queue[dict]" = queue.Queue()
    zc = None
    if args.url and not args.once:
        threading.Thread(target=listen_for_cast_requests, args=(args.url, requests), daemon=True).start()
        zc = advertise(args.url)

    asked: dict | None = None  # a "Show on TV" request being handled this round
    while True:
        cast, browser = None, None
        force = bool(asked and asked.get("force"))
        path = (asked or {}).get("path") or "/"
        if asked:
            log.info("Show on TV requested (%s)%s", path, " - forced" if force else "")
        if in_quiet_hours(args.quiet, dt.datetime.now().time()) and not asked:
            log.debug("Quiet hours (%s); not launching", args.quiet)
        elif args.url and not server_up(args.url):
            log.warning("Nisbat is not answering at %s; not casting an error page", args.url)
        else:
            cast, browser = find_device(args.device, args.host)
            if not cast:
                log.warning('Chromecast "%s" not found; retrying in %ss', args.device, args.interval)
        if cast:
            try:
                st = cast.status
                action = decide(cast.app_id, st.status_text if st else None, st.is_active_input if st else None, args.take_over_input or force)
                if force and action == "busy":
                    action = "launch"
                if action == "relaunch":
                    log.info("DashCast is open without Nisbat; restarting it")
                    cast.quit_app()
                    wait_until(lambda: cast.app_id != APP_DASHCAST, 15)
                    action = "launch"
                if action == "launch":
                    launch(cast, args.url or "", args.app_id, path)
                elif action == "ok":
                    log.debug("Nisbat is already on the TV")
                else:
                    log.info("%s", "Busy with %s; leaving it alone" % cast.app_display_name if action == "busy" else action)
            except Exception as e:  # keep the loop alive across network hiccups
                log.warning("Cast attempt failed: %s", e)
            finally:
                cast.disconnect(timeout=5)
                browser.stop_discovery()
        if args.once:
            break
        try:
            asked = requests.get(timeout=args.interval)
        except queue.Empty:
            asked = None
    if zc:
        zc.close()


if __name__ == "__main__":
    main()
