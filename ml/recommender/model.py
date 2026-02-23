import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
from joblib import dump, load
from typing import List, Tuple, Dict, Any
import os
from datetime import datetime, timedelta


def load_csvs(paths: List[str]) -> pd.DataFrame:
    dfs = []
    for p in paths:
        df = pd.read_csv(p, parse_dates=['Date'], dayfirst=True, date_format='%d/%m/%Y')
        dfs.append(df)
    data = pd.concat(dfs, ignore_index=True)
    data['Date'] = pd.to_datetime(data['Date'], dayfirst=True, errors='coerce')
    data = data.dropna(subset=['Date'])
    return data


def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    # Normalize column names
    df = df.rename(columns=lambda c: c.strip())
    # Clean numeric columns that may contain commas or dashes
    for col in ['12m Low', '12m High', 'Day Low', 'Day High', 'Day Price', 'Previous', 'Change', 'Change%', 'Volume', 'Adjusted Price']:
        if col in df.columns:
            df[col] = df[col].astype(str).str.replace(',', '', regex=False).str.replace('%', '', regex=False)
            df[col] = df[col].replace('-', np.nan).infer_objects(copy=False)
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # Some CSVs use 'Code' for ticker
    if 'Code' in df.columns:
        df = df.rename(columns={'Code': 'Ticker'})
    if 'Name' in df.columns:
        df = df.rename(columns={'Name': 'Name'})

    # Ensure necessary columns
    df = df[['Date', 'Ticker'] + [c for c in ['Day Price', 'Previous', 'Volume'] if c in df.columns] + ([ 'Name'] if 'Name' in df.columns else [])]
    df = df.sort_values(['Ticker', 'Date'])
    return df


def engineer_features(df: pd.DataFrame, window_short: int = 5, window_long: int = 20) -> pd.DataFrame:
    out = []
    tickers = df['Ticker'].unique()
    for t in tickers:
        sub = df[df['Ticker'] == t].copy()
        sub = sub.sort_values('Date')
        sub['price'] = sub['Day Price'].astype(float)
        sub['prev'] = sub['Previous'].astype(float)
        sub['volume'] = sub['Volume'].fillna(0).astype(float)
        sub['ret1'] = sub['price'].pct_change()
        sub['ret5'] = sub['price'].pct_change(window_short)
        sub['ret20'] = sub['price'].pct_change(window_long)
        sub['ma_short'] = sub['price'].rolling(window_short).mean()
        sub['ma_long'] = sub['price'].rolling(window_long).mean()
        sub['volatility'] = sub['ret1'].rolling(window_long).std()
        sub['vol_avg'] = sub['volume'].rolling(window_long).mean()
        # momentum: current price vs long moving average
        sub['momentum'] = (sub['price'] - sub['ma_long']) / sub['ma_long']
        # forward-looking target: pct change after 30 days (approx) -> we use 20 trading days as proxy
        sub['future_ret_20'] = sub['price'].shift(-20) / sub['price'] - 1
        sub['Ticker'] = t
        out.append(sub)
    feat = pd.concat(out, ignore_index=True)
    feat = feat.dropna(subset=['price', 'ma_short', 'ma_long', 'volatility', 'future_ret_20'])
    return feat


