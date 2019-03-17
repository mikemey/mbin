const chai = require('chai')
chai.use(require('chai-match'))

const ScriptRunner = require('./scriptRunner')

describe('bash tests', () => {
  const testMessage = 'hello world!'
  let runner

  beforeEach(() => {
    runner = ScriptRunner()
  })

  describe('basics', () => {
    it('uses bash version 5', () => runner
      .command('echo', `\${BASH_VERSION%%[^0-9]*}`)
      .expectOutput('5')
      .execute()
    )

    it('runs user home bash profile/rc', () => {
      const testFile = runner.fixturesFilePath('setup-env.sh')
      return runner
        .command('ll', testFile)
        .expectOutput(output => output.should.match(new RegExp(`.*${testFile}$`)))
        .execute()
    })

    it('can execute scripts-under-tests', () => runner
      .command('timelog', testMessage)
      .expectOutput(output => output.should.match(new RegExp(`^\\[[0-9\\-: ]*]: ${testMessage}$`)))
      .execute()
    )
  })

  describe('mocking', () => {
    it('known command exit status', () => runner
      .command('test/fixtures/test-exit-status.sh')
      .mockCommand('request_confirmation', 73)
      .expectOutput(`success 73`)
      .execute()
    )

    it('unknown command + alias', () => runner
      .mockCommand('mock1', 45)
      .mockCommand('ll', 22)
      .command('mock1; res1=$?; ll; res2=$?; echo "$res1-$res2"')
      .expectOutput('45-22')
      .execute()
    )

    it('environment variables', () => {
      return runner
        .mockEnvironment('HOME', testMessage)
        .command('echo $HOME')
        .expectOutput(testMessage)
        .execute()
    })

    it('returns static data', () => runner
      .command('cygpath')
      .mockCommand('cygpath', 0, testMessage)
      .expectOutput(testMessage)
      .execute()
    )

    it('returns dynamic data', () => runner
      .command('cygpath')
      .mockCommand('cygpath', 0, () => testMessage)
      .expectOutput(testMessage)
      .execute()
    )

    it('forwards parameters', () => runner
      .command('cygpath', 'abc', 123, testMessage)
      .mockCommand('cygpath', 0, (str, num, msg) => {
        str.should.equal('abc')
        num.should.equal('123')
        msg.should.equal(testMessage)
        return `${str}=${num}=${testMessage}`
      })
      .expectOutput(`abc=123=${testMessage}`)
      .execute()
    )
  })
})
