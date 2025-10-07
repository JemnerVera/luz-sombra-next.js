// Server-side EXIF extraction for Node.js
import * as piexif from 'piexifjs';

export interface DateTimeInfo {
  date: string;
  time: string;
}

// Extract date and time from EXIF data on server-side
export const extractDateTimeFromImageServer = async (file: File): Promise<DateTimeInfo | null> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const binary = buffer.toString('binary');
    
    // Extract EXIF data
    const exifData = piexif.load(binary);
    
    if (!exifData || !exifData['0th'] || !exifData['Exif']) {
      console.log(`❌ No EXIF data found for ${file.name}`);
      return null;
    }

    // Try different EXIF date fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateTime = (exifData as any)['0th']?.[piexif.ImageIFD.DateTime];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateTimeOriginal = (exifData as any)['Exif']?.[piexif.ExifIFD.DateTimeOriginal];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateTimeDigitized = (exifData as any)['Exif']?.[piexif.ExifIFD.DateTimeDigitized];
    
    const dateTimeValue = dateTimeOriginal || dateTimeDigitized || dateTime;
    
    if (dateTimeValue && typeof dateTimeValue === 'string') {
      // EXIF date format: "YYYY:MM:DD HH:MM:SS"
      const [datePart, timePart] = dateTimeValue.split(' ');
      if (datePart && timePart) {
        // Convert to more readable format
        const [year, month, day] = datePart.split(':');
        const [hour, minute, second] = timePart.split(':');
        
        const date = `${day}/${month}/${year}`;
        const time = `${hour}:${minute}:${second}`;
        
        const result: DateTimeInfo = { date, time };
        
        console.log(`📅 Date/Time found for ${file.name}: ${date} ${time}`);
        return result;
      } else {
        console.log(`❌ Invalid date format for ${file.name}: ${dateTimeValue}`);
        return null;
      }
    } else {
      console.log(`❌ No date/time data found for ${file.name}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error processing EXIF date for ${file.name}:`, error);
    return null;
  }
};
