# Texas Monthly BBQ Restaurants Data Scraper

This project scrapes Texas Monthly's Top 50 BBQ restaurant lists from multiple years and creates a comprehensive database with location data for mapping.

## Setup

1. Install required packages:
```bash
pip install -r requirements.txt
```

## Usage

### Main Scraper

Run the main scraper to fetch data from Texas Monthly:
```bash
python scrape_texas_bbq.py
```

### Clean Data

Remove duplicates from the scraped data:
```bash
python clean_data.py
```

### Generate Chart

Create a horizontal bar chart of restaurants by city:
```bash
python create_chart.py
```

## Output Files

- `texas_monthly_bbq_restaurants.csv` - Raw scraped dataset
- `texas_monthly_bbq_restaurants_clean.csv` - Cleaned dataset (no duplicates)
- `texas_bbq_by_city.png` - Bar chart from raw data
- `texas_bbq_by_city_clean.png` - Bar chart from cleaned data

## Data Fields

- **year**: Year the restaurant appeared on the list
- **name**: Restaurant name
- **city**: City location
- **rank**: Ranking on the list (if available)
- **description**: Notes and description from Texas Monthly
- **raw_location**: Original location text from the website
- **latitude**: Latitude coordinate
- **longitude**: Longitude coordinate
- **restaurant_key**: Unique identifier for deduplication

## Current Data

- **2021 List**: 40 unique restaurants across 33 Texas cities
- **Top Cities**: Austin (4), Dallas (3), Fort Worth (2), San Antonio (2)

## Notes

- Texas Monthly publishes their Top 50 BBQ list approximately every 4-5 years
- The script includes pre-defined coordinates for Texas cities (see `texas_city_coords.py`)
- All 40 restaurants from the 2021 list have been successfully geocoded
- The 2017 and 2013 URLs in the script are placeholders and may need to be updated
- Web scraping may break if Texas Monthly changes their website structure

## Next Steps for Mapping

The cleaned CSV file (`texas_monthly_bbq_restaurants_clean.csv`) is ready for mapping with:
- Full restaurant names
- City locations
- Latitude/longitude coordinates
- Descriptions and notes

You can use libraries like Folium, Plotly, or Leaflet.js to create interactive maps.
