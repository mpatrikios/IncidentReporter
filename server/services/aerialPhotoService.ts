import axios from 'axios';
import { Buffer } from 'buffer';

interface AerialPhotoRequest {
  address: string;
  reportId: string;
  figureNumber?: number;
}

interface AerialPhotoResponse {
  imageUrl: string;
  caption: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  figureNumber: number;
}

export class AerialPhotoService {
  private readonly GEOCODING_API = 'https://nominatim.openstreetmap.org/search';
  private readonly GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  
  /**
   * Generate aerial photo of property using Google Maps Static API
   */
  async generateAerialPhoto(request: AerialPhotoRequest): Promise<AerialPhotoResponse> {
    try {
      console.log('DEBUG: Starting aerial photo generation for address:', request.address);
      
      // For now, let's use a simple test approach to verify the S3 upload works
      return await this.generateTestAerialPhoto(request);
      
      // Step 1: Geocode the address to get coordinates
      console.log('DEBUG: Step 1 - Geocoding address...');
      const coordinates = await this.geocodeAddress(request.address);
      console.log('DEBUG: Geocoding successful:', coordinates);
      
      // Step 2: Generate map URL (try Google first, fallback to OSM)
      console.log('DEBUG: Step 2 - Generating map URL...');
      let mapImageUrl;
      let useGoogle = false;
      
      if (this.GOOGLE_MAPS_API_KEY) {
        console.log('DEBUG: Using Google Maps Static API');
        mapImageUrl = this.generateGoogleMapsUrl(coordinates.latitude, coordinates.longitude);
        useGoogle = true;
      } else {
        console.log('DEBUG: No Google Maps API key, using OpenStreetMap');
        mapImageUrl = this.generateOSMTileUrl(coordinates.latitude, coordinates.longitude);
        useGoogle = false;
      }
      
      console.log('DEBUG: Map URL generated:', mapImageUrl);
      
      // Step 3: Fetch the image
      console.log('DEBUG: Step 3 - Fetching map image...');
      const imageBuffer = await this.fetchMapImage(mapImageUrl);
      console.log('DEBUG: Image fetched, size:', imageBuffer.length, 'bytes');
      
      // Step 4: Save the image to S3 and create database record
      console.log('DEBUG: Step 4 - Saving image to S3...');
      const imageUrl = await this.saveAerialImage(imageBuffer, request.reportId);
      console.log('DEBUG: Image saved to S3:', imageUrl);
      
      // Step 4b: Save as ReportImage in database
      console.log('DEBUG: Step 4b - Creating database record...');
      await this.saveAerialImageRecord(request.reportId, imageUrl, coordinates);
      console.log('DEBUG: Database record created');
      
      // Step 5: Generate caption with figure number
      const figureNumber = request.figureNumber || 1;
      const source = useGoogle ? 'Google Maps' : 'OpenStreetMap';
      const caption = `Figure ${figureNumber}: Aerial view of subject property (${source})`;
      
      return {
        imageUrl,
        caption,
        coordinates,
        figureNumber
      };

    } catch (error) {
      console.error('ERROR: Aerial photo generation failed at step:', error);
      console.error('ERROR: Full error details:', error);
      throw error; // Re-throw the original error for better debugging
    }
  }

  /**
   * Generate a test aerial photo to verify the system works
   */
  private async generateTestAerialPhoto(request: AerialPhotoRequest): Promise<AerialPhotoResponse> {
    try {
      console.log('DEBUG: Using test aerial photo generation');
      
      // Create a simple colored image as a test
      const testImageBuffer = await this.createTestImage();
      console.log('DEBUG: Test image created, size:', testImageBuffer.length, 'bytes');
      
      // Save to S3
      const imageUrl = await this.saveAerialImage(testImageBuffer, request.reportId);
      console.log('DEBUG: Test image saved to S3:', imageUrl);
      
      // Mock coordinates for testing
      const coordinates = { latitude: 40.7128, longitude: -74.0060 }; // NYC as example
      
      // Save database record
      await this.saveAerialImageRecord(request.reportId, imageUrl, coordinates);
      
      const figureNumber = request.figureNumber || 1;
      const caption = `Figure ${figureNumber}: Aerial view of subject property (Test Image)`;
      
      return {
        imageUrl,
        caption,
        coordinates,
        figureNumber
      };
      
    } catch (error) {
      console.error('ERROR: Test aerial photo generation failed:', error);
      throw error;
    }
  }

  /**
   * Create a simple test image
   */
  private async createTestImage(): Promise<Buffer> {
    // Create a simple PNG image programmatically
    // This is a minimal 1x1 pixel PNG for testing
    const pngBytes = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // Width: 1
      0x00, 0x00, 0x00, 0x01, // Height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, etc.
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Data
      0xE2, 0x21, 0xBC, 0x33, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    return pngBytes;
  }

