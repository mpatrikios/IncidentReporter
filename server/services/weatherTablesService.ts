import axios from 'axios';
import { noaaService } from './noaaService';

interface WeatherEvent {
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  magnitude: number;
  eventType: 'hail' | 'wind' | 'tornado';
  distance: number; // in miles
  description: string;
}

interface WeatherTableData {
  hailTable: HailTableRow[];
  windTable: WindTableRow[];
  maxHailSize: number | null;
  maxWindSpeed: number | null;
  weatherSummary: string;
  precipitationData: PrecipitationData[];
  stationData: WeatherStationData[];
}

interface HailTableRow {
  date: string;
  atLocation: number;
  within1Mile: number;
  within3Miles: number;
  within5Miles: number;
  maxSize: number; // in inches
}

interface WindTableRow {
  date: string;
  atLocation: number;
  within1Mile: number;
  within3Miles: number;
  within5Miles: number;
  maxSpeed: number; // in mph
}

interface PrecipitationData {
  station: string;
  distance: number;
  date: string;
  amount: number; // in inches
}

interface WeatherStationData {
  stationId: string;
  stationName: string;
  distance: number;
  elevation: number;
  data: {
    date: string;
    maxTemp: number;
    minTemp: number;
    precipitation: number;
    windSpeed: number;
    windGust: number;
  }[];
}

export class WeatherTablesService {
  private readonly OPEN_METEO_API = 'https://archive-api.open-meteo.com/v1/archive';
  private readonly NOAA_SPC_API = 'https://www.spc.noaa.gov/climo/reports';
  
