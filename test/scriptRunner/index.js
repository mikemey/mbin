// const spawn = require('child-process-promise').spawn
// const util = require('util')
const childProcess = require('child_process')
// const spawn = require('child_process').spawn
// const execPromise = util.promisify(require('child_process').exec)
const fsextra = require('fs-extra')
const chai = require('chai')
const should = chai.should()

const logMessage = msg => console.log(`==> ${msg}`)

// const { createFileWatcher } = require('./fileWatcher')
const { createMockFile, writeRetvalFile } = require('./mockFiles')

const SHELL_COMMAND_TIMEOUT = 1000
// const STDOUT = 'stdout'
// const STDERR = 'stderr'

const fixturesFilePath = file => {
  const fullPath = `test/fixtures/${file}`
  if (fsextra.existsSync(fullPath)) {
    return fullPath
  }
  throw new Error(`file doesn't exist: ${fullPath}`)
}

// const fileWatcher = createFileWatcher()

// const stopCallbackObj = () => {
//   let promiseFinished = false
//   const cleanup = () => {
//     if (!promiseFinished && _childProcess) {
//       logMessage(`CommandPromise [${cmd}]: killing processs: ==<${_childProcess.pid}>==`)
//       _childProcess.kill()
//     }
//   }

//   const promise = new Promise((resolve, reject) => {
//     const execFileCallback = (error, stdout, stderr) => {
//       if (promiseFinished) {
//         logMessage(`CommandPromise [${cmd}]: if (promiseFinished) { reject(new Error('shell promise promiseFinished'))`)
//         reject(new Error('shell promise finished!'))
//       }
//       promiseFinished = true

//       if (error && error.signal) {
//         logMessage(`CommandPromise [${cmd}]: if (error && error.signal) { => throw error`)
//         reject(error)
//       }
//       const exitCode = error && error.code ? error.code : 0
//       const output = `${__readStr(stdout)}${__readStr(stderr)}`
//       logMessage(`CommandPromise [${cmd}]: resolves: ===<${exitCode}>==<${stdout}>=====<${stderr}>==`)
//       resolve({ exitCode, output })
//     }
//     logMessage(`CommandPromise [${cmd}]: _childProcess = execFile()`)
//     _childProcess = execFile(cmd, params, { timeout: SHELL_COMMAND_TIMEOUT }, execFileCallback)
//     logMessage(`CommandPromise [${cmd}]: _childProcess = execFile() : <${_childProcess.pid}>`)
//   })
//   return { stop, promise }
// }

const __toCommandPromiseObj = commands => {
  logMessage(`__toCommandPromiseObj [${commands}]`)
  const targetCommand = commands[4]
  const cmdLog = msg => logMessage(`CommandPromise [${targetCommand}]: ${msg}`)
  // let _childProcess

  const cleanup = () => {
    // if (!promiseFinished) {
    // }
  }

  // result.on('data', data => {
  //   console.log('+++ DATA +++')
  //   console.log(data)
  // })
  // result.on('data', data => {
  //   console.log('+++ DATA +++')
  //   console.log(data)
  // })
  // result.on('error', error => {
  //   console.log('+++ ERROR +++')
  //   console.log(error)
  // })

  // result.on('exit', code => {
  //   console.log('+++ EXIT +++')
  //   console.log(code)
  // })
  const promise = new Promise((resolve, reject) => {
    // const commandStr = commands.reduce((cumCmd, cmd) => `${ cumCmd } ${ cmd }`, '').trim()
    const cmd = commands.shift()
    const execCommand = commands.reduce((concatCmd, curr) => concatCmd + ` ${curr}`, cmd)
    try {
      cmdLog(`childProcess.spawn( [${execCommand}], options)`)
      const cmdProcess = childProcess.spawn(cmd, commands, { stdio: ['ignore', 1, 'ignore', 'ipc'] })
      let result
      cmdProcess.on('message', message => {
        cmdLog(`message received: [${message.type}]`)
        switch (message.type) {
          case 'result':
            result = message
            break
          default:
            throw new Error(`message type not recognised: [${message.type}]`)
        }

        // const message = 'hello world back'
        // const responseSuccess = cmdProcess.send(message)
        // cmdLog('sent message back success: ' + responseSuccess)
      })
      // cmdProcess.stdout.on('data', data => {
      //   cmdLog(`stdout: ${data}`)
      //   output += __readStr(data)
      // })
      // cmdProcess.stderr.on('data', data => {
      //   cmdLog(`stderr: ${data}`)
      //   output += data
      // })
      cmdProcess.on('close', code => {
        cmdLog(`child process exit: <${code}>`)
        return result
          ? resolve(result)
          : reject(new Error(`no response from command: [${execCommand}]`))
      })
      cmdProcess.on('error', err => {
        cmdLog('PROCESS error!')
        console.log(err)
      })

      // if (promiseFinished) {
      //   cmdLog(`CommandPromise [${commands}]: if (promiseFinished) { resolve()`)
      //   // reject(new Error('shell promise finished!'))
      //   resolve()
      // }
      // promiseFinished = true

      // if (result.signal || isNaN(result.status)) {
      //   cmdLog(`CommandPromise [${commands}]: if (error && (error.signal || isNaN(error.code))) {`)
      //   reject(result.error)
      // }

      // const exitCode = result.status ? result.status : 0
      // const output = __readStr(result)
      // cmdLog(`CommandPromise [${commands}]: resolves: ==exit:<${exitCode}>==output:<${output}>==`)
      // resolve({ exitCode, output })
    } catch (err) {
      cmdLog(`ise [.testtmp/test.mocks]: ERROR:`)
      console.log(err)
      reject(err)
    }

    // execFileSync(file[, args][, options])
    // _childProcess = execFileSync(commandStr, {timeout: SHELL_COMMAND_TIMEOUT, shell: true }, execCallback)
    // cmdLog(`CommandPromise [${commands}]: _childProcess = execFile() : <${_childProcess.pid}>`)
  })

  return { cleanup, promise }
}

