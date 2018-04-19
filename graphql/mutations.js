const createReviewMutation = `
  mutation review($pullRequestId: ID!, $event: PullRequestReviewEvent!, $comments: [DraftPullRequestReviewComment]!) {
    addPullRequestReview(input: {pullRequestId: $pullRequestId, event: $event, comments: $comments}) {
      pullRequestReview {
        id
      }
    }
  }
`

module.exports = {
  createReviewMutation
}
