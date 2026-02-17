import pandas as pd

df = pd.read_csv('texas_monthly_bbq_restaurants.csv')

print("="*60)
print("TEXAS MONTHLY BBQ DATA ANALYSIS")
print("="*60)
print(f"\nTotal rows: {len(df)}")
print(f"Unique restaurants: {df['name'].nunique()}")
print(f"\nColumns: {list(df.columns)}")

print(f"\n\nData completeness:")
print(df.notna().sum())

print(f"\n\nTop 10 cities by unique restaurants:")
print(df.groupby('city')['name'].nunique().sort_values(ascending=False).head(10))

print(f"\n\nSample restaurants:")
print(df[['name', 'city', 'year', 'latitude', 'longitude']].head(10))
