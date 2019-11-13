import React from 'react' 
import SpotifyWebApi from 'spotify-web-api-js'
const spotifyApi = new SpotifyWebApi()
import SpotifyCtrl from 'spotify_ctrl'

/* MSB: This is the spotify component; it simply renders the album art
 * for the current playlist.  Most of the state and API calls are in 
 * spotify_ctrl.js
 */
export default class Spotify extends React.Component{
  constructor(props){
    super(props)
    this.spotifyCtrl = new SpotifyCtrl()

    this.interval = null;
    this.state = {
      loggedIn: token ? true : false,
      nowPlaying: { name: 'Not Checked', albumArt: '', uri: '' },
    }
    this.getPlaying = this.getPlaying.bind(this);
  }

  getPlaying() {
      this.spotifyCtrl.getPlaying().then(() => {
          clearInterval(this.interval);
          this.interval = setInterval(this.getPlaying,
                                      this.spotifyCtrl.timeRemaining);
          this.setState({nowPlaying: this.spotifyCtrl.nowPlaying});
      });
  }

  componentDidMount(){
    this.getPlaying();
  }

  render(){
    return(
      <div className="spotify-div">
        <div>
          <a href="http://localhost:8888">Link to Spotify</a>
          <div>{this.state.nowPlaying.name}</div>
          <img alt="album art" src={this.state.nowPlaying.albumArt}
               style={{height: '150px', width: '150px'}}/>
        </div>
      </div>
    );
  }
}
