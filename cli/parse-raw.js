const State = {
  COMMIT: 'commit',
  TREE: 'tree',
  PARENT: 'parent',
  AUTHOR: 'author',
  COMMITTER: 'commiter',
  BODY_OPEN: 'body_open',
  BODY: 'body',
  BODY_CLOSE: 'body_close',
  SHORTSTAT: 'shortstat',
};

const fs = require('fs');

class Parser {

  constructor() {
    this.state = State.COMMIT;
    this.revisions = [];
    this.rev = null;
  }

  read(line) {
    switch (this.state) {
      case State.COMMIT:
        this.rev = {
          parents: [],
          body: '',
        }
        this.rev.commit = shaMatch(line, /commit\s([a-f0-9]{40})/);
        this.state = State.TREE;
        break;

      case State.TREE:
        this.rev.tree = shaMatch(line, /tree\s([a-f0-9]{40})/);
        this.state = State.PARENT;
        break;

      case State.PARENT:
        try {
          const parent = shaMatch(line, /parent\s([a-f0-9]{40})/);
          this.rev.parents.push(parent);
        } catch(e) {
          this.state = State.AUTHOR;
          this.read(line);
        }
        break;

      case State.AUTHOR:
        const author = shaMatch(line, /author\s(.*)/);
        this.rev.author = {
          raw: author,
          ...parseName(author),
        }
          
        this.state = State.COMMITTER;
        break;

      case State.COMMITTER:
        const committer = shaMatch(line, /committer\s(.*)/);
        this.rev.committer = {
          raw: committer,
          ...parseName(committer),
        };
        this.state = State.BODY_OPEN;
        break;

      case State.BODY_OPEN:
        this.state = State.BODY;
        break;
      
      case State.BODY:
        if (line === '') {
          this.state = State.BODY_CLOSE;
          // could be shortstat afterwards
          this.revisions.push(this.rev);
        } else {
          this.rev.body += line.substr(4) + "\n";
        }
        break;

      case State.BODY_CLOSE:
        this.state = State.COMMIT;
        this.read(line);
        break;
    }
  }
}

function shaMatch(line, regex) {
  let match = line.match(regex);
  if (match) {
    return match[1];
  } else {
    throw new Error(`Bad line: ${line}`);
  }
}

function parseName(line) {
  const lessThan = line.indexOf("<");
  const greaterThan = line.indexOf(">");

  const name = line.substr(0, lessThan - 1);
  const email = line.substr(lessThan + 1, greaterThan - lessThan - 1);
  const date = line.substr(greaterThan + 2);
  return {
    name,
    email,
    date,
  };
}

function main() { 
  const input = process.argv.length == 3
    ? fs.createReadStream(process.argv[2])
    : process.stdin;

  let lingeringLine = '';

  const parser = new Parser();
    
  input.on('data', (chunk) => {
    const lines = `${chunk}`.split("\n");

    lines[0] = lingeringLine + lines[0];
    lingeringLine = lines.pop();

    lines.forEach((line) => parser.read(line));
  });
  input.on('end', function() {
    parser.read(lingeringLine);
    console.log(JSON.stringify(parser.revisions));
  });
}

main();
