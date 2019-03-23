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
        .expectOutput(output => output.should.match(new RegExp(`^[-rwx]{10}.*${testFile}$`)))
        .execute()
    })

    it('can execute scripts-under-tests', () => runner
      .command('timelog', testMessage)
      .expectOutput(output => output.should.match(new RegExp(`^\\[[0-9\\-: ]*]: ${testMessage}$`)))
      .execute()
    )
  })

  describe('static mocks', () => {
    it('known command output', () => runner
      .command('test/fixtures/test-mock-exit-status.sh')
      .mockCommand('request_confirmation', 73)
      .expectOutput(`success 73`)
      .execute()
    )

    it('unknown command + alias output', () => runner
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

    it('expect output', () => runner
      .command('cygpath')
      .mockCommand('cygpath', 0, testMessage)
      .expectOutput(testMessage)
      .execute()
    )

    it('expect exit-code', () => runner
      .command('test/fixtures/test-command-exit-status.sh', 37)
      .expectOutput('test-script output')
      .expectExitCode(37)
      .execute()
    )
  })

  describe('dynamic mocks', () => {
    it('expect ouptut', () => runner
      .command('cygpath')
      .mockCommand('cygpath', 0, () => testMessage)
      .expectOutput(testMessage)
      .execute()
    )

    it('expect exit-code', () => runner
      .command('cygpath')
      .mockCommand('cygpath', 4)
      .expectExitCode(4)
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
  })

  describe('mock errors', () => {
    const shouldFailWith = (underTest, expectedError) => {
      let errorThrown = false
      const underTestPromise = underTest instanceof Promise
        ? underTest
        : new Promise(underTest)
      return underTestPromise
        .catch(err => {
          errorThrown = true
          expectedError.name.should.equal(err.name, 'Error name')
          expectedError.message.should.equal(err.message, 'Error name')
        }).finally(() => {
          if (!errorThrown) {
            should.fail(`expected error [${expectedError.message}] not thrown!`)
          }
        })
    }

    it('command not found', () => {
      const unknownCommand = 'unknownCmd'
      return shouldFailWith(
        runner
          .command(unknownCommand)
          .expectOutput(testMessage)
          .execute(),
        new chai.AssertionError(`expected 'bash: ${unknownCommand}: command not found' to equal '${testMessage}'`)
      )
    })

    it('mock is unused', () => {
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

    it('static mock is specified twice', () => {
      const commandName = '_test_static_twice'
      return shouldFailWith(
        () => runner
          .mockCommand(commandName, 0, testMessage)
          .mockCommand(commandName, 0, testMessage),
        new Error(`command-mock defined twice: ${commandName}`)
      )
    })

    it('dynamic + static mock is specified twice', () => {
      const commandName = '_test_mixed_twice'
      return shouldFailWith(
        () => runner
          .mockCommand(commandName, 0, testMessage)
          .mockCommand(commandName, 0, () => testMessage),
        new Error(`command-mock defined twice: ${commandName}`)
      )
    })

    it('dynamic mock returns undefined', () => {
      const commandName = 'cygpath'
      return shouldFailWith(
        runner
          .command(commandName)
          .mockCommand(commandName, 0, () => { })
          .execute(),
        new Error(`command-mock returns no value: ${commandName}`)
      )
    })

    it('unexpected static output', () => shouldFailWith(
      runner
        .command('echo', testMessage)
        .expectOutput('5')
        .execute(),
      new chai.AssertionError(`expected '${testMessage}' to equal '5'`)
    ))

    it('unexpected static exit-code', () => shouldFailWith(
      runner
        .command('test/fixtures/test-command-exit-status.sh', 0)
        .expectOutput('test-script output')
        .expectExitCode(1)
        .execute(),
      new chai.AssertionError(`expected 0 to equal 1`)
    ))

    it('dynamic output function throws error', () => shouldFailWith(
      runner
        .command('echo', testMessage)
        .expectOutput(() => should.fail(testMessage))
        .execute(),
      new chai.AssertionError(testMessage)
    ))

    it('dynamic exit-code function throws error', () => shouldFailWith(
      runner
        .command('test/fixtures/test-command-exit-status.sh', 0)
        .expectExitCode(() => should.fail(testMessage))
        .execute(),
      new chai.AssertionError(testMessage)
    ))
  })
})
