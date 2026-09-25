"""TigerGraph MCP Client Integration for TRACE Agent.

Provides async/sync tool wrappers for interacting with TigerGraph
via TigerGraph MCP server and pyTigerGraph.
"""

import os
import json
import logging
import requests
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

class TigerGraphMCPToolClient:
    """Wrapper that communicates with TigerGraph MCP server or directly via pyTigerGraph."""

    def __init__(
        self,
        host: Optional[str] = None,
        graphname: Optional[str] = None,
        token: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
    ):
        self.host = host or os.environ.get("TG_HOST") or os.environ.get("TIGERGRAPH_HOST") or ""
        self.graphname = graphname or os.environ.get("TG_GRAPHNAME") or os.environ.get("TIGERGRAPH_GRAPH", "FraudCaseGraph")
        self.token = token or os.environ.get("TG_TOKEN") or os.environ.get("TIGERGRAPH_TOKEN") or os.environ.get("TG_SECRET", "")
        self.username = username or os.environ.get("TIGERGRAPH_USERNAME", "tigergraph")
        self.password = password or os.environ.get("TIGERGRAPH_PASSWORD", "")
        self._conn = None

    def get_connection(self):
        if self._conn is not None:
            return self._conn
        if os.environ.get("BACKEND_MOCK_MODE", "true").lower() == "true":
            return None
        configured = any(value and "your_" not in value.lower() and "your-" not in value.lower()
                         for value in (self.token, self.password))
        if not self.host or "your_" in self.host.lower() or "your-" in self.host.lower() or not configured:
            return None
        try:
            # Avoid pyTigerGraph.ping(), which has no exposed timeout and can
            # block the investigation when a Savanna cluster is paused.
            response = requests.get(
                f"{self.host.rstrip('/')}/restpp/echo",
                headers={"Authorization": f"Bearer {self.token}"} if self.token else {},
                timeout=(1.0, 3.0),
            )
            if response.status_code != 200:
                return None
            import pyTigerGraph as tg
            conn = tg.TigerGraphConnection(
                host=self.host,
                graphname=self.graphname,
                username=self.username,
                password=self.password,
                apiToken=self.token if self.token else None,
            )
            self._conn = conn
            return self._conn
        except Exception as e:
            logger.debug(f"TigerGraph cluster unreachable ({self.host}): {e}")
            return None

    def get_entity_neighbors(self, vertex_type: str, vertex_id: str, depth: int = 2) -> Dict[str, Any]:
        """Fetch multi-hop connected subgraph around a vertex."""
        conn = self.get_connection()
        if not conn:
            return {"nodes": [], "edges": [], "error": "TigerGraph connection not available"}
        try:
            vertices = conn.getVerticesById(vertex_type, vertex_id)
            return {"vertex": vertices, "status": "success"}
        except Exception as e:
            logger.error(f"Error querying TigerGraph neighbors for {vertex_type}/{vertex_id}: {e}")
            return {"nodes": [], "edges": [], "error": str(e)}

    def run_gsql_query(self, query_name: str, params: Optional[Dict[str, Any]] = None) -> Any:
        """Run an installed GSQL query."""
        conn = self.get_connection()
        if not conn:
            return None
        try:
            return conn.runInstalledQuery(query_name, params or {})
        except Exception as e:
            logger.error(f"Error running GSQL query {query_name}: {e}")
            return None
