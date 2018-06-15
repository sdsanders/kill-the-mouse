const { ipcRenderer } = require('electron')

// start up heath-check
ipcRenderer.on('asynchronous-reply', (event, arg) => {
  console.log(arg) // prints "pong"
})
ipcRenderer.send('asynchronous-message', 'ping')

// front end
const React = require('react');
const ReactDOM = require('react-dom');
const moment = require('moment');

class MainComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentStreak: 0,
      streaks: [],
      minStreak: 10,
    };

    this.handleMinStreakChange = this.handleMinStreakChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.quit = this.quit.bind(this);
    ipcRenderer.on('current-streak', this.currentStreak.bind(this));
    ipcRenderer.on('streak-broken', this.streakBroken.bind(this));
  }

  handleMinStreakChange(event) {
    this.setState({ minStreak: event.target.value });
  }

  handleSubmit(event) {
    event.preventDefault();
    ipcRenderer.send('min-streak', this.state.minStreak);
  }
  currentStreak(event, arg) {
    this.setState(() => ({ currentStreak: arg }))
  }
  streakBroken(event, arg) {
    // const { keystrokes, duration, timestamp } = arg
    this.setState(() => ({
      streaks: [
        ...this.state.streaks,
        arg
      ]
    }));
  }
  quit() {
    ipcRenderer.send('quit', true);
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <label>
            minimum keystrokes for notification: 
            <input type="number" value={this.state.minStreak} onChange={this.handleMinStreakChange} style={{width: 80}} />
          </label>
          <input type="submit" value="Set" />
        </form>
        <div>current streak: {this.state.currentStreak}</div>
        <div>
          <ul>
            {this.state.streaks &&
              this.state.streaks.length >= 1
              ? (
                <div>
                  {this.state.streaks.sort((a, b) =>  b.keystrokes - a.keystrokes )
                    .map((streak, index) => {
                      return (
                        <li key={index}>
                          {streak.keystrokes} keys, {streak.duration}.  {moment(streak.timestamp).format("ddd, hA")}
                        </li>
                      )
                    })}
                </div>
              ) : null}
          </ul>
        </div>
        <button onClick={this.quit}>quit</button>
      </div>
    )
  }
}

ReactDOM.render(<MainComponent />, document.getElementById('container'));