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
  attributes,
  model,
  filter,
  include,
  collate,
  searchable,
  duplicating = false,
  paging = true,
  curPage = 1,
  perPage = 30,
  sort = 'DESC',
  sortBy,
  order,
  group,
  limit = perPage,
  log = false,
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
        limit: limit > perPage ? perPage : limit,
        offset: (curPage - 1) * perPage,
      } : {
        limit,
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

    if (attributes) {
      query.attributes = attributes;
    }

    // 如果有指定完全符合欄位
    if (filter.where) {
      const defaultCondition = formatCondition('and');
      if (!searchable) {
        query.where[defaultCondition] = filter.where;
      } else {
        // 組合 searchable
        for (const key in searchable) {
          if (_.isString(searchable[key]) && filter.where[key]) {
            if (!query.where[defaultCondition]) {
              query.where[defaultCondition] = [];
            }

            const op = formatOperator(searchable[key]);
            query.where[defaultCondition].push({
              [key]: {
                [op]: filter.where[key],
              },
            });
          } else if (_.isObject(searchable[key])) {
            const {
              operator,
              condition,
              defaultValue,
            } = searchable[key];

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
        }
      }
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
    // Console.log('query=>');
    // Console.dir(query);
    return query;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

function formatOutput({
  presenter = null,
  data = null,
}) {
  try {
    return !_.isNil(presenter) && _.isFunction(presenter)
      ? presenter(data)
      : data;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

async function find(
  {
    model,
    scope = null,
    include = [],
    attributes,
    searchable,
    presenter,
    filter = {
      where: {},
    },
    sort = 'DESC',
    sortBy = null,
    order = null,
    collate = null,
    group = null,
    limit,
    log = false,
    paging = true,
    curPage = 1,
    perPage = 30,
  } = {},
) {
  try {
    const inputHasNull = ValidatorHelper.checkNull({
      model,
    });
    if (inputHasNull) {
      throw Error(
        MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({
          inputHasNull,
        }),
      );
    }
    const query = formatQuery({
      searchable,
      attributes,
      curPage,
      perPage,
      filter,
      sort,
      sortBy,
      order,
      collate,
      model,
      include,
      log,
      group,
      limit,
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

    const items = data.rows.map((e) =>
      formatOutput({
        presenter,
        data: e ? e.toJSON() : null,
      }));
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

class Chain {
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
      useWhere: [],
    };
  }

  select(model) {
    this.data.model = model;
    return this;
  }

  /**
   * @param {array} include models
   */
  useInclude(models) {
    if (Array.isArray(models)) {
      this.data.include = this.data.include.concat(models);
    }
    return this;
  }

  /**
   * @param {string|array} scope
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
   * @param {string|object} 字串為 operator, defaultCondition 為 and
   * @param {string} operator
   * @param {string} condition
   * @param {string} defaultValue - 搜尋數值未填入時的預設搜尋內容
   */
  useSearchable(searchable) {
    this.data.searchable = {
      ...this.data.searchable ? this.data.searchable : {},
      ...searchable,
    };
    return this;
  }

  /**
   * @param {array} attributes
   */
  useAttribute(attributes) {
    if (Array.isArray(attributes)) {
      this.data.attributes = this.data.attributes.concat(attributes);
    }
    return this;
  }

  /**
   * @param {function(request: object)} request 為傳入內容
   */
  useWhere(parameter) {
    this.data.useWhere.push(parameter);
    return this;
  }

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
   * @param {function} presenter
   */
  usePresenter(presenter) {
    if (typeof presenter === 'function') {
      this.data.presenter = presenter;
    }
    return this;
  }

  /**
   * @param {number} curPage - 當前頁面位置
   * @param {number} perPage - 每頁結果數量
   * @param {string} sort - 排序方法
   * @param {string} sortBy - 排序欄位
   * @param {object} order - 其他排序
   * @param {string} collate - 語系
   * @param {number} limit - 搜尋數量上限
   * @return {object}
   * @property {array} items - 搜尋結果
   * @property {object} paging - 分頁設定
   * @property {number} paging.lastPage - 最後一頁位置
   * @property {number} paging.curPage - 當前頁面位置
   * @property {number} paging.perPage - 每頁結果數量
   * @property {string} paging.sort - 排序方法
   * @property {string} paging.sortBy - 排序欄位
   * @property {object} paging.order - 其他排序
   * @property {number} paging.limit - 搜尋數量上限
   * @property {number} paging.total - 總搜尋數量
   */
  getPaging({
    curPage = 1,
    perPage = 30,
    sort = 'DESC',
    sortBy = 'createdAt',
    order,
    group,
    collate,
    limit,
  }) {
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

    return find({
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
      limit,
    });
  }

  /**
   * @param {string} sort - 排序方法
   * @param {string} sortBy - 排序欄位
   * @param {object} order - 其他排序
   * @param {string} collate - 語系
   * @param {number} limit - 搜尋數量上限
   * @return {object}
   * @property {array} items - 搜尋結果
   * @property {object} paging - 分頁設定
   * @property {number} paging.lastPage - 最後一頁位置
   * @property {number} paging.curPage - 當前頁面位置
   * @property {number} paging.perPage - 每頁結果數量
   * @property {string} paging.sort - 排序方法
   * @property {string} paging.sortBy - 排序欄位
   * @property {object} paging.order - 其他排序
   * @property {number} paging.limit - 搜尋數量上限
   * @property {number} paging.total - 總搜尋數量
   */
  findAll({
    sort = 'DESC',
    sortBy = 'createdAt',
    order,
    group,
    collate,
    limit,
  }) {
    return find({
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
      limit,
    });
  }
}

export default function select(model) {
  return new Chain().select(model);
}