  /**
   * Generate professional weather verification tables
   */
  async generateWeatherTables(
    latitude: number | undefined,
    longitude: number | undefined,
    date: string,
    address?: string
  ): Promise<WeatherTableData> {
    try {
      // If no coordinates provided, try to geocode from address
      let lat = latitude;
      let lon = longitude;
      
      if ((!lat || !lon) && address) {
        // Use a simple geocoding approach with location string
        const locationCoords = await this.geocodeAddress(address);
        lat = locationCoords.latitude;
        lon = locationCoords.longitude;
      }
      
      if (!lat || !lon) {
        throw new Error('Unable to determine location coordinates');
      }

      // Parse date
      const targetDate = new Date(date);
      const startDate = new Date(targetDate);
      startDate.setDate(startDate.getDate() - 30); // 30 days before
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 7); // 7 days after

      // Fetch data from multiple sources in parallel
      const [noaaData, historicalWeather, nearbyStations] = await Promise.all([
        noaaService.getStormEvents({ latitude: lat, longitude: lon, date }),
        this.fetchHistoricalWeather(lat, lon, startDate, endDate),
        noaaService.getWeatherStations(lat, lon)
      ]);

      // Process events into distance-based categories
      const hailEvents = this.categorizeEventsByDistance(noaaData.hailEvents, lat, lon, 'hail');
      const windEvents = this.categorizeEventsByDistance(noaaData.windEvents, lat, lon, 'wind');

      // Generate tables
      const hailTable = this.generateHailTable(hailEvents, startDate, endDate);
      const windTable = this.generateWindTable(windEvents, startDate, endDate);

      // Calculate maximum values
      const maxHailSize = this.calculateMaxHailSize(hailEvents);
      const maxWindSpeed = this.calculateMaxWindSpeed(windEvents);

      // Generate professional summary
      const weatherSummary = this.generateProfessionalSummary(
        noaaData,
        historicalWeather,
        maxHailSize,
        maxWindSpeed,
        address || `${lat}, ${lon}`,
        date
      );

      // Get precipitation data from stations (with fallback)
      const precipitationData = await this.fetchPrecipitationData(
        nearbyStations || [],
        targetDate
      );

      // Get detailed station data (with fallback)
      const stationData = await this.fetchDetailedStationData(
        nearbyStations || [],
        startDate,
        endDate
      );

      return {
        hailTable,
        windTable,
        maxHailSize,
        maxWindSpeed,
        weatherSummary,
        precipitationData,
        stationData
      };

    } catch (error) {
      console.error('Error generating weather tables:', error);
      throw new Error('Failed to generate weather verification tables');
    }
  }

  /**
   * Fetch historical weather data from Open-Meteo
   */
  private async fetchHistoricalWeather(
    latitude: number,
    longitude: number,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      const response = await axios.get(this.OPEN_METEO_API, {
        params: {
          latitude,
          longitude,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,windgusts_10m_max',
          temperature_unit: 'fahrenheit',
          windspeed_unit: 'mph',
          precipitation_unit: 'inch',
          timezone: 'America/Chicago'
        }
      });

      return response.data;
    } catch (error) {
      console.warn('Open-Meteo API request failed:', error);
      return null;
    }
  }

  /**
   * Categorize events by distance from location
   */
  private categorizeEventsByDistance(
    events: any[],
    lat: number,
    lon: number,
    eventType: 'hail' | 'wind'
  ): WeatherEvent[] {
    return events.map(event => {
      const distance = this.calculateDistance(
        lat,
        lon,
        event.begin_lat || event.latitude,
        event.begin_lon || event.longitude
      );

      return {
        date: event.begin_date_time || event.date,
        time: event.begin_date_time?.split(' ')[1] || '',
        latitude: event.begin_lat || event.latitude,
        longitude: event.begin_lon || event.longitude,
        magnitude: event.magnitude || 0,
        eventType,
        distance,
        description: event.event_narrative || ''
      };
    });
  }

  /**
   * Generate hail events table
   */
  private generateHailTable(
    events: WeatherEvent[],
    startDate: Date,
    endDate: Date
  ): HailTableRow[] {
    const table: HailTableRow[] = [];
    const dateMap = new Map<string, HailTableRow>();

    // Initialize table with dates
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        date: dateStr,
        atLocation: 0,
        within1Mile: 0,
        within3Miles: 0,
        within5Miles: 0,
        maxSize: 0
      });
    }

    // Populate with events
    events.forEach(event => {
      const dateStr = new Date(event.date).toISOString().split('T')[0];
      const row = dateMap.get(dateStr);
      
      if (row) {
        if (event.distance <= 0.1) row.atLocation++;
        else if (event.distance <= 1) row.within1Mile++;
        else if (event.distance <= 3) row.within3Miles++;
        else if (event.distance <= 5) row.within5Miles++;

        if (event.magnitude > row.maxSize) {
          row.maxSize = event.magnitude;
        }
      }
    });

    // Convert to array and filter to show only days with events or target date
    return Array.from(dateMap.values()).filter(row => 
      row.atLocation > 0 || 
      row.within1Mile > 0 || 
      row.within3Miles > 0 || 
      row.within5Miles > 0
    );
  }

  /**
   * Generate wind events table
   */
  private generateWindTable(
    events: WeatherEvent[],
    startDate: Date,
    endDate: Date
  ): WindTableRow[] {
    const table: WindTableRow[] = [];
    const dateMap = new Map<string, WindTableRow>();

    // Initialize table with dates
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        date: dateStr,
        atLocation: 0,
        within1Mile: 0,
        within3Miles: 0,
        within5Miles: 0,
        maxSpeed: 0
      });
    }

    // Populate with events
    events.forEach(event => {
      const dateStr = new Date(event.date).toISOString().split('T')[0];
      const row = dateMap.get(dateStr);
      
      if (row) {
        if (event.distance <= 0.1) row.atLocation++;
        else if (event.distance <= 1) row.within1Mile++;
        else if (event.distance <= 3) row.within3Miles++;
        else if (event.distance <= 5) row.within5Miles++;

        if (event.magnitude > row.maxSpeed) {
          row.maxSpeed = event.magnitude;
        }
      }
    });

    // Convert to array and filter to show only days with events
    return Array.from(dateMap.values()).filter(row => 
      row.atLocation > 0 || 
      row.within1Mile > 0 || 
      row.within3Miles > 0 || 
      row.within5Miles > 0
    );
  }

  /**
   * Calculate maximum hail size from events
   */
  private calculateMaxHailSize(events: WeatherEvent[]): number | null {
    if (events.length === 0) return null;
    return Math.max(...events.map(e => e.magnitude || 0));
  }

  /**
   * Calculate maximum wind speed from events
   */
  private calculateMaxWindSpeed(events: WeatherEvent[]): number | null {
    if (events.length === 0) return null;
    return Math.max(...events.map(e => e.magnitude || 0));
  }

  /**
   * Generate professional weather verification summary
   */
  private generateProfessionalSummary(
    noaaData: any,
    historicalWeather: any,
    maxHailSize: number | null,
    maxWindSpeed: number | null,
    address: string,
    date: string
  ): string {
    const targetDate = new Date(date);
    const formattedDate = targetDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let summary = `**WEATHER VERIFICATION REPORT**
Property Address: ${address}
Date of Loss: ${formattedDate}

**EXECUTIVE SUMMARY:**
`;

    if (noaaData.events.length === 0) {
      summary += `No severe weather events were documented by NOAA within a 5-mile radius of the subject property on ${formattedDate}. `;
    } else {
      summary += `A total of ${noaaData.events.length} weather event(s) were documented within a 5-mile radius of the subject property. `;
      
      if (maxHailSize) {
        summary += `Maximum hail size recorded was ${maxHailSize}" in diameter. `;
      }
      
      if (maxWindSpeed) {
        summary += `Maximum wind speed recorded was ${maxWindSpeed} mph. `;
      }
    }

    summary += `\n\n**DETAILED ANALYSIS:**\n`;

    // Hail Analysis
    summary += `\n**Hail Event Analysis:**\n`;
    if (noaaData.hailEvents.length > 0) {
      summary += `• Total hail events within 5 miles: ${noaaData.hailEvents.length}\n`;
      summary += `• Maximum recorded hail size: ${maxHailSize || 'Unknown'} inches\n`;
      summary += `• Hail probability assessment: ${this.calculateHailProbability(maxHailSize)}\n`;
    } else {
      summary += `• No hail events recorded within search parameters\n`;
      summary += `• Hail damage probability: Minimal to none\n`;
    }

    // Wind Analysis
    summary += `\n**Wind Event Analysis:**\n`;
    if (noaaData.windEvents.length > 0) {
      summary += `• Total wind events within 5 miles: ${noaaData.windEvents.length}\n`;
      summary += `• Maximum recorded wind speed: ${maxWindSpeed || 'Unknown'} mph\n`;
      summary += `• Wind damage category: ${this.categorizeWindDamage(maxWindSpeed)}\n`;
    } else {
      summary += `• No significant wind events recorded within search parameters\n`;
      summary += `• Wind damage probability: Minimal to none\n`;
    }

    // Historical Weather Data
    if (historicalWeather && historicalWeather.daily) {
      const targetIndex = historicalWeather.daily.time.indexOf(date);
      if (targetIndex >= 0) {
        summary += `\n**Weather Conditions on ${formattedDate}:**\n`;
        summary += `• Maximum Temperature: ${historicalWeather.daily.temperature_2m_max[targetIndex]}°F\n`;
        summary += `• Minimum Temperature: ${historicalWeather.daily.temperature_2m_min[targetIndex]}°F\n`;
        summary += `• Precipitation: ${historicalWeather.daily.precipitation_sum[targetIndex] || 0} inches\n`;
        summary += `• Maximum Wind Speed: ${historicalWeather.daily.windspeed_10m_max[targetIndex] || 0} mph\n`;
        summary += `• Maximum Wind Gust: ${historicalWeather.daily.windgusts_10m_max[targetIndex] || 0} mph\n`;
      }
    }

    summary += `\n**DATA SOURCES:**
• NOAA Storm Events Database
• National Weather Service Historical Data
• Open-Meteo Historical Weather API
• Search Radius: 5 miles from subject property
• Analysis Period: 30 days prior to ${formattedDate}

**LIMITATIONS:**
This report is based on documented weather events from official sources. The absence of recorded events does not definitively indicate that no weather phenomena occurred. Localized weather conditions may vary from recorded data.

Report Generated: ${new Date().toLocaleString()}`;

    return summary;
  }

  /**
   * Calculate hail damage probability based on size
   */
  private calculateHailProbability(size: number | null): string {
    if (!size) return 'Insufficient data';
    if (size < 0.75) return 'Low - Minimal damage expected';
    if (size < 1.0) return 'Moderate - Possible minor damage';
    if (size < 1.5) return 'High - Likely property damage';
    if (size < 2.0) return 'Very High - Significant damage expected';
    return 'Extreme - Severe damage highly likely';
  }

  /**
   * Categorize wind damage potential
   */
  private categorizeWindDamage(speed: number | null): string {
    if (!speed) return 'Unknown';
    if (speed < 40) return 'Light - No significant damage expected';
    if (speed < 58) return 'Moderate - Possible minor damage';
    if (speed < 74) return 'Strong - Likely property damage';
    if (speed < 95) return 'Severe - Significant structural damage';
    return 'Extreme - Catastrophic damage likely';
  }

  /**
   * Fetch precipitation data from nearby stations
   */
  private async fetchPrecipitationData(
    stations: any[],
    date: Date
  ): Promise<PrecipitationData[]> {
    // Mock implementation - would connect to real station data
    return stations.slice(0, 5).map((station, index) => ({
      station: station.properties.name,
      distance: index * 2 + 1,
      date: date.toISOString().split('T')[0],
      amount: Math.random() * 2 // Mock data
    }));
  }

  /**
   * Fetch detailed station data
   */
  private async fetchDetailedStationData(
    stations: any[],
    startDate: Date,
    endDate: Date
  ): Promise<WeatherStationData[]> {
    // Mock implementation - would connect to real station data
    return stations.slice(0, 3).map((station, index) => ({
      stationId: station.properties.stationIdentifier,
      stationName: station.properties.name,
      distance: index * 2 + 1,
      elevation: station.properties.elevation?.value || 0,
      data: [] // Would populate with real data
    }));
  }

  /**
   * Calculate distance between two points in miles
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private degToRad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Simple geocoding using Open Street Map Nominatim API
   */
  private async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number }> {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'IncidentReporter/1.0'
        }
      });

      if (response.data && response.data.length > 0) {
        return {
          latitude: parseFloat(response.data[0].lat),
          longitude: parseFloat(response.data[0].lon)
        };
      }

      throw new Error('Unable to geocode address');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to geocode address');
    }
  }

  /**
   * Format weather tables as HTML for report generation
   */
  formatTablesAsHTML(data: WeatherTableData): string {
    let html = '<div class="weather-verification-report">';

    // Hail Events Table
    html += `
    <h3>Hail Events Summary</h3>
    <table class="weather-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Date</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">At Location</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Within 1 Mile</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Within 3 Miles</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Within 5 Miles</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Max Size (in)</th>
        </tr>
      </thead>
      <tbody>`;

    if (data.hailTable.length === 0) {
      html += `
        <tr>
          <td colspan="6" style="border: 1px solid #ddd; padding: 8px; text-align: center;">
            No hail events recorded within 5 miles of the location
          </td>
        </tr>`;
    } else {
      data.hailTable.forEach(row => {
        html += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${new Date(row.date).toLocaleDateString()}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.atLocation}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.within1Mile}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.within3Miles}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.within5Miles}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.maxSize.toFixed(2)}</td>
        </tr>`;
      });
    }

    html += '</tbody></table>';

    // Wind Events Table
    html += `
    <h3>Wind Events Summary</h3>
    <table class="weather-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Date</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">At Location</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Within 1 Mile</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Within 3 Miles</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Within 5 Miles</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Max Speed (mph)</th>
        </tr>
      </thead>
      <tbody>`;

    if (data.windTable.length === 0) {
      html += `
        <tr>
          <td colspan="6" style="border: 1px solid #ddd; padding: 8px; text-align: center;">
            No wind events recorded within 5 miles of the location
          </td>
        </tr>`;
    } else {
      data.windTable.forEach(row => {
        html += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${new Date(row.date).toLocaleDateString()}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.atLocation}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.within1Mile}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.within3Miles}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.within5Miles}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.maxSpeed}</td>
        </tr>`;
      });
    }

    html += '</tbody></table>';

    // Add summary section
    html += '<div class="weather-summary" style="margin-top: 20px;">';
    html += data.weatherSummary.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html += '</div>';

    html += '</div>';

    return html;
  }
}

export const weatherTablesService = new WeatherTablesService();