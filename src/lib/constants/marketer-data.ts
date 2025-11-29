
import type {
  Profile,
  Review,
  Award,
  BrandAudit,
  Competitor,
  KeywordRanking,
  Property,
} from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) =>
  PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';
const getImageHint = (id: string) =>
  PlaceHolderImages.find(img => img.id === id)?.imageHint || '';


export const buyerPersonas = [
  { value: 'First-Time Homebuyer', label: 'First-Time Homebuyer' },
  { value: 'Luxury Investor', label: 'Luxury Investor' },
  { value: 'Growing Family', label: 'Growing Family' },
  { value: 'Downsizer/Retiree', label: 'Downsizer / Retiree' },
  { value: 'Remote Worker', label: 'Remote Worker' },
];
