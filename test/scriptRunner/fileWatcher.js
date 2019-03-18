const fsextra = require('fs-extra')
// const chai = require('chai')

class UnusedFileWatchError extends Error {
  constructor (...params) {
    super(...params)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnusedFileWatchError)
    }
  }
}

const tempFilePath = file => `.testtmp/${file}`

const readFile = file => fsextra.readFileSync(file).toString().trim()

const createFileWatcher = () => {
  const data = {
    allFileListener: [],
    tempDir: tempFilePath(''),
    watch: null
  }

  const _addFileListener = fileListener => {
    data.allFileListener.push(fileListener)
    if (!data.watch) {
      fsextra.ensureDirSync(data.tempDir)
      data.watch = fsextra.watch(data.tempDir, (_, filename) => {
        const changeFilePath = tempFilePath(filename)
        data.allFileListener
          .filter(listener => listener.fileName === changeFilePath)
          .forEach(listener => listener.receivedContent(readFile(listener.fileName)))
      })
    }
  }

  const watchFileContent = fileName => {
    const fileListener = { fileName }
    const watchFilePromise = new Promise((resolve, reject) => {
      fileListener.abort = () => reject(new UnusedFileWatchError())
      fileListener.receivedContent = resolve
    })
    _addFileListener(fileListener)
    return watchFilePromise
  }

  const cleanup = () => {
    if (fsextra.existsSync(data.tempDir)) {
      fsextra.removeSync(data.tempDir)
    }
    if (data.watch) {
      data.watch.close()
      data.allFileListener.forEach(l => l.abort())
      data.allFileListener = []
      data.watch = null
    }
  }
  process.on('exit', cleanup)

  return { cleanup, watchFileContent }
}

module.exports = { createFileWatcher, UnusedFileWatchError }
