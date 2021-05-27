/**
 * @module QueryHelper
 * @author Kent Chen<iamcxa@gmail.com>
 */
/* eslint no-underscore-dangle: 0 */
// import moment from 'moment';
import _ from 'lodash';
import inflection from 'inflection';
import Joi from 'joi';

export { default as getDetail } from './QueryHelper.getDetail';
export { default as create } from './QueryHelper.create';
export { default as update } from './QueryHelper.update';
export { default as destroy } from './QueryHelper.destroy';
export * from './QueryHelper.format';
export * from './QueryHelper.view';

const TAG = 'QueryHelper';
const { log } = sails.config.queryhelper;

const fakeConsole = {};
for (const key of Object.keys(console)) {
  fakeConsole[key] = () => {};
}
const langCode = 'zh-TW';
const commonFields = ['createdAt', 'updatedAt', 'deletedAt', 'id'];
const isNumeric = (val) => !Number.isNaN(parseFloat(val)) && Number.isFinite(val);
const isDate = /[0-9]{4}-[0-9]{2}-[0-9]{2}/g;

global.Console = log ? console : fakeConsole;

export {
  langCode, log, commonFields, TAG, isNumeric, isDate,
};

export function validate({
  value, schema, options, callback,
}) {
  return Joi.validate(
    value,
    _.isFunction(schema) ? Joi.object().keys(schema(Joi)) : schema,
    options,
    callback,
  );
}

/**
 * 定義共通資料欄位，用來將 Model Name 去除，以便使用同一組 i18n。
 * @example model.User.createdAt ==> model.createdAt
 * @param {*} name
 */
