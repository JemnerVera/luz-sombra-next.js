declare module 'piexifjs' {
  export function load(data: string): any;
  export function dump(exifObj: any): string;
  export function insert(exifStr: string, jpeg: string): string;
  export function remove(jpeg: string): string;
  export const ImageIFD: any;
  export const ExifIFD: any;
  export const GPSIFD: any;
  export const InteropIFD: any;
}
