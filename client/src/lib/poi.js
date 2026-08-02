import {
  Fuel, Zap, Pill, Cross, Banknote, ShoppingCart, Croissant, Store,
  ParkingSquare, TreePine, Droplet, Toilet, Eye, Landmark, Church, Building2, MapPin,
} from 'lucide-react';

/** POI group → colour (used for markers and legend). */
export const GROUP_COLOR = {
  essential: '#e4572e', // warm red — services you may urgently need
  supplies: '#f5b638', // amber — shops
  rest: '#2d9cdb', // blue — rest/scenery
  interest: '#8e5bd9', // purple — cultural interest
};

/** POI subcategory → lucide icon. */
export const SUB_ICON = {
  fuel: Fuel, charging: Zap, pharmacy: Pill, hospital: Cross, atm: Banknote,
  supermarket: ShoppingCart, bakery: Croissant, convenience: Store,
  parking: ParkingSquare, picnic: TreePine, water: Droplet, toilets: Toilet, viewpoint: Eye,
  historic: Landmark, church: Church, museum: Building2,
};

export const GROUPS = ['essential', 'supplies', 'rest', 'interest'];

export const iconFor = (sub) => SUB_ICON[sub] ?? MapPin;
