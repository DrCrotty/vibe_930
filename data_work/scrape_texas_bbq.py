"""
Texas Monthly Top 50 BBQ Restaurants Scraper
Scrapes multiple years of Texas Monthly's top BBQ restaurant lists
and creates a comprehensive database with location data.
"""

import pandas as pd
import requests
from bs4 import BeautifulSoup
import time
import re
from urllib.parse import urljoin
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
from texas_city_coords import get_city_coords

# Texas Monthly Top 50 BBQ list URLs (they publish every 4-5 years)
URLS = {
    '2021': 'https://www.texasmonthly.com/interactive/top-50-bbq-2021/',
    '2017': 'https://www.texasmonthly.com/bbq/the-list-the-top-50-barbecue-joints-in-texas/',
    '2013': 'https://www.texasmonthly.com/list/the-top-50-barbecue-joints/',
}

def get_soup(url):
    """Fetch and parse a webpage"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return BeautifulSoup(response.content, 'html.parser')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def extract_restaurant_data_2021(soup):
    """Extract restaurant data from 2021 list format"""
    restaurants = []
    
    # Find all restaurant entries - adjust selectors based on actual page structure
    entries = soup.find_all(['article', 'div'], class_=re.compile(r'restaurant|entry|bbq', re.I))
    
    if not entries:
        # Try alternative selectors
        entries = soup.find_all('div', class_=re.compile(r'item|card|post', re.I))
    
    for entry in entries:
        restaurant = {}
        
        # Extract name
        name_elem = entry.find(['h1', 'h2', 'h3', 'h4'], class_=re.compile(r'title|name|heading', re.I))
        if not name_elem:
            name_elem = entry.find(['h1', 'h2', 'h3', 'h4'])
        if name_elem:
            restaurant['name'] = name_elem.get_text(strip=True)
        
        # Extract all text for better parsing
        all_text = entry.get_text(separator=' ', strip=True)
        
        # Extract location/address - try multiple approaches
        location_elem = entry.find(['p', 'div', 'span'], class_=re.compile(r'location|address|city', re.I))
        if location_elem:
            location_text = location_elem.get_text(strip=True)
            restaurant['raw_location'] = location_text
        else:
            # Try to find location in text
            location_match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*(?:Texas|TX))', all_text, re.IGNORECASE)
            if location_match:
                restaurant['raw_location'] = location_match.group(1)
        
        # Try to parse city from raw_location or all text
        if 'raw_location' in restaurant:
            city_match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*(?:Texas|TX)', restaurant['raw_location'], re.IGNORECASE)
            if city_match:
                restaurant['city'] = city_match.group(1).strip()
        
        if not restaurant.get('city'):
            # Try to extract city from all text
            city_match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*(?:Texas|TX)', all_text, re.IGNORECASE)
            if city_match:
                restaurant['city'] = city_match.group(1).strip()
        
        # Extract description
        desc_elem = entry.find(['p', 'div'], class_=re.compile(r'description|content|excerpt', re.I))
        if desc_elem:
            restaurant['description'] = desc_elem.get_text(strip=True)[:500]
        elif len(all_text) > 100:
            # Use first part of all_text as description
            restaurant['description'] = all_text[:500]
        
        # Extract rank if available
        rank_elem = entry.find(['span', 'div'], class_=re.compile(r'rank|number', re.I))
        if rank_elem:
            rank_text = rank_elem.get_text(strip=True)
            rank_match = re.search(r'\d+', rank_text)
            if rank_match:
                restaurant['rank'] = int(rank_match.group())
        
        # Try to find rank in text if not already found
        if not restaurant.get('rank'):
            rank_match = re.search(r'#?\s*(\d+)', all_text[:50])
            if rank_match and 1 <= int(rank_match.group(1)) <= 100:
                restaurant['rank'] = int(rank_match.group(1))
        
        if restaurant.get('name'):
            restaurants.append(restaurant)
    
    return restaurants

def extract_restaurant_data_generic(soup, year):
    """Generic extraction for older list formats"""
    restaurants = []
    
    # Look for common patterns in BBQ list articles
    # Strategy 1: Find ordered/numbered lists
    list_items = soup.find_all(['li', 'div'], class_=re.compile(r'list-item|entry|restaurant', re.I))
    
    if not list_items:
        # Strategy 2: Look for paragraphs or sections with restaurant names
        list_items = soup.find_all(['p', 'div', 'article'])
    
    for idx, item in enumerate(list_items[:60], 1):  # Limit to avoid excessive processing
        text = item.get_text(strip=True)
        
        # Skip if too short or clearly not a restaurant entry
        if len(text) < 20:
            continue
        
        restaurant = {}
        
        # Try to extract rank from beginning
        rank_match = re.match(r'^(\d+)[\.\)\s]+', text)
        if rank_match:
            restaurant['rank'] = int(rank_match.group(1))
            text = text[rank_match.end():]
        
        # Try to extract name (usually comes first, often bold or in heading)
        name_elem = item.find(['strong', 'b', 'h1', 'h2', 'h3', 'h4'])
        if name_elem:
            restaurant['name'] = name_elem.get_text(strip=True)
        else:
            # Try to get first sentence or phrase
            name_match = re.match(r'^([^,\.]+)', text)
            if name_match:
                restaurant['name'] = name_match.group(1).strip()
        
        # Try to extract city
        city_match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*(?:Texas|TX)', text, re.IGNORECASE)
        if city_match:
            restaurant['city'] = city_match.group(1).strip()
            restaurant['raw_location'] = city_match.group(0)
        
        # Store full text as description
        restaurant['description'] = text[:500]
        
        if restaurant.get('name'):
            restaurants.append(restaurant)
    
    return restaurants

def scrape_all_years():
    """Scrape all available years"""
    all_restaurants = []
    
    for year, url in URLS.items():
        print(f"\nScraping {year} list from {url}...")
        soup = get_soup(url)
        
        if not soup:
            print(f"Failed to retrieve {year} list")
            continue
        
        # Try different extraction strategies based on year
        if year == '2021':
            restaurants = extract_restaurant_data_2021(soup)
        else:
            restaurants = extract_restaurant_data_generic(soup, year)
        
        # Add year to each restaurant
        for r in restaurants:
            r['year'] = year
        
        print(f"Found {len(restaurants)} restaurants from {year}")
        all_restaurants.extend(restaurants)
        
        time.sleep(2)  # Be polite to the server
    
    return all_restaurants

def clean_and_structure_data(restaurants):
    """Clean and structure the scraped data"""
    df = pd.DataFrame(restaurants)
    
    if df.empty:
        print("No data scraped!")
        return df
    
    # Ensure city column exists
    if 'city' not in df.columns:
        df['city'] = None
    
    # Try to extract city from raw_location if city is missing
    if 'raw_location' in df.columns:
        for idx, row in df.iterrows():
            if pd.isna(row['city']) and pd.notna(row['raw_location']):
                # Try different patterns to extract city
                location_text = row['raw_location']
                
                # Pattern 1: City, TX or City, Texas
                city_match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*(?:Texas|TX)', location_text, re.IGNORECASE)
                if city_match:
                    df.at[idx, 'city'] = city_match.group(1).strip()
                    continue
                
                # Pattern 2: Just a city name (capitalized word(s))
                city_match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b', location_text)
                if city_match:
                    df.at[idx, 'city'] = city_match.group(1).strip()
    
    # Clean restaurant names
    if 'name' in df.columns:
        df['name'] = df['name'].str.strip()
        df['name'] = df['name'].str.replace(r'\s+', ' ', regex=True)
    
    # Clean city names
    df['city'] = df['city'].str.strip()
    df['city'] = df['city'].str.title()
    
    # Remove duplicates (same restaurant appearing in multiple years)
    df['restaurant_key'] = df['name'].str.lower() + '_' + df['city'].fillna('unknown').str.lower()
    
    # Sort by year and rank
    if 'rank' in df.columns:
        df = df.sort_values(['year', 'rank'], ascending=[False, True])
    else:
        df = df.sort_values('year', ascending=False)
    
    return df

def add_geocoding(df, skip_on_error=True):
    """Add latitude and longitude to restaurants using pre-defined coordinates"""
    if df.empty:
        return df
    
    print("\nAdding geographic coordinates...")
    
    df['latitude'] = None
    df['longitude'] = None
    
    # Get unique cities
    unique_cities = df['city'].dropna().unique()
    city_coords = {}
    found_count = 0
    missing_cities = []
    
    for city in unique_cities:
        lat, lon = get_city_coords(city)
        city_coords[city] = (lat, lon)
        
        if lat is not None:
            print(f"  ✓ {city}: {lat:.4f}, {lon:.4f}")
            found_count += 1
        else:
            print(f"  ✗ {city}: Coordinates not found")
            missing_cities.append(city)
    
    # Apply coordinates to dataframe
    for idx, row in df.iterrows():
        if pd.notna(row['city']) and row['city'] in city_coords:
            df.at[idx, 'latitude'] = city_coords[row['city']][0]
            df.at[idx, 'longitude'] = city_coords[row['city']][1]
    
    geocoded_count = df['latitude'].notna().sum()
    print(f"\nSuccessfully geocoded {geocoded_count} of {len(df)} entries")
    print(f"Found coordinates for {found_count} of {len(unique_cities)} cities")
    
    if missing_cities:
        print(f"\nMissing coordinates for: {', '.join(missing_cities)}")
        print("These can be added manually to texas_city_coords.py if needed")
    
    return df

def create_city_bar_chart(df):
    """Create horizontal bar chart of unique restaurants by city"""
    if df.empty or 'city' not in df.columns:
        print("No city data available for chart")
        return
    
    try:
        # Count unique restaurants per city
        city_counts = df.groupby('city')['name'].nunique().sort_values(ascending=True)
        
        # Create horizontal bar chart
        fig, ax = plt.subplots(figsize=(12, max(8, len(city_counts) * 0.3)))
        ax.barh(city_counts.index, city_counts.values, color='#8B4513')
        ax.set_xlabel('Number of Unique Restaurants', fontsize=12, fontweight='bold')
        ax.set_ylabel('City', fontsize=12, fontweight='bold')
        ax.set_title('Texas Monthly Top 50 BBQ: Unique Restaurants by City', 
                  fontsize=14, fontweight='bold', pad=20)
        ax.grid(axis='x', alpha=0.3)
        plt.tight_layout()
        
        # Save chart
        chart_path = 'texas_bbq_by_city.png'
        plt.savefig(chart_path, dpi=300, bbox_inches='tight')
        print(f"\nBar chart saved to {chart_path}")
        plt.close(fig)
        
    except Exception as e:
        print(f"\nWarning: Could not create chart: {e}")
        print("Continuing without chart...")

def main():
    """Main execution function"""
    print("=" * 60)
    print("Texas Monthly Top 50 BBQ Restaurants Scraper")
    print("=" * 60)
    
    # Scrape data
    restaurants = scrape_all_years()
    
    if not restaurants:
        print("\nNo data was scraped. Please check the URLs and website structure.")
        return
    
    # Clean and structure
    df = clean_and_structure_data(restaurants)
    
    print(f"\nTotal entries found: {len(df)}")
    print(f"Unique restaurants: {df['name'].nunique()}")
    if 'city' in df.columns:
        print(f"Cities represented: {df['city'].nunique()}")
    
    # Try to add geocoding, but continue if it fails
    try:
        df = add_geocoding(df, skip_on_error=True)
    except Exception as e:
        print(f"\nWarning: Geocoding failed ({e}). Continuing without coordinates...")
        df['latitude'] = None
        df['longitude'] = None
    
    # Create bar chart
    try:
        create_city_bar_chart(df)
    except Exception as e:
        print(f"\nWarning: Could not create chart ({e})")
    
    # Save to CSV
    output_file = 'texas_monthly_bbq_restaurants.csv'
    df.to_csv(output_file, index=False, encoding='utf-8')
    print(f"\nData saved to {output_file}")
    
    # Display sample
    print("\nSample of data:")
    cols_to_show = ['year', 'name', 'city', 'latitude', 'longitude']
    available_cols = [col for col in cols_to_show if col in df.columns]
    print(df[available_cols].head(10))
    
    # Summary statistics
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    if 'city' in df.columns:
        print("\nTop 10 cities by number of restaurants:")
        print(df.groupby('city')['name'].nunique().sort_values(ascending=False).head(10))

if __name__ == "__main__":
    main()
