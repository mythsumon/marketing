// Stub for papaparse when not installed
// This allows the build to succeed even if papaparse is not installed
module.exports = {
  default: {
    parse: () => {
      throw new Error('papaparse is not installed. Please run: npm install papaparse')
    }
  },
  parse: () => {
    throw new Error('papaparse is not installed. Please run: npm install papaparse')
  }
}


