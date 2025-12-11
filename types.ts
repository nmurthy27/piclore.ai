export interface PhoneSpecs {
  name: string;
  width: number;
  height: number;
}

export interface ImageSource {
  type: 'ai' | 'url';
  data: string; // Base64 or URL
}

export enum AppStep {
  LOGIN = 'LOGIN',
  INPUT = 'INPUT',
  PROCESSING = 'PROCESSING',
  EDITOR = 'EDITOR',
  RESULT = 'RESULT'
}

export interface CropState {
  x: number;
  y: number;
  scale: number;
}

export interface SearchQuery {
  celeb: string;
  phone: string;
  style: string;
  context: string;
}

export interface User {
  name: string;
  email: string;
  country: string;
}