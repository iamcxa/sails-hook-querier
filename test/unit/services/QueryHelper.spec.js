import samples from '../samples';

describe('about QueryHelper operation.', function () {
  it('getModelColumnType should be success', async function () {
    const result = QueryHelper.getModelColumnType({
      modelName: 'User',
      columnName: 'name',
    });

    result.toLowerCase().should.be.equal(typeof samples.user.name);
  });

  it('getModelColumnType worng column should be success', async function () {
    const result = QueryHelper.getModelColumnType({
      modelName: 'User',
      columnName: 'test',
    });

    should.not.exist(result);
  });

  it('modelAssociationsToArray should be success', async function () {
    const result = QueryHelper.modelAssociationsToArray(User);

    result.length.should.be.equal(2);
  });

  it('modelAssociationsToArray wrong model should be fail', async function () {
    try {
      QueryHelper.modelAssociationsToArray({});
    } catch (err) {
      err.message.should.be.equal("Model should be an object with the 'associations' property.");
    }
  });

  it('getEnumValues should be success', async function () {
    const result = QueryHelper.getEnumValues('Group', 'role');

    result.length.should.be.equal(2);
  });

  it('getEnumValues wrong column should be success', async function () {
    const result = QueryHelper.getEnumValues('Group', 'name');

    should.not.exist(result);
  });

  it('getEnumValues wrong model should be fail', async function () {
    try {
      QueryHelper.getEnumValues();
    } catch (err) {
      err.message.should.be.equal('Missing required parameter: `modelName` is required.');
    }
  });

  it('getEnumValues should be success', async function () {
    const result = QueryHelper.getModelSearchableColumns('User', {
      date: true,
      integer: true,
    });

    result.length.should.be.equal(6);
  });

  it('getIncludeModelByObject should be success', async function () {
    const result1 = QueryHelper.getIncludeModelByObject({
      model: User,
    });

    const result2 = QueryHelper.getIncludeModelByObject({
      modelName: 'User',
    });

    const result3 = QueryHelper.getIncludeModelByObject(User);

    should.exist(result1);
    should.exist(result2);
    should.exist(result3);
  });

  it('getIncludeModelByObject  wrong model should be fail', async function () {
    try {
      QueryHelper.getIncludeModelByObject({});
    } catch (err) {
      err.message.should.be.equal(
        JSON.stringify({
          message: 'BadRequest.Target.Model.Not.Exits',
          code: 400,
          extra: { includeModelObject: {} },
        }),
      );
    }
  });
});
