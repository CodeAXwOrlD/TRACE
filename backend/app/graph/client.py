try:
    import pyTigerGraph as tg
except ImportError:
    tg = None
import os


class TigerGraphClient:
    def __init__(self):
        self.host = os.environ.get("TG_HOST") or os.environ.get("TIGERGRAPH_HOST", "http://localhost:9000")
        self.graphname = os.environ.get("TG_GRAPHNAME") or os.environ.get("TIGERGRAPH_GRAPH", "FraudCaseGraph")
        self.token = os.environ.get("TG_TOKEN") or os.environ.get("TIGERGRAPH_TOKEN") or os.environ.get("TG_SECRET", "")
        self.username = os.environ.get("TIGERGRAPH_USERNAME", "tigergraph")
        self.password = os.environ.get("TIGERGRAPH_PASSWORD", "")
        self.mock_mode = os.environ.get("BACKEND_MOCK_MODE", "true").lower() == "true"
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

