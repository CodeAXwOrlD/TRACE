import polars as pl
import os

def load_csv(file_path: str) -> pl.DataFrame:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    return pl.read_csv(file_path)

def validate_dataframe(df: pl.DataFrame, required_columns: list) -> bool:
    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    return True