const __readStr = stream => stream ? stream.toString().trim() : ''

// const __toMockPromiseObj = mockOpts => {
//   logMessage(`__toMockPromise [${mockOpts.parametersFile}]`)
//   let cleanup = () => { }
//   const promise = new Promise((resolve, reject) => {
//     logMessage(`MockPromise [${mockOpts.parametersFile}]: START __toMockPromise`)
//     cleanup = resolve
//     const callback = fileContent => {
//       logMessage(`MockPromise [${mockOpts.parametersFile}]: fileWatcher.callback(fileContent)`)
//       const params = fileContent.split(/(?<!\\) /).map(param => param.replace('\\ ', ' '))
//       const funcResult = mockOpts.retvalFunc(...params)
//       logMessage(`MockPromise [${mockOpts.parametersFile}]: const funcResult = mockOpts.retvalFunc(...params)`)

//       if (!funcResult) {
//         logMessage(`MockPromise [${mockOpts.parametersFile}]: if (!funcResult) {  --> reject(command-mock returns no value)`)
//         reject(Error(`command-mock returns no value: ${mockOpts.originalName}`))
//       }
//       writeRetvalFile(mockOpts, funcResult)
//       logMessage(`MockPromise [${mockOpts.parametersFile}]: writeRetvalFile( ... )`)
//       resolve()
//       logMessage(`MockPromise [${mockOpts.parametersFile}]: END __toMockPromise`)
//     }
//     fileWatcher.watchFileContent(mockOpts.parametersFile, callback)
//   })
//   return { cleanup, promise }
// return fileWatcher.watchFileContent(mockOpts.parametersFile, callback)
//   .then(fileContent => {
//     logMessage(`MockPromise [${mockOpts.parametersFile}]: fileWatcher.watchFileContent( ... ).then(fileContent => {`)
//     const params = fileContent.split(/(?<!\\) /).map(param => param.replace('\\ ', ' '))
//     const funcResult = mockOpts.retvalFunc(...params)
//     logMessage(`MockPromise [${mockOpts.parametersFile}]: const funcResult = mockOpts.retvalFunc(...params)`)

//     if (!funcResult) {
//       logMessage(`MockPromise [${mockOpts.parametersFile}]: if (!funcResult) {  --> throw new Error(command-mock returns no value)`)
//       throw new Error(`command-mock returns no value: ${mockOpts.originalName}`)
//     }
//     writeRetvalFile(mockOpts, funcResult)
//     logMessage(`MockPromise [${mockOpts.parametersFile}]: writeRetvalFile( ... )`)
//     logMessage(`MockPromise [${mockOpts.parametersFile}]: END __toMockPromise`)
//   })
//   .catch(err => {
//     logMessage(`MockPromise [${mockOpts.parametersFile}]: .catch(err => {`)
//     logMessage(`MockPromise [${mockOpts.parametersFile}]:         --> throw err instanceof UnusedFileWatchError`)
//     throw err instanceof UnusedFileWatchError
//       ? new Error(`mock not used: [${mockOpts.originalName}]`)
//       : err
//   })
// }

