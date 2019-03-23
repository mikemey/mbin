const fsextra = require('fs-extra')

const EOL = require('os').EOL
const SHE_BANG = `#!/usr/bin/env bash ${EOL}`

const tempFilePath = file => `.testtmp/${file}`

const createMockFile = () => {
  const mockFile = tempFilePath('test.mocks', false)
  __writeFile(mockFile, SHE_BANG, true)

  const writeFunc = (commandName, exitCode, retval) => {
    const mockOpts = retval instanceof Function
      ? __dynamicFuncOpts(commandName, exitCode, retval)
      : __staticFuncOpts(commandName, exitCode, retval)
    __writeFile(mockFile, mockOpts.output)
    return mockOpts
  }

  const writeEnv = (envName, envValue) => __writeFile(mockFile, `export ${envName}="${envValue}" ${EOL}`)
  return { path: mockFile, writeFunc, writeEnv }
}

const writeRetvalFile = (mockOpts, funcResult) => __writeFile(mockOpts.retvalFile, funcResult, true)

const __writeFile = (file, data, createNew = false) => {
  const options = createNew ? {} : { flag: 'a' }
  fsextra.outputFileSync(file, data, options)
}

const __staticFuncOpts = (commandName, exitCode, output) => {
  const outputLine = output ? `echo "${output}"` : ''
  return { output: __bashFunction(commandName, exitCode, outputLine) }
}

const __dynamicFuncOpts = (commandName, exitCode, retvalFunc) => {
  const originalName = commandName
  const output = __bashFunction(commandName, exitCode, `invoke_mock_callback "${commandName}" "$@"`)
  return { retvalFunc, originalName, output }
}

const __bashFunction = (commandName, exitCode, outputLine) => {
  return `[[ \`type -t "${commandName}"\` == "alias" ]] && unalias ${commandName} ${EOL}` +
    `function ${commandName} () { ${EOL}` +
    `  ${outputLine} ${EOL}` +
    `  return ${exitCode} ${EOL}` +
    `} ${EOL}` +
    `export -f ${commandName} ${EOL}`
}

module.exports = { createMockFile, writeRetvalFile }
