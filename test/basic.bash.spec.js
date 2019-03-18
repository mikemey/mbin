const chai = require('chai')
const should = chai.should()
chai.use(require('chai-match'))

const ScriptRunner = require('./scriptRunner')

describe('bash tests', () => {
  const testMessage = 'hello world!'
  let runner

  beforeEach(() => {
    runner = ScriptRunner()
  })

  const shouldFailWith = (runnerPromise, expectedError) => {
    let errorThrown = false
    return runnerPromise
      .catch(err => {
        errorThrown = true
        expectedError.name.should.equal(err.name, 'Error name')
        expectedError.message.should.equal(err.message, 'Error name')
      })
      .finally(() => {
        if (!errorThrown) {
          should.fail(`expected error [${expectedError.message}] not thrown!`)
        }
      })
  }

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

  describe('static mocks', () => {
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
  })

  describe('dynamic mocks', () => {
    it('returns dynamic data', () => runner
      .command('cygpath')
      .mockCommand('cygpath', 0, () => testMessage)
      .expectOutput(testMessage)
      .execute()
    )

    it('forwards mock parameters', () => runner
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

    it('should fail when mock is unused', () => {
      const unknownCommand = '_TEST_MOCK_'
      return shouldFailWith(
        runner
          .command('cygpath')
          .mockCommand(unknownCommand, 0, () => 'UNKNOWN')
          .mockCommand('cygpath', 0, () => testMessage)
          .execute(),
        new Error(`mock not used: [${unknownCommand}]`)
      )
    })
  })
})
