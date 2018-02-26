module.exports = (robot) => {
  // Your code here
  robot.log('Yay, the app was loaded!')

  robot.on('pull_request', async context => {
    const owner = context.payload.repository.owner.login
    const repo = context.payload.repository.name
    const number = context.payload.number

    // Get the first X files in a PR.
    // TODO: Get ALL files in a PR.
    const files = await context.github.pullRequests.getFiles({
      owner,
      repo,
      number,
      headers: {accept: "application/vnd.github.v3.diff"}
    });

    console.log(context.payload)

    let currentPosition = 0
    const comments = []
    for (const file of files.data) {
      const lines = file.patch.split('\n')
      console.log(lines)
      for (const line of lines) {
        if (line.startsWith('+') && line.includes('eslint-disable')) {
          console.log(`${currentPosition} ${line}`)
          // TODO: Check if there is a comment already here?
          comments.push({
            path: file.filename,
            position: currentPosition,
            body: "Please don't disable eslint rules :pray:",
          })
        }
        currentPosition += 1
      }
    }
    await context.github.pullRequests.createReview({
      owner,
      repo,
      number,
      commit_id: context.payload.pull_request.head.sha,
      event: comments.length ? 'REQUEST_CHANGES' : 'APPROVE',
      comments,
    })
  })
}
