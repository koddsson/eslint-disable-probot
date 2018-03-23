# eslint-disable-bot

> A GitHub App built with [probot](https://github.com/probot/probot) that comments on pull requests that try to disable eslint rules.

![screen shot 2018-02-26 at 22 38 10](https://user-images.githubusercontent.com/318208/36699828-d1a92b82-1b45-11e8-9a4d-91da0852d7da.png)

## Usage

Simply [install the app](https://github.com/apps/eslint-disable-watcher) and the bot will keep 👀 on PRs that have `eslint-disable` comments.

## How it works

When a PR is opened or updated, the ESLint Disable Watcher will scan through the diffs of JavaScript files and comment if the PR is adding any strings containing `eslint-disable`.

## Configuration

You don't need any configuration for this to work in your project but you can customize a few things to fit your needs. You can create a `.github/eslint-disable-bot.yml` file:

```yml
# Change this to set the number of comments the watcher should comment on a given PR.
commentLimit: 10
# The message the bot will post on any lines containing a eslint disable comment.
commentMessage: Please don't disable eslint rules :pray:
# A optional regular expression that will match against the branch name and not comment on it if it matches.
skipBranchMatching: null
```

If you need more configuration, please [let me know in a new issue](https://github.com/koddsson/eslint-disable-probot/issues/new?title=[Config]&body=Can%20you%20please%20add%20the%20___%20config%20option).


## Development setup

```
# Install dependencies
npm install

# Run the bot
npm start
```
