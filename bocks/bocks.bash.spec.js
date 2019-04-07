const chai = require('chai')
const should = chai.should()
chai.use(require('chai-match'))
const fsextra = require('fs-extra')

const { Bocks, DEFAULT_OPTIONS } = require('./index')

const fixtureFile = name => `${__dirname}/fixtures/${name}`

describe('bash tests', () => {
  const testMessage = 'he llo  world!'
  const bocks = (opts = {}) => Bocks(opts)
  const verboseBocks = () => bocks({ verbose: true })

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
    it('uses bash version 5', () => bocks()
      .command('echo', `\${BASH_VERSION%%[^0-9]*}`)
      .expectOutput('5')
      .execute()
    )

    it('runs user home bash profile/rc', () => bocks()
      .command('ll', __filename)
      .expectOutput(output => output.should.match(new RegExp(`^[-rwx]{10}.*${__filename}$`)))
      .execute()
    )

    it('can execute scripts-under-tests', () => bocks()
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

    it('deletes test mock file after test', () => bocks()
      .command('echo', testMessage).mockEnvironment('abc', 'def')
      .expectOutput(() => fileExists(DEFAULT_OPTIONS.mockFile))
      .execute()
      .then(() => fileDeleted(DEFAULT_OPTIONS.mockFile))
    )

    it('deletes test mock files after failing output expectation', () => {
      return shouldFail(
        bocks().command('echo', testMessage).mockEnvironment('abc', 'def')
          .expectOutput(() => {
            fileExists(DEFAULT_OPTIONS.mockFile)
            should.fail(testMessage)
          })
          .execute()
      ).then(() => fileDeleted(DEFAULT_OPTIONS.mockFile))
    })

    it('deletes test mock files after failing mock command expectation', () => {
      return shouldFail(
        bocks().command('blab', testMessage).mockEnvironment('abc', 'def')
          .mockCommand('blab', 0, () => {
            fileExists(DEFAULT_OPTIONS.mockFile)
            should.fail(testMessage)
          })
          .execute())
        .then(() => fileDeleted(DEFAULT_OPTIONS.mockFile))
    })

    it('test mock file not created when not necessary', () => {
      const testMockFile = 'mocks.file.test'
      return bocks({ mockFile: testMockFile })
        .command('echo', testMessage)
        .expectOutput(() => {
          fileDeleted(testMockFile)
          fileDeleted(DEFAULT_OPTIONS.mockFile)
        })
        .execute()
    })

    it('test mock file uses custom file', () => {
      const testMockFile = 'mocks.file.test'
      return bocks({ mockFile: testMockFile }).command('echo', testMessage).mockEnvironment('bla', 'blu')
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
      return bocks({ keepMockFile: true }).command(testMock).mockCommand(testMock, 0).execute()
        .finally(() => {
          fileExists(DEFAULT_OPTIONS.mockFile)
          fileHasShaBang(DEFAULT_OPTIONS.mockFile)
          deleteFile(DEFAULT_OPTIONS.mockFile)
        })
    })

    it('bash log uses custom file', () => {
      const testLogFile = 'runner.log.test'
      return bocks({ logFile: testLogFile, verbose: true }).command('echo', testMessage).execute()
        .then(() => fileExists(testLogFile))
        .finally(() => deleteFile(testLogFile))
    })

    it('bash log verbosity defaults false', () => {
      const testLogFile = 'runner.silent.log.test'
      const testLog = 'hello'
      fsextra.outputFileSync(testLogFile, testLog)
      return bocks({ logFile: testLogFile }).command('echo', testMessage).execute()
        .then(() => fileContent(testLogFile).should.equal(testLog))
        .finally(() => deleteFile(testLogFile))
    })

    it(`bash log file defaults to "${DEFAULT_OPTIONS.logFile}"`, () => {
      const defaultLogFile = DEFAULT_OPTIONS.logFile
      const testLog = 'hello'
      fsextra.outputFileSync(defaultLogFile, testLog, { flag: 'a' })
      return verboseBocks().command('echo', testMessage).execute()
        .then(() => fileContent(defaultLogFile).length.should.be.greaterThan(testLog.length))
        .finally(() => deleteFile(defaultLogFile))
    })
  })

  describe('static mocks', () => {
    it('known command output', () => bocks()
      .command(fixtureFile('test-mock-exit-status.sh'))
      .mockCommand('request_confirmation', 73)
      .expectOutput(`success 73`)
      .execute()
    )

    it('unknown command + alias output', () => bocks()
      .mockCommand('mock1', 45)
      .mockCommand('ll', 22)
      .command('mock1; res1=$?; ll; res2=$?; echo "$res1-$res2"')
      .expectOutput('45-22')
      .execute()
    )

    it('environment variables', () => bocks()
      .mockEnvironment('HOME', testMessage)
      .command('echo "$HOME"')
      .expectOutput(testMessage)
      .execute()
    )

    it('expect output', () => bocks()
      .command('cygpath')
      .mockCommand('cygpath', 0, testMessage)
      .expectOutput(testMessage)
      .execute()
    )

    it('expect regex output', () => bocks()
      .command('cygpath')
      .mockCommand('cygpath', 0, testMessage)
      .expectOutput(/^he/)
      .execute()
    )

    it('expect exit-code', () => bocks()
      .command(fixtureFile('test-command-exit-status.sh'), 37)
      .expectOutput('test-script output')
      .expectExitCode(37)
      .execute()
    )

    it('expect regex exit-code', () => bocks()
      .command(fixtureFile('test-command-exit-status.sh'), 97)
      .expectOutput('test-script output')
      .expectExitCode(/^9/)
      .execute()
    )

    it('can pass empty parameter', () => bocks()
      .command('echo', '', 'xXx')
      .expectOutput(' xXx')
      .execute()
    )

    it('can receive multiline output', () => bocks()
      .command(fixtureFile('test-multiple-output-lines.sh'))
      .expectOutput('\n hello\n\t world')
      .execute()
    )
  })

  describe('dynamic mocks', () => {
    it('expect output', () => bocks()
      .command('cygpath')
      .mockCommand('cygpath', 0, () => testMessage)
      .expectOutput(testMessage)
      .execute()
    )

    it('expect exit-code', () => bocks()
      .command('cygpath')
      .mockCommand('cygpath', 4)
      .expectExitCode(4)
      .execute()
    )

    it('forwards mock parameters', () => {
      const mockCommandResponse = `abc=123=${testMessage}`
      return bocks()
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
      return bocks()
        .command('cygpath', tabNewLineStr)
        .mockCommand('cygpath', 0, param => {
          param.should.equal(tabNewLineStr)
          return tabNewLineStr
        })
        .expectOutput(tabNewLineStr)
        .execute()
    })

    it(`can pass parameter '-n'`, () => {
      const dashParam = '-n'
      return bocks()
        .command(fixtureFile('test-mock-backtick.sh'), dashParam)
        .mockCommand('lsof', 0, param => {
          param.should.equal(dashParam)
          return dashParam
        })
        .expectOutput(dashParam)
        .execute()
    })

    it('can be called within backticks', () => {
      const expectedParam = 'bla'
      return bocks()
        .command(fixtureFile('test-mock-backtick.sh'), expectedParam)
        .mockCommand('lsof', 0, param => {
          param.should.equal(expectedParam)
          return testMessage
        })
        .expectOutput(testMessage)
        .execute()
    })

    it('can be called within braces', () => bocks()
      .command(fixtureFile('test-mock-braces.sh'))
      .mockCommand('lsof', 0, param => {
        param.should.equal('bla')
        return testMessage
      })
      .expectOutput(testMessage)
      .execute()
    )
  })

  describe('mock errors', () => {
    it('deletes test mock file after failing test', () => {
      return shouldFail(bocks()
        .command('echo', testMessage)
        .expectOutput('')
        .execute()
      ).then(() => fsextra.pathExistsSync(DEFAULT_OPTIONS.mockFile).should.equal(false))
    })

    it('empty command', () => {
      const emptyCommand = '      '
      return shouldFailWith(
        () => bocks().command(emptyCommand),
        new Error(`can't mock command '${emptyCommand}'`)
      )
    })

    it('empty mock', () => {
      const emptyCommand = '      '
      return shouldFailWith(
        () => bocks().mockCommand(emptyCommand),
        new Error(`can't mock command '${emptyCommand}'`)
      )
    })

    it('command not found', () => {
      const unknownCommand = 'unknownCmd'
      return shouldFailWith(
        bocks().command(unknownCommand)
          .expectOutput(testMessage)
          .execute(),
        new Error(`expected 'bash: ${unknownCommand}: command not found' to equal '${testMessage}'`)
      )
    })

    it('mock is unused', () => {
      const unknownCommand = '_TEST_MOCK_'
      return shouldFailWith(
        bocks().command('cygpath')
          .mockCommand(unknownCommand, 0, () => 'UNKNOWN')
          .mockCommand('cygpath', 0, () => testMessage)
          .execute(),
        new Error(`mock not used: [${unknownCommand}]`)
      )
    })

    it('static mock is specified twice', () => {
      const commandName = '_test_static_twice'
      return shouldFailWith(
        () => bocks()
          .mockCommand(commandName, 0, testMessage)
          .mockCommand(commandName, 0, testMessage),
        new Error(`command-mock defined twice: ${commandName}`)
      )
    })

    it('dynamic + static mock is specified twice', () => {
      const commandName = '_test_mixed_twice'
      return shouldFailWith(
        () => bocks()
          .mockCommand(commandName, 0, testMessage)
          .mockCommand(commandName, 0, () => testMessage),
        new Error(`command-mock defined twice: ${commandName}`)
      )
    })

    it('throws error when mock-command expectation failed', () => shouldFailWith(
      bocks().command('bla')
        .mockCommand('bla', 0, () => should.fail(testMessage))
        .execute(),
      new chai.AssertionError(testMessage))
    )

    it('dynamic mock returns undefined', () => {
      const commandName = 'cygpath'
      return shouldFailWith(
        bocks()
          .command(commandName)
          .mockCommand(commandName, 0, () => { })
          .execute(),
        new Error(`command-mock returns no value: ${commandName}`)
      )
    })

    it('unexpected static output', () => shouldFailWith(
      bocks().command('echo', testMessage)
        .expectOutput('5')
        .execute(),
      new Error(`expected '${testMessage}' to equal '5'`)
    ))

    it('unexpected static regex output', () => shouldFailWith(
      bocks().command('echo', testMessage)
        .expectOutput(/ho/)
        .execute(),
      new Error(`expected '${testMessage}' to match /ho/`)
    ))

    it('unexpected static exit-code', () => shouldFailWith(
      bocks().command(fixtureFile('test-command-exit-status.sh'), 0)
        .expectOutput('test-script output')
        .expectExitCode(1)
        .execute(),
      new Error(`expected '0' to equal '1'`)
    ))

    it('unexpected static regex exit-code', () => shouldFailWith(
      bocks().command(fixtureFile('test-command-exit-status.sh'), 99)
        .expectExitCode(/^1/)
        .execute(),
      new Error(`expected '99' to match /^1/`)
    ))

    it('dynamic output function throws error', () => shouldFailWith(
      bocks().command('echo', testMessage)
        .expectOutput(() => should.fail(testMessage))
        .execute(),
      new chai.AssertionError(testMessage)
    ))

    it('dynamic exit-code function throws error', () => shouldFailWith(
      bocks().command(fixtureFile('test-command-exit-status.sh'), 0)
        .expectExitCode(() => should.fail(testMessage))
        .execute(),
      new chai.AssertionError(testMessage)
    ))
  })

  describe('bash commands safety', () => {
    const prohibitedCommands = [
      '', '  ', ' \n ', 'command', '  invoke_mock_callback  ', 'output_log', 'source_profiles',
      'send_to_node', 'read_from_node', 'send_command_result', 'local', 'safe_json'
    ]
    prohibitedCommands.forEach(cmdName => {
      it(`throws error when mocking '${cmdName.replace(/\n/g, '\\n')}'`, () => {
        return shouldFailWith(
          () => bocks().mockCommand(cmdName, 0, testMessage),
          new Error(`can't mock command '${cmdName}'`)
        )
      })
    })

    const scriptRunnerCommands = ['echo', 'printf', 'shift', 'eval', 'source', 'read']
    scriptRunnerCommands.forEach(cmdName => {
      it(`dynamic mock can overwrite '${cmdName}' function`, () => bocks()
        .command(cmdName, testMessage)
        .mockCommand(cmdName, 0, msg => `${msg}${testMessage}`)
        .expectOutput(`${testMessage}${testMessage}`)
        .execute()
      )
    })

    it('static mock can overwrite export function', () => bocks()
      .command('export', testMessage)
      .mockCommand('export', 0, testMessage)
      .expectOutput(testMessage)
      .execute()
    )

    it('can overwrite echo function when dynamic mock-command expectation failed', () => shouldFailWith(
      bocks().command('echo', 'fail')
        .mockCommand('echo', 0, () => should.fail(testMessage))
        .execute(),
      new chai.AssertionError(testMessage))
    )
  })
})
