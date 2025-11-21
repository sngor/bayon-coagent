/**
 * MSW Request Handlers
 * 
 * Centralized export of all API mock handlers for external services.
 */

import { publicRecordsHandlers } from './public-records';
import { mlsHandlers } from './mls';
import { demographicsHandlers } from './demographics';
import { schoolsHandlers } from './schools';
import { googlePlacesHandlers } from './google-places';
import { walkScoreHandlers } from './walk-score';

export const handlers = [
    ...publicRecordsHandlers,
    ...mlsHandlers,
    ...demographicsHandlers,
    ...schoolsHandlers,
    ...googlePlacesHandlers,
    ...walkScoreHandlers,
];