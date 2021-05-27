import _ from 'lodash';
/**
 * 依據輸入資料格式化查詢 query
 * @version 1.0
 * @param {Object} {
 *     langCode{String} = 'zh-TW',      要查詢的資料語系。
 *     modelName{String} = null,        要查詢的目標 Sequelize Model 名稱。
 *     filter = null,
 *     include{Object|Array} = null, 額外給予的 Sequelize include Query。
 *     curPage = 1,
 *     perPage = 30,
 *     sort = 'DESC',
 *     order = null,
 *   }
 * @example
 * @returns {Object}
 */
export function formatQuery({
  attributes = undefined,
  langCode = 'zh-TW',
  modelName = undefined,
  filter = undefined,
  include = undefined,
  curPage = 1,
  perPage = 30,
  paging = true,
  sort = 'DESC',
  sortBy = undefined,
  order = undefined,
  group = undefined,
  subQuery = undefined,
  duplicating = undefined,
  collate = undefined,
  log = false,
  condition = '$and',
}) {
  let sortByColumn = null;
  try {
    let mOrder = order;
    let intPage = Number(curPage);
    let intLimit = Number(perPage);
    if (_.isNaN(intPage)) intPage = 1;
    if (_.isNaN(intLimit)) intLimit = 10;
    // sails.log('filter=>', filter);

    if (langCode) {
      // TODO: 語系篩選
    }
    const model = this.getModelByName(modelName);
    const columns = _.keys(model.rawAttributes);
    // console.log('columns=>', columns);
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
    let query = {
      where: {},
      order: mOrder,
    };
    if (paging) {
      query = {
        ...query,
        limit: intLimit,
        offset: (intPage - 1) * intLimit,
      };
    }

    if (include && _.isArray(include)) {
      query.include = [];
      include.forEach((e) => {
        const inc = {
          model: e.model ? e.model : this.getModelByName(e.modelName),
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
      if (!query.where[condition]) {
        query.where[condition] = [];
      }
      if (_.isArray(filter.where)) {
        // eslint-disable-next-line guard-for-in
        for (const field of filter.where) {
          // Console.log('field=>', field);
          query.where[condition].push(field);
        }
      } else if (_.isObject(filter.where)) {
        query.where[condition] = filter.where;
      } else {
        throw Error('parameter `filter.where` has to be Array or Object.');
      }
    }

    if (filter.having) {
      query.having = filter.having;
    }

    // 如果有指定配對的搜尋欄位
    let fields = _.has(filter, 'fields') ? filter.fields : null;
    if (_.isString(fields)) {
      try {
        fields = JSON.parse(decodeURIComponent(fields));
      } catch (e) {
        sails.log.warn(
          `[!] ${TAG}.formatQuery Parse "filter.fields" into Json-Array type failed.(${e})) this may not be an issue, please check what is actually be input by frontend.`,
        );
        fields = filter.fields;
      }
      // Console.log('[QueryHelper] fields=>', fields);
    }
    if (!_.isEmpty(fields)) {
      if (!query.where.$and) {
        query.where.$and = [];
      }

      fields.forEach((field) => {
        console.log('QueryHelper field=>', field);
        // 檢查是否有 $or 條件
        const { $or } = field;
        if (!_.isNil($or) && _.isArray($or)) {
          const condition = {
            $or: [],
          };
          $or.forEach((item) => {
            // 轉型
            const isNumber = isNumeric(item.value);
            let value = isNumber ? parseInt(item.value, 10) : item.value;
            value = _.isDate(value) ? new Date(value) : value;
            if (isNumeric) {
              condition.$or.push({
                [`$${item.key}$`]: {
                  $eq: value,
                },
              });
            } else {
              condition.$or.push({
                [`$${item.key}$`]: {
                  $like: `%${value}%`,
                },
              });
            }
          });
          // 檢查 where 類型
          if (_.isArray(query.where.$and)) {
            query.where.$and.push(condition);
          } else if (_.isPlainObject(query.where.$and)) {
            query.where.$and = {
              ...query.where.$and,
              ...condition,
            };
          }
          // console.log('query.where.$and=>', query.where.$and);
        } else {
          // 轉型
          const isNumber = isNumeric(item.value);
          let value = isNumber ? parseInt(field.value, 10) : field.value;
          value = _.isDate(value) ? new Date(value) : value;
          if (isNumber) {
            query.where.$and.push(
              Sequelize.where(Sequelize.col(`${field.key}`), 'eq', value),
            );
          } else {
            query.where.$and.push(
              Sequelize.where(
                Sequelize.col(`${field.key}`),
                'like',
                `%${value}%`,
              ),
            );
          }
        }
      });
    }

    // 全文檢索 - 如果有輸入關鍵字
    const hasKeyword = filter.search && filter.search.keyword;
    const hasSearchText = filter.searchText; // 相容舊版寫法
    if (hasKeyword || hasSearchText) {
      let kw = '';
      let targets = null;

      // 搜尋關鍵字
      if (hasKeyword) {
        kw = filter.search.keyword.trim();
        targets = filter.search.fields;
      }
      if (hasSearchText) {
        kw = filter.searchText.trim();
      }

      // 搜尋的目標欄位
      if (!targets) {
        targets = this.getModelSearchableColumns(modelName).map((e) => e.key);
      }

      // 防錯
      if (!query.where.$or) {
        query.where.$or = [];
      }

      // 推入搜尋目標
      query.where.$or = targets.map((e) =>
        Sequelize.where(Sequelize.col(e), 'like', `%${kw}%`));

      // 額外目標欄位
      if (filter.search.extra) {
        filter.search.extra.forEach((e) => {
          query.where.$or.push(
            Sequelize.where(Sequelize.col(e), 'like', `%${kw}%`),
          );
        });
      }
    }

    // 搜尋前最後再整理一次 query
    query = {
      ...query,
      collate,
      subQuery: subQuery || false,
      duplicating: duplicating || false,
    };
    if (log) {
      if (_.isObject(log)) {
        query.logging = log;
      }
      query.logging = Console.log;
    }
    if (_.isNil(group) && include) {
      query.group = [`${modelName}.id`];
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

/**
 * 依據輸入資料回傳分頁資料
 * @version 1.0
 * @param {Object} {
 *     modelName = null,
 *     include = null,
 *   }
 * @param {Object} {
 *     langCode = 'zh-TW',
 *     filter = null,
 *     curPage = 1,
 *     perPage = 30,
 *     sort = 'DESC',
 *     log = false,
 *   }
 * @param {Object} {
 *     format = null,
 *     formatCb = null,
 *   }
 * @example 查詢 User 包含 Parent
 * QueryHelper.findBy({
 *     modelName: 'User',
 *     include: [
 *       { model: Parent,
 *         required: true,
 *       },
 *     ],
 *   }, {
 *     filter: {
 *       ...mFilter,
 *       search: {
 *         keyword: mFilter.searchText,
 *         extra: [
 *           'User.nameEN', 'User.nameTW',
 *           ...QueryHelper.getModelSearchableColumns('Parent'),
 *         ],
 *       },
 *     },
 *     curPage,
 *     perPage,
 *     sort,
 *     order: ['id'],
 *   }, {
 *     format: null,
 *     formatCb: e => ({
 *       // 先展開 Parent
 *       ...e.data.Parent,
 *       // 再存入 user 資料避免重疊
 *       userId: e.data.id,
 *       createdAt: moment(e.createdAt).format('MM/DD/YYYY'),
 *       name: {
 *         'zh-TW': e.data.nameTW,
 *         en: e.data.nameEN,
 *       },
 *       isActived: e.data.isActived,
 *       studentNames: e.data.Parent.studentNames,
 *     }),
 *   });
 * @returns {Object}
 */
export async function findBy(
  {
    modelName = null,
    scope = null,
    include = [],
    attributes = null,
    includeColumns = [],
    excludeColumns = [],
  } = {},
  {
    langCode = 'zh-TW',
    whereCondition = '$and',
    filter = null,
    curPage = 1,
    perPage = 30,
    sort = 'DESC',
    sortBy = null,
    order = null,
    collate = null,
    log = false,
    group = null,
  } = {},
  { view = false, format = null, formatCb = null } = {},
) {
  let extra = {};
  // const now = new Date().getTime();
  // const tag = `${modelName}-findBy-${now}`;
  try {
    const inputHasNull = ValidatorHelper.checkNull({
      modelName,
      filter,
    });
    if (inputHasNull) {
      throw Error(
        MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({
          inputHasNull,
        }),
      );
    }
    // if (sortBy) {
    //   const getModelColumns = name => this.getModelColumns({ modelName: name });
    //   const isByExistInModel = getModelColumns(modelName)
    //     .some(e => e.toString() === sortBy.toString());

    //   if (!isByExistInModel && !_.isEmpty(include)) {
    //     include
    //       .forEach((inc) => {
    //         Console.log('inc=>', inc);
    //         const incModelName = inc.modelName ? inc.modelName : inc.model.name;
    //         const isByExistInIncludeModel = getModelColumns(incModelName)
    //           .some(e => e.toString() === sortBy.toString());
    //         if (isByExistInIncludeModel) {
    //           // eslint-disable-next-line
    //           sortBy = inc.model ? `${inc.model.name}.${sortBy}` : `${inc.modelName}.${sortBy}`;
    //         }
    //       });
    //   }
    //   Console.log('findBy order sortBy=>', sortBy);
    // }
    // Console.time(tag);
    const query = this.formatQuery({
      attributes,
      langCode,
      curPage,
      perPage,
      filter,
      condition: whereCondition,
      sort,
      sortBy,
      order,
      collate,
      modelName,
      include,
      log,
      group,
    });
    if (log) {
      sails.log.debug('query=>');
      Console.dir(query);
    }
    const model = this.getModelByName(modelName);
    let data = null;
    if (scope) {
      data = await model.scope(scope).findAndCountAll(query);
    } else {
      data = await model.findAndCountAll(query);
    }
    // Console.log('data=>', data);

    const items = data.rows.map((e) =>
      this.formatOutput({
        modelName,
        format,
        formatCb,
        data: e ? e.toJSON() : null,
        view,
      }));
    const total = typeof data.count === 'number' ? data.count : data.count.length;
    if (view) {
      extra = {
        ...this.getIndexPageTableAndFilters({
          modelName,
          langCode,
          include,
          includeColumns,
          excludeColumns,
        }),
        _associations: this.getAssociations(modelName),
      };
    }
    // Console.timeEnd(tag);
    return {
      paging: {
        lastPage: Math.ceil(total / perPage) || 1,
        curPage: parseInt(curPage, 10),
        perPage: parseInt(perPage, 10),
        sort: sort.toUpperCase(),
        sortBy: sortBy ? sortBy.toLowerCase() : sortBy,
        order,
        total,
      },
      filter,
      items,
      ...extra,
    };
  } catch (e) {
    // Console.timeEnd(tag);
    sails.log.error(e);
    throw e;
  }
}
