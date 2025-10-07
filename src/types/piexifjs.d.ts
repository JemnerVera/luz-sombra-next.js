declare module 'piexifjs' {
  export function load(data: string): Record<string, unknown>;
  export function dump(exifObj: Record<string, unknown>): string;
  export function insert(exifStr: string, jpeg: string): string;
  export function remove(jpeg: string): string;
  export const ImageIFD: Record<string, number>;
  export const ExifIFD: Record<string, number>;
  export const GPSIFD: Record<string, number>;
  export const InteropIFD: Record<string, number>;
}
