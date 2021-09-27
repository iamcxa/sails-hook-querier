const _ = require('lodash');

/**
 * 依據輸入的 format 物件來格式化輸出，將 data 與 format 合併並保留 format 作為預設值。
 *
 * @version 20180310
 * @example
 * QueryHelper.matchFormat({
 *    format: {
 *      updatedAt: '',
 *      createdAt: '',
 *      id: '',
 *      type: '',
 *      title: {
 *        'zh-TW': '',
 *        en: '',
 *      },
 *    },
 *    data,
 * });
 * // {
 * //  updatedAt: '03/29/2018',
 * //  createdAt: '03/29/2018',
 * //  id: 5,
 * //  type: 'ceu',
 * //  title: {
 * //    'zh-TW': '測試測試測試測試',
 * //    en: 'Test Test Test'
 * //  },
 * // }
 * @param Required {Object} {
 *     format{Object} = null,  預先定義的資料格式。
 *     data{Object} = null,    尚未處理過的輸入資料。
 *   }
 * @returns formated data
 * @see {@link https://lodash.com/docs/4.17.5#findKey}
 * @see {@link https://lodash.com/docs/4.17.5#hasIn}
 * @see {@link https://lodash.com/docs/4.17.5#has}
 */
export function matchFormat({ format = null, data = null }) {
  try {
    const body = { ...format };
    for (const prop in format) {
      if (typeof data[prop] !== 'undefined' && data[prop] !== null) {
        if (_.has(data, prop)) {
          body[prop] = data[prop];
        } else if (_.hasIn(data, prop)) {
          body[prop] = data[_.findKey(data, prop)][prop];
        }
      }
    }
    return body;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

/**
 * 依據定義好的欄位比對並同步輸入與目標物件。
 *
 * @version 1.0
 * @param Required {object} {
 *     modelName{String} = null,  目標 Sequelize Model 名稱。
 *     format{object} = null,     預先定義的資料格式。
 *     formatCb{Function} = null, 最後輸出前再次格式化資料的 callback。
 *     rawData{object} = null,    尚未處理過的輸入資料。
 *     source{object} = null,     要被填入的空白資料欄位。
 *   }
 * @example
 * QueryHelper.formatInput({
 *    modelName,
 *    format,
 *    formatCb,
 *    source: QueryHelper.buildEmptyModel({
 *       modelName,
 *    }),
 *    rawData: input,
 * });
 * @returns {object} 格式化過的輸入資料。
 * @see {@link https://lodash.com/docs/4.17.5#hasIn}
 * @see {@link https://lodash.com/docs/4.17.5#has}
 * @see {@link https://lodash.com/docs/4.17.5#set}
 */
export function formatInput({
  // eslint-disable-next-line no-unused-vars
  modelName = null,
  format = null,
  source = null,
  rawData = null,
  formatCb = null,
}) {
  try {
    // 比對來源與目的物件是否有以下欄位
    if (format) {
      for (const path of format) {
        // Console.log('path=>', path);
        if (_.hasIn(rawData, path)) {
          // Console.log('_.get(rawData, path)=>', _.get(rawData, path));
          const value = _.get(rawData, path);
          if (
            _.isNil(value) ||
            (!this.isNumeric(value) &&
              _.isEmpty(value) &&
              !_.isBoolean(value) &&
              !_.isFunction(value))
          ) {
            _.set(source, path, null);
          } else if (_.isString(value) && value.match(this.isDate) !== null) {
            // 檢查輸入是否包含日期
            try {
              const valueAsDate = new Date(value);
              _.set(source, path, valueAsDate);
            } catch (e) {
              sails.log.warn(
                `[!] ${this.TAG}.formatInput: Parse Value "${value}" into Date type failed(${e}). this may not be an issue, will fallback to it origin String type value.`,
              );
              _.set(source, path, value);
            }
          } else if (value === 'Invalid date') {
            _.set(source, path, null);
          } else {
            _.set(source, path, value);
          }
        }
      }
    }
    const hasCb = !_.isNil(formatCb) && _.isFunction(formatCb);
    return hasCb ? formatCb(source) : source;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

/**
 * 格式化來自 Sequelize Query 的輸出物件，並視輸入來輸出該 Model 的欄位定義給前端。
 * 如果有給予 fields，可以依據 required 與 readonly 參數，給予前端可以自動產生表格的資料。
 *
 * @version 1.0
 * @param Required {object} {
 *     format{object} = null,     預先定義的資料格式。
 *     formatCb{Function} = null, 最後輸出前再次格式化資料的 callback。
 *     data{object} = null,       來自 Sequelize Query 後的原始的輸出資料。
 *     fields{object} = null,     預先定義的 Sequelize Model 欄位定義。
 *     required{Array} = [],     要被設定為 required 的欄位名稱。
 *     readonly{Array} = [],     要被設定為 readonly 的欄位名稱。
 *  }
 * @example
 * QueryHelper.formatOutput({
 *    format,
 *    formatCb,
 *    fields,
 *    required,
 *    readonly,
 *    data: data.toJSON(),
 *  });
 * @returns {object} 格式化過的輸出資料與 Sequelize Model 欄位定義。
 */
export function formatOutput({
  format = null,
  formatCb = null,
  data = null,
  fields = null,
  required = [],
  readonly = [],
  extra = null,
  view = false,
}) {
  let result = {};
  try {
    // 格式化輸出
    if (format) {
      // 比對來源與目的物件是否有以下欄位
      for (const path of format) {
        if (_.hasIn(data, path)) {
          const value = _.get(data, path);
          if (_.isEmpty(value)) {
            _.set(result, path, null);
            // 檢查輸入是否包含日期
          } else if (value.match(this.isDate) !== null) {
            _.set(result, path, new Date(value));
          } else {
            _.set(result, path, value);
          }
        }
      }
    } else {
      result = data;
    }
    // 檢查並輸出前端要顯示的欄位與類型
    if (view && fields) {
      result._fields = fields.map((field) => {
        // 如果已經有 required 與 readonly 欄位則不修改
        if (_.has(field, 'required') && _.has(field, 'readonly')) {
          return field;
        }
        return {
          ...field,
          required: required ? required.some((r) => r === field) : false,
          readonly: readonly ? readonly.some((r) => r === field) : false,
        };
      });
    }
    if (extra) {
      result = {
        ...result,
        ...extra,
      };
    }
    return !_.isNil(formatCb) && _.isFunction(formatCb) ? formatCb(result) : result;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

/**
 * 替 fields 加入 or 條件
 *
 * @param {*} fields
 * @returns
 */
export function formatFieldQueryWithOrCondition(fields) {
  try {
    const fieldsOr = [];
    const fieldsOrCommand = [];
    fields.forEach((e) => {
      if (!fieldsOr.find((x) => x === e.key)) {
        fieldsOr.push(e.key);
        fieldsOrCommand.push({
          $or: [
            {
              key: e.key,
              value: e.value,
            },
          ],
        });
      } else {
        const i = fieldsOr.findIndex((x) => x === e.key);
        fieldsOrCommand[i].$or.push({
          key: e.key,
          value: e.value,
        });
      }
    });
    return fieldsOrCommand;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}
