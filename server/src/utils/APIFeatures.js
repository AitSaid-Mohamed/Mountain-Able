import { getPaginationParams } from './pagination.js';

/**
 * Small, reusable query-builder helper that applies filtering, sorting and
 * pagination to a Mongoose query from the request query string. Controllers
 * build the concrete Mongo filter object (search regexes, ranges, …) and hand
 * it to `.filter()`, then chain `.sort()` and `.paginate()` — keeping the
 * controller body short and the behaviour consistent across resources.
 *
 * @example
 *   const features = new APIFeatures(Village.find(), req.query)
 *     .filter(mongoFilter)
 *     .sort(SORT_MAP, '-ratingAverage')
 *     .paginate({ defaultLimit: 9, maxLimit: 50 });
 *   const docs = await features.query;
 *   // features.page / features.limit are available for the meta object
 */
export default class APIFeatures {
  /**
   * @param {import('mongoose').Query} query  a Mongoose query (e.g. Model.find())
   * @param {object} queryString  the Express req.query
   */
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString ?? {};
    this.page = 1;
    this.limit = 0;
  }

  /**
   * Apply a pre-built Mongo filter object to the query.
   * @param {object} [mongoFilter={}]
   */
  filter(mongoFilter = {}) {
    this.query = this.query.find(mongoFilter);
    return this;
  }

  /**
   * Apply sorting from a whitelist map keyed by the public `sort` value.
   * @param {Record<string,string>} sortMap  e.g. { rating: '-ratingAverage', name: 'name' }
   * @param {string} [defaultKey]  the map key used when none/invalid is provided
   */
  sort(sortMap, defaultKey) {
    const requested = this.queryString.sort;
    const chosen = (requested && sortMap[requested]) || sortMap[defaultKey] || defaultKey;
    if (chosen) this.query = this.query.sort(chosen);
    return this;
  }

  /**
   * Apply page/limit pagination and remember the values for the meta object.
   * @param {{defaultLimit?:number, maxLimit?:number}} [opts]
   */
  paginate(opts) {
    const { page, limit, skip } = getPaginationParams(this.queryString, opts);
    this.page = page;
    this.limit = limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
