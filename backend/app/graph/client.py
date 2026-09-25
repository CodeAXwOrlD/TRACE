try:
    import pyTigerGraph as tg
except ImportError:
    tg = None
import os
import requests
from dotenv import load_dotenv

# Ensure backend environment variables are available
load_dotenv(override=True)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"), override=True)


class TigerGraphClient:
    def __init__(self):
        self.host = os.environ.get("TG_HOST") or os.environ.get("TIGERGRAPH_HOST", "")
        self.graphname = os.environ.get("TG_GRAPHNAME") or os.environ.get("TIGERGRAPH_GRAPH", "FraudCaseGraph")
        self.token = os.environ.get("TG_TOKEN") or os.environ.get("TIGERGRAPH_TOKEN") or os.environ.get("TG_SECRET", "")
        self.real_mode = os.environ.get("REAL_MODE", "false").lower() == "true"
        self.mock_mode = os.environ.get("BACKEND_MOCK_MODE", "false").lower() == "true"
        self.conn = None
        self._last_ping_ok = False

    def connect(self):
        if self.mock_mode or tg is None or not self._has_real_credentials():
            return None
        try:
            self.conn = tg.TigerGraphConnection(
                host=self.host,
                graphname=self.graphname,
                apiToken=self.token,
            )
            return self.conn
        except Exception:
            self.conn = None
            return None

    def _has_real_credentials(self) -> bool:
        """Ignore .env.example placeholders; they are not a live configuration."""
        values = (self.host, self.token)
        return all(value and "your_" not in value.lower() and "your-" not in value.lower() for value in values)

    def ping(self) -> bool:
        """Pings real TigerGraph instance. Returns False if in mock mode, tg missing, or unreachable."""
        self.host = os.environ.get("TG_HOST") or os.environ.get("TIGERGRAPH_HOST") or self.host
        self.token = os.environ.get("TG_TOKEN") or os.environ.get("TG_SECRET") or self.token
        if self.mock_mode or tg is None or not self._has_real_credentials():
            return False
        try:
            response = requests.get(
                f"{self.host.rstrip('/')}/restpp/echo",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=(2.0, 4.0),
            )
            self._last_ping_ok = response.status_code == 200
            return self._last_ping_ok
        except Exception:
            self._last_ping_ok = False
            return False

    def get_status(self, force_check: bool = False) -> str:
        """Returns a status backed by an actual ping or simulation toggle."""
        if os.environ.get("TG_SIMULATE_CONNECTED", "false").lower() == "true":
            return "connected"
        if self.mock_mode:
            return "disconnected"
        import time
        now = time.time()
        # Check every 10s if connected, or every 3s if currently disconnected
        interval = 10 if getattr(self, "_last_ping_ok", False) else 3
        if force_check or (now - getattr(self, "_last_ping_time", 0) > interval):
            self._last_ping_time = now
            self.ping()
        if self._last_ping_ok:
            return "connected"
        return "disconnected"

    def mark_connected(self) -> None:
        """Called by graph operations only after a successful live response."""
        self._last_ping_ok = True

    def connection_state(self) -> str:
        """UI-friendly single source of truth for graph connectivity."""
        return "CONNECTED" if self.get_status() == "connected" else "OFFLINE"


client = TigerGraphClient()
