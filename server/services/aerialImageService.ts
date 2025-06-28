import axios from 'axios';
import fs from 'fs';
import path from 'path';

interface AerialImageOptions {
  address?: string;
  latitude?: number;
  longitude?: number;
  zoom?: number;
  size?: string;
  mapType?: 'satellite' | 'hybrid' | 'roadmap';
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

class AerialImageService {
  private readonly googleApiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
  private readonly geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

  constructor() {
    this.googleApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    if (!this.googleApiKey) {
      console.warn('⚠️ Google Maps API key not found. Aerial imagery service will not work.');
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.googleApiKey;
  }

  /**
   * Build complete address string from form components
   */
  buildAddressString(projectInfo: any): string {
    const parts = [];
    
    if (projectInfo.insuredAddress) parts.push(projectInfo.insuredAddress);
    if (projectInfo.city) parts.push(projectInfo.city);
    if (projectInfo.state) parts.push(projectInfo.state);
    if (projectInfo.zipCode) parts.push(projectInfo.zipCode);
    
    return parts.join(', ');
  }

  /**
   * Geocode an address to get latitude/longitude (for reference, not required for static maps)
   */
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!this.isConfigured()) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      console.log(`🌍 Geocoding address: ${address}`);
      
      const response = await axios.get(this.geocodeUrl, {
        params: {
          address: address,
          key: this.googleApiKey
        },
        timeout: 10000
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;
        
        console.log(`✅ Geocoded to: ${location.lat}, ${location.lng}`);
        
        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: result.formatted_address
        };
      } else {
        console.warn(`⚠️ Geocoding failed: ${response.data.status}`);
        return null;
      }
    } catch (error: any) {
      console.error('❌ Geocoding error:', error.message);
      return null;
    }
  }

  /**
   * Get aerial/satellite image for a location using address or coordinates
   */
  async getAerialImage(options: AerialImageOptions): Promise<Buffer | null> {
    if (!this.isConfigured()) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const {
        address,
        latitude,
        longitude,
        zoom = 18, // Good zoom level for property inspection
        size = '640x640', // Square format works well for reports
        mapType = 'satellite'
      } = options;

      let center: string;

      // Use coordinates if available, otherwise use address
      if (latitude && longitude) {
        center = `${latitude},${longitude}`;
        console.log(`🛰️ Fetching aerial image for coordinates: ${center}`);
      } else if (address) {
        center = address;
        console.log(`🛰️ Fetching aerial image for address: ${address}`);
      } else {
        throw new Error('Either address or coordinates must be provided');
      }

      const params = new URLSearchParams({
        center: center,
        zoom: zoom.toString(),
        size: size,
        maptype: mapType,
        key: this.googleApiKey,
        format: 'jpg',
        scale: '2' // High resolution
      });

      const imageUrl = `${this.baseUrl}?${params}`;
      console.log(`🔗 Requesting aerial image: ${imageUrl.replace(this.googleApiKey, '[API_KEY]')}`);

      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      if (response.status === 200) {
        const buffer = Buffer.from(response.data);
        console.log(`✅ Aerial image retrieved: ${buffer.length} bytes`);
        return buffer;
      } else {
        console.error(`❌ Failed to fetch aerial image: ${response.status}`);
        return null;
      }

    } catch (error: any) {
      console.error('❌ Error fetching aerial image:', error.message);
      return null;
    }
  }

  /**
   * Get aerial image from project information data
   */
  async getAerialImageFromProjectInfo(projectInfo: any): Promise<Buffer | null> {
    try {
      const options: AerialImageOptions = {};

      // Use coordinates if available (most precise)
      if (projectInfo.latitude && projectInfo.longitude) {
        options.latitude = projectInfo.latitude;
        options.longitude = projectInfo.longitude;
        console.log('📍 Using provided coordinates for aerial image');
      } else {
        // Build address string from components
        options.address = this.buildAddressString(projectInfo);
        console.log(`📍 Using address for aerial image: ${options.address}`);
      }

      return await this.getAerialImage(options);
    } catch (error: any) {
      console.error('❌ Error getting aerial image from project info:', error.message);
      return null;
    }
  }

  /**
   * Save aerial image to a temporary file and return the path
   */
  async saveAerialImageToTemp(options: AerialImageOptions): Promise<string | null> {
    try {
      const imageBuffer = await this.getAerialImage(options);
      if (!imageBuffer) {
        return null;
      }

      // Create temp directory if it doesn't exist
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `aerial_${timestamp}.jpg`;
      const tempPath = path.join(tempDir, filename);

      // Save to temp file
      fs.writeFileSync(tempPath, imageBuffer);
      console.log(`💾 Aerial image saved to: ${tempPath}`);

      return tempPath;
    } catch (error: any) {
      console.error('❌ Error saving aerial image:', error.message);
      return null;
    }
  }

  /**
   * Get aerial image as base64 data URL for embedding in documents
   */
  async getAerialImageAsDataUrl(options: AerialImageOptions): Promise<string | null> {
    try {
      const imageBuffer = await this.getAerialImage(options);
      if (!imageBuffer) {
        return null;
      }

      const base64 = imageBuffer.toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    } catch (error: any) {
      console.error('❌ Error creating aerial image data URL:', error.message);
      return null;
    }
  }

  /**
   * Get multiple aerial images with different zoom levels and views
   */
  async getMultipleAerialImages(options: AerialImageOptions) {
    const results = {
      standard: null as Buffer | null,    // Standard satellite view
      hybrid: null as Buffer | null,      // Satellite + roads/labels
      overview: null as Buffer | null,    // Zoomed out context
      detail: null as Buffer | null       // Zoomed in detail
    };

    try {
      console.log('📸 Fetching multiple aerial views...');

      // Standard satellite view (main view for reports)
      results.standard = await this.getAerialImage({
        ...options,
        mapType: 'satellite',
        zoom: 18
      });

      // Hybrid view (satellite + roads/labels for context)
      results.hybrid = await this.getAerialImage({
        ...options,
        mapType: 'hybrid',
        zoom: 18
      });

      // Overview (zoomed out for neighborhood context)
      results.overview = await this.getAerialImage({
        ...options,
        mapType: 'satellite',
        zoom: 16
      });

      // Detail view (zoomed in for close inspection)
      results.detail = await this.getAerialImage({
        ...options,
        mapType: 'satellite',
        zoom: 20
      });

      console.log('✅ Multiple aerial images retrieved');
      return results;
    } catch (error: any) {
      console.error('❌ Error fetching multiple aerial images:', error.message);
      return results;
    }
  }

  /**
   * Clean up temporary files older than 1 hour
   */
  cleanupTempFiles(): void {
    try {
      const tempDir = path.join(process.cwd(), 'temp');
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        const now = Date.now();
        
        files.forEach(file => {
          if (file.startsWith('aerial_')) {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);
            const fileAge = now - stats.mtime.getTime();
            
            // Delete files older than 1 hour
            if (fileAge > 60 * 60 * 1000) {
              fs.unlinkSync(filePath);
              console.log(`🧹 Cleaned up temp file: ${file}`);
            }
          }
        });
      }
    } catch (error: any) {
      console.error('❌ Error cleaning up temp files:', error.message);
    }
  }
}

export const aerialImageService = new AerialImageService();