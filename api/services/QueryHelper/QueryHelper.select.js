/* eslint no-await-in-loop: 0 */
const _ = require('lodash');
const Redis = require('ioredis');

const config = sails.config.queryhelper;
const redis = new Redis(config.redis);

const cacheAdapter = {
  redis: {
    get: async (key) => {
      const result = await redis.get(key);
      return result;
    },
    set: async (key, value, options) => {
      const result = await redis.set(key, value, 'EX', options.lifetime);
      return result;
    },
    del: async (key) => {
      const result = await redis.del(key);
      return result;
    },
  },
};

function formatOperator(operator) {
  const { Op } = Sequelize;
  let op;
  switch (operator) {
    case '<>':
      op = Op.ne;
      break;
    case '=':
      op = Op.eq;
      break;
    case 'like':
      op = Op.like;
      break;
    default:
      throw Error('this operator not supported.');
  }

  return op;
}

function formatCondition(condition) {
  const { Op } = Sequelize;
  let cond;
  switch (condition) {
    case 'and':
      cond = Op.and;
      break;
    case 'or':
      cond = Op.or;
      break;
    default:
      throw Error('this condition not supported.');
  }

  return cond;
}

function formatQuery({
  attributes = [],
  model = undefined,
  filter = {},
  include = [],
  collate = undefined,
  searchable = undefined,
  duplicating = false,
  paging = true,
  curPage = 1,
  perPage = 30,
  sort = 'DESC',
  sortBy = undefined,
  order = undefined,
  group = undefined,
  limit = undefined,
  keyword = undefined,
  log = false,
  rawWhere = false,
}) {
  let sortByColumn = null;
  try {
    let mOrder = order;
    const columns = _.keys(model.rawAttributes);

    if (sortBy) {
      sortByColumn = sortBy;
    } else if (columns.some((c) => c === 'createdAt')) {
      sortByColumn = 'createdAt';
    } else if (columns.some((c) => c === 'id')) {
      sortByColumn = 'id';
    }

    if (sortByColumn && !mOrder) {
      mOrder = [[Sequelize.col(sortByColumn), sort]];
    }

    // 組合搜尋 query
    const query = {
      where: {},
      order: mOrder,
      collate,
      duplicating,
      ...(paging
        ? {
            limit: limit && limit > perPage ? limit : perPage,
            offset: (curPage - 1) * perPage,
          }
        : {
            ...(limit ? { limit } : {}),
          }),
    };

    if (include && _.isArray(include)) {
      query.include = [];
      include.forEach((e) => {
        const inc = {
          model: e.model,
        };
        if (e.as) {
          inc.as = e.as;
        }
        if (e.limit) {
          inc.limit = e.limit;
        }
        if (e.where) {
          inc.where = e.where;
        }
        if (e.include) {
          inc.include = e.include;
        }
        if (e.through) {
          inc.through = e.through;
        }
        if (e.required) {
          inc.required = e.required;
        }
        if (e.attributes) {
          inc.attributes = e.attributes;
        }
        query.include.push(inc);
      });
    }

    if (attributes && attributes.length && attributes.length > 0) {
      query.attributes = attributes;
    }

    // 如果有指定完全符合欄位
    if (filter.where && !rawWhere) {
      const defaultCondition = formatCondition('and');
      if (!searchable) {
        _.forEach(filter.where, (value, key) => {
          const op = formatOperator('like');
          if (!query.where[defaultCondition]) {
            query.where[defaultCondition] = [];
          }

          query.where[defaultCondition].push({
            [key]: {
              [op]: filter.where[key],
            },
          });
        });
      } else {
        // 組合 searchable
        _.forEach(searchable, (value, key) => {
          if (log && !filter.where[key]) {
            sails.log(`searchable[${key}] is exists but request[${key}] missing.`);
          }

          if (_.isString(value) && filter.where[key]) {
            if (!query.where[defaultCondition]) {
              query.where[defaultCondition] = [];
            }

            const op = formatOperator(value);
            query.where[defaultCondition].push({
              [key]: {
                [op]: filter.where[key],
              },
            });
          } else if (_.isObject(value)) {
            const { operator, condition, defaultValue } = value;

            const op = formatOperator(operator);
            const cond = formatCondition(condition);

            if (!query.where[cond]) {
              query.where[cond] = [];
            }

            query.where[cond].push({
              [key]: {
                [op]: filter.where[key] ? filter.where[key] : defaultValue,
              },
            });
          }
        });

        _.forEach(filter.where, (value, key) => {
          if (Object.keys(searchable).indexOf(key) === -1) {
            const op = formatOperator('like');
            query.where[defaultCondition].push({
              [key]: {
                [op]: value,
              },
            });
          }
        });
      }
    } else if (filter.where && rawWhere) {
      query.where = filter.where;
    }

    if (keyword) {
      const fmtKeyword = keyword.trim();
      const defaultCondition = formatCondition('or');
      if (!query.where[defaultCondition]) {
        query.where[defaultCondition] = [];
      }

      columns.forEach((column) => {
        query.where[defaultCondition].push(
          Sequelize.where(Sequelize.col(column), 'like', `%${fmtKeyword}%`),
        );
      });
    }

    if (log) {
      if (_.isObject(log)) {
        query.logging = log;
      }
      query.logging = Console.log;
    }

    if (!_.isNil(group) && group !== false) {
      query.group = group;
    }

    return query;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

async function formatOutput({ presenter = null, data = null }) {
  try {
    let result;
    if (!_.isNil(presenter) && _.isFunction(presenter)) {
      if (presenter.constructor.name === 'AsyncFunction') {
        result = await presenter(data);
      } else {
        result = presenter(data);
      }
    } else {
      result = data;
    }
    return result;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

async function getCaches(cache) {
  let result;
  const data = await cache.adapter.get(`${cache.key}:*`);
  try {
    if (data) result = JSON.parse(data);
  } catch (err) {
    sails.log.error(err);
  }

  return result;
}

async function getCache(cache) {
  let result;
  const data = await cache.adapter.get(`${cache.key}`);
  sails.log(data)
  try {
    if (data) result = JSON.parse(data);
  } catch (err) {
    sails.log.error(err);
  }

  return result;
}

async function setCache(cache, value, options = {}) {
  const cachedAt = Date.now();
  const key = `${options.isItem ? options.itemId : cachedAt}`;
  await cache.adapter.set(
    `${cache.key}:${key}`,
    JSON.stringify({
      ...value,
      cachedAt,
    }),
    {
      lifetime: cache.lifetime,
    },
  );
}

async function delCache(cache) {
  await cache.adapter.del(`${cache.name}:${cache.key}:*`);
}

async function create({
  model = undefined,
  scope = [],
  include = [],
  data = {},
  presenter = undefined,
} = {}) {
  let result;

  if (scope) {
    result = await model.scope(scope).create(data, {
      include,
    });
  } else {
    result = await model.create(data, {
      include,
    });
  }

  if (!_.isNil(presenter) && _.isFunction(presenter)) {
    if (presenter.constructor.name === 'AsyncFunction') {
      result = await presenter(result);
    } else {
      result = presenter(result);
    }
  }

  return result;
}

async function update({
  model = undefined,
  scope = [],
  include = [],
  where = {},
  data = {},
  // log = false,
} = {}) {
  let result;

  if (scope) {
    result = await model.scope(scope).update(data, {
      where,
      include,
    });
  } else {
    result = await model.update(data, {
      where,
      include,
    });
  }

  return result;
}

async function destroy({
  model = undefined,
  scope = [],
  where = {},
} = {}) {
  let result;
  if (scope) {
    result = await model.scope(scope).destroy({
      where,
    });
  } else {
    result = await model.destroy({
      where,
    });
  }

  return result;
}

async function find({
  model = undefined,
  scope = [],
  include = [],
  attributes = [],
  searchable = undefined,
  presenter = undefined,
  filter = {
    where: {},
  },
  sort = 'DESC',
  sortBy = undefined,
  order = undefined,
  collate = undefined,
  group = undefined,
  limit = undefined,
  paging = true,
  curPage = 1,
  perPage = 30,
  keyword = undefined,
  rawWhere = false,
  toJSON = true,
  log = false,
} = {}) {
  try {
    if (!model || !model.name) {
      throw Error('model missing.');
    }

    const query = formatQuery({
      searchable,
      attributes,
      paging,
      curPage,
      perPage,
      filter,
      sort,
      sortBy,
      order,
      collate,
      model,
      include,
      group,
      limit,
      keyword,
      rawWhere,
      toJSON,
      log,
    });

    if (log) {
      sails.log.debug('query=>');
      Console.dir(query);
    }
    let data = null;
    if (scope) {
      data = await model.scope(scope).findAndCountAll(query);
    } else {
      data = await model.findAndCountAll(query);
    }

    const items = [];
    for (const row of data.rows) {
      items.push(
        await formatOutput({
          presenter,
          data: toJSON ? row.toJSON() : row,
        }),
      );
    }

    const total = typeof data.count === 'number' ? data.count : data.count.length;
    const result = {
      paging: {
        lastPage: paging ? Math.ceil(total / perPage) || 1 : null,
        curPage: paging ? curPage : null,
        perPage: paging ? perPage : null,
        sort: sort.toUpperCase(),
        sortBy: sortBy ? sortBy.toLowerCase() : sortBy,
        order,
        limit: limit || null,
        total,
      },
      filter,
      items,
    };

    return result;
  } catch (e) {
    // Console.timeEnd(tag);
    sails.log.error(e);
    throw e;
  }
}

class Query {
  constructor() {
    this.data = {
      attributes: [],
      model: null,
      scope: [],
      include: [],
      where: {},
      request: {},
      presenter: null,
      searchable: null,
      keyword: null,
      keyName: null,
      useWhere: [],
      useRawWhere: null,
    };
  }

  /**
   * @param {object} model - 要進行查詢的 Sequelize models
   */
  select(model) {
    this.data.model = model;
    return this;
  }

  /**
   * @param {Array} models - 要 include 的 Sequelize models array
   */
  useInclude(models) {
    if (Array.isArray(models)) {
      this.data.include = this.data.include.concat(models);
    }
    return this;
  }

  /**
   * @param {string|Array} scope - 要使用的 scope name 或 name array
   */
  useScope(scope) {
    if (typeof scope === 'string') {
      this.data.scope.push(scope);
    } else if (Array.isArray(scope)) {
      this.data.scope = this.data.scope.concat(scope);
    }
    return this;
  }

  /**
   * @param {string|object} searchable - 只有 string 時為 Sequelize operator 且預設 condition 為 and
   * @param {string} searchable.operator - Sequelize operator, 支援 <>, =, like
   * @param {string} searchable.condition - Sequelize condition, 支援 and, or
   * @param {string} searchable.defaultValue - 搜尋數值未填入時的預設搜尋內容
   */
  useSearchable(searchable) {
    this.data.searchable = {
      ...(this.data.searchable ? this.data.searchable : {}),
      ...searchable,
    };
    return this;
  }

  /**
   * @param {Array} attributes - 查詢時所需的 attributes
   */
  useAttribute(attributes) {
    if (Array.isArray(attributes)) {
      this.data.attributes = this.data.attributes.concat(attributes);
    }
    return this;
  }

  /**
   * @param {object|function(request: object)} parameter -
   * where 查詢內容 object,
   * 傳入 function 時, function 會傳入 useRequest 所儲存的結果,
   * useWhere 的查詢在未使用 useSearchable 時預設 operator 為 like
   */
  useWhere(parameter) {
    this.data.useWhere.push(parameter);
    return this;
  }

  /**
   * @param {object} parameter -
   * 原始 where 查詢 object, 使用後將忽略 useWhere() 的功能
   */
  useRawWhere(parameter) {
    this.data.useRawWhere = parameter;
    return this;
  }

  /**
   * @param {object} request -
   * 傳入 req.validate 驗證過後的 request 內容供 useWhere() 使用
   */
  useRequest(request) {
    this.data.request = {
      ...this.data.request,
      ...request,
    };
    return this;
  }

  useView(view) {
    this.data.view = {
      includeColumns: view.includeColumns,
      excludeColumns: view.excludeColumns,
    };
    return this;
  }

  /**
   * 設定快取
   * @param {object} cache - cache 設定 object
   * @param {string|object} cache.adapter - adapter 名稱或是包含 set/get function 的 adapter object
   * @param {string} cache.key - cache key
   * @param {string} cache.lifetime - cache 存活時間
   */
  useCache(cache) {
    const adapter = typeof cache.adapter === 'string' ? cacheAdapter[cache.adapter] : cache.adapter;

    let key = `${this.data.model.name}`;

    if (cache.key) {
      key = `${key}:${cache.key}`;
    }

    if (cache.rawKey) {
      key = cache.rawKey;
    }

    this.data.cache = {
      lifetime: cache.lifetime,
      adapter,
      key,
    };

    return this;
  }

  /**
   * @param {function(request: object)} presenter -
   * 會傳入每筆查詢結果 object, 用於 formating 輸出
   */
  usePresenter(presenter) {
    if (typeof presenter === 'function') {
      this.data.presenter = presenter;
    }
    return this;
  }

  /**
   * @param {string} keyName - useRequest() 所傳入的全文檢索查詢用關鍵字 key name
   */
  useFullTextSearchByKey(keyName) {
    if (typeof keyName === 'string') {
      this.data.keyName = keyName;
    }
    return this;
  }

  queryInit() {
    for (const parameter of this.data.useWhere) {
      let where = {};
      if (typeof parameter === 'object') {
        where = parameter;
      } else if (typeof parameter === 'function') {
        where = parameter(this.data.request);
      }

      this.data.where = {
        ...this.data.where,
        ...where,
      };
    }

    if (this.data.useRawWhere) {
      this.data.where = this.data.useRawWhere;
    }

    if (this.data.keyName && this.data.request[this.data.keyName]) {
      this.data.keyword = this.data.request[this.data.keyName];
      delete this.data.request[this.data.keyName];
    }
  }

  /**
   * @param {object} query - 查詢用 object
   * @param {number} [query.curPage=1] - 當前頁面位置
   * @param {number} [query.perPage=30] - 每頁結果數量
   * @param {string} [query.sort='DESC'] - 排序方法
   * @param {string} query.sortBy - 排序欄位
   * @param {object} query.order - 其他排序
   * @param {Array} query.group - 分組
   * @param {string} query.collate - 語系
   * @param {number} query.limit - 搜尋數量上限
   * @returns {object} result - 回傳結果
   * @property {Array} result.items - 搜尋結果
   * @property {object} result.paging - 分頁設定
   * @property {number} result.paging.lastPage - 最後一頁位置
   * @property {number} result.paging.curPage - 當前頁面位置
   * @property {number} result.paging.perPage - 每頁結果數量
   * @property {string} result.paging.sort - 排序方法
   * @property {string} result.paging.sortBy - 排序欄位
   * @property {object} result.paging.order - 其他排序
   * @property {number} result.paging.limit - 搜尋數量上限
   * @property {number} result.paging.total - 總搜尋數量
   */
  async getPaging({
    curPage = 1,
    perPage = 30,
    sort = 'DESC',
    sortBy,
    order,
    group,
    collate,
    limit,
    toJSON,
    log,
  }) {
    this.queryInit();

    let result;
    let cacheResult;
    if (this.data.cache) {
      cacheResult = await getCache(this.data.cache);
    }

    if (this.data.cache && cacheResult) {
      result = cacheResult;
    } else {
      result = await find({
        model: this.data.model,
        scope: this.data.scope,
        include: this.data.include,
        attributes: this.data.attributes,
        searchable: this.data.searchable,
        presenter: this.data.presenter,
        filter: {
          where: this.data.where,
        },
        curPage,
        perPage,
        paging: true,
        sort,
        sortBy,
        order,
        group,
        collate,
        keyword: this.data.keyword,
        limit,
        rawWhere: this.data.useRawWhere instanceof Object,
        toJSON,
        log,
      });
    }

    if (this.data.cache && !cacheResult) {
      const fmtData = result;
      if (!toJSON) {
        const items = [];
        for (const item of fmtData.items) {
          items.push(item.toJSON());
        }
        fmtData.items = items;
      }
      await setCache(this.data.cache, fmtData);
    }

    return result;
  }

  /**
   * @param {object} query - 查詢用 object
   * @param {string} [query.sort='DESC'] - 排序方法
   * @param {string} query.sortBy - 排序欄位
   * @param {object} query.order - 其他排序
   * @param {Array} query.group - 分組
   * @param {string} query.collate - 語系
   * @param {number} query.limit - 搜尋數量上限
   * @returns {object} result - 回傳結果
   * @property {Array} result.items - 搜尋結果
   * @property {object} result.paging - 分頁設定
   * @property {number} result.paging.lastPage - 最後一頁位置
   * @property {number} result.paging.curPage - 當前頁面位置
   * @property {number} result.paging.perPage - 每頁結果數量
   * @property {string} result.paging.sort - 排序方法
   * @property {string} result.paging.sortBy - 排序欄位
   * @property {object} result.paging.order - 其他排序
   * @property {number} result.paging.limit - 搜尋數量上限
   * @property {number} result.paging.total - 總搜尋數量
   */
  async findAll({ sort = 'DESC', sortBy, order, group, collate, limit, toJSON, log }) {
    this.queryInit();

    let result;
    let cacheResult;
    if (this.data.cache) {
      cacheResult = await getCache(this.data.cache);
    }

    if (this.data.cache && cacheResult) {
      result = cacheResult;
    } else {
      result = await find({
        model: this.data.model,
        scope: this.data.scope,
        include: this.data.include,
        attributes: this.data.attributes,
        searchable: this.data.searchable,
        presenter: this.data.presenter,
        filter: {
          where: this.data.where,
        },
        paging: false,
        sort,
        sortBy,
        order,
        group,
        collate,
        keyword: this.data.keyword,
        limit,
        rawWhere: this.data.useRawWhere instanceof Object,
        toJSON,
        log,
        cache: this.data.cache,
      });
    }

    if (this.data.cache && !cacheResult) {
      const fmtData = result;
      if (!toJSON) {
        const items = [];
        for (const item of fmtData.items) {
          items.push(item.toJSON());
        }
        fmtData.items = items;
      }
      await setCache(this.data.cache, fmtData);
    }

    return result;
  }

  /**
   * 取得快取資料
   */
  async getCache() {
    this.queryInit();

    let result = [];
    if (this.data.cache) {
      result = await getCache(this.data.cache);
    }

    return result;
  }

  /**
   * 新增資料
   * @param {object} data - 欲新增的資料
   */
  async create(data) {
    this.queryInit();

    const result = await create({
      model: this.data.model,
      scope: this.data.scope,
      include: this.data.include,
      presenter: this.data.presenter,
      data,
    });

    if (this.data.cache) {
      await setCache(this.data.cache, result.toJSON(), {
        isItem: true,
        itemId: result.id,
      });
    }

    return result;
  }

  /**
   * 更新資料
   * @param {object} data - 欲更新的資料
   */
  async update(data) {
    this.queryInit();

    const result = await update({
      model: this.data.model,
      scope: this.data.scope,
      include: this.data.include,
      where: this.data.where,
      data,
    });

    if (this.data.cache) {
      await delCache(this.data.cache);
    }

    return result;
  }

  /**
   * 刪除資料
   */
  async destroy() {
    this.queryInit();

    const result = destroy({
      model: this.data.model,
      scope: this.data.scope,
      include: this.data.include,
      where: this.data.where,
    });

    if (this.data.cache) {
      await delCache(this.data.cache);
    }

    return result;
  }
}

/**
 * 將回傳 class Query 並呼叫 Query.select(model)
 *
 * @param {model} model - 要進行查詢的 Sequelize models
 */
module.exports = function select(model) {
  return new Query().select(model);
};
