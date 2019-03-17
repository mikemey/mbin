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

    it('can mock exit status', () => {
      const testExitCode = 73
      return runner
        .command('test/fixtures/test-exit-status-mock.sh')
        .mock('request_confirmation', testExitCode)
        .expectOut(output => output.should.equal(`success ${testExitCode}`))
        .execute()
    })

    it('mocks multiple unknown commands', () => runner
      .mock('mock1', 5)
      .mock('mock2', 2)
      .command('mock1; res1=$?; mock2; res2=$?; echo "$res1-$res2"')
      .expectOut(output => output.should.equal('5-2'))
      .execute()
    )
  })
})
