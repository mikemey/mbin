const chai = require('chai')
const should = chai.should()
chai.use(require('chai-match'))
const fsextra = require('fs-extra')

const { ScriptRunner, DEFAULT_OPTIONS } = require('./scriptRunner')

describe('bash tests', () => {
  const testMessage = 'he llo  world!'
  const runner = () => ScriptRunner()
  const verboseRunner = () => ScriptRunner({ verbose: true })

  const shouldFail = underTest => shouldFailWith(underTest)
  const shouldFailWith = (underTest, expectedError) => {
    let errorThrown = false
    const underTestPromise = underTest instanceof Promise
      ? underTest
      : new Promise(underTest)
    return underTestPromise
      .catch(err => {
        errorThrown = true
        if (expectedError) {
          err.name.should.equal(expectedError.name, 'Error name')
          err.message.should.equal(expectedError.message, 'Error message')
        }
      }).finally(() => {
        if (!errorThrown) {
          const errorMsg = expectedError ? `[${expectedError.message}] ` : ''
          should.fail(`expected error ${errorMsg}not thrown!`)
        }
      })
  }

  describe('basics', () => {
    it('uses bash version 5', () => runner()
      .command('echo', `\${BASH_VERSION%%[^0-9]*}`)
      .expectOutput('5')
      .execute()
    )

    it('runs user home bash profile/rc', () => runner()
      .command('ll', __filename)
      .expectOutput(output => output.should.match(new RegExp(`^[-rwx]{10}.*${__filename}$`)))
      .execute()
    )

    it('can execute scripts-under-tests', () => runner()
      .command('timelog', testMessage)
      .expectOutput(output => output.should.match(new RegExp(`^\\[[0-9\\-: ]*]: ${testMessage}$`)))
      .execute()
    )
  })

  describe('output files', () => {
    const fileExists = name => fsextra.pathExistsSync(name).should.equal(true, `file not found: [${name}]`)
    const fileDeleted = name => fsextra.pathExistsSync(name).should.equal(false, `file found: [${name}]`)
    const deleteFile = name => fsextra.removeSync(name)
    const fileContent = name => fsextra.readFileSync(name).toString()
    const fileHasShaBang = name => fileContent(name).should.match(/#!\/usr\/bin\/env bash/)

    it('deletes test mock file after test', () => runner()
      .command('echo', testMessage).mockEnvironment('abc', 'def')
      .expectOutput(() => fileExists(DEFAULT_OPTIONS.mockFile))
      .execute()
      .then(() => fileDeleted(DEFAULT_OPTIONS.mockFile))
    )

    it('deletes test mock files after failing output expectation', () => {
      return shouldFail(
        runner().command('echo', testMessage).mockEnvironment('abc', 'def')
          .expectOutput(() => {
            fileExists(DEFAULT_OPTIONS.mockFile)
            should.fail(testMessage)
          })
          .execute()
      ).then(() => fileDeleted(DEFAULT_OPTIONS.mockFile))
    })

    it('deletes test mock files after failing mock command expectation', () => {
      return shouldFail(
        runner().command('blab', testMessage).mockEnvironment('abc', 'def')
          .mockCommand('blab', 0, () => {
            fileExists(DEFAULT_OPTIONS.mockFile)
            should.fail(testMessage)
          })
          .execute())
        .then(() => fileDeleted(DEFAULT_OPTIONS.mockFile))
    })

    it('test mock file not created when not necessary', () => {
      const testMockFile = 'mocks.file.test'
      const runner = ScriptRunner({ mockFile: testMockFile })
      return runner.command('echo', testMessage)
        .expectOutput(() => {
          fileDeleted(testMockFile)
          fileDeleted(DEFAULT_OPTIONS.mockFile)
        })
        .execute()
    })

    it('test mock file uses custom file', () => {
      const testMockFile = 'mocks.file.test'
      const runner = ScriptRunner({ mockFile: testMockFile })
      return runner.command('echo', testMessage).mockEnvironment('bla', 'blu')
        .expectOutput(() => {
          fileExists(testMockFile)
          fileHasShaBang(testMockFile)
          fileDeleted(DEFAULT_OPTIONS.mockFile)
        })
        .execute()
        .finally(() => fileDeleted(testMockFile))
    })

    it('keeps test mock file after test', () => {
      const testMock = 'someMockedCommand'
      const runner = ScriptRunner({ keepMockFile: true })
      return runner.command(testMock).mockCommand(testMock, 0).execute()
        .finally(() => {
          fileExists(DEFAULT_OPTIONS.mockFile)
          fileHasShaBang(DEFAULT_OPTIONS.mockFile)
          deleteFile(DEFAULT_OPTIONS.mockFile)
        })
    })

    it('bash log uses custom file', () => {
      const testLogFile = 'runner.log.test'
      const runner = ScriptRunner({ logFile: testLogFile, verbose: true })
      return runner.command('echo', testMessage).execute()
        .then(() => fileExists(testLogFile))
        .finally(() => deleteFile(testLogFile))
    })

    it('bash log verbosity defaults false', () => {
      const testLogFile = 'runner.silent.log.test'
      const testLog = 'hello'
      fsextra.outputFileSync(testLogFile, testLog)
      const runner = ScriptRunner({ logFile: testLogFile })
      return runner.command('echo', testMessage).execute()
        .then(() => fileContent(testLogFile).should.equal(testLog))
        .finally(() => deleteFile(testLogFile))
    })

    it(`bash log file defaults to "${DEFAULT_OPTIONS.logFile}"`, () => {
      const defaultLogFile = DEFAULT_OPTIONS.logFile
      const testLog = 'hello'
      fsextra.outputFileSync(defaultLogFile, testLog, { flag: 'a' })
      return verboseRunner().command('echo', testMessage).execute()
        .then(() => fileContent(defaultLogFile).length.should.be.greaterThan(testLog.length))
        .finally(() => deleteFile(defaultLogFile))
    })
  })

  describe('static mocks', () => {
    it('known command output', () => runner()
      .command('test/fixtures/test-mock-exit-status.sh')
      .mockCommand('request_confirmation', 73)
      .expectOutput(`success 73`)
      .execute()
    )

    it('unknown command + alias output', () => runner()
      .mockCommand('mock1', 45)
      .mockCommand('ll', 22)
      .command('mock1; res1=$?; ll; res2=$?; echo "$res1-$res2"')
      .expectOutput('45-22')
      .execute()
    )

    it('environment variables', () => runner()
      .mockEnvironment('HOME', testMessage)
      .command('echo "$HOME"')
      .expectOutput(testMessage)
      .execute()
    )

    it('expect output', () => runner()
      .command('cygpath')
      .mockCommand('cygpath', 0, testMessage)
      .expectOutput(testMessage)
      .execute()
    )

    it('expect exit-code', () => runner()
      .command('test/fixtures/test-command-exit-status.sh', 37)
      .expectOutput('test-script output')
      .expectExitCode(37)
      .execute()
    )

    it('can pass empty parameter', () => runner()
      .command('echo', '', 'xXx')
      .expectOutput(' xXx')
      .execute()
    )
  })

  describe('dynamic mocks', () => {
    it('expect ouptut', () => runner()
      .command('cygpath')
      .mockCommand('cygpath', 0, () => testMessage)
      .expectOutput(testMessage)
      .execute()
    )

    it('expect exit-code', () => runner()
      .command('cygpath')
      .mockCommand('cygpath', 4)
      .expectExitCode(4)
      .execute()
    )

    it('forwards mock parameters', () => {
      const mockCommandResponse = `abc=123=${testMessage}`
      return runner()
        .command('cygpath', 'abc', 123, testMessage)
        .mockCommand('cygpath', 0, (str, num, msg) => {
          str.should.equal('abc')
          num.should.equal('123')
          msg.should.equal(testMessage)
          return mockCommandResponse
        })
        .expectOutput(mockCommandResponse)
        .execute()
    })

    it('can pass newlines and tabs', () => {
      const tabNewLineStr = `${testMessage}\t${testMessage}\n${testMessage}`
      return runner()
        .command('cygpath', tabNewLineStr)
        .mockCommand('cygpath', 0, param => {
          param.should.equal(tabNewLineStr)
          return tabNewLineStr
        })
        .expectOutput(tabNewLineStr)
        .execute()
    })
  })

  describe('mock errors', () => {
    it('deletes test mock file after failing test', () => {
      return shouldFail(runner()
        .command('echo', testMessage)
        .expectOutput('')
        .execute()
      ).then(() => fsextra.pathExistsSync(DEFAULT_OPTIONS.mockFile).should.equal(false))
    })

    it('empty command', () => {
      const emptyCommand = '      '
      return shouldFailWith(
        () => runner().command(emptyCommand),
        new Error(`can't mock command '${emptyCommand}'`)
      )
    })

    it('empty mock', () => {
      const emptyCommand = '      '
      return shouldFailWith(
        () => runner().mockCommand(emptyCommand),
        new Error(`can't mock command '${emptyCommand}'`)
      )
    })

    it('command not found', () => {
      const unknownCommand = 'unknownCmd'
      return shouldFailWith(
        runner().command(unknownCommand)
          .expectOutput(testMessage)
          .execute(),
        new Error(`expected 'bash: ${unknownCommand}: command not found' to equal '${testMessage}'`)
      )
    })

    it('mock is unused', () => {
      const unknownCommand = '_TEST_MOCK_'
      return shouldFailWith(
        runner().command('cygpath')
          .mockCommand(unknownCommand, 0, () => 'UNKNOWN')
          .mockCommand('cygpath', 0, () => testMessage)
          .execute(),
        new Error(`mock not used: [${unknownCommand}]`)
      )
    })

    it('static mock is specified twice', () => {
      const commandName = '_test_static_twice'
      return shouldFailWith(
        () => runner()
          .mockCommand(commandName, 0, testMessage)
          .mockCommand(commandName, 0, testMessage),
        new Error(`command-mock defined twice: ${commandName}`)
      )
    })

    it('dynamic + static mock is specified twice', () => {
      const commandName = '_test_mixed_twice'
      return shouldFailWith(
        () => runner()
          .mockCommand(commandName, 0, testMessage)
          .mockCommand(commandName, 0, () => testMessage),
        new Error(`command-mock defined twice: ${commandName}`)
      )
    })

    it('throws error when mock-command expectation failed', () => shouldFailWith(
      runner().command('blabla')
        .mockCommand('blabla', 0, () => should.fail(testMessage))
        .execute(),
      new chai.AssertionError(testMessage))
    )

    it('dynamic mock returns undefined', () => {
      const commandName = 'cygpath'
      return shouldFailWith(
        runner()
          .command(commandName)
          .mockCommand(commandName, 0, () => { })
          .execute(),
        new Error(`command-mock returns no value: ${commandName}`)
      )
    })

    it('unexpected static output', () => shouldFailWith(
      runner().command('echo', testMessage)
        .expectOutput('5')
        .execute(),
      new Error(`expected '${testMessage}' to equal '5'`)
    ))

    it('unexpected static exit-code', () => shouldFailWith(
      runner().command('test/fixtures/test-command-exit-status.sh', 0)
        .expectOutput('test-script output')
        .expectExitCode(1)
        .execute(),
      new Error(`expected '0' to equal '1'`)
    ))

    it('dynamic output function throws error', () => shouldFailWith(
      runner().command('echo', testMessage)
        .expectOutput(() => should.fail(testMessage))
        .execute(),
      new chai.AssertionError(testMessage)
    ))

    it('dynamic exit-code function throws error', () => shouldFailWith(
      runner().command('test/fixtures/test-command-exit-status.sh', 0)
        .expectExitCode(() => should.fail(testMessage))
        .execute(),
      new chai.AssertionError(testMessage)
    ))
  })

  describe('bash commands safety', () => {
    const prohibitedCommands = [
      '', '  ', ' \n ', 'command', '  invoke_mock_callback  ', 'output_log', 'source_profiles',
      'send_to_node', 'read_from_node', 'send_command_result', 'local'
    ]
    prohibitedCommands.forEach(cmdName => {
      it(`throws error when mocking '${cmdName.replace(/\n/g, '\\n')}'`, () => {
        return shouldFailWith(
          () => runner().mockCommand(cmdName, 0, testMessage),
          new Error(`can't mock command '${cmdName}'`)
        )
      })
    })

    const scriptRunnerCommands = ['echo', 'printf', 'shift', 'eval', 'source', 'read']
    scriptRunnerCommands.forEach(cmdName => {
      it(`dynamic mock can overwrite '${cmdName}' function`, () => runner()
        .command(cmdName, testMessage)
        .mockCommand(cmdName, 0, msg => `${msg}${testMessage}`)
        .expectOutput(`${testMessage}${testMessage}`)
        .execute()
      )
    })

    it('static mock can overwrite export function', () => runner()
      .command('export', testMessage)
      .mockCommand('export', 0, testMessage)
      .expectOutput(testMessage)
      .execute()
    )

    it('can overwrite echo function when dynamic mock-command expectation failed', () => shouldFailWith(
      runner().command('echo', 'fail')
        .mockCommand('echo', 0, () => should.fail(testMessage))
        .execute(),
      new chai.AssertionError(testMessage))
    )
  })
})
