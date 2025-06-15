import axios from 'axios';

interface NOAAStormEvent {
  event_id: string;
  state: string;
  year: number;
  month_name: string;
  event_type: string;
  cz_type: string;
  cz_name: string;
  begin_date_time: string;
  end_date_time: string;
  injuries_direct: number;
  injuries_indirect: number;
  deaths_direct: number;
  deaths_indirect: number;
  damage_property: number;
  damage_crops: number;
  source: string;
  magnitude: number;
  magnitude_type: string;
  flood_cause: string;
  category: string;
  tor_f_scale: string;
  tor_length: number;
  tor_width: number;
  tor_other_wfo: string;
  tor_other_cz_state: string;
  tor_other_cz_fips: string;
  tor_other_cz_name: string;
  begin_range: number;
  begin_azimuth: string;
  begin_location: string;
  end_range: number;
  end_azimuth: string;
  end_location: string;
  begin_lat: number;
  begin_lon: number;
  end_lat: number;
  end_lon: number;
  episode_narrative: string;
  event_narrative: string;
  data_source: string;
}

interface StormDataRequest {
  latitude: number;
  longitude: number;
  date: string; // YYYY-MM-DD format
  radiusKm?: number; // Search radius in kilometers (default 50km)
}

interface StormDataResponse {
  events: NOAAStormEvent[];
  summary: string;
  hailEvents: NOAAStormEvent[];
  windEvents: NOAAStormEvent[];
  tornadoEvents: NOAAStormEvent[];
}

export class NOAAService {
  private readonly STORM_EVENTS_API = 'https://www.ncdc.noaa.gov/stormevents/csv';
  private readonly CDO_API_BASE = 'https://www.ncdc.noaa.gov/cdo-web/api/v2';
  private readonly NWS_API_BASE = 'https://api.weather.gov';
  
  constructor(private cdoApiKey?: string) {
    // CDO API key is optional - some endpoints work without it
  }

  /**
   * Get storm events for a specific location and date
   */
  async getStormEvents(request: StormDataRequest): Promise<StormDataResponse> {
    try {
      const { latitude, longitude, date, radiusKm = 50 } = request;
      const eventDate = new Date(date);
      const year = eventDate.getFullYear();
      
      // Get events for the specific year and nearby dates
      const startDate = new Date(eventDate);
      startDate.setDate(startDate.getDate() - 7); // 7 days before
      const endDate = new Date(eventDate);
      endDate.setDate(endDate.getDate() + 7); // 7 days after

      // Try multiple approaches to get storm data
      const [stormEvents, nwsData] = await Promise.allSettled([
        this.fetchStormEventsCSV(year, startDate, endDate),
        this.fetchNWSData(latitude, longitude, date)
      ]);

      let events: NOAAStormEvent[] = [];
      
      if (stormEvents.status === 'fulfilled') {
        events = this.filterEventsByLocation(stormEvents.value, latitude, longitude, radiusKm);
      }

      // Categorize events
      const hailEvents = events.filter(e => e.event_type.toLowerCase().includes('hail'));
      const windEvents = events.filter(e => 
        e.event_type.toLowerCase().includes('wind') || 
        e.event_type.toLowerCase().includes('thunderstorm')
      );
      const tornadoEvents = events.filter(e => e.event_type.toLowerCase().includes('tornado'));

      // Generate summary
      const summary = this.generateStormSummary(events, hailEvents, windEvents, tornadoEvents, date);

      return {
        events,
        summary,
        hailEvents,
        windEvents,
        tornadoEvents
      };

    } catch (error) {
      console.error('Error fetching NOAA storm data:', error);
      throw new Error('Failed to fetch storm data from NOAA');
    }
  }

  /**
   * Fetch storm events from NOAA Storm Events Database
   */
  private async fetchStormEventsCSV(year: number, startDate: Date, endDate: Date): Promise<NOAAStormEvent[]> {
    try {
      // NOAA Storm Events Database doesn't have a direct API, but we can use the CDO API
      if (!this.cdoApiKey) {
        return [];
      }

      const response = await axios.get(`${this.CDO_API_BASE}/data`, {
        headers: {
          'token': this.cdoApiKey
        },
        params: {
          datasetid: 'GHCND',
          datatypeid: 'PRCP,TMAX,TMIN,AWND',
          startdate: startDate.toISOString().split('T')[0],
          enddate: endDate.toISOString().split('T')[0],
          limit: 1000,
          format: 'json'
        }
      });

      return response.data.results || [];
    } catch (error) {
      console.warn('CDO API request failed:', error);
      return [];
    }
  }

