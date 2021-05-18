const fixtures = require('./../../fixtures/instances.json');

describe('about NotifierHelper operation.', () => {
  it('create should be success', async () => {
    const result = await QueryHelper.default.create({
      modelName: 'User',
      include: [],
      input: fixtures.user,
    }, {
      formatCb: e => e,
    });

    const target = {
      ...fixtures.user,
      id: 0,
      updatedAt: new Date(),
      createdAt: new Date(),
    };

    SpecHelper.validateEach({
      source: result.dataValues,
      target,
    }, {
      strictMode: false,
    });
  });
});
