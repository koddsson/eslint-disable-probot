module.exports = (robot) => {
  robot.on(['pull_request.opened', 'pull_request.synchronize'], async context => {
    const owner = context.payload.repository.owner.login
    const repo = context.payload.repository.name
    const number = context.payload.number

    // TODO: We are currently just sticking everything into memory. We should do this in a smarter way.

    let files = []
    let tempFiles
    do {
      tempFiles = await context.github.pullRequests.getFiles({
        owner,
        repo,
        number,
        headers: {accept: 'application/vnd.github.v3.diff'},
        per_page: 100
      })
      files = files.concat(tempFiles.data)
    } while (tempFiles.data.length === 100)

    let commentsByBot = []
    let existingComments
    do {
      existingComments = await context.github.pullRequests.getComments({
        owner,
        repo,
        number,
        per_page: 100
      })
      commentsByBot = commentsByBot.concat(existingComments.data.filter(comment => comment.user.login === 'eslint-disable-watcher[bot]'))
    } while (existingComments.data.length === 100)
    const linesCommentedOnByBot = commentsByBot.map(comment => comment.position)

    let currentPosition = 0
    const comments = []
    for (const file of files) {
      // TODO: Read this from config
      if (!file.filename.endsWith('.js')) return
      // In order to no spam the PR with comments we'll stop after a certain number of comments
      // TODO: Read this from config
      if (comments.length > 10) return
      const lines = file.patch.split('\n')
      for (const line of lines) {
        if (line.startsWith('+') && line.includes('eslint-disable')) {
          if (!linesCommentedOnByBot.includes(currentPosition)) {
            comments.push({
              path: file.filename,
              position: currentPosition,
              // TODO: Read this from config
              body: 'Please don\'t disable eslint rules :pray:'
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
        comments
      })
    }
  })
}
