# Gitlab-CLI

This node.js application provides a command line interface to the GitLab API v3.

## Installation

Install dependencies using npm:

    npm install

Create a symlink to the bin/cli.js in your bin/ folder(s)

    ln -s bin/cli.js ~/bin/gitlab


## Usage

    gitlab Action [Resource] [Options]

To get a list of available commands

    gitlab --help


## Help

    Resource:
      Is the relative url to the resource.

      Examples:
        foo/bar/issue for issues in the namespace 'foo' and the project 'bar'
        foo/bar/issue/12 for issue with id 12 in namespace 'foo' and the project 'bar'

    Actions:
      get RESOURCE            Gets resource
      list RESOURCE           Lists resource
      create RESOURCE         Creates resource
      remove RESOURCE         Deletes resource
      update RESOURCE         Updates existing resource
      close RESOURCE          Closes an issue
      open RESOURCE           Opens an issue
      comment RESOURCE        Comments an issue
      alias RESOURCE ALIAS    Create a resource alias to prevent retyping long resource paths
      rm-alias ALIAS          Removes an existing alias
      list-aliases            Lists all aliases

    Options:
      -h --help               Display this help
      -m 'MESSAGE'            Adds a message (first line will be treated as title other lines as body)
      -u --user USERNAME      User to assign the issue to, default is "me" (use "me" to assign to user defined in environment)
      -l --labels tag1,tag2   Comma separated list of labels
      -f --filter attr=value  Filter results by value of a property
      --json                  Output all data as JSON
      --env ENVIRONMENT       Environment to use under /config/. If not set will use the 'default' environment.
