import samples from '../samples';

describe('about QueryHelper.create operation.', () => {
  const validateFormater = (target) => {
    return {
      ...target,
      id: 0,
      updatedAt: new Date(),
      createdAt: new Date(),
    }
  }

  it('create should be success', async () => {
    const input = {
      ...samples.create.User,
    }

    const result = await QueryHelper.create(
      {
        modelName: 'User',
        input,
      },
      {
        formatCb: (e) => e,
        toJSON: true,
      },
    );

    const target = validateFormater(samples.create.User);

    SpecHelper.validateEach(
      {
        source: result,
        target,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('create and use include models should be success', async () => {
    const input = {
      ...samples.create.Group,
      Users: {
        ...samples.create.User,
        Image: samples.create.Image,
      },
    };

    const result = await QueryHelper.create(
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
        formatCb: (e) => e,
      },
    );

    const target = {
      ...validateFormater(samples.create.Group),
      Users: [{
        ...validateFormater(samples.create.User),
        Images: [{
          ...validateFormater(samples.create.Image),
        }]
      }]
    };

    SpecHelper.validateEach(
      {
        source: result,
        target,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('create wrong modelName should be fail', async () => {
    const input = {
      ...samples.create.User,
    }
    const chai = require('chai');
    chai.should();

    try {
      const result = await QueryHelper.create(
        {
          modelName: 'test',
          input,
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
