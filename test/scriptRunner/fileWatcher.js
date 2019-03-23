const fsextra = require('fs-extra')

// class UnusedFileWatchError extends Error {
//   constructor (...params) {
//     super(...params)
//     if (Error.captureStackTrace) {
//       Error.captureStackTrace(this, UnusedFileWatchError)
//     }
//   }
// }

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
          .forEach(listener => listener.callback(readFile(listener.fileName)))
      })
    }
  }

  const watchFileContent = (fileName, callback) => {
    if (!fileName) throw Error('file watch requires file-name!')
    if (!callback) throw Error('file watch requires callback!')
    // const fileListener = { fileName }
    // const watchFilePromise = new Promise((resolve, reject) => {
    //   fileListener.receivedContent = resolve
    // })
    _addFileListener({ fileName, callback })
    // return watchFilePromise
  }

  const cleanup = () => {
    if (fsextra.existsSync(data.tempDir)) {
      fsextra.removeSync(data.tempDir)
    }
    if (data.watch) {
      data.allFileListener = []
      data.watch.close()
      data.watch = null
    }
  }
  process.on('exit', cleanup)

  return { cleanup, watchFileContent }
}

module.exports = { createFileWatcher }
