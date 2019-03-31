const fsextra = require('fs-extra')

const EOL = require('os').EOL
const SHE_BANG = `#!/usr/bin/env bash ${EOL}`

const createMockFile = mockFile => {
  let firstWrite = true

  const __writeFile = data => {
    let options = { flag: 'a' }
    if (firstWrite) {
      firstWrite = false
      options = {}
      data = `${SHE_BANG}${data}`
    }
    fsextra.outputFileSync(mockFile, data, options)
  }

  const cleanup = () => {
    fsextra.removeSync(mockFile)
  }

  const writeFunc = (commandName, exitCode, retval) => {
    const mockOpts = retval instanceof Function
      ? __dynamicFuncOpts(commandName, exitCode, retval)
      : __staticFuncOpts(commandName, exitCode, retval)
    __writeFile(mockOpts.output)
    return mockOpts
  }

  const writeEnv = (envName, envValue) => __writeFile(`command export ${envName}="${envValue}" ${EOL}`)
  return { path: mockFile, writeFunc, writeEnv, cleanup }
}

const __staticFuncOpts = (commandName, exitCode, output) => {
  const outputLine = output ? `command echo "${output}"` : ''
  return { output: __bashFunction(commandName, exitCode, outputLine) }
}

const __dynamicFuncOpts = (commandName, exitCode, retvalFunc) => {
  const originalName = commandName
  const outputLine =
    `  local params="" ${EOL}` +
    `  for p in "\${@}"; do ${EOL}` +
    `    output_log "adding parameter: [$p]" ${EOL}` +
    `    if [[ "$params" != "" ]]; then params+=","; fi ${EOL}` +
    `    params+="\\"$p\\"" ${EOL}` +
    `  done ${EOL}` +
    `  invoke_mock_callback "${commandName}" "$params"`
  const output = __bashFunction(commandName, exitCode, outputLine)
  return { retvalFunc, originalName, output }
}

const __bashFunction = (commandName, exitCode, outputLine) => {
  return `[[ \`type -t "${commandName}"\` == "alias" ]] && unalias ${commandName} ${EOL}` +
    `function ${commandName} () { ${EOL}` +
    `  ${outputLine} ${EOL}` +
    `  return ${exitCode} ${EOL}` +
    `} ${EOL}` +
    `command export -f ${commandName} ${EOL}`
}

module.exports = createMockFile
