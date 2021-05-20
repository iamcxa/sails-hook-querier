/**
 * @module QueryHelper.create
 *
 * 依據給予的資料建立
 * @version 1.0
 * @param Required {Object} {
 *     langCode{String} = 'zh-TW',   要新增的資料語系。
 *     modelName{String} = null,     要新增的目標 Sequelize Model 名稱。
 *     include{Object|Array} = null, 額外給予的 Sequelize include Query。
 *     input{Object} = null,         要新增的原始資料。
 *   }
 * @param Optional {Object} {
 *     format{Object} = null,        原始資料的格式化樣板。
 *     formatCb{Object} = null,      原始資料的格式化 callback。
 *   }
 * @example 依據 input 建立一筆 User 的新資料，並且包含建立 Parent 與 Passport，同時附有建立資料前的 formatCb。
 * QueryHelper.create({
 *    modelName: 'User',
 *    include: [Parent, Passport],
 *    input: rawData,
 *  }, {
 *    format,
 *    formatCb: e => ({
 *      ...e,
 *     username: rawData.Parent.idNumber,
 *    }),
 * });
 * @returns {Object} created item
 */

import _ from 'lodash';
export default async function create(
  {
    langCode = this.langCode,
    modelName = undefined,
    include = undefined,
    input = undefined,
  } = {},
  { toJSON = undefined, format = undefined, formatCb = undefined } = {},
) {
  try {
    const { error, value } = this.validate({
      value: {
        langCode,
        modelName,
        include,
        input,
        format,
        formatCb,
        toJSON,
      },
      schema: (j) => ({
        modelName: j.string().required(),
        input: j.object().required(),
        langCode: j.string(),
        include: j.array().items(j.any()),
        format: j.array().items(j.string()).allow(null),
        formatCb: j.func().allow(null),
        toJSON: j.boolean(),
      }),
    });
    if (error) {
      throw Error(
        MESSAGE.BAD_REQUEST.PARAMETER_FORMAT_INVALID({
          error,
          value,
        }),
      );
    }
    const model = this.getModelByName(modelName);
    if (langCode) {
      // TODO: 語系篩選
    }
    // Console.log('modelName=>', modelName);
    // Console.log('include=>', include);
    // Console.log('input==============>');
    // Console.dir(input);
    // Console.log('source==============>');
    // Console.dir(this.buildEmptyModel({
    //   modelName,
    // }));
    if (!format) {
      // eslint-disable-next-line
      format = this.getModelColumns({
        modelName,
        modelPrefix: false,
        include: include
          ? _.flatten(
              this.getAssociations(modelName, {
                raw: true,
              }).map((association) => {
                // this.getModelColumns({
                //   modelName: association.singular,
                //   modelPrefix: association.name,
                // }),
                // console.log('associationLevel2 association=>', association);
                const associationLevel2 = this.getAssociations(
                  association.singular,
                  {
                    raw: true,
                  },
                );

                if (!_.isEmpty(associationLevel2)) {
                  return _.flatten(
                    associationLevel2.map((association2) =>
                      this.getModelColumns({
                        modelName: association2.singular,
                        modelPrefix: `${association.name}.${association2.name}`,
                      }),
                    ),
                  );
                } else {
                  return this.getModelColumns({
                    modelName: association.singular,
                    modelPrefix: association.name,
                  });
                }
              }),
            )
          : null,
      });
      Console.log('format==============>');
      Console.dir(format);
    }
    const data = this.formatInput({
      modelName,
      format,
      formatCb,
      source: this.buildEmptyModel({
        modelName,
      }),
      rawData: input,
    });
    Console.log('data==============>');
    Console.dir(data);
    // const cretaeBuild = await model.build(data, { include });
    // Console.log('build==============>');
    // Console.dir(cretaeBuild);
    // const errors = await cretaeBuild.validate().catch((e) => {
    //   Console.log("!!!!!!catch");
    //   Console.log(e);
    //   throw e;
    // });
    // Console.log(errors);
    // return await cretaeBuild.save();
    const createdItem = await model.create(data, {
      include,
    });
    if (!createdItem) {
      throw Error('QueryHelper.Create.Failed.Null.Created.Item');
    }
    return toJSON
      ? createdItem.get({
          plain: true,
        })
      : createdItem;
  } catch (e) {
    sails.log.error(e);
    throw e;
  }
}
