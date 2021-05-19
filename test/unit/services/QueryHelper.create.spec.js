import samples from '../samples';

describe('about QueryHelper.create operation.', () => {
  it('create should be success', async () => {
    const result = await QueryHelper.default.create(
      {
        modelName: 'User',
        include: [],
        input: samples.user.create,
      },
      {
        formatCb: (e) => e,
      },
    );

    const target = {
      ...samples.user.create,
      id: 0,
      updatedAt: new Date(),
      createdAt: new Date(),
    };

    SpecHelper.validateEach(
      {
        source: result.dataValues,
        target,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });
});
