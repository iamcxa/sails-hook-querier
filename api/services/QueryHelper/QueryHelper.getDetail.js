/**
 * 依據 ID 取回詳細資料。
 * @version 1.0
 * @param Required {Object} {
 *     langCode{String} = 'zh-TW',      要查詢的資料語系。
 *     modelName{String} = null,        要查詢的目標 Sequelize Model 名稱。
 *     include{Object|Array} = null,    額外給予的 Sequelize Query-include 參數。
 *     where{Object} = null,            Sequelize Query-where 查詢。
 *     attributes{Object|Array} = null, 查詢時的 Sequelize Query-attributes 參數。
 *   }
 * @param Optional {Object} {
 *     required{Array} = [],     要被設定為 required 的欄位名稱。
 *     readonly{Array} = [],     要被設定為 readonly 的欄位名稱。
 *     format{Object} = null,     預先定義的資料格式。
 *     formatCb{Function} = null, 最後輸出前再次格式化資料的 callback。
 *   }
 * @example 依據 Parent ID 查詢 User 與 Parent，同時包含 Student。
 * QueryHelper.getDetail({
 *    modelName: 'User',
 *    where: { id: { $not: null } },
 *    attributes: [
 *      'id',
 *      'email',
 *      'nameTW',
 *      'nameEN',
 *    ],
 *    include: [{
 *      model: Parent,
 *      where: { id: parentId },
 *      attributes: {
 *        exclude: ['createdAt', 'updatedAt'],
 *      },
 *      include: [{
 *        model: Student,
 *        through: 'StudentParent',
 *        attributes: ['id', 'idNumber1', 'idNumber2'],
 *        include: [{
 *          model: User,
 *          attributes: ['id', 'email', 'nameTW', 'nameEN'],
 *        }],
 *      }],
 *    }],
 *  }, {
 *    required,
 *    readonly,
 *    format: null,
 *    formatCb: e => ({
 *      data: {
 *        ...e.data,
 *        Parent: {
 *          ..._.omit(e.data.Parent, ['Students']),
 *          Students: e.data.Parent.Students.map(s => ({
 *            ..._.omit(s, ['StudentParent']),
 *            relationship: s.StudentParent.relationship,
 *            comment: s.StudentParent.relationship,
 *          })),
 *          passportDuedate1:
 *            moment(e.data.Parent.passportDuedate1, 'YYYY/MM-DD').format('YYYY-MM-DD'),
 *          passportDuedate2:
 *            moment(e.data.Parent.passportDuedate2, 'YYYY/MM-DD').format('YYYY-MM-DD'),
 *          birthday:
 *            moment(e.data.Parent.birthday, 'YYYY/MM-DD').format('YYYY-MM-DD'),
 *        },
 *      },
 *      fields,
 *    }),
 *  });
 * @returns {Object} 屬於某個 ID 的資料。
 */
import _ from 'lodash';

