import samples from '../samples';

describe('about QueryHelper select operation.', () => {
  const input = {
    ...samples.group,
    Users: {
      ...samples.user,
      Image: samples.image,
    },
  };
  let createdGroups;
  const baseSize = 50;
  const perPage = 10;
  before('before test QueryHelper select operation.', async () => {
    await Group.destroy({
      where: {},
    });
    createdGroups = await SeedHelper.create({
      size: baseSize * 3,
      model: Group,
      data: (i) => {
        if (i < baseSize) {
          return {
            ...input,
            name: input.name + i,
          };
        }

        if (i < baseSize * 2) {
          return {
            ...input,
            name: 'test',
          };
        }
        return input;
      },
    });

    createdGroups.length.should.be.equal(baseSize * 3);
  });

  after('after test QueryHelper select operation.', async () => {
    await Group.destroy({
      where: {},
    });
  });

  it('select should be success', async () => {
    const result1 = await QueryHelper
      .select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRequest({
        name: input.name,
      })
      .useWhere((request) => ({
        name: `${request.name}%`,
      }))
      .useSearchable({
        name: 'like',
      })
      .usePresenter((data) => ({
        name: data.name,
        Users: data.Users,
        formatted: true,
      }))
      .getPaging({
        curPage: 1,
        perPage,
      });

    const result2 = await QueryHelper
      .select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRequest({
        name: input.name,
      })
      .useWhere((request) => ({
        name: `${request.name}%`,
      }))
      .useSearchable({
        name: 'like',
      })
      .usePresenter(async (data) => ({
        name: data.name,
        Users: data.Users,
        formatted: true,
      }))
      .findAll({
      });

    result1.items.length.should.equal(perPage);
    result2.items.length.should.equal(baseSize * 2);
    result1.items[0].formatted.should.equal(true);
    result2.items[0].formatted.should.equal(true);
  });

  it('searchable should be success', async () => {
    const result1 = await QueryHelper
      .select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useWhere(() => ({
        name: undefined,
      }))
      .useSearchable({
        name: {
          operator: '<>',
          condition: 'and',
          defaultValue: 'public',
        },
      })
      .usePresenter((data) => ({
        name: data.name,
        Users: data.Users,
      }))
      .getPaging({
        curPage: 1,
        perPage,
      });
    const result2 = await QueryHelper
      .select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useWhere(() => ({
        name: undefined,
      }))
      .useSearchable({
        name: {
          operator: '<>',
          condition: 'and',
          defaultValue: 'public',
        },
      })
      .usePresenter((data) => ({
        name: data.name,
        Users: data.Users,
      }))
      .findAll({
      });

    result1.items.length.should.equal(perPage);
    result2.items.length.should.equal(baseSize * 2);
  });

  it('wong searchable should be fail', async () => {
    try {
      await QueryHelper
        .select(Group)
        .useScope([])
        .useInclude([{
          model: User,
        }])
        .useAttribute(['name'])
        .useRequest({
          name: 'public',
        })
        .useWhere((request) => ({
          name: request.name,
        }))
        .useSearchable({
          name: {
            operator: 'abc',
            condition: 'def',
            defaultValue: 'public',
          },
        })
        .usePresenter((data) => ({
          name: data.name,
          Users: data.Users,
        }))
        .getPaging({
          curPage: 1,
          perPage,
        });
      throw Error('unknown');
    } catch (err) {
      err.message.should.be.equal('this operator not supported.');
    }
  });

  it('select useRawWhere should be success', async () => {
    const result1 = await QueryHelper
      .select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRawWhere({
        name: input.name,
      })
      .usePresenter((data) => ({
        name: data.name,
        Users: data.Users,
      }))
      .getPaging({
        curPage: 1,
        perPage,
      });

    const result2 = await QueryHelper
      .select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRawWhere({
        name: input.name,
      })
      .usePresenter(async (data) => ({
        name: data.name,
        Users: data.Users,
      }))
      .findAll({
      });

    result1.items.length.should.equal(perPage);
    result1.items.forEach((e) => {
      e.name.should.be.a('string');
      e.name.should.be.equal(input.name);
    });
    result2.items.length.should.equal(baseSize);
    result2.items.forEach((e) => {
      e.name.should.be.a('string');
      e.name.should.be.equal(input.name);
    });
  });

  it('select keyword should be success', async () => {
    const result1 = await QueryHelper
      .select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRequest({
        keyword: 'test',
      })
      .useFullTextSearchByKey('keyword')
      .usePresenter((data) => ({
        name: data.name,
        Users: data.Users,
      }))
      .getPaging({
        curPage: 1,
        perPage,
      });

    const result2 = await QueryHelper
      .select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRequest({
        keyword: 'test',
      })
      .useFullTextSearchByKey('keyword')
      .usePresenter(async (data) => ({
        name: data.name,
        Users: data.Users,
      }))
      .findAll({
      });

    result1.items.length.should.equal(perPage);
    result1.items.forEach((e) => {
      e.name.should.be.a('string');
      e.name.should.be.contains('test');
    });
    result2.items.length.should.equal(baseSize);
    result2.items.forEach((e) => {
      e.name.should.be.a('string');
      e.name.should.be.contains('test');
    });
  });

  it('select data should be right', async () => {
    const result1 = await QueryHelper
      .select(Group)
      .useScope([])
      .getPaging({
        curPage: 1,
        perPage: createdGroups.length,
        toJSON: true,
      });

    const result2 = await QueryHelper
      .select(Group)
      .useScope([])
      .findAll({
        toJSON: true,
      });

    SpecHelper.validateEach({
      source: createdGroups,
      target: result1.items,
    }, {
      log: false,
    });

    SpecHelper.validateEach({
      source: createdGroups,
      target: result2.items,
    }, {
      log: false,
    });
  });
});
