const childProcess = require('child_process')

const SPAWN_OPTIONS = { stdio: ['ignore', 1, 'ignore', 'ipc'], timeout: 1000 }

const createCommandPromise = (mockMap, commands) => {
  const cmdLog = msg => console.log(`==> CommandPromise [${commands[4]}]: ${msg}`)
  const cmd = commands.shift()
  const execCommand = commands.reduce((concatCmd, curr) => concatCmd + ` "${curr}"`, cmd)
  cmdLog(`start`)

  const data = { result: null }

  const processMessage = (abortProcessing, sendBack) => message => {
    cmdLog(`message received: [${message.type}]`)
    switch (message.type) {
      case 'result':
        data.result = message
        break
      case 'mock':
        sendBack(getMockResult(abortProcessing, message))
        break
      default:
        abortProcessing(new Error(`message type not recognised: [${message.type}]`))
        break
    }
  }

  const getMockResult = (abortProcessing, shellMsg) => {
    cmdLog(`mock callback( [${shellMsg.command}] [${shellMsg.parameters}])`)
    const commandMock = mockMap.get(shellMsg.command)
    // if mock not found ==> error
    commandMock.called = true

    const funcResult = commandMock.retvalFunc(...shellMsg.parameters)
    if (!funcResult) {
      abortProcessing(Error(`command-mock returns no value: ${commandMock.originalName}`))
      return ''
    }
    cmdLog(`response [${funcResult}]`)
    return funcResult
  }

  const processOnClose = (abortProcessing, resolve) => code => {
    cmdLog(`child process exit: <${code}>`)
    for (const unusedMock of mockMap.values()) {
      if (unusedMock.called !== true) {
        return abortProcessing(new Error(`mock not used: [${unusedMock.originalName}]`))
      }
    }
    return data.result
      ? resolve(data.result)
      : abortProcessing(new Error(`no response from command: [${execCommand}]`))
  }

  const processError = abortProcessing => err => {
    cmdLog('PROCESS ERROR!')
    abortProcessing(err)
  }

  return new Promise((resolve, reject) => {
    cmdLog(`childProcess.spawn( [${execCommand}], options)`)
    const commandProcess = childProcess.spawn(cmd, commands, SPAWN_OPTIONS)
    const abortProcessing = err => {
      reject(err)
      if (commandProcess && !commandProcess.killed) {
        commandProcess.kill()
      }
    }
    const sendBack = msg => { commandProcess.send(msg) }

    commandProcess.on('message', processMessage(abortProcessing, sendBack))
    commandProcess.on('close', processOnClose(abortProcessing, resolve))
    commandProcess.on('error', processError(abortProcessing))
  })
}

module.exports = createCommandPromise