const ScriptRunner = () => {
  const mockFile = createMockFile()
  const data = {
    self: null,
    mockFile,
    // commands: [fixturesFilePath('setup-env.sh'), mockFile.path],
    commands: ['env', 'bash', '-i', fixturesFilePath('setup-env.sh'), mockFile.path],
    resultExpectFunc: null,
    exitCodeExpectFunc: null,
    dynamicMockOpts: [],
    allMockCommands: []
  }

  const command = (...cmd) => {
    data.commands.push(...cmd)
    return data.self
  }

  const expectOutput = expectedOutput => {
    data.resultExpectFunc = __ExpectationFunction(expectedOutput)
    return data.self
  }

  const expectExitCode = expectedExitCode => {
    data.exitCodeExpectFunc = __ExpectationFunction(expectedExitCode)
    return data.self
  }

  const mockEnvironment = (envName, envValue) => {
    logMessage('START mockEnvironment')
    data.mockFile.writeEnv(envName, envValue)
    logMessage('END mockEnvironment')
    return data.self
  }

  const mockCommand = (commandName, exitCode, retval = null) => {
    logMessage('START mockCommand')
    if (data.allMockCommands.includes(commandName)) {
      logMessage('if (data.allMockCommands.includes(commandName)) { --> throw new Error(command-mock defined twice:)')
      throw new Error(`command-mock defined twice: ${commandName}`)
    }
    data.allMockCommands.push(commandName)

    const bashFuncOpts = data.mockFile.writeFunc(commandName, exitCode, retval)
    if (bashFuncOpts.retvalFunc) {
      data.dynamicMockOpts.push(bashFuncOpts)
    }

    logMessage('END mockCommand')
    return data.self
  }

  const execute = () => {
    logMessage('START execute', true)
    const commandPromiseObj = __toCommandPromiseObj(data.commands)
    // const mockPromiseObjects = data.dynamicMockOpts.map(__toMockPromiseObj)
    // const shellObjects = mockPromiseObjects.concat(commandPromiseObj)
    logMessage('Promise.all(commandPromiseObj.promise)')
    return commandPromiseObj.promise
      .then(commandResult => {
        logMessage('Promise.all(commandPromiseObj.promise).then(result => {')
        // const commandResult = allResult[allResult.length - 1]
        if (data.resultExpectFunc) {
          logMessage('data.resultExpectFunc')
          data.resultExpectFunc(commandResult.output)
        }
        if (data.exitCodeExpectFunc) {
          logMessage('data.exitCodeExpectFunc')
          data.exitCodeExpectFunc(commandResult.exitCode)
        }
        logMessage('END execute')
      })
      .catch(__handleCatchAll)
    // .finally(() => {
    //   logMessage('FINALLY START execute')
    // shellObjects.forEach(o => o.cleanup())
    // fileWatcher.cleanup()
    //   logMessage('FINALLY STOP execute')
    // })
  }

  // const __checkExitStatus = err => {
  //   logMessage('START __checkExitStatus')
  //   if (err.code) {
  //     logMessage('if (err.code) {')
  //     return [err]
  //   }
  //   logMessage('END __checkExitStatus')
  //   throw err
  // }

  const __handleCatchAll = err => {
    logMessage('START __handleCatchAll')
    if (err instanceof chai.AssertionError) {
      logMessage('if (err instanceof chai.AssertionError) {')
      should.fail(err.actual, err.expected, err.message)
    }
    if (err.stderr) {
      logMessage('if (err.stderr) {')
      should.fail(`SCRIPT error: ${err.stderr}`)
    }
    logMessage('END __handleCatchAll')
    throw err
  }

  const __ExpectationFunction = expectation => expectation instanceof Function
    ? expectation
    : output => output.should.equal(expectation)

  data.self = { command, execute, expectOutput, expectExitCode, fixturesFilePath, mockCommand, mockEnvironment }
  return data.self
}

module.exports = ScriptRunner
