# Texas Monthly Top 50 BBQ Restaurants - Project Summary

## Overview
Successfully scraped and processed the Texas Monthly Top 50 BBQ restaurants list (2021) with complete geographic data for mapping.

## Data Collected

### Statistics
- **Total Restaurants**: 40 unique establishments
- **Cities Covered**: 33 Texas cities
- **Geographic Coverage**: All restaurants geocoded with lat/lon coordinates
- **Data Year**: 2021

### Top Cities by Number of Restaurants
1. **Austin** - 4 restaurants
2. **Dallas** - 3 restaurants  
3. **Fort Worth** - 2 restaurants
4. **San Antonio** - 2 restaurants
5. Other cities - 1 restaurant each

### Sample Restaurants
- Valentina's Tex Mex BBQ (Austin)
- 2M Smokehouse (San Antonio)
- Louie Mueller Barbecue (Taylor)
- Terry Black's Barbecue (Dallas)
- Smoke-A-Holics BBQ (Fort Worth)
- And 35 more...

## Files Generated

### Data Files
1. **texas_monthly_bbq_restaurants_clean.csv** - Main dataset (RECOMMENDED for mapping)
   - 40 rows (unique restaurants)
   - 9 columns including name, city, coordinates, description
   - Ready for mapping applications

2. **texas_monthly_bbq_restaurants.csv** - Raw scraped data
   - Contains duplicates (80 rows)
   - Use clean version instead

### Visualization
3. **texas_bbq_by_city_clean.png** - Horizontal bar chart
   - Shows number of restaurants by city
   - Clear visualization of geographic distribution

### Code Files
4. **scrape_texas_bbq.py** - Main web scraper
5. **texas_city_coords.py** - Pre-defined coordinates for 90+ Texas cities
6. **clean_data.py** - Data cleaning script
7. **create_chart.py** - Chart generation script
8. **analyze_data.py** - Data analysis script

## Data Structure

The cleaned CSV file contains:
- `name` - Restaurant name
- `city` - City location
- `year` - List year (2021)
- `latitude` - Decimal degrees
- `longitude` - Decimal degrees
- `description` - Texas Monthly's notes (first 500 characters)
- `raw_location` - Original location text
- `rank` - Position in top 50 (where available)
- `restaurant_key` - Unique identifier

## Ready for Mapping!

The data is fully prepared for creating maps with:

### Recommended Tools
- **Python**: Folium, Plotly, or matplotlib with basemap
- **JavaScript**: Leaflet.js or Mapbox
- **GIS**: QGIS, ArcGIS, or similar

### What You Can Map
- All 40 restaurants as points on Texas map
- Color-code by city or region
- Add popups with restaurant names and descriptions
- Show concentration in Austin/Dallas areas
- Create heat maps or cluster maps

## Notes & Limitations

### Successes
✓ Successfully scraped 2021 list (most recent available)
✓ All restaurants have valid coordinates
✓ Comprehensive city coverage across Texas
✓ Rich attribute data including descriptions

### Limitations
- Only 2021 data captured (2017 and 2013 URLs didn't work)
- Some restaurants may have moved or closed since 2021
- Coordinates are city-level, not exact addresses
- Website structure changes may break scraper

### Future Enhancements
- Add exact street addresses if needed
- Scrape additional years when available
- Add restaurant categories/specialties
- Include phone numbers and websites
- Add price range information

## Quick Start for Mapping

```python
import pandas as pd
import folium

# Load the data
df = pd.read_csv('texas_monthly_bbq_restaurants_clean.csv')

# Create map centered on Texas
m = folium.Map(location=[31.0, -100.0], zoom_start=6)

# Add markers
for _, row in df.iterrows():
    folium.Marker(
        location=[row['latitude'], row['longitude']],
        popup=f"<b>{row['name']}</b><br>{row['city']}<br>{row['description'][:100]}...",
        tooltip=row['name']
    ).add_to(m)

# Save map
m.save('texas_bbq_map.html')
```

---

**Created**: February 2026
**Data Source**: Texas Monthly (https://www.texasmonthly.com/interactive/top-50-bbq-2021/)
**Tools Used**: Python, BeautifulSoup, Pandas, Matplotlib