export default async function getDetail(
  {
    langCode = 'zh-TW',
    modelName = null,
    where = null,
    include = null,
    attributes = null,
  },
  {
    log = false,
    raw = false,
    required = null,
    readonly = null,
    view = false,
    outputFieldNamePairs = null,
    viewExclude = null,
    viewInclude = null,
    format = null,
    formatCb = null,
  } = {},
) {
  const extra = {};
  try {
    const model = this.getModelByName(modelName);
    if (!where) {
      throw Error(MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER(' where'));
    }
    if (langCode) {
      // TODO: 語系篩選
    }
    // 自動整合欄位類型與選項
    let fields = this.getModelOutputColumns({
      langCode,
      modelName,
      required,
      readonly,
      exclude: viewExclude,
      include: viewInclude,
    });
    // 組合查詢 Query
    const query = {
      raw,
      nest: raw,
    };
    if (where) {
      query.where = where;
    }
    if (include && _.isArray(include)) {
      query.include = [];
      include.forEach((e) => {
        if (!e.name && !e.model && !e.modelName) {
          throw Error(
            MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({
              field: 'include',
              required: ['model', 'modelName'],
              input: `${e}`,
            }),
          );
        }
        let thisModelName;
        if (e.name) {
          thisModelName = e.name;
        } else if (e.model && e.model.name) {
          thisModelName = e.model.name;
        } else if (e.modelName) {
          thisModelName = e.modelName;
        }

        const arr = this.getModelOutputColumns({
          modelName: thisModelName,
          as: e.as,
          exclude: viewExclude
            ? viewExclude.filter((ex) => ex.indexOf(thisModelName) > -1)
            : null,
          modelPrefix: true,
          langCode,
          required,
          readonly,
        });
        fields = fields.concat(arr);

        let thisModel;
        if (e.name) {
          thisModel = e;
        } else if (e.model && e.model.name) {
          thisModel = e.model;
        } else if (e.modelName) {
          thisModel = this.getModelByName(e.modelName);
        }

        const inc = {
          model: thisModel,
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
        if (e.through) {
          inc.through = e.through;
        }
        if (e.include) {
          inc.include = e.include;
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
      fields = fields.filter((e) => {
        if (_.isArray(attributes)) {
          return attributes.some((attr) => e.name === attr);
        }
        if (_.isObject(attributes) && _.isArray(attributes.include)) {
          return attributes.include.some((attr) => e.name === attr);
        }
        return attributes;
      });
    }
    if (log) {
      if (_.isFunction(log)) {
        query.logging = log;
      } else {
        query.logging = Console.log;
      }
    }
    // Console.log('fields=>', fields);
    // Console.log('query=>');
    // Console.dir(query);
    const data = await model.findOne(query);
    // if (!data) {
    //   throw Error(MESSAGE.BAD_REQUEST.NO_TARGET_FOUNDED({
    //     where: `${modelName}:${_.values(where)}`,
    //   }));
    // }

    // 自動取出關聯的資料欄位與對應資料來源，並且將欄位設成 chosen 以供選擇
    if (view) {
      extra._associations = this.getAssociations(modelName);
      {
        const associatedData = {};
        // 只取出 1v1 的關聯，即當下 model 中的 AbcId 欄位的 model Abc
        const associatedModels = this.getAssociations(modelName, {
          one2One: true,
        });
        for (const target of associatedModels) {
          /* eslint no-await-in-loop: 0 */
          const modelData = await sails.models[target.toLowerCase()].findAll();
          // Console.log('modelData=>', modelData);
          associatedData[target] = modelData;
        }
        fields.map((field) => {
          const isThisFieldAssociated = associatedModels.some(
            (ass) => field.name === `${ass}Id`,
          );
          // Console.log('isThisFieldAssociated=>', isThisFieldAssociated);
          if (isThisFieldAssociated) {
            const associatedModelName = field.name.replace('Id', '');
            const values = associatedData[associatedModelName];
            /* eslint no-param-reassign: 0 */
            let modelOutputPropName = null;
            {
              // Console.log('associatedModelName=>', associatedModelName);
              // 如果有指定哪個 model 使用哪個 prop 輸出
              const assignModelOutputField = outputFieldNamePairs
                ? outputFieldNamePairs.filter(
                  (pair) => pair.modelName === associatedModelName,
                )[0]
                : null;
              // Console.log('assignModelOutputField=>', assignModelOutputField);
              modelOutputPropName = assignModelOutputField
                ? assignModelOutputField.target
                : null;
              // Console.log('modelOutputPropName=>', modelOutputPropName);
            }
            // 可能要再加上一對多判斷
            field.type = 'chosen';
            field.required = true;
            field.values = values
              ? values
                .concat([
                  {
                    id: null,
                  },
                ])
                .map((v) => {
                  let name = v[modelOutputPropName] || v.name || v.key || v.id;
                  if (_.isFunction(modelOutputPropName)) {
                    name = modelOutputPropName(v);
                  }
                  return {
                    value: v.id,
                    name,
                  };
                })
              : [];
          }
          return field;
        });
      }
    }
    return this.formatOutput({
      format,
      formatCb,
      fields,
      required,
      readonly,
      data,
      extra,
      view,
    });
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}
