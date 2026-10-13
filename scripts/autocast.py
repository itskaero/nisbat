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

Run it on an always-on machine on the same network as the Chromecast (the PC
or Raspberry Pi that runs Nisbat is ideal):

  pip install pychromecast
  python3 scripts/autocast.py --device "Living Room TV" --url http://192.168.1.20:3000
"""
import argparse
import logging
import sys
import time

try:
    import pychromecast
    from pychromecast.config import APP_BACKDROP
    from pychromecast.controllers.dashcast import DashCastController
except ImportError:  # pragma: no cover
    sys.exit("pychromecast is required: pip install pychromecast")

log = logging.getLogger("nisbat-autocast")


def find_device(name: str, known_hosts: list[str] | None):
    casts, browser = pychromecast.get_listed_chromecasts(friendly_names=[name], known_hosts=known_hosts, timeout=15)
    if not casts:
        browser.stop_discovery()
        return None, None
    cast = casts[0]
    cast.wait(timeout=15)
    return cast, browser


def is_free(cast) -> bool:
    """Idle = nothing running, or the stock backdrop (ambient mode)."""
    app = cast.app_id
    return app is None or app == APP_BACKDROP or cast.is_idle


def launch(cast, url: str, app_id: str | None):
    if app_id:
        log.info("Launching Nisbat receiver %s", app_id)
        cast.start_app(app_id, force_launch=True)
    else:
        target = url.rstrip("/") + "/?tv=1"
        log.info("Showing %s via DashCast", target)
        dash = DashCastController()
        cast.register_handler(dash)
        dash.load_url(target, force=True)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--device", required=True, help='Chromecast name as shown in Google Home, e.g. "Living Room TV"')
    p.add_argument("--url", help="Base URL of your Nisbat server (needed without --app-id)")
    p.add_argument("--app-id", help="Cast App ID of your registered Nisbat receiver (/cast)")
    p.add_argument("--host", action="append", help="Chromecast IP, if mDNS discovery doesn't work on your network")
    p.add_argument("--interval", type=int, default=60, help="Seconds between checks (default 60)")
    p.add_argument("--once", action="store_true", help="Cast once (if idle) and exit")
    p.add_argument("-v", "--verbose", action="store_true")
    args = p.parse_args()
    if not args.app_id and not args.url:
        p.error("--url is required when --app-id is not given")
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO, format="%(asctime)s %(message)s")

    while True:
        cast, browser = find_device(args.device, args.host)
        if not cast:
            log.warning('Chromecast "%s" not found; retrying in %ss', args.device, args.interval)
        else:
            try:
                if is_free(cast):
                    launch(cast, args.url or "", args.app_id)
                else:
                    log.debug("Busy with %s; leaving it alone", cast.app_display_name)
            except Exception as e:  # keep the loop alive across network hiccups
                log.warning("Cast attempt failed: %s", e)
            finally:
                cast.disconnect(timeout=5)
                browser.stop_discovery()
        if args.once:
            break
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
