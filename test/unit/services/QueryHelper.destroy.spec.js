import samples from '../samples';

describe('about QueryHelper.destroy operation.', () => {
  it('destroy should be success', async () => {
    const input = {
      ...samples.user,
    };

    const user = await User.create(input, {
      include: [],
    });

    await QueryHelper.destroy(
      {
        modelName: 'User',
        ids: [user.id],
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
        toJSON: true,
      },
    );

    const target = {
      ...samples.builder('user'),
    };

    SpecHelper.validateEach(
      {
        source,
        target,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('destroy and use include models should be success', async () => {
    const input = {
      ...samples.user,
      Image: samples.image,
    };

    const user = await User.create(input, {
      include: [Image],
    });

    await QueryHelper.destroy(
      {
        modelName: 'User',
        include: [Image],
        ids: [user.id],
      },
    );

    const source1 = await QueryHelper.getDetail(
      {
        modelName: 'User',
        include: [],
        where: {
          id: user.id,
        },
      },
      {
        toJSON: true,
      },
    );

    const source2 = await QueryHelper.getDetail(
      {
        modelName: 'Image',
        include: [],
        where: {
          id: user.Image.id,
        },
      },
      {
        toJSON: true,
      },
    );

    SpecHelper.validateEach(
      {
        source: source1,
        target: {},
      },
      {
        strictMode: false,
        log: true,
      },
    );
    SpecHelper.validateEach(
      {
        source: source2,
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
      ...samples.user,
    };

    const user = await User.create(input, {
      include: [],
    });

    try {
      await QueryHelper.destroy(
        {
          modelName: 'test',
          ids: [user.id],
        },
      );
    } catch (err) {
      err.message.should.equal(
        JSON.stringify({ message: 'BadRequest.Target.Model.Not.Exits', code: 400, extra: { modelName: 'test' } }),
      );
    }
  });
});
