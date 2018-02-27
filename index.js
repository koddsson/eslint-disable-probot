async function getAllLinesCommentedOnByBot(context, owner, repo, number) {
  let linesCommentedOnByBot = []
  let page = 0
  while (true) {
    const existingComments = await context.github.pullRequests.getComments({
      owner,
      repo,
      number,
      page,
      per_page: 100
    })
    const commentsByBot = existingComments.data.filter(comment => comment.user.login === 'eslint-disable-watcher[bot]')
    linesCommentedOnByBot = linesCommentedOnByBot.concat(commentsByBot.map(comment => comment.position))
    page += 1
    if (existingComments.data.length < 100) break
  }
  return linesCommentedOnByBot
}

module.exports = (robot) => {
  robot.on(['pull_request.opened', 'pull_request.synchronize'], async context => {
    const owner = context.payload.repository.owner.login
    const repo = context.payload.repository.name
    const number = context.payload.number
    
    // TODO: Read this from config
    const commentLimit = 10
    const commentMessage = 'Please don\'t disable eslint rules :pray:'
    
    // Find all the comments on the PR to make sure we don't comment on something we have already commented on.
    const linesCommentedOnByBot = await getAllLinesCommentedOnByBot(context, owner, repo, number)

    const comments = []
    let page = 0
    while (true) {
      const files = await context.github.pullRequests.getFiles({
        owner,
        repo,
        number,
        headers: {accept: 'application/vnd.github.v3.diff'},
        page,
        per_page: 100
      })
      
      let currentPosition = 0
      for (const file of files.data) {
        if (!file.filename.endsWith('.js')) return
        
        // In order to not spam the PR with comments we'll stop after a certain number of comments
        if (comments.length > commentLimit) return
        
        const lines = file.patch.split('\n')
        for (const line of lines) {
          if (line.startsWith('+') && line.includes('eslint-disable')) {
            if (!linesCommentedOnByBot.includes(currentPosition)) {
              comments.push({
                path: file.filename,
                position: currentPosition,
                body: commentMessage
              })
            }
          }
          // We need to keep a running position of where we are in the file so we comment on the right line
          currentPosition += 1
        }
      }
      page += 1
      
      
      if (files.data.length < 100 || comments.length >= commentLimit) break
    } 

    // Only post a review if we have some comments
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