def prepare_training_data(feat: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    Xcols = ['price', 'ret1', 'ret5', 'ret20', 'ma_short', 'ma_long', 'volatility', 'vol_avg', 'momentum']
    available = [c for c in Xcols if c in feat.columns]
    X = feat[available].fillna(0).values
    y = feat['future_ret_20'].values
    tickers = feat['Ticker'].values
    return X, y, tickers


def train_and_save_model(X: np.ndarray, y: np.ndarray, model_path: str) -> Dict[str, Any]:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    mse = mean_squared_error(y_test, preds)
    dump(model, model_path)
    return {'model_path': model_path, 'mse': mse}


def load_model(model_path: str):
    if not os.path.exists(model_path):
        raise FileNotFoundError(model_path)
    return load(model_path)


def predict_universe(model, feat: pd.DataFrame, top_n: int = 20) -> pd.DataFrame:
    # Use same features as training
    Xcols = ['price', 'ret1', 'ret5', 'ret20', 'ma_short', 'ma_long', 'volatility', 'vol_avg', 'momentum']
    available = [c for c in Xcols if c in feat.columns]
    X = feat[available].fillna(0).values
    preds = model.predict(X)
    out = feat[['Date', 'Ticker', 'price', 'volatility', 'vol_avg', 'momentum']].copy()
    out['pred_return_20'] = preds
    # keep latest row per ticker (most recent date)
    out_latest = out.sort_values('Date').groupby('Ticker').tail(1)
    out_latest = out_latest.sort_values('pred_return_20', ascending=False)
    return out_latest


def map_to_recommendation(row: pd.Series, user_risk_score: int, portfolio_diversification_score: float, time_horizon: str) -> Dict[str, Any]:
    # risk assessment from volatility
    vol = float(row.get('volatility', 0.0))
    pred = float(row.get('pred_return_20', 0.0))
    ticker = row['Ticker']
    price = row.get('price', None)

    # classify risk by volatility percentile bands (this is a simple heuristic)
    if vol <= 0.01:
        stock_risk = 'Low'
    elif vol <= 0.03:
        stock_risk = 'Medium'
    else:
        stock_risk = 'High'

    # map predicted return to action
    if pred >= 0.08:
        action = 'BUY'
    elif pred <= -0.03:
        action = 'SELL'
    else:
        action = 'HOLD'

    # confidence: combine magnitude of prediction and how it matches user risk
    # Higher predicted return = higher confidence
    # Lower volatility = higher confidence
    # Formula: scale predicted return (0-100%) and reduce by volatility impact
    pred_confidence = min(95, abs(pred) * 500)  # Scale up: 10% return = 50 confidence, 20% = 100 (capped at 95)
    vol_penalty = min(50, vol * 1000)  # Higher volatility reduces confidence (3% vol = 30 point penalty)
    base_confidence = max(10, int(pred_confidence - vol_penalty))
    confidence = base_confidence
    
    # Build confidence explanation
    confidence_factors = []
    confidence_factors.append(f"ML prediction: {pred:.1%} return")
    confidence_factors.append(f"Base confidence: {int(pred_confidence)}%")
    confidence_factors.append(f"Volatility penalty: -{int(vol_penalty)}% (volatility: {vol:.2%})")
    confidence_factors.append(f"Initial score: {base_confidence}%")
    
    # adjust confidence based on user risk profile match
    if user_risk_score <= 40 and stock_risk == 'High' and action == 'BUY':
        old_conf = confidence
        confidence = max(10, int(confidence * 0.5))
        confidence_factors.append(f"⚠️ Risk mismatch: {old_conf}% → {confidence}% (Conservative investor + High-risk stock)")
    elif user_risk_score <= 40 and stock_risk == 'Medium' and action == 'BUY':
        old_conf = confidence
        confidence = max(15, int(confidence * 0.75))
        confidence_factors.append(f"⚠️ Slight mismatch: {old_conf}% → {confidence}% (Conservative investor + Medium-risk stock)")
    elif user_risk_score >= 70 and stock_risk == 'Low' and action == 'BUY':
        old_conf = confidence
        confidence = min(95, int(confidence * 1.15))
        confidence_factors.append(f"✓ Profile bonus: {old_conf}% → {confidence}% (Aggressive investor + Low-risk stock = safer bet)")
    elif user_risk_score >= 70 and stock_risk == 'High' and action == 'BUY':
        confidence_factors.append(f"✓ Profile match: Aggressive investor comfortable with high-risk stocks")
    elif user_risk_score > 40 and user_risk_score < 70 and stock_risk == 'Medium':
        confidence_factors.append(f"✓ Good match: Moderate profile + Medium-risk stock")
    
    confidence_explanation = " | ".join(confidence_factors)

    # potential return bucket
    if pred >= 0.15:
        potential = "+15-25%"
    elif pred >= 0.08:
        potential = "+8-15%"
    elif pred >= 0.03:
        potential = "+3-8%"
    elif pred >= 0:
        potential = "+0-3%"
    else:
        potential = f"{int(pred*100)}%"

    # time horizon mapping simple heuristic
    if time_horizon == 'short':
        horizon = 'Short-term (<1yr)'
    elif time_horizon == 'medium':
        horizon = 'Medium-term (1-3yr)'
    else:
        horizon = 'Long-term (3yr+)'

    reason = f"Model predicts {pred:.2%} return over ~20 trading days; volatility={vol:.2%}."

    return {
        'ticker': ticker,
        'action': action,
        'confidence': confidence,
        'confidence_explanation': confidence_explanation,
        'reason': reason,
        'potential_return': potential,
        'risk_level': stock_risk,
        'time_horizon': horizon,
        'price': price
    }


def merge_realtime_data(historical_df: pd.DataFrame, realtime_data: Dict[str, Any]) -> pd.DataFrame:
    """Merge real-time scraped NSE data with historical data"""
    if not realtime_data or 'stocks' not in realtime_data:
        return historical_df
    
    today = pd.Timestamp(datetime.now().date())
    realtime_rows = []
    
    for stock in realtime_data['stocks']:
        row = {
            'Date': today,
            'Ticker': stock.get('ticker', ''),
            'Day Price': stock.get('price', 0),
            'Previous': stock.get('price', 0) - stock.get('change', 0),
            'Volume': stock.get('volume', 0),
            'Name': stock.get('name', '')
        }
        realtime_rows.append(row)
    
    if realtime_rows:
        rt_df = pd.DataFrame(realtime_rows)
        rt_df['Date'] = pd.to_datetime(rt_df['Date'])
        # Combine with historical data, removing any duplicates for today
        combined = pd.concat([historical_df[historical_df['Date'] < today], rt_df], ignore_index=True)
        return combined
    
    return historical_df


def generate_recommendations(model_path: str, data_paths: List[str], user_profile: Dict[str, Any], top_k: int = 5, realtime_data: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """Generate recommendations using historical data + real-time scraped data
    
    Args:
        model_path: Path to trained model
        data_paths: Paths to historical CSV files
        user_profile: User risk profile and preferences
        top_k: Number of recommendations to return
        realtime_data: Real-time NSE data from scraper (optional)
    """
    df = load_csvs(data_paths)
    df = preprocess(df)
    
    # Merge real-time data if available
    if realtime_data:
        df = merge_realtime_data(df, realtime_data)
    
    feat = engineer_features(df)
    model = load_model(model_path)
    universe = predict_universe(model, feat, top_n=200)

    # basic portfolio/diversification scoring placeholder
    diversification_score = user_profile.get('diversification_score', 0.5)
    user_risk = user_profile.get('risk_score', 50)
    desired_horizon = user_profile.get('time_horizon', 'medium')

    recs = []
    for _, row in universe.head(100).iterrows():
        rec = map_to_recommendation(row, user_risk, diversification_score, desired_horizon)
        # Add company name if available
        ticker = rec['ticker']
        if realtime_data and 'stocks' in realtime_data:
            for stock in realtime_data['stocks']:
                if stock.get('ticker') == ticker:
                    rec['company'] = stock.get('name', ticker)
                    break
        if 'company' not in rec:
            rec['company'] = ticker
        recs.append(rec)

    # sort by confidence and predicted return
    recs_sorted = sorted(recs, key=lambda r: (-r['confidence'], r['risk_level'] == 'Low', -float(r['potential_return'].strip('+%').split('-')[0]) if isinstance(r['potential_return'], str) and r['potential_return'].startswith('+') else 0))
    # return top_k
    return recs_sorted[:top_k]
