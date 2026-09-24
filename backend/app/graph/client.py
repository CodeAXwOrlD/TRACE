try:
    import pyTigerGraph as tg
except ImportError:
    tg = None
import os
from dotenv import load_dotenv

# Ensure backend environment variables are available
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))


class TigerGraphClient:
    def __init__(self):
        self.host = os.environ.get("TG_HOST", "http://localhost:9000")
        self.graphname = os.environ.get("TG_GRAPHNAME", "FraudCaseGraph")
        self.token = os.environ.get("TG_TOKEN") or os.environ.get("TG_SECRET", "")
        self.mock_mode = os.environ.get("BACKEND_MOCK_MODE", "false").lower() == "true"
        self.conn = None

    def connect(self):
        if self.mock_mode or tg is None:
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

    def ping(self) -> bool:
        """Pings real TigerGraph instance. Returns False if in mock mode, tg missing, or unreachable."""
        if self.mock_mode or tg is None:
            return False
        try:
            if not self.conn:
                self.connect()
            if not self.conn:
                return False
            res = self.conn.ping()
            return bool(res)
        except Exception:
            return False

    def get_status(self) -> str:
        """Returns honest TigerGraph status: 'connected', 'mock', or 'disconnected'."""
        if self.mock_mode:
            return "mock"
        if self.ping():
            return "connected"
        return "disconnected"


client = TigerGraphClient()