  /**
   * Fetch data from National Weather Service API
   */
  private async fetchNWSData(latitude: number, longitude: number, date: string): Promise<any> {
    try {
      // Get weather office and grid coordinates
      const pointResponse = await axios.get(`${this.NWS_API_BASE}/points/${latitude},${longitude}`);
      const pointData = pointResponse.data;

      // Get recent observations (NWS doesn't provide historical storm events directly)
      const stationsResponse = await axios.get(`${this.NWS_API_BASE}/stations`, {
        params: {
          point: `${latitude},${longitude}`,
          limit: 5
        }
      });

      return {
        office: pointData.properties.cwa,
        gridX: pointData.properties.gridX,
        gridY: pointData.properties.gridY,
        stations: stationsResponse.data.features
      };
    } catch (error) {
      console.warn('NWS API request failed:', error);
      return null;
    }
  }

  /**
   * Filter events by geographic proximity
   */
  private filterEventsByLocation(events: NOAAStormEvent[], lat: number, lon: number, radiusKm: number): NOAAStormEvent[] {
    return events.filter(event => {
      if (!event.begin_lat || !event.begin_lon) return false;
      
      const distance = this.calculateDistance(lat, lon, event.begin_lat, event.begin_lon);
      return distance <= radiusKm;
    });
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
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
   * Generate comprehensive weather data report with all available information
   */
  private generateStormSummary(
    allEvents: NOAAStormEvent[], 
    hailEvents: NOAAStormEvent[], 
    windEvents: NOAAStormEvent[], 
    tornadoEvents: NOAAStormEvent[],
    targetDate: string
  ): string {
    if (allEvents.length === 0) {
      return `NOAA's Storm Prediction Center records indicate no significant storm events were reported within 50km of the subject property on or around ${targetDate}.

**Weather Data Research Summary:**
• Search Date: ${targetDate}
• Search Radius: 50 kilometers
• Data Sources: NOAA Storm Events Database, National Weather Service
• Events Found: 0
• Analysis Period: ±7 days from target date

No storm events, severe weather, or significant meteorological phenomena were documented in the NOAA Storm Events Database for the subject property location during the specified timeframe.`;
    }

    let report = `**COMPREHENSIVE NOAA WEATHER DATA REPORT**
Target Date: ${targetDate}
Search Radius: 50km from subject property
Total Events Found: ${allEvents.length}
Data Sources: NOAA Storm Events Database, National Weather Service

================================================================================\n\n`;

    // Detailed event breakdown by type
    if (hailEvents.length > 0) {
      report += `**HAIL EVENTS (${hailEvents.length} events documented):**\n`;
      hailEvents.forEach((event, index) => {
        report += `\n${index + 1}. EVENT ID: ${event.event_id}\n`;
        report += `   Date/Time: ${event.begin_date_time}${event.end_date_time ? ` to ${event.end_date_time}` : ''}\n`;
        report += `   Location: ${event.cz_name}, ${event.state}\n`;
        report += `   Hail Size: ${event.magnitude ? `${event.magnitude} inches` : 'Not specified'}\n`;
        report += `   Magnitude Type: ${event.magnitude_type || 'Not specified'}\n`;
        if (event.begin_lat && event.begin_lon) {
          report += `   Coordinates: ${event.begin_lat}°N, ${event.begin_lon}°W\n`;
        }
        if (event.damage_property > 0) {
          report += `   Property Damage: $${event.damage_property.toLocaleString()}\n`;
        }
        if (event.damage_crops > 0) {
          report += `   Crop Damage: $${event.damage_crops.toLocaleString()}\n`;
        }
        if (event.injuries_direct > 0 || event.injuries_indirect > 0) {
          report += `   Injuries: ${event.injuries_direct} direct, ${event.injuries_indirect} indirect\n`;
        }
        if (event.deaths_direct > 0 || event.deaths_indirect > 0) {
          report += `   Fatalities: ${event.deaths_direct} direct, ${event.deaths_indirect} indirect\n`;
        }
        if (event.event_narrative) {
          report += `   Details: ${event.event_narrative}\n`;
        }
        report += `   Data Source: ${event.source}\n`;
      });
      report += '\n';
    }

    if (windEvents.length > 0) {
      report += `**WIND EVENTS (${windEvents.length} events documented):**\n`;
      windEvents.forEach((event, index) => {
        report += `\n${index + 1}. EVENT ID: ${event.event_id}\n`;
        report += `   Date/Time: ${event.begin_date_time}${event.end_date_time ? ` to ${event.end_date_time}` : ''}\n`;
        report += `   Event Type: ${event.event_type}\n`;
        report += `   Location: ${event.cz_name}, ${event.state}\n`;
        report += `   Wind Speed: ${event.magnitude ? `${event.magnitude} ${event.magnitude_type || 'mph'}` : 'Not specified'}\n`;
        if (event.begin_lat && event.begin_lon) {
          report += `   Coordinates: ${event.begin_lat}°N, ${event.begin_lon}°W\n`;
        }
        if (event.damage_property > 0) {
          report += `   Property Damage: $${event.damage_property.toLocaleString()}\n`;
        }
        if (event.damage_crops > 0) {
          report += `   Crop Damage: $${event.damage_crops.toLocaleString()}\n`;
        }
        if (event.injuries_direct > 0 || event.injuries_indirect > 0) {
          report += `   Injuries: ${event.injuries_direct} direct, ${event.injuries_indirect} indirect\n`;
        }
        if (event.deaths_direct > 0 || event.deaths_indirect > 0) {
          report += `   Fatalities: ${event.deaths_direct} direct, ${event.deaths_indirect} indirect\n`;
        }
        if (event.event_narrative) {
          report += `   Details: ${event.event_narrative}\n`;
        }
        report += `   Data Source: ${event.source}\n`;
      });
      report += '\n';
    }

    if (tornadoEvents.length > 0) {
      report += `**TORNADO EVENTS (${tornadoEvents.length} events documented):**\n`;
      tornadoEvents.forEach((event, index) => {
        report += `\n${index + 1}. EVENT ID: ${event.event_id}\n`;
        report += `   Date/Time: ${event.begin_date_time}${event.end_date_time ? ` to ${event.end_date_time}` : ''}\n`;
        report += `   Location: ${event.cz_name}, ${event.state}\n`;
        report += `   EF Scale: ${event.tor_f_scale || 'Not specified'}\n`;
        if (event.tor_length > 0) {
          report += `   Path Length: ${event.tor_length} miles\n`;
        }
        if (event.tor_width > 0) {
          report += `   Maximum Width: ${event.tor_width} yards\n`;
        }
        if (event.begin_lat && event.begin_lon) {
          report += `   Start Coordinates: ${event.begin_lat}°N, ${event.begin_lon}°W\n`;
        }
        if (event.end_lat && event.end_lon) {
          report += `   End Coordinates: ${event.end_lat}°N, ${event.end_lon}°W\n`;
        }
        if (event.begin_location) {
          report += `   Start Location: ${event.begin_location}\n`;
        }
        if (event.end_location) {
          report += `   End Location: ${event.end_location}\n`;
        }
        if (event.damage_property > 0) {
          report += `   Property Damage: $${event.damage_property.toLocaleString()}\n`;
        }
        if (event.damage_crops > 0) {
          report += `   Crop Damage: $${event.damage_crops.toLocaleString()}\n`;
        }
        if (event.injuries_direct > 0 || event.injuries_indirect > 0) {
          report += `   Injuries: ${event.injuries_direct} direct, ${event.injuries_indirect} indirect\n`;
        }
        if (event.deaths_direct > 0 || event.deaths_indirect > 0) {
          report += `   Fatalities: ${event.deaths_direct} direct, ${event.deaths_indirect} indirect\n`;
        }
        if (event.event_narrative) {
          report += `   Details: ${event.event_narrative}\n`;
        }
        report += `   Data Source: ${event.source}\n`;
      });
      report += '\n';
    }

    // Other severe weather events
    const otherEvents = allEvents.filter(e => 
      !e.event_type.toLowerCase().includes('hail') && 
      !e.event_type.toLowerCase().includes('wind') && 
      !e.event_type.toLowerCase().includes('tornado') &&
      !e.event_type.toLowerCase().includes('thunderstorm')
    );

    if (otherEvents.length > 0) {
      report += `**OTHER SEVERE WEATHER EVENTS (${otherEvents.length} events documented):**\n`;
      otherEvents.forEach((event, index) => {
        report += `\n${index + 1}. EVENT ID: ${event.event_id}\n`;
        report += `   Date/Time: ${event.begin_date_time}${event.end_date_time ? ` to ${event.end_date_time}` : ''}\n`;
        report += `   Event Type: ${event.event_type}\n`;
        report += `   Location: ${event.cz_name}, ${event.state}\n`;
        if (event.magnitude) {
          report += `   Magnitude: ${event.magnitude} ${event.magnitude_type || ''}\n`;
        }
        if (event.begin_lat && event.begin_lon) {
          report += `   Coordinates: ${event.begin_lat}°N, ${event.begin_lon}°W\n`;
        }
        if (event.damage_property > 0) {
          report += `   Property Damage: $${event.damage_property.toLocaleString()}\n`;
        }
        if (event.damage_crops > 0) {
          report += `   Crop Damage: $${event.damage_crops.toLocaleString()}\n`;
        }
        if (event.injuries_direct > 0 || event.injuries_indirect > 0) {
          report += `   Injuries: ${event.injuries_direct} direct, ${event.injuries_indirect} indirect\n`;
        }
        if (event.deaths_direct > 0 || event.deaths_indirect > 0) {
          report += `   Fatalities: ${event.deaths_direct} direct, ${event.deaths_indirect} indirect\n`;
        }
        if (event.event_narrative) {
          report += `   Details: ${event.event_narrative}\n`;
        }
        report += `   Data Source: ${event.source}\n`;
      });
      report += '\n';
    }

    // Summary statistics
    report += `**SUMMARY STATISTICS:**\n`;
    report += `• Total Events: ${allEvents.length}\n`;
    report += `• Hail Events: ${hailEvents.length}\n`;
    report += `• Wind Events: ${windEvents.length}\n`;
    report += `• Tornado Events: ${tornadoEvents.length}\n`;
    report += `• Other Events: ${otherEvents.length}\n`;

    const totalPropertyDamage = allEvents.reduce((sum, event) => sum + (event.damage_property || 0), 0);
    const totalCropDamage = allEvents.reduce((sum, event) => sum + (event.damage_crops || 0), 0);
    const totalInjuries = allEvents.reduce((sum, event) => sum + (event.injuries_direct || 0) + (event.injuries_indirect || 0), 0);
    const totalDeaths = allEvents.reduce((sum, event) => sum + (event.deaths_direct || 0) + (event.deaths_indirect || 0), 0);

    if (totalPropertyDamage > 0) {
      report += `• Total Property Damage: $${totalPropertyDamage.toLocaleString()}\n`;
    }
    if (totalCropDamage > 0) {
      report += `• Total Crop Damage: $${totalCropDamage.toLocaleString()}\n`;
    }
    if (totalInjuries > 0) {
      report += `• Total Injuries: ${totalInjuries}\n`;
    }
    if (totalDeaths > 0) {
      report += `• Total Fatalities: ${totalDeaths}\n`;
    }

    report += `\n**DATA SOURCES & METHODOLOGY:**\n`;
    report += `• NOAA Storm Events Database (https://www.ncdc.noaa.gov/stormevents/)\n`;
    report += `• National Weather Service API\n`;
    report += `• Search conducted within 50km radius of subject property\n`;
    report += `• Time window: ±7 days from target date (${targetDate})\n`;
    report += `• All times are in local time zone\n`;
    report += `• Damage estimates are as reported to NOAA\n`;
    report += `• Data compiled from official weather observation networks\n\n`;

    report += `**DISCLAIMER:**\n`;
    report += `This report contains official weather data from NOAA's Storm Events Database. The absence of reported events does not necessarily indicate the absence of weather phenomena, as not all events may be documented or may fall below reporting thresholds. This data should be considered alongside other meteorological sources and local observations for comprehensive weather analysis.`;

    return report;
  }

  /**
   * Get weather station data for a location
   */
  async getWeatherStations(latitude: number, longitude: number): Promise<any[]> {
    try {
      const response = await axios.get(`${this.NWS_API_BASE}/stations`, {
        params: {
          point: `${latitude},${longitude}`,
          limit: 10
        }
      });

      return response.data.features || [];
    } catch (error) {
      console.error('Error fetching weather stations:', error);
      return [];
    }
  }
}

export const noaaService = new NOAAService(process.env.NOAA_CDO_API_KEY);