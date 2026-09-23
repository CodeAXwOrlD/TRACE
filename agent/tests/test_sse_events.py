"""Unit tests for SSE event generation and streaming."""

import asyncio
import json
import unittest
from agent.runner import InvestigationRunner


class TestSSEEvents(unittest.TestCase):
    def test_sse_event_streaming_sequence(self):
        async def run_stream():
            runner = InvestigationRunner()
            state = {
                "case_id": "CASE_STREAM_1",
                "transaction_id": "txn_stream_100",
                "card_id": "card_stream_100",
                "transaction": {
                    "transaction_id": "txn_stream_100",
                    "amount": 750.0,
                    "risk_score": 0.85,
                },
                "connected_cards": ["card_stream_100", "card_other_200"],
            }

            chunks = []
            async for sse_chunk in runner.stream_events(state, artificial_delay=0.0):
                chunks.append(sse_chunk)
            return chunks

        chunks = asyncio.run(run_stream())

        self.assertGreater(len(chunks), 0)

        # Parse event types from chunks
        event_types = []
        for chunk in chunks:
            self.assertTrue(chunk.startswith("event: "))
            lines = chunk.strip().split("\n")
            event_type = lines[0].replace("event: ", "").strip()
            event_types.append(event_type)

            # Validate data payload is valid json
            data_line = lines[1].replace("data: ", "").strip()
            data_obj = json.loads(data_line)
            self.assertEqual(data_obj["type"], event_type)
            self.assertIn("data", data_obj)
            self.assertIn("timestamp", data_obj)

        # Verify key milestone events exist in the stream
        expected_milestones = [
            "investigation_started",
            "evidence_found",
            "graph_analysis_started",
            "graph_analysis_complete",
            "pattern_detected",
            "historical_cases_found",
            "probability_updated",
            "uncertainty_updated",
            "policy_selected",
            "action_generated",
            "investigation_complete",
        ]
        for milestone in expected_milestones:
            self.assertIn(milestone, event_types, f"Missing milestone event: {milestone}")


if __name__ == "__main__":
    unittest.main()
