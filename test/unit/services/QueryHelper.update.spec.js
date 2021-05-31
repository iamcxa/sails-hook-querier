import samples from '../samples';

describe('about QueryHelper.update operation.', () => {
  it('update should be success', async () => {
    const input = {
      ...samples.user,
    };

    const user = await User.create(input, {
      include: [],
    });

    const name = 'debugger';
    await QueryHelper.update(
      {
        modelName: 'User',
        input: {
          name,
        },
        where: {
          id: user.id,
        },
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
      GroupId: null,
      Image: null,
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
    source.name.should.equal(name);
  });

  it('update and use include models should be success', async () => {
    const input = {
      ...samples.user,
      Image: samples.image,
    };

    const user = await User.create(input, {
      include: [{
        model: Image,
      }],
    });

    const url = 'http://goo.gl';
    await QueryHelper.update(
      {
        modelName: 'User',
        include: [{
          model: Image,
        }],
        input: {
          Image: {
            url,
          },
        },
        where: {
          id: user.id,
        },
      },
    );

    const source = await QueryHelper.getDetail(
      {
        modelName: 'User',
        include: [{
          model: Image,
        }],
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
      Image: samples.builder('image'),
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

    source.Image.url.should.equal(url);
  });

  it('update wrong modelName should be fail', async () => {
    const input = {
      ...samples.user,
    };

    const user = await User.create(input, {
      include: [],
    });

    try {
      await QueryHelper.update(
        {
          modelName: 'test',
          input,
          where: {
            id: user.id,
          },
        },
      );
    } catch (err) {
      err.message.should.equal(
        JSON.stringify({ message: 'BadRequest.Target.Model.Not.Exits', code: 400, extra: { modelName: 'test' } }),
      );
    }
  });
});
