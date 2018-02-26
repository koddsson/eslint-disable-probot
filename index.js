module.exports = (robot) => {
  // Your code here
  robot.log('Yay, the app was loaded!')

  robot.on(['pull_request.opened', 'pull_request.synchronize'], async context => {
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

    // Get the first X comments on a PR
    // TODO: Get all the comments on a PR
    const existingComments = await context.github.pullRequests.getComments({
      owner,
      repo,
      number
    })
    const commentsByBot = existingComments.data.filter(comment => comment.user.login === 'eslint-disable-watcher[bot]')
    const linesCommentedOnByBot = commentsByBot.map(comment => comment.position)

    let currentPosition = 0
    const comments = []
    // TODO: Check fileextension?
    for (const file of files.data) {
      const lines = file.patch.split('\n')
      for (const line of lines) {
        if (line.startsWith('+') && line.includes('eslint-disable')) {
          // TODO: Check if comment is hidden.
          if (!linesCommentedOnByBot.includes(currentPosition)) {
            comments.push({
              path: file.filename,
              position: currentPosition,
              body: "Please don't disable eslint rules :pray:",
            })
          }
        }
        currentPosition += 1
      }
    }

    if (comments.length) {
      await context.github.pullRequests.createReview({
        owner,
        repo,
        number,
        commit_id: context.payload.pull_request.head.sha,
        event: 'REQUEST_CHANGES',
        comments,
      })
    }
  })
}
