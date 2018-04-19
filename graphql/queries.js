const getPullRequestReviewCommentsQuery = `
  query getPullRequestReviewComments($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        reviews(first: 100, author:"eslint-disable-watcher[bot]") {
          nodes {
            comments(first: 100) {
              nodes {
                position
              }
            }
          }
        }
      }
    }
  }
`

const getResource = `
  query getResource($url: URI!) {
    resource(url: $url) {
      ... on Node {
        id
      }
    }
  }
`

module.exports = {
  getPullRequestReviewCommentsQuery,
  getResource
}
