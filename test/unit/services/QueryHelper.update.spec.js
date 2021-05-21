import samples from '../samples';

describe('about QueryHelper.update operation.', () => {
  const validateFormater = (target) => {
    return {
      ...target,
      id: 0,
      updatedAt: new Date(),
      createdAt: new Date(),
    }
  }

  it('update should be success', async () => {
    const input = {
      ...samples.update.User,
    }

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

    await QueryHelper.update(
      {
        modelName: 'User',
        input,
        where: {
          id: user.id,
        }
      },
      {
        formatCb: (e) => e,
      },
    );

    const result = await QueryHelper.getDetail(
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

    const source = {
      ...validateFormater(samples.update.User),
      GroupId: null,
      Image: null,
      ageString: 'string',
    };

    SpecHelper.validateEach(
      {
        source,
        target: result,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('update and use include models should be success', async () => {
    const input = {
      ...samples.update.User,
      Image: samples.update.Image,
    };

    sails.log(input)

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

    const url = 'http://goo.gl'
    await QueryHelper.update(
      {
        modelName: 'User',
        include: [Image],
        input: {
          Image: {
            url,
          }
        },
        where: {
          id: user.id,
        }
      },
      {
        formatCb: (e) => e,
      },
    );

    const result = await QueryHelper.getDetail(
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
        // log: true,
      },
    );

    const source = {
      ...validateFormater(samples.update.User),
      Image: validateFormater({
        url,
      }),
    };

    SpecHelper.validateEach(
      {
        source,
        target: result,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('update wrong modelName should be fail', async () => {
    const input = {
      ...samples.update.User,
    }

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
      await QueryHelper.update(
        {
          modelName: 'test',
          input,
          where: {
            id: user.id,
          }
        },
        {
          formatCb: (e) => e,
        },
      );
    } catch (err) {
      err.message.should.equal(
        JSON.stringify({"message":"BadRequest.Target.Model.Not.Exits","code":400,"extra":{"modelName":"test"}})
      );
    }
  });
});
