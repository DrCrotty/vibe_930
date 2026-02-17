"""
Clean the scraped BBQ data by removing duplicates
"""
import pandas as pd

# Read the data
df = pd.read_csv('texas_monthly_bbq_restaurants.csv')

print(f"Original data: {len(df)} rows")
print(f"Unique restaurants: {df['name'].nunique()}")

# Remove duplicates based on name, city, and year
df_clean = df.drop_duplicates(subset=['name', 'city', 'year'], keep='first')

print(f"\nAfter removing duplicates: {len(df_clean)} rows")
print(f"Unique restaurants: {df_clean['name'].nunique()}")

# Save cleaned data
df_clean.to_csv('texas_monthly_bbq_restaurants_clean.csv', index=False)
print("\nCleaned data saved to texas_monthly_bbq_restaurants_clean.csv")

# Display summary
print(" \n" + "="*60)
print("CLEANED DATA SUMMARY")
print("="*60)
print(f"\nTop 10 cities by unique restaurants:")
city_counts = df_clean.groupby('city')['name'].nunique().sort_values(ascending=False)
print(city_counts.head(10))

print(f"\n\nSample of cleaned data:")
print(df_clean[['name', 'city', 'year', 'latitude', 'longitude']].head(15))
