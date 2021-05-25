import samples from '../samples';

describe('about QueryHelper.destroy operation.', () => {
  const validateFormater = (target) => ({
    ...target,
    id: 0,
    updatedAt: new Date(),
    createdAt: new Date(),
  });

  it('destroy should be success', async () => {
    const input = {
      ...samples.update.User,
    };

    const user = await QueryHelper.create(
      {
        modelName: 'User',
        input,
      },
      {
        formatCb: (e) => e,
        toJSON: true,
      },
    );

    await QueryHelper.destroy(
      {
        modelName: 'User',
        ids: [user.id],
      },
      {
        formatCb: (e) => e,
      },
    );

    const source = await QueryHelper.getDetail(
      {
        modelName: 'User',
        include: [],
        where: {
          id: user.id,
        },
      },
      {
        // log: true,
      },
    );

    SpecHelper.validateEach(
      {
        source,
        target: {},
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('destroy and use include models should be success', async () => {
    const input = {
      ...samples.create.User,
      Image: samples.create.Image,
    };

    const user = await QueryHelper.create(
      {
        modelName: 'User',
        include: [Image],
        input,
      },
      {
        formatCb: (e) => e,
        toJSON: true,
      },
    );

    await QueryHelper.destroy(
      {
        modelName: 'User',
        // FIXME: Error: User has no associated with class extends Model {}.
        // include: [Image],
        ids: [user.id],
      },
      {
        formatCb: (e) => e,
      },
    );

    const source = await QueryHelper.getDetail(
      {
        modelName: 'User',
        include: [],
        where: {
          id: user.id,
        },
      },
      {
        // log: true,
      },
    );

    SpecHelper.validateEach(
      {
        source,
        target: {},
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('destroy wrong modelName should be fail', async () => {
    const input = {
      ...samples.destroy.User,
    };

    const user = await QueryHelper.create(
      {
        modelName: 'User',
        input: {},
      },
      {
        formatCb: (e) => e,
        toJSON: true,
      },
    );

    try {
      await QueryHelper.destroy(
        {
          modelName: 'test',
          ids: [user.id],
        },
        {
          formatCb: (e) => e,
        },
      );
    } catch (err) {
      err.message.should.equal(
        JSON.stringify({ message: 'BadRequest.Target.Model.Not.Exits', code: 400, extra: { modelName: 'test' } }),
      );
    }
  });
});
