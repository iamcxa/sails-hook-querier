/* eslint no-await-in-loop: 0 */
import _ from 'lodash';

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
  log = false,
  toJSON = false,
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
      ...paging ? {
        limit: limit && limit > perPage ? limit : perPage,
        offset: (curPage - 1) * perPage,
      } : {
        ...limit ? { limit } : {},
      },
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
    if (filter.where) {
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
            const {
              operator,
              condition,
              defaultValue,
            } = value;

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
    }

    if (filter.keyword) {
      const keyword = filter.keyword.trim();
      const defaultCondition = formatCondition('or');
      if (!query.where[defaultCondition]) {
        query.where[defaultCondition] = [];
      }

      columns.forEach((column) => {
        query.where[defaultCondition].push(Sequelize.where(Sequelize.col(column), 'like', `%${keyword}%`));
      });
    }

    if (log) {
      if (_.isObject(log)) {
        query.logging = log;
      }
      query.logging = Console.log;
    }

    if (_.isNil(group) && include) {
      query.group = [`${model.name}.id`];
    } else if (!_.isNil(group) && group !== false) {
      query.group = group;
    }

    if (toJSON) {
      query.raw = true;
      query.nest = true;
    }
    // Console.log('query=>');
    // Console.dir(query);

    return query;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

async function formatOutput({
  presenter = null,
  data = null,
}) {
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

async function find(
  {
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
    toJSON = false,
    log = false,
  } = {},
) {
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
      items.push(await formatOutput({
        presenter,
        data: row,
      }));
    }

    const total = typeof data.count === 'number' ? data.count : data.count.length;
    return {
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
      ...this.data.searchable ? this.data.searchable : {},
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

  useCache(cache) {
    this.data.cache = {
      minutes: cache.minutes,
      target: cache.target,
      tableName: cache.tableName,
      redisPath: cache.redisPath,
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
   * @return {object} result - 回傳結果
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
  getPaging({
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

    return find({
      model: this.data.model,
      scope: this.data.scope,
      include: this.data.include,
      attributes: this.data.attributes,
      searchable: this.data.searchable,
      presenter: this.data.presenter,
      filter: {
        where: this.data.where,
        keyword: this.data.keyword,
      },
      curPage,
      perPage,
      paging: true,
      sort,
      sortBy,
      order,
      group,
      collate,
      limit,
      toJSON,
      log,
    });
  }

  /**
   * @param {object} query - 查詢用 object
   * @param {string} [query.sort='DESC'] - 排序方法
   * @param {string} query.sortBy - 排序欄位
   * @param {object} query.order - 其他排序
   * @param {Array} query.group - 分組
   * @param {string} query.collate - 語系
   * @param {number} query.limit - 搜尋數量上限
   * @return {object} result - 回傳結果
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
  findAll({
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

    return find({
      model: this.data.model,
      scope: this.data.scope,
      include: this.data.include,
      attributes: this.data.attributes,
      searchable: this.data.searchable,
      presenter: this.data.presenter,
      filter: {
        where: this.data.where,
        keyword: this.data.keyword,
      },
      paging: false,
      sort,
      sortBy,
      order,
      group,
      collate,
      limit,
      toJSON,
      log,
    });
  }
}

/**
 * 將回傳 class Query 並呼叫 Query.select(model)
 * @param {model} model - 要進行查詢的 Sequelize models
 */
export default function select(model) {
  return new Query().select(model);
}

export {
  Query,
};
