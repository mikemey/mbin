const chai = require('chai')
chai.use(require('chai-match'))

const ScriptRunner = require('./scriptRunner')

describe('bash tests', () => {
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

    it('can execute scripts-under-tests', () => {
      const msg = 'hello'
      return runner
        .command('timelog', msg)
        .expectOut(output => output.should.match(new RegExp(`^\\[[0-9\\-: ]*]: ${msg}$`)))
        .execute()
    })
  })

  describe('mocking', () => {
    it('known command exit status', () => {
      const testExitCode = 73
      return runner
        .command('test/fixtures/test-exit-status-mock.sh')
        .mockCommand('request_confirmation', testExitCode)
        .expectOut(output => output.should.equal(`success ${testExitCode}`))
        .execute()
    })

    it('unknown command + alias', () => runner
      .mockCommand('mock1', 5)
      .mockCommand('ll', 2)
      .command('mock1; res1=$?; ll; res2=$?; echo "$res1-$res2"')
      .expectOut(output => output.should.equal('5-2'))
      .execute()
    )

    it('environment variables', () => {
      const testHome = 'this is a test'
      return runner
        .mockEnvironment('HOME', testHome)
        .command('echo $HOME')
        .expectOut(output => output.should.equal(testHome))
        .execute()
    })
  })
})
