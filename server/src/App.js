import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    console.log('nit');
    return (
      <div className="App">
        <textarea onChange={(e) => {
            this.setState({ value: e.value })
          }} ref="json" />
        {this.renderLog()}
      </div>
    );
  }

  renderLog() {
    if (!this.refs.json) {
      return;
    }

    const value = this.refs.json.value;
    if (!value || value === '') {
      return;
    }

    let json = null;
    try {
      json = JSON.parse(value);
    } catch (error) {
      console.log(error);
      return null;
    }

    const revisions = json.map((rev) => {
      let posFirstNewLine = rev.body.indexOf("\n");
      if (!posFirstNewLine) {
        posFirstNewLine = -1;
      }

      let firstLine = rev.body.substr(0, posFirstNewLine);
      let pullRequestMatch = firstLine.match(/#[0-9]+/);
      let pullRequest = pullRequestMatch
        ? pullRequestMatch[0]
        : null;

      const ticketsMatch = firstLine.match(/\[.+?\]/g)
      let kanbanize = [];
      let jira = [];
      if (ticketsMatch) {
        ticketsMatch.map((uncleanCode) => {
          const code = uncleanCode.substr(1, uncleanCode.length - 2);

          if (code.match(/^[0-9]+$/)) {
            kanbanize.push(code);
          } else if (code.match(/^[a-z]+-/i)) {
            jira.push(code);
          }
        });
      }


      return {
        commit: rev.commit,
        summary: firstLine,
        author: rev.author,
        pullRequest,
        kanbanize,
        jira,
      };
    });

    const rows = revisions.map((rev, index) => {
      const shortSha = rev.commit.slice(0, 8);

      let pullRequestURI = null;
      let pullRequest = null;
      
      if (rev.pullRequest) {
        pullRequestURI = `https://github.com/mulesoft/authentication-server/pull/${rev.pullRequest.substr(1)}`;
        pullRequest = <a href={pullRequestURI}>{rev.pullRequest}</a>
      }

      const jira = rev.jira.map((code) => {
        return <a key={code} href={`https://www.mulesoft.org/jira/browse/${code}`}>{code}</a>;
      });

      const kanbanize = rev.kanbanize.map((code) => {
        return <a key={code} href={`https://mulesoft.kanbanize.com/ctrl_board/3/cards/${code}/details`}>{code}</a>;
      });

      let commitURI = `https://github.com/mulesoft/authentication-server/commit/${rev.commit}`;

      return (
        <tr key={rev.commit}>
          <td>{index + 1}</td>
          <td><a href={commitURI}>{shortSha}</a></td>
          <td>{pullRequest}</td>
          <td>{jira}</td>
          <td>{kanbanize}</td>
          <td style={{textAlign: 'left'}}>{rev.summary}</td>
          <td style={{textAlign: 'left'}}>{rev.author.name}</td>
        </tr>
      );
    });

    return (
      <table>
        <thead>
          <tr>
            <th />
            <th>Commit</th>
            <th>Pull Request</th>
            <th>Jira</th>
            <th>Kanbanize</th>
            <th>Summary</th>
            <th>Author</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    );
  }

}

export default App;
