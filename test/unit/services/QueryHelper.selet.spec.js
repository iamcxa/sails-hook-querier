const samples = require('../samples');

describe('about QueryHelper select operation.', function () {
  const input = {
    ...samples.group,
    Users: {
      ...samples.user,
      Image: samples.image,
    },
  };
  let createdGroups;
  const baseSize = 10;
  const perPage = 10;
  before('before test QueryHelper select operation.', async function () {
    await Group.destroy({
      where: {},
    });
    createdGroups = await SeedHelper.create({
      size: baseSize * 3,
      model: Group,
      include: [User],
      data: (i) => {
        if (i < 2) {
          return {
            ...input,
            name: 'targetItem',
          };
        }

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

  after('after test QueryHelper select operation.', async function () {
    await Group.destroy({
      where: {},
    });
    await User.destroy({
      where: {},
    });
  });

  it('select should be success', async function () {
    const result1 = await QueryHelper.select(Group)
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
        formatted: true,
      }))
      .getPaging({
        curPage: 1,
        perPage,
      });

    const result2 = await QueryHelper.select(Group)
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
        formatted: true,
      }))
      .findAll({});

    result1.items.length.should.equal(perPage);
    result2.items.length.should.equal(baseSize * 2 - 2);
    result1.items[0].formatted.should.equal(true);
    result2.items[0].formatted.should.equal(true);
  });

  it('searchable should be success', async function () {
    const result1 = await QueryHelper.select(Group)
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
      }))
      .getPaging({
        curPage: 1,
        perPage,
      });
    const result2 = await QueryHelper.select(Group)
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
      }))
      .findAll({});

    result1.items.length.should.equal(perPage);
    result2.items.length.should.equal(baseSize * 2);
  });

  it('wong searchable should be fail', async function () {
    try {
      await QueryHelper.select(Group)
        .useScope([])
        .useInclude([
          {
            model: User,
          },
        ])
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

  it('select useRawWhere should be success', async function () {
    const result1 = await QueryHelper.select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRawWhere({
        name: input.name,
      })
      .usePresenter((data) => ({
        name: data.name,
      }))
      .getPaging({
        curPage: 1,
        perPage,
      });

    const result2 = await QueryHelper.select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRawWhere({
        name: input.name,
      })
      .usePresenter(async (data) => ({
        name: data.name,
      }))
      .findAll({});

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

  it('select keyword should be success', async function () {
    const result1 = await QueryHelper.select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRequest({
        keyword: 'test',
      })
      .useFullTextSearchByKey('keyword')
      .usePresenter((data) => ({
        name: data.name,
      }))
      .getPaging({
        curPage: 1,
        perPage,
      });

    const result2 = await QueryHelper.select(Group)
      .useScope([])
      .useAttribute(['name'])
      .useRequest({
        keyword: 'test',
      })
      .useFullTextSearchByKey('keyword')
      .usePresenter(async (data) => ({
        name: data.name,
      }))
      .findAll({});

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

  it('select data should be right', async function () {
    const result1 = await QueryHelper.select(Group)
      .useInclude([
        {
          model: User,
        },
      ])
      .useScope([])
      .getPaging({
        curPage: 1,
        perPage: createdGroups.length,
        toJSON: true,
      });

    const result2 = await QueryHelper.select(Group)
      .useInclude([
        {
          model: User,
        },
      ])
      .useScope([])
      .findAll({
        toJSON: true,
      });

    SpecHelper.validateEach(
      {
        source: createdGroups,
        target: result1.items,
      },
      {
        log: false,
      },
    );

    SpecHelper.validateEach(
      {
        source: createdGroups,
        target: result2.items,
      },
      {
        log: false,
      },
    );
  });

  it.skip('cache data should be success', async function () {
    let start = process.hrtime();
    const timer = function (note) {
      const precision = 3; // 3 decimal places
      const elapsed = process.hrtime(start)[1] / 1000000;
      sails.log(`${process.hrtime(start)[0]} s, ${elapsed.toFixed(precision)} ms - ${note}`);
      start = process.hrtime();
    };

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    timer('query1 start');
    const result1 = await QueryHelper.select(Group)
      .useInclude([
        {
          model: User,
        },
      ])
      .useRequest({
        name: 'get',
      })
      .useWhere((request) => ({
        name: `%${request.name}%`,
      }))
      .useCache({
        adapter: 'redis',
        lifetime: 10,
      })
      .findAll({
        toJSON: true,
      });
    timer('query1 done');
    sails.log(result1);
    await sleep(2000);
    timer('query2 start');
    const result2 = await QueryHelper.select(Group)
      .useInclude([
        {
          model: User,
        },
      ])
      .useRequest({
        name: 'get',
      })
      .useWhere((request) => ({
        name: `%${request.name}%`,
      }))
      .useCache({
        adapter: 'redis',
        lifetime: 10,
      })
      .findAll({
        toJSON: true,
      });
    timer('query2 done');
    sails.log(result2);
  });
});
