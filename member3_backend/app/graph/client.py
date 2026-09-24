import pyTigerGraph as tg
import os

class TigerGraphClient:
    def __init__(self):
        self.host = os.environ.get("TIGERGRAPH_HOST", "http://localhost:9000")
        self.graphname = os.environ.get("TIGERGRAPH_GRAPH", "AntiFraudGraph")
        self.token = os.environ.get("TIGERGRAPH_TOKEN", "")
        self.mock_mode = os.environ.get("BACKEND_MOCK_MODE", "false").lower() == "true"
        self.conn = None

    def connect(self):
        if self.mock_mode:
            return
        self.conn = tg.TigerGraphConnection(
            host=self.host,
            graphname=self.graphname,
            apiToken=self.token
        )

    def ping(self):
        if self.mock_mode:
            return True
        if not self.conn:
            self.connect()
        # In a real scenario, ping the database
        return True

client = TigerGraphClient()
