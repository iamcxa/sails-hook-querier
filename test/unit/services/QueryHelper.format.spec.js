import samples from '../samples';

describe('about QueryHelper format operation.', function () {
  it('matchFormat should be success', async function () {
    const data = {
      name: 'test',
      age: 1,
    };

    const format = {
      name: 'string',
      ageString: '1',
    };

    const body = QueryHelper.matchFormat({
      format,
      data,
    });

    SpecHelper.validateEach(
      {
        source: body,
        target: format,
      },
      {
        strictMode: false,
        log: true,
      },
    );
  });

  it('formatInput should be success', async function () {});

  it('formatOutput should be success', async function () {});

  it('formatFieldQueryWithOrCondition should be success', async function () {});
});
