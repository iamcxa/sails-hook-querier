/**
 * 依據給予的 id array 刪除對象
 * @version 1.0
 * @param Required {Object} {
 *    modelName{String} = null,  要刪除的目標 Sequelize Model 名稱。
 *    ids{Array} = [],           要刪除的欄位 ID 陣列。
 * }
 * @example 刪除 User 表中，ID 為 1~4 的資料。
 * QueryHelper.destroy({
 *    modelName: 'User',
 *    ids: [1, 2, 3, 4],
 * });
 * // [1, 1, 1, 0]
 * @returns {Array} 包含是否完成的陣列
 */

import _ from 'lodash';
export default async function destroy({
  modelName = null,
  include = null,
  force = false,
  ids = [],
}) {
  try {
    const inputHasNull = ValidatorHelper.checkNull({
      modelName,
      ids,
    });
    if (inputHasNull) {
      throw Error(
        MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({
          inputHasNull,
        }),
      );
    }
    if (!_.isArray(ids)) {
      throw Error(MESSAGE.BAD_REQUEST.CHECK_INPUT_PARAMETER_TYPE('ids', Array));
    }
    const model = this.getModelByName(modelName);
    const results = [];
    /* eslint no-await-in-loop: 0 */
    for (const id of ids) {
      // delete associated model item with giving model id.
      if (include) {
        for (const includeModel of include) {
          let includeModelName;

          if (includeModel.model) {
            includeModelName = includeModel.model.name;
          } else if (includeModel.modelName) {
            includeModelName = includeModel.modelName;
          } else if (includeModel.name) {
            includeModelName = includeModel.name;
          }

          // FIXME: destroy image
          const target = await model.findByPk(id);
          const associatedId = target[`${_.upperFirst(includeModelName)}Id`];

          sails.log(`${_.upperFirst(includeModelName)}Id`)
          sails.log(target)
          sails.log(associatedId)

          if (associatedId) {
            const includedModelInstance =
              sails.models[includeModelName.toLowerCase()];
            const deletedAssociatedModelId =
              await includedModelInstance.destroy({
                where: {
                  id: associatedId,
                },
                force,
              });
            const message = `[!] Delete  "${modelName}"'s associated model "${includeModelName}" with id "${associatedId}" (?=${deletedAssociatedModelId})`;

            if (deletedAssociatedModelId) {
              sails.log.debug(`${message} success.`);
            } else {
              sails.log.debug(`${message} failed.`);
            }
          } else {
            throw Error(`${modelName} has no associated with ${includeModel}.`);
          }
        }
      }
      const result = await model.destroy({
        where: {
          id,
        },
        force,
      });
      results.push({
        success: Boolean(result),
        id,
      });
    }
    // Console.log('results=>', results);
    return results;
  } catch (e) {
    throw e;
  }
}
