const chai = require('chai')
chai.use(require('chai-match'))

const ScriptRunner = require('./scriptRunner')

describe('bash tests', () => {
  const testMessage = 'hello world!'
  let runner

  beforeEach(() => {
    runner = ScriptRunner()
  })

  after(() => {
    if (runner) runner.cleanup()
  })

  describe('basics', () => {
    it('uses bash version 5', () => runner
      .command('echo', `\${BASH_VERSION%%[^0-9]*}`)
      .expectOut(output => output.should.equal('5'))
      .execute()
    )

    it('runs user home bash profile/rc', () => {
      const testFile = runner.fixturesDir('setup-env.sh')
      return runner
        .command('ll', testFile)
        .expectOut(output => output.should.match(new RegExp(`.*${testFile}$`)))
        .execute()
    })

    it('can execute scripts-under-tests', () => runner
      .command('timelog', testMessage)
      .expectOut(output => output.should.match(new RegExp(`^\\[[0-9\\-: ]*]: ${testMessage}$`)))
      .execute()
    )
  })

  describe('mocking', () => {
    it('known command exit status', () => runner
      .command('test/fixtures/test-exit-status.sh')
      .mockCommand('request_confirmation', 73)
      .expectOut(output => output.should.equal(`success 73`))
      .execute()
    )

    it('unknown command + alias', () => runner
      .mockCommand('mock1', 5)
      .mockCommand('ll', 2)
      .command('mock1; res1=$?; ll; res2=$?; echo "$res1-$res2"')
      .expectOut(output => output.should.equal('5-2'))
      .execute()
    )

    it('environment variables', () => {
      return runner
        .mockEnvironment('HOME', testMessage)
        .command('echo $HOME')
        .expectOut(output => output.should.equal(testMessage))
        .execute()
    })

    it('returns static data', () => runner
      .command('cygpath')
      .mockCommand('cygpath', 0, testMessage)
      .expectOut(output => output.should.equal(testMessage))
      .execute()
    )

    it('returns dynamic data', () => runner
      .command('cygpath')
      .mockCommand('cygpath', 0, () => testMessage)
      .expectOut(output => output.should.equal(testMessage))
      .execute()
    )
  })
})