export function isCommonField(name) {
  try {
    return this.commonFields
      .concat([
        'isValid',
        'index',
        'isActive',
        'isActivated',
        'isConfirmed',
        'activatedAt',
        'confirmedAt',
      ])
      .some((e) => name.indexOf(e) !== -1);
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

export function getModelByName(modelName) {
  try {
    if (!modelName) {
      throw Error(
        MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({
          modelName,
        }),
      );
    }
    let model = null;
    if (_.isString(modelName)) {
      model = sails.models[modelName.toLowerCase()];
    }
    if (!model || !_.isObject(model)) {
      throw Error(
        MESSAGE.BAD_REQUEST.MODEL_NOT_EXISTS({
          modelName,
        }),
      );
    }
    return model;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

export function getIncludeModelByObject(includeModelObject) {
  try {
    // Console.log('includeModelObject=>', includeModelObject);
    // Console.log('includeModelObject=>', includeModelObject.model);
    // Console.log('includeModelObject=>', includeModelObject.model.name);
    if (!includeModelObject) {
      throw Error(
        MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({
          includeModelObject,
        }),
      );
    }
    let model = null;
    if (_.isObject(includeModelObject)) {
      // 如果是 { model: ModelClass } 形式
      if (includeModelObject.model && includeModelObject.model.name) {
        model = sails.models[includeModelObject.model.name.toLowerCase()];
        // 如果是 { modelName: ModelClass } 形式
      } else if (includeModelObject.modelName) {
        model = sails.models[includeModelObject.modelName.toLowerCase()];
        // 如果是 ModelClass {} 形式
      } else if (includeModelObject.name) {
        model = includeModelObject;
      }
    }
    // Console.log('model=>', model);
    if (!model) {
      throw Error(
        MESSAGE.BAD_REQUEST.MODEL_NOT_EXISTS({
          includeModelObject,
        }),
      );
    }
    return model;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

/**
 * 取出目標 Model 全部是文字類型的欄位名稱
 * @version 1.0
 * @param {String} modelName = null 要查詢的目標 Sequelize Model 名稱。
 * @example 取出 Parent 中，全部屬性為文字類型的欄位名稱。
 * QueryHelper.getModelSearchableColumns('Parent');
 * // *  [{ key: 'Parent.education', type: 'String' }
 * // *   { key: 'Parent.password', type: 'String' }]
 * @returns {Array} Object contains field and type
 */
export function getModelSearchableColumns(
  modelName = null,
  { date = false, integer = false } = {},
) {
  try {
    const model = this.getModelByName(modelName);
    // 取出全部的 model field
    const targets = [];
    // eslint-disable-next-line
    for (const key in model.rawAttributes) {
      if (
        model.rawAttributes[key].type.key === 'STRING'
        || model.rawAttributes[key].type.key === 'TEXT'
        || model.rawAttributes[key].type.key === 'JSON'
        || model.rawAttributes[key].type.key === 'UUID'
        || model.rawAttributes[key].type.key === 'ENUM'
      ) {
        targets.push({
          key: `${modelName}.${key}`,
          type: 'STRING',
        });
      }
      if (
        date
        && (model.rawAttributes[key].type.key === 'DATE'
          || model.rawAttributes[key].type.key === 'DATEONLY')
      ) {
        targets.push({
          key: `${modelName}.${key}`,
          type: 'DATE',
        });
      }
      if (integer && model.rawAttributes[key].type.key === 'INTEGER') {
        targets.push({
          key: `${modelName}.${key}`,
          type: 'NUMBER',
        });
      }
    }
    // 移除不必要的屬性
    const exclude = ['createdAt', 'updatedAt'];
    return targets.filter((e) => !exclude.some((ex) => ex === e));
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

/**
 * 取得傳入的 model column ENUM 的值
 * @version 1.0
 * @param {String} [modelName=null]
 * @param {String} [columnName=null]
 * @example 取出 Parent 中 ENUM 欄位 union 的全部值。
 * QueryHelper.getEnumValues('Parent', 'union');
 * // * [ '非會員', '個人會員', '學生會員', '相關會員', '理事', '監事', '理事長', '常務理事', '常務監事' ]
 * @returns {Array} column's ENUM values.
 */
export function getEnumValues(modelName = null, columnName = null) {
  try {
    if (!modelName || !columnName) {
      throw Error('Missing required parameter: `modelName` is required.');
    }
    const model = this.getModelByName(modelName);
    const { values } = model.rawAttributes[columnName];
    return _.isArray(values) ? values : null;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

/**
 * 產生 VUE form 需要的欄位名稱與類型
 * @param {any} {
 *     modelName = null,
 * }
 * @returns
 */
export function getModelOutputColumns({
  // langCode = null,
  modelName = null,
  modelPrefix = false,
  readonly = null,
  required = null,
  exclude = null,
  include = null,
}) {
  try {
    let prefix = '';
    if (_.isBoolean(modelPrefix)) {
      prefix = modelPrefix ? `${modelName}.` : '';
    } else if (_.isString(modelPrefix)) {
      prefix = `${modelPrefix}.`;
    }
    const model = this.getModelByName(modelName);
    const fields = [];
    for (const name of _.keys(model.rawAttributes)) {
      const modelAttr = model.rawAttributes[name];
      let fieldName;

      if (modelPrefix && !this.isCommonField(name)) {
        fieldName = `${prefix}${name}`;
      } else {
        fieldName = name;
      }

      const field = {
        values: null,
        name: fieldName,
      };
      // 自動依據資料庫轉型 input
      switch (modelAttr.type.key) {
        case 'ENUM':
          field.type = 'chosen';
          field.values = modelAttr.values.map((e) => ({
            value: e,
            name: e,
          }));
          break;
        case 'DOUBLE PRECISION':
        case 'INTEGER':
          field.type = 'number';
          break;
        case 'DATEONLY':
          field.type = 'date';
          break;
        default: {
          // eslint-disable-next-line no-underscore-dangle
          const length = modelAttr.type._length;
          if (length) {
            field.limit = length - 1;
          }
          field.type = modelAttr.type.key.toLowerCase();
          break;
        }
      }
      fields.push(field);
    }
    const autoReadonly = ['createdAt', 'updatedAt', 'deletedAt', 'id'].concat(
      readonly || [],
    );
    const autoRequired = this.getModelColumns({
      modelName,
      exclude: autoReadonly,
      required: true,
    }).concat(required || []);

    const getPhrase = (name) => {
      const output = modelPrefix
        ? `model.${_.upperFirst(name)}`
        : `model.${_.upperFirst(modelName)}.${name}`;
      return this.isCommonField(name) ? `model.${name}` : output;
    };
    return fields
      .filter((e) => !this.commonFields.some((ex) => e.name === ex))
      .filter((e) =>
        (!_.isEmpty(include) ? include.some((inc) => e.name === inc) : e))
      .filter((e) =>
        (!_.isEmpty(exclude) ? !exclude.some((ex) => e.name === ex) : e))
      .map((field) => ({
        ...field,
        label: sails.__(getPhrase(field.name)),
        // label: sails.__({
        //   phrase: getPhrase(field.name),
        //   locale: langCode || 'zh-TW',
        // }),
        required: autoRequired.some((r) => r === field.name),
        readonly: autoReadonly.some((r) => r === field.name),
      }));
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

/**
 * 依據給予的 Sequelize Model 名稱，產生空白的欄位格式 JSON，並以 null 填充。
 * @version 20180310
 * @param {Object} {
 *     modelName{String} = null, 目標 Model 名稱。
 *     exclude{Array} = [], 要排除的欄位名稱。
 *     include{Array} = [], 要額外加入的欄位名稱。
 * }
 * @example
 * QueryHelper.buildEmptyModel({
 *    modelName: 'User',
 *    exclude: ['id'],
 * }),
 * // {
 * //  locale: null,
 * //  weights: null,
 * //  gender: null,
 * //  resetPasswordTokenExpire: null,
 * //  username: null,
 * //  avatar: null,
 * //  avatarThumb: null,
 * //  score: null,
 * //  isActived: null,
 * //  resetPasswordToken: null,
 * //  verificationEmailToken: null,
 * //  isEmailVerified: null,
 * //  createdAt: null,
 * //  updatedAt: null,
 * //  deletedAt: null,
 * // }
 * @returns {Object} 空的 model 欄位格式 JSON。
 */
export function buildEmptyModel({
  modelName = null,
  exclude = [],
  include = [],
} = {}) {
  try {
    const model = {};
    this.getModelColumns({
      modelName,
      exclude,
      include,
    }).forEach((e) => {
      model[e.replace(`${modelName}.`, '')] = null;
    });
    return model;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

/**
 * 取得某個 Sequelize Model 的所有欄位名稱。
 * @version 20180310
 * @param {Object} {
 *     modelPrefix = false,
 *     modelName = null,
 *     exclude = [],
 *     include = [],
 *   }
 * @example 取得 Parent 的欄位，同時加上 email/nameTW/nameEN 三個額外欄位、排除
 * id/UserId/createdAt/updatedAt 四個欄位，並且在查詢得到的欄位名稱前加上 `Parent` prefix。
 * QueryHelper.getModelColumns({
 *    modelName: 'Parent',
 *    modelPrefix: true,
 *    exclude: ['id', 'UserId', 'createdAt', 'updatedAt'],
 *    include: ['email', 'nameTW', 'nameEN'],
 *  });
 * // [ 'Parent.education',
 * //   'Parent.union',
 * //   'Parent.phone',
 * //   'Parent.fax',
 * //   'Parent.app',
 * //   'Parent.comment',
 * //   'Parent.address',
 * //   'Parent.passportName',
 * //   'Parent.profession',
 * //   'Parent.birthday',
 * //   'Parent.idNumber',
 * //   'Parent.mobile',
 * //   'Parent.city',
 * //   'Parent.password',
 * //   'Parent.studentNames',
 * //   'email',
 * //   'nameTW',
 * //   'nameEN' ]
 * @returns {Array} Sequelize Model column names
 * @see {@link https://lodash.com/docs/4.17.5#keys}
 */
export function getModelColumns({
  modelPrefix = false,
  isPrefixPlural = false,
  modelName = null,
  exclude = [],
  include = [],
  required = false,
}) {
  try {
    // 取得 model
    const model = this.getModelByName(modelName);
    // 取得單複數 model name
    const outputModelName = isPrefixPlural
      ? inflection.pluralize(model.name)
      : model.name;
    // 組合
    let prefix = '';
    if (_.isBoolean(modelPrefix)) {
      prefix = modelPrefix ? `${outputModelName}.` : '';
    } else if (_.isString(modelPrefix)) {
      prefix = `${modelPrefix}.`;
    }
    // 自動取得所有欄位
    const attributes = _.keys(model.rawAttributes)
      .filter((column) => !exclude.some((ex) => column === ex))
      .filter((column) => !this.commonFields.some((ex) => column === ex))
      .filter((column) => {
        if (required) {
          const target = model.rawAttributes[column];
          // Console.log('target=>', target);
          return target.allowNull !== true && target.primaryKey !== true;
        }
        return true;
      })
      .map((e) => `${_.upperFirst(prefix)}${e}`)
      .concat(include);
    return attributes;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

/**
 * 取得特定 model 內 column 的類型，回傳值為 Sequelize 的 type 字串。
 * @version 20180331
 * @param {Object} {
 *     modelName{String} = null,
 *     columnName{String} = null,
 *  }
 * @example 取得 User 的 email 欄位類型
 * getModelColumnType({
 *    modelName = 'User',
 *    columnName = 'email',
 * });
 * // 'String'
 * @returns {String|Null} column type
 * @see {@link http://docs.sequelizejs.com/manual/tutorial/models-definition.html}
 */
export function getModelColumnType({ modelName = null, columnName = null }) {
  try {
    const model = this.getModelByName(modelName);
    // 自動取得所有欄位
    const column = model.rawAttributes[columnName];
    if (!_.isNil(column)) {
      return column.type.key;
    }
    return null;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}

/**
 * 取得給予 ModelName 之關聯 ModelName，可透過參數指定取得單數或複數名稱。
 * @param {*} modelName
 * @param {*} { singular = false, plural = false }
 * @returns [String...]
 */
export function getAssociations(
  modelName,
  {
    singular = false,
    plural = false,
    one2One = false,
    one2Many = false,
    raw = false,
  } = {},
) {
  const model = this.getModelByName(modelName);
  const { associations } = model;
  const result = [];
  Object.keys(associations).forEach((key) => {
    const association = {};
    // all needed information in the 'options' object
    if (_.has(associations[key], 'options')) {
      association[key] = associations[key].options;
      const singularName = association[key].name.singular;
      const pluralName = association[key].name.plural;
      if (associations[key].options.constraints !== false) {
        // // Console.log('associations[key]=>');
        // // Console.dir(associations[key]);
        // Console.log('associations[key].HasMany=>', associations[key].hasMany);
        // Console.dir(associations[key].target);
        if (singular) {
          result.push(singularName);
        } else if (plural) {
          result.push(pluralName);
        } else if (one2One) {
          if (key === singularName) result.push(key);
        } else if (one2Many) {
          if (key === pluralName) result.push(key);
        } else if (raw) {
          result.push({
            name: key,
            singular: singularName,
            plural: pluralName,

            options: associations[key].options,
            rawName: association[key].name,
          });
        } else {
          result.push(key);
        }
      }
    }
  });
  return result;
}

/**
 * 取得給予 ModelName 之關聯 ModelName 的欄位名稱，可透過 include 參數指定複數關聯 Model 的欄位名稱。
 * @param {*} modelName
 * @param {*} include
 * @param {*} prefix
 * @returns [String...]
 */
export function getIncludeModelColumns({
  modelName,
  include,
  prefix,
}) {
  const modelAssociations = this.getAssociations(modelName, {
    raw: true,
  });
  const namePool = modelAssociations.map((association) => association.name);
  const singularPool = modelAssociations.map((association) => association.singular);

  let result = [];
  for (const model of include) {
    const modelItem = this.getIncludeModelByObject(model);
    const index = singularPool.indexOf(modelItem.name);

    if (index !== -1) {
      const modelPrefix = prefix ? `${prefix}.${namePool[index]}` : namePool[index];
      const columns = this.getModelColumns({
        modelName: modelItem.name,
        modelPrefix,
      });

      result = result.concat(columns);

      if (model.include && Array.isArray(model.include)) {
        result = result.concat(this.getIncludeModelColumns({
          modelName: modelItem.name,
          include: model.include,
          prefix: modelPrefix,
        }));
      }
    }
  }

  Console.log('result========>');
  Console.log(result);
  return result;
}

export function modelAssociationsToArray(model) {
  const result = [];
  if (typeof model !== 'function' || typeof model.associations !== 'object') {
    throw Error("Model should be an object with the 'associations' property.");
  }
  Object.keys(model.associations).forEach((key) => {
    const association = {};
    // all needed information in the 'options' object
    if (_.has(model.associations[key], 'options')) {
      association[key] = model.associations[key].options;
    }
    result.push(association);
  });
  return result;
}

export default {};
