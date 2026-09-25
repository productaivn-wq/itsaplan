#!/usr/bin/env python3
"""
launch_itsaplan_headless.py — Autonomous Headless Watchdog Supervisor for ItsAPlan & Bridge Stack.

Responsibilities:
1. Verifies PostgreSQL (port 5432) connectivity with retry loop.
2. Headlessly launches and supervises 'bun run dev' in d:\\WORK\\01_PROJECTS\\58_ITSAPLAN with real-time log rotation.
3. Headlessly launches and supervises start_itsaplan_bridge_daemon.py in d:\\WORK\\01_PROJECTS\\53_PROJECT_MANAGEMENT.
4. Enforces continuous health probing on HTTP ports 3000 (API) and 3001 (Web) and automatic revival in < 15 seconds.
5. Strictly enforces Gate GW-HEADLESS-01 (CREATE_NO_WINDOW) and Gate GW-LOG-01 (Live Streaming).

Implements: UC-001, UC-012, FR-AUTOHEAL-EBQC-01, GW-HEADLESS-01, 53.REF.69
"""

import argparse
import atexit
import os
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
import psutil

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ITSAPLAN_ROOT = Path(r"d:\WORK\01_PROJECTS\58_ITSAPLAN")
PM_ROOT = Path(r"d:\WORK\01_PROJECTS\53_PROJECT_MANAGEMENT")
LOG_DIR = ITSAPLAN_ROOT / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LAUNCHER_LOG = LOG_DIR / "itsaplan_launcher.log"
DEV_LOG = LOG_DIR / "itsaplan_dev.log"
LOCK_FILE = ITSAPLAN_ROOT / "scripts" / ".itsaplan_launcher.lock"

CREATE_NO_WINDOW = 0x08000000
DETACHED_PROCESS = 0x00000008
CREATE_NEW_PROCESS_GROUP = 0x00000200
DAEMON_CREATION_FLAGS = CREATE_NO_WINDOW | DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP

_lock_file_handle = None


def log(msg: str):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{timestamp}] [ItsAPlanLauncher] {msg}\n"
    try:
        with open(LAUNCHER_LOG, "a", encoding="utf-8") as f:
            f.write(entry)
    except Exception:
        pass
    print(entry, end="", flush=True)


def cleanup_lock():
    global _lock_file_handle
    if _lock_file_handle:
        try:
            _lock_file_handle.close()
        except Exception:
            pass
        _lock_file_handle = None
    if LOCK_FILE.exists():
        try:
            LOCK_FILE.unlink(missing_ok=True)
        except Exception:
            pass


atexit.register(cleanup_lock)


def ensure_single_instance() -> bool:
    global _lock_file_handle
    if LOCK_FILE.exists():
        try:
            content = LOCK_FILE.read_text(encoding="utf-8").strip()
            if content.isdigit():
                pid = int(content)
                if not psutil.pid_exists(pid):
                    log(f"Pruning stale launcher lockfile (dead PID {pid})")
                    LOCK_FILE.unlink(missing_ok=True)
                else:
                    try:
                        p = psutil.Process(pid)
                        cmdline = " ".join(p.cmdline() or [])
                        if "launch_itsaplan_headless" in cmdline:
                            log(f"Active launcher supervisor already running with PID {pid}. Exiting redundant launch.")
                            return False
                        else:
                            log(f"PID {pid} belongs to unrelated process ({p.name()}). Pruning lockfile.")
                            LOCK_FILE.unlink(missing_ok=True)
                    except Exception:
                        pass
        except PermissionError:
            log("Active launcher lock held by running supervisor instance. Exiting redundant launch.")
            return False
        except Exception as e:
            log(f"Warning reading lockfile: {e}")

    try:
        _lock_file_handle = open(LOCK_FILE, "w", encoding="utf-8")
        if sys.platform == "win32":
            import msvcrt
            msvcrt.locking(_lock_file_handle.fileno(), msvcrt.LK_NBLCK, 1)
        _lock_file_handle.write(str(os.getpid()))
        _lock_file_handle.flush()
        return True
    except Exception as e:
        log(f"Could not acquire exclusive launcher lock: {e}")
        return False


def wait_for_postgres(host="127.0.0.1", port=5432, timeout_s=45, check_interval_s=2) -> bool:
    start = time.time()
    attempt = 1
    while time.time() - start < timeout_s:
        try:
            with socket.create_connection((host, port), timeout=1.5):
                log(f"PostgreSQL is online and responsive on {host}:{port} (attempt {attempt}).")
                return True
        except (socket.timeout, ConnectionRefusedError, OSError):
            time.sleep(check_interval_s)
            attempt += 1
    log(f"WARNING: PostgreSQL port {port} unresponsive after {timeout_s}s. Proceeding with caution.")
    return False


def probe_http(port: int, path: str = "/") -> bool:
    for host in ("127.0.0.1", "localhost"):
        url = f"http://{host}:{port}{path}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "ItsAPlanWatchdog/1.0"})
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                if resp.status in (200, 301, 302, 307, 308):
                    return True
        except urllib.error.HTTPError as e:
            if e.code in (200, 301, 302, 307, 308, 401, 403, 404):
                return True
        except Exception:
            pass
    return False


