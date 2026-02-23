#!/usr/bin/env python3
"""Generate recommendations by loading a saved model and historical CSVs.

Usage:
  python predict.py --model ml_model.joblib --csv 2023.csv 2024.csv --risk 60 --horizon medium --top 5
  python predict.py --model ml_model.joblib --csv 2023.csv 2024.csv --risk 60 --horizon medium --top 5 --realtime realtime.json

Outputs JSON list to stdout.
"""
import argparse
import json
import sys
from recommender.model import generate_recommendations


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', required=True, help='Path to saved model.joblib')
    parser.add_argument('--csv', nargs='+', required=True, help='Paths to historical CSV files')
    parser.add_argument('--risk', type=int, default=50, help='User risk score 0-100')
    parser.add_argument('--horizon', choices=['short','medium','long'], default='medium', help='User time horizon')
    parser.add_argument('--top', type=int, default=5, help='Number of recommendations')
    parser.add_argument('--realtime', type=str, help='Path to JSON file with real-time NSE data or JSON string')
    args = parser.parse_args()

    user_profile = {
        'risk_score': args.risk,
        'time_horizon': args.horizon,
        'diversification_score': 0.5
    }

    # Load real-time data if provided
    realtime_data = None
    if args.realtime:
        try:
            # Try to parse as JSON string first
            realtime_data = json.loads(args.realtime)
        except json.JSONDecodeError:
            # If that fails, try to load as file
            try:
                with open(args.realtime, 'r') as f:
                    realtime_data = json.load(f)
            except FileNotFoundError:
                print(f"Warning: Real-time data file not found: {args.realtime}", file=sys.stderr)
            except Exception as e:
                print(f"Warning: Could not load real-time data: {e}", file=sys.stderr)

    recs = generate_recommendations(args.model, args.csv, user_profile, top_k=args.top, realtime_data=realtime_data)
    print(json.dumps(recs, indent=2))

if __name__ == '__main__':
    main()
