import sys
sys.path.insert(0, '/home/indmadmax/Downloads/TRACE-member1')
from backend.app.data.dataset_loader import load_case_pack, load_closed_cases

cases = load_case_pack()
closed = load_closed_cases()
print(f'✅ case_pack.csv loaded: {len(cases)} benchmark cases')
print(f'✅ closed_cases_history.csv loaded: {len(closed)} historical cases')
print('\nFirst 5 benchmark cases:')
for c in cases[:5]:
    cid = c["id"]
    cust = c["customerId"]
    card = c["cardId"]
    txn = c["flaggedTxnId"]
    risk = c["riskScore"]
    print(f'  {cid} | customer={cust} | card={card} | txn={txn} | risk={risk}')