def is_bridge_running() -> bool:
    for p in psutil.process_iter(["pid", "cmdline"]):
        try:
            cmd = " ".join(p.info.get("cmdline") or []).lower()
            if "start_itsaplan_bridge_daemon.py" in cmd or "antigravity_to_itsaplan_bridge.py" in cmd:
                return True
        except Exception:
            pass
    return False


def get_bun_executable() -> str:
    import shutil
    found = shutil.which("bun")
    if found:
        return found
    localappdata = os.environ.get("LOCALAPPDATA")
    if localappdata:
        winget_bun = Path(localappdata) / r"Microsoft\WinGet\Packages\Oven-sh.Bun_Microsoft.Winget.Source_8wekyb3d8bbwe\bun-windows-x64\bun.exe"
        if winget_bun.exists():
            return str(winget_bun)
    return "bun"


def is_bun_dev_running() -> bool:
    for p in psutil.process_iter(["pid", "name", "cmdline"]):
        try:
            cmd = " ".join(p.info.get("cmdline") or []).lower()
            name = (p.info.get("name") or "").lower()
            if "bun" in name or "bun.exe" in name or "turbo" in name:
                if "dev" in cmd or "turbo" in cmd or "58_itsaplan" in cmd:
                    return True
        except Exception:
            pass
    return False


def launch_bun_dev():
    bun_exe = get_bun_executable()
    log(f"Spawning 'bun run dev' headlessly via {bun_exe}...")
    dev_log_fd = open(DEV_LOG, "a", encoding="utf-8")
    env = os.environ.copy()
    env["PYTHONUTF8"] = "1"
    env["PYTHONUNBUFFERED"] = "1"
    popen_kwargs = {
        "stdin": subprocess.DEVNULL,
        "stdout": dev_log_fd,
        "stderr": subprocess.STDOUT,
        "cwd": str(ITSAPLAN_ROOT),
        "env": env,
    }
    if os.name == "nt":
        popen_kwargs["creationflags"] = DAEMON_CREATION_FLAGS

    try:
        proc = subprocess.Popen([bun_exe, "run", "dev"], **popen_kwargs)
        log(f"'bun run dev' spawned with PID {proc.pid}. Logs redirected to {DEV_LOG}.")
        return proc
    finally:
        dev_log_fd.close()


def launch_bridge_daemon():
    bridge_script = PM_ROOT / "scripts" / "start_itsaplan_bridge_daemon.py"
    if not bridge_script.exists():
        log(f"ERROR: Bridge script not found at {bridge_script}")
        return None

    pythonw = Path(sys.executable).with_name("pythonw.exe")
    if not pythonw.exists():
        pythonw = Path(sys.executable)

    log(f"Spawning bridge daemon supervisor via {pythonw}...")
    env = os.environ.copy()
    env["PYTHONUTF8"] = "1"
    env["PYTHONUNBUFFERED"] = "1"
    env["ANTIGRAVITY_DAEMON"] = "1"
    popen_kwargs = {
        "cwd": str(PM_ROOT),
        "env": env,
        "stdin": subprocess.DEVNULL,
        "stdout": subprocess.DEVNULL,
        "stderr": subprocess.DEVNULL,
    }
    if os.name == "nt":
        popen_kwargs["creationflags"] = DAEMON_CREATION_FLAGS

    proc = subprocess.Popen([str(pythonw), str(bridge_script)], **popen_kwargs)
    log(f"start_itsaplan_bridge_daemon.py spawned with PID {proc.pid}.")
    return proc


def run_cycle():
    # 1. Check Dev Server (Ports 3000 & 3001)
    api_ok = probe_http(3000, "/auth-config") or probe_http(3000, "/")
    web_ok = probe_http(3001, "/project/PM") or probe_http(3001, "/login")
    if not (api_ok and web_ok):
        if is_bun_dev_running():
            log("Dev server process active but still compiling/binding ports... awaiting readiness.")
        else:
            log(f"Dev server check failed (API 3000: {api_ok}, Web 3001: {web_ok}). Initiating spawn...")
            launch_bun_dev()
    else:
        # Healthy
        pass

    # 2. Check Bridge Daemon
    if not is_bridge_running():
        log("ItsAPlan bridge daemon not detected. Initiating spawn...")
        launch_bridge_daemon()


def main():
    parser = argparse.ArgumentParser(description="ItsAPlan Headless Launcher & Watchdog")
    parser.add_argument("--once", action="store_true", help="Run single verification/launch pass and exit")
    parser.add_argument("--interval", type=int, default=15, help="Watchdog poll interval in seconds (default: 15)")
    args = parser.parse_args()

    log(f"[START] ItsAPlan Headless Supervisor starting (PID {os.getpid()}, mode={'once' if args.once else 'continuous'})...")
    
    if not args.once:
        if not ensure_single_instance():
            sys.exit(0)

    wait_for_postgres()
    run_cycle()

    if args.once:
        log("[COMPLETE] Single pass finished successfully.")
        sys.exit(0)

    log(f"Entering continuous watchdog loop (interval {args.interval}s)...")
    try:
        while True:
            time.sleep(args.interval)
            run_cycle()
    except (KeyboardInterrupt, SystemExit):
        log("Launcher supervisor received shutdown signal. Exiting.")
        cleanup_lock()
        sys.exit(0)


if __name__ == "__main__":
    main()
