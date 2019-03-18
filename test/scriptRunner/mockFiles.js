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
  return { output: __bashFunction(commandName, exitCode, `echo "${output}"`) }
}

const __dynamicFuncOpts = (commandName, exitCode, retvalFunc) => {
  const uid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const name = `${commandName}_${uid}`

  const originalName = commandName
  const parametersFile = tempFilePath(`${name}.parameters`)
  const retvalFile = tempFilePath(`${name}.retval`)
  const output = __bashFunction(commandName, exitCode, `wait_for_function_result "${parametersFile}" "${retvalFile}" "$@"`)
  return { retvalFunc, originalName, parametersFile, retvalFile, output }
}

const __bashFunction = (commandName, exitCode, outputLine) => {
  return `[[ \`type -t "${commandName}"\` == "alias" ]] && unalias ${commandName} ${EOL}` +
    `function ${commandName} () { ${EOL}` +
    `  ${outputLine} ${EOL}` +
    `  $( exit ${exitCode} ) ${EOL}` +
    `} ${EOL}` +
    `export -f ${commandName} ${EOL}`
}

module.exports = { createMockFile, writeRetvalFile }
