const samples = require('../samples');

describe('about QueryHelper.create operation.', function () {
  it('create should be success', async function () {
    const input = {
      ...samples.user,
    };

    const target = await QueryHelper.create(
      {
        modelName: 'User',
        include: [],
        input,
      },
      {
        toJSON: true,
      },
    );

    const source = samples.builder('user');

    SpecHelper.validateEach(
      {
        target,
        source,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('create and use include models should be success', async function () {
    const input = {
      ...samples.group,
      Users: {
        ...samples.user,
        Image: samples.iamge,
      },
    };

    const target = await QueryHelper.create(
      {
        modelName: 'Group',
        include: [
          {
            model: User,
            include: [Image],
          },
        ],
        input,
      },
      {
        toJSON: true,
      },
    );

    const source = {
      ...samples.builder('group'),
      Users: [
        {
          ...samples.builder('user', true),
        },
      ],
    };

    SpecHelper.validateEach(
      {
        target,
        source,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('create wrong modelName should be fail', async function () {
    const input = {
      ...samples.user,
    };

    try {
      await QueryHelper.create({
        modelName: 'test',
        input,
      });
    } catch (err) {
      err.message.should.equal(
        JSON.stringify({
          message: 'BadRequest.Target.Model.Not.Exits',
          code: 400,
          extra: { modelName: 'test' },
        }),
      );
    }
  });
});
