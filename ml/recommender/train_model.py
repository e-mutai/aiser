#!/usr/bin/env python3
"""Train a RandomForest model on historical NSE CSVs and save the model file.

Usage:
  python train_model.py --csv /path/to/2023.csv /path/to/2024.csv --out model.joblib
"""
import argparse
from recommender.model import load_csvs, preprocess, engineer_features, prepare_training_data, train_and_save_model


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--csv', nargs='+', required=True, help='Paths to historical CSV files')
    parser.add_argument('--out', required=False, default='ml_model.joblib', help='Output model path')
    args = parser.parse_args()

    print('Loading CSVs...')
    df = load_csvs(args.csv)
    print('Preprocessing...')
    df = preprocess(df)
    print('Engineering features...')
    feat = engineer_features(df)
    print('Preparing training data...')
    X, y, tickers = prepare_training_data(feat)
    print(f'Training on {X.shape[0]} rows...')
    res = train_and_save_model(X, y, args.out)
    print('Saved model to', res['model_path'])
    print('MSE on held-out set:', res['mse'])

if __name__ == '__main__':
    main()
