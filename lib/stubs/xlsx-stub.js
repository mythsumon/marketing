// Stub for xlsx when not installed
// This allows the build to succeed even if xlsx is not installed
module.exports = {
  read: () => {
    throw new Error('xlsx is not installed. Please run: npm install xlsx')
  },
  utils: {
    sheet_to_json: () => {
      throw new Error('xlsx is not installed. Please run: npm install xlsx')
    }
  }
}