  /**
   * Geocode address to coordinates using OpenStreetMap Nominatim
   */
  private async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number }> {
    try {
      const response = await axios.get(this.GEOCODING_API, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'IncidentReporter/1.0'
        }
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('Address not found');
      }

      const result = response.data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      };

    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to geocode address');
    }
  }

  /**
   * Generate Google Maps Static API URL for satellite view
   */
  private generateGoogleMapsUrl(latitude: number, longitude: number): string {
    if (!this.GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams({
      center: `${latitude},${longitude}`,
      zoom: '18',
      size: '640x640',
      maptype: 'satellite',
      format: 'png',
      key: this.GOOGLE_MAPS_API_KEY
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Fetch the map image from Google Maps Static API
   */
  private async fetchMapImage(mapUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(mapUrl, {
        responseType: 'arraybuffer',
        timeout: 10000
      });

      return Buffer.from(response.data);

    } catch (error) {
      console.error('Error fetching map image:', error);
      throw new Error('Failed to fetch satellite image');
    }
  }

  /**
   * Save aerial image temporarily (bypass S3 for now)
   */
  private async saveAerialImage(imageBuffer: Buffer, reportId: string): Promise<string> {
    try {
      console.log('DEBUG: Bypassing S3, saving locally for testing');
      
      const fs = await import('fs');
      const path = await import('path');
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'aerial');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const filename = `aerial_${reportId}_${Date.now()}.png`;
      const filepath = path.join(uploadsDir, filename);

      // Save the image
      fs.writeFileSync(filepath, imageBuffer);
      console.log('DEBUG: Aerial image saved locally:', filepath);

      // Return the public URL
      const publicUrl = `/uploads/aerial/${filename}`;
      console.log('DEBUG: Public URL:', publicUrl);
      
      return publicUrl;

    } catch (error) {
      console.error('Error saving aerial image locally:', error);
      throw new Error('Failed to save aerial image locally');
    }
  }

  /**
   * Save aerial photo as ReportImage in database
   */
  private async saveAerialImageRecord(
    reportId: string, 
    imageUrl: string, 
    coordinates: { latitude: number; longitude: number }
  ): Promise<void> {
    try {
      // Import the ReportImage model
      const { ReportImage } = await import('../../shared/schema');
      const mongoose = await import('mongoose');
      
      // Extract filename from URL
      const filename = imageUrl.split('/').pop() || 'aerial_photo.png';
      
      // Create ReportImage record
      const aerialImageRecord = new ReportImage({
        reportId: new mongoose.Types.ObjectId(reportId),
        stepNumber: 3, // Building & Site step
        filename: filename,
        originalFilename: `aerial_view_${Date.now()}.png`,
        fileSize: 0, // We don't track file size for generated images
        mimeType: 'image/png',
        s3Key: filename, // For local storage, we'll use filename as key
        s3Url: imageUrl, // Local URL for now
        publicUrl: imageUrl,
        uploadOrder: 0, // Aerial photos get first position
        description: `Aerial view of subject property (${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)})`,
        category: 'aerial'
      });
      
      await aerialImageRecord.save();
      console.log('DEBUG: Aerial image record saved to database');
      
    } catch (error) {
      console.error('Error saving aerial image record:', error);
      // Don't throw here - the image is already saved, this is just for organization
    }
  }

  /**
   * Alternative method using Open Street Map tiles (free option)
   */
  async generateAerialPhotoFree(request: AerialPhotoRequest): Promise<AerialPhotoResponse> {
    try {
      // Geocode the address
      const coordinates = await this.geocodeAddress(request.address);
      
      // Use OpenStreetMap tile server for satellite imagery
      // Note: This is a basic implementation - for production, consider using
      // a proper tile server or satellite imagery service
      const tileUrl = this.generateOSMTileUrl(coordinates.latitude, coordinates.longitude);
      
      const imageBuffer = await this.fetchMapImage(tileUrl);
      const imageUrl = await this.saveAerialImage(imageBuffer, request.reportId);
      
      const figureNumber = request.figureNumber || 1;
      const caption = `Figure ${figureNumber}: Aerial view of subject property (OpenStreetMap)`;
      
      return {
        imageUrl,
        caption,
        coordinates,
        figureNumber
      };

    } catch (error) {
      console.error('Error generating free aerial photo:', error);
      throw new Error('Failed to generate aerial photo using free service');
    }
  }

  /**
   * Generate OpenStreetMap tile URL (fallback option)
   * Uses a satellite imagery provider since OSM doesn't have satellite tiles
   */
  private generateOSMTileUrl(latitude: number, longitude: number): string {
    // Use a simple satellite map service (this is a placeholder)
    // In production, you'd want to use a proper satellite tile service
    const zoom = 16; // Lower zoom for single tile
    const size = 512;
    
    // Use a simple map service that provides satellite-like imagery
    // This is a basic implementation - for production, consider using:
    // - Mapbox (with API key)
    // - ESRI World Imagery
    // - Or another satellite imagery provider
    
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${Math.floor((1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))}/${Math.floor((longitude + 180) / 360 * Math.pow(2, zoom))}`;
  }

  /**
   * Validate if aerial photo generation is available
   */
  isAvailable(): { google: boolean; osm: boolean } {
    return {
      google: !!this.GOOGLE_MAPS_API_KEY,
      osm: true // OSM is always available
    };
  }
}

export const aerialPhotoService = new AerialPhotoService();