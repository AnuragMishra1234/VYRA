"""Dataset Loader Module.

Responsible for discovering, loading, and partitioning raw trajectory benchmark
data without lookahead bias or data leakage.

Inputs: Raw trajectory file paths.
Outputs: Raw unaligned sensor streams as DataFrames / dictionaries.
"""
