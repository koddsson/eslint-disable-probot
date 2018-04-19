const {getResource, getPullRequestReviewCommentsQuery} = require('./graphql/queries')
const {createReviewMutation} = require('./graphql/mutations')

async function getAllLinesCommentedOnByBot (context, owner, repo, number) {
  const {repository} = await context.github.query(getPullRequestReviewCommentsQuery, {
    owner,
    name: repo,
    number
  })
  const commentsByBot = repository.pullRequest.reviews.nodes.reduce(
    (comments, review) => [...comments, ...review.comments], []
  )
  const linesCommentedOnByBot = commentsByBot.reduce(
    (positions, comment) => [...positions, ...comment.nodes], []
  ).map(p => p.position)

  return linesCommentedOnByBot
}

module.exports = (robot) => {
  robot.on(['pull_request.opened', 'pull_request.synchronize'], async context => {
    const owner = context.payload.repository.owner.login
    const repo = context.payload.repository.name
    const number = context.payload.number

    const {commentLimit, commentMessage, skipBranchMatching} = await context.config('eslint-disable-bot.yml', {
      commentLimit: 10,
      commentMessage: 'Please don\'t disable eslint rules :pray:',
      skipBranchMatching: null
    })

    // Check if we should skip this branch
    const branchName = context.payload.pull_request.head.ref
    const regex = new RegExp(skipBranchMatching)
    if (skipBranchMatching && branchName.match(regex)) {
      context.log.warn(`Skipping branch: ${branchName} because of regex ${regex}`)
      return
    }

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

      for (const file of files.data) {
        let currentPosition = 0
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
      const { resource } = await context.github.query(getResource, {
        url: context.payload.pull_request.html_url
      })
      await context.github.query(createReviewMutation, {
        pullRequestId: resource.id,
        event: 'REQUEST_CHANGES',
        comments
      })
    }
  })
}
