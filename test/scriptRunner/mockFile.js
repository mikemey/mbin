const fsextra = require('fs-extra')

const EOL = require('os').EOL
const SHE_BANG = `#!/usr/bin/env bash ${EOL}`

const createMockFile = mockFile => {
  let firstWrite = true

  const __writeFile = (file, data) => {
    let options = { flag: 'a' }
    if (firstWrite) {
      firstWrite = false
      options = {}
      data = `${SHE_BANG}${data}`
    }
    fsextra.outputFileSync(file, data, options)
  }

  const cleanup = () => {
    fsextra.removeSync(mockFile)
  }

  const writeFunc = (commandName, exitCode, retval) => {
    const mockOpts = retval instanceof Function
      ? __dynamicFuncOpts(commandName, exitCode, retval)
      : __staticFuncOpts(commandName, exitCode, retval)
    __writeFile(mockFile, mockOpts.output)
    return mockOpts
  }

  const writeEnv = (envName, envValue) => __writeFile(mockFile, `export ${envName}="${envValue}" ${EOL}`)
  return { path: mockFile, writeFunc, writeEnv, cleanup }
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

module.exports = createMockFile
