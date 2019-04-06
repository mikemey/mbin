const childProcess = require('child_process')

const SPAWN_OPTIONS = { stdio: ['ignore', 'ignore', 'ignore', 'ipc'], timeout: 1000 }

const createCommandPromise = (promiseLog, mockMap, commands) => {
  promiseLog('start')
  const cmd = commands.shift()
  const cmdLogName = commands.reduce((concatCmd, curr) => concatCmd + ` ${curr}`, cmd)

  const data = {
    errorOccurred: false,
    result: null
  }

  const processMessage = sendBack => message => {
    promiseLog(`on MESSAGE: [${message.type}]`)
    switch (message.type) {
      case 'result':
        data.result = message
        break
      case 'mock':
        sendMockResult(sendBack, message)
        break
      default:
        throw new Error(`message type not recognised: [${message.type}]`)
    }
  }

  const sendMockResult = (sendBack, message) => {
    promiseLog(`mock callback( [${message.command}] [${message.parameters}])`)
    let funcResult = ''
    let error = null
    try {
      const commandMock = mockMap.get(message.command)
      commandMock.called = true

      funcResult = commandMock.retvalFunc(...message.parameters)
      if (!funcResult) {
        funcResult = ''
        throw new Error(`command-mock returns no value: ${commandMock.originalName}`)
      }
    } catch (err) {
      error = err
    }
    promiseLog(`mock response [${funcResult}]`)
    sendBack(funcResult)
    if (error) { throw error }
  }

  const processOnClose = resolve => code => {
    if (data.errorOccurred) { return }

    promiseLog(`on CLOSE: <${code}>`)
    for (const unusedMock of mockMap.values()) {
      if (unusedMock.called !== true) {
        throw new Error(`mock not used: [${unusedMock.originalName}]`)
      }
    }
    if (!data.result) { throw new Error(`no response from command: [${cmdLogName}]`) }

    promiseLog(`received output: [${data.result.output}]`)
    return resolve(data.result)
  }

  const processError = err => {
    promiseLog(`on ERROR: ${err}`)
    throw err
  }

  return new Promise((resolve, reject) => {
    promiseLog(`childProcess.spawn(${cmdLogName}, options)`)
    const commandProcess = childProcess.spawn(cmd, commands, SPAWN_OPTIONS)

    const cleanup = () => {
      promiseLog('command promise error CLEANUP')

      process.removeAllListeners()
      commandProcess.removeAllListeners()
      if (!commandProcess.killed) { commandProcess.kill() }
    }

    const promiseError = err => {
      promiseLog(`command promise error: ${err}`)
      if (!data.errorOccurred) {
        data.errorOccurred = true
        cleanup()
        reject(err)
      }
    }

    const promiseSuccess = result => {
      cleanup()
      resolve(result)
    }

    const sendBack = msg => {
      const escapedMsg = msg.replace('\t', '\\t').replace('\n', '\\n')
      commandProcess.send(escapedMsg, err => err && promiseError(err))
    }

    const safe = (unsafeFunc, name) => event => {
      promiseLog(`calling function: ${name}`)
      try { return unsafeFunc(event) } catch (err) {
        promiseError(err)
      }
    }

    process.on('uncaughtException', safe(promiseError, 'uncaughtHandler'))
    commandProcess.on('message', safe(processMessage(sendBack), 'processMessage'))
    commandProcess.on('close', safe(processOnClose(promiseSuccess), 'processOnClose'))
    commandProcess.on('error', safe(processError, 'processError'))
  })
}

module.exports = createCommandPromise
