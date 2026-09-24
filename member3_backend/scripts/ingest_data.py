import argparse

def ingest_data(data_dir: str):
    print(f"Ingesting data from {data_dir} into TigerGraph...")
    # Read Polars dataframe, transform, and load to TigerGraph.
    # Currently a mock implementation.
    print("Ingestion successful (Mocked).")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest TRACE data into TigerGraph")
    parser.add_argument("--data-dir", default="../../data/raw", help="Path to raw data directory")
    args = parser.parse_args()
    ingest_data(args.data_dir)
