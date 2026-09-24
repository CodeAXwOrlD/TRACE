"""Generate 20 benchmark case answer files for TRACE hackathon evaluation.

Reads data/raw/case_pack.csv and executes the complete agent workflow on each case,
writing structured evaluation JSON files to cases/HHG-001.json through cases/HHG-020.json.
"""

import json
import logging
import os
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend.app.data.dataset_loader import (
    load_case_pack,
    build_initial_state_for_case,
)
from agent.runner import InvestigationRunner

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("generate_cases")


def main():
    cases_dir = root_dir / "cases"
    cases_dir.mkdir(parents=True, exist_ok=True)

    case_pack = load_case_pack()
    logger.info("Loaded %d benchmark cases from case_pack.csv", len(case_pack))

    runner = InvestigationRunner()
    success_count = 0

    for idx, case in enumerate(case_pack, 1):
        cid = case["caseId"]
        filename = f"{cid}.json"
        out_path = cases_dir / filename

        logger.info("[%d/%d] Investigating case %s (Txn %s)...", idx, len(case_pack), cid, case["flaggedTxnId"])

        initial_state = build_initial_state_for_case(cid)
        if not initial_state:
            logger.error("Failed to build initial state for %s", cid)
            continue

        try:
            contract = runner.run(initial_state)
            contract_dict = contract.model_dump()

            # Write clean formatted JSON
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(contract_dict, f, indent=2, ensure_ascii=False)

            logger.info("Saved %s -> Verdict: %s | Pattern: %s | Policy: %s", filename, contract.verdict, contract.pattern, contract.policy)
            success_count += 1
        except Exception as e:
            logger.error("Error investigating %s: %s", cid, e, exc_info=True)

    logger.info("Successfully generated %d/%d benchmark case answer files in %s", success_count, len(case_pack), cases_dir)


if __name__ == "__main__":
    main()
