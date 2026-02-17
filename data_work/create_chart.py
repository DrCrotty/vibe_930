"""
Create horizontal bar chart from cleaned BBQ data
"""
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Read cleaned data
df = pd.read_csv('texas_monthly_bbq_restaurants_clean.csv')

# Count restaurants per city
city_counts = df.groupby('city')['name'].nunique().sort_values(ascending=True)

# Create horizontal bar chart
fig, ax = plt.subplots(figsize=(12, max(8, len(city_counts) * 0.35)))
bars = ax.barh(city_counts.index, city_counts.values, color='#8B4513', edgecolor='black', linewidth=0.5)

# Customize
ax.set_xlabel('Number of Top 50 Restaurants', fontsize=13, fontweight='bold')
ax.set_ylabel('City', fontsize=13, fontweight='bold')
ax.set_title('Texas Monthly Top 50 BBQ: Restaurants by City (2021)', 
          fontsize=15, fontweight='bold', pad=20)
ax.grid(axis='x', alpha=0.3, linestyle='--')

# Add value labels on bars
for i, (city, value) in enumerate(city_counts.items()):
    ax.text(value + 0.05, i, str(value), va='center', fontsize=10, fontweight='bold')

plt.tight_layout()

# Save chart
chart_path = 'texas_bbq_by_city_clean.png'
plt.savefig(chart_path, dpi=300, bbox_inches='tight', facecolor='white')
print(f"Bar chart saved to {chart_path}")
plt.close(fig)

print(f"\nTotal cities: {len(city_counts)}")
print(f"Total restaurants: {city_counts.sum()}")
