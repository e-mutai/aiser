#!/usr/bin/env python3
"""Generate recommendations by loading a saved model and historical CSVs.

Usage:
  python predict.py --model ml_model.joblib --csv 2023.csv 2024.csv --risk 60 --horizon medium --top 5

Outputs JSON list to stdout.
"""
import argparse
import json
from recommender.model import generate_recommendations


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', required=True, help='Path to saved model.joblib')
    parser.add_argument('--csv', nargs='+', required=True, help='Paths to historical CSV files')
    parser.add_argument('--risk', type=int, default=50, help='User risk score 0-100')
    parser.add_argument('--horizon', choices=['short','medium','long'], default='medium', help='User time horizon')
    parser.add_argument('--top', type=int, default=5, help='Number of recommendations')
    args = parser.parse_args()

    user_profile = {
        'risk_score': args.risk,
        'time_horizon': args.horizon,
        'diversification_score': 0.5
    }

    recs = generate_recommendations(args.model, args.csv, user_profile, top_k=args.top)
    print(json.dumps(recs, indent=2))

if __name__ == '__main__':
    main()
