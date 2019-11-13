import SpotifyWebApi from 'spotify-web-api-js'
const spotifyApi = new SpotifyWebApi()

export default class Spotify {
  constructor(cortexCallback){
    const token = getHashParams().access_token;

    this.user_playlists = [];
    this.cortexCallback = cortexCallback;
    this.nowPlaying: { name: 'Not Checked', albumArt: '', uri: '' };
    this.timeRemaining = 0;
    this.userId: "";
    this.playlistId: "";
    this.currentPlaylist: "";
    this.playlistSongs: [];
    this.error: null;
    this.search: "";
    // int is a keyword, so I changed it to intt
    // also I made each entry an object so we can store both name and ID
    this.playlists: {foc: {}, str: {}, eng: {}, exc: {}, intt: {}, rel: {}},

    this.getPlaying = this.getPlaying.bind(this);
    this.getUserPlaylists = this.getUserPlaylists.bind(this);
    this.setUpSpotify = this.setUpSpotify.bind(this);

    if(token){
      this.setUpSpotify();
    }

  }

  //returns both request and access tokens
  getHashParams(){
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g;
    var q = window.location.hash.substring(1);
    e = r.exec(q)
    while(e){
      hashParams[e[1]] = decodeURIComponent(e[2]);
      e= r.exec(q);
    }
    return hashParams
  }

  /* Call this after the user logs in to Spotify to set everything up */
  setUpSpotify() {
      const token = getHashParams().access_token;
      spotifyApi.setAccessToken(token);
      this.user_playlists = getUserPlaylists();
  }

  /* Grab the user's playlists and store them locally for use later */
  getUserPlaylists() {
    spotifyApi.getUserPlaylists(this.userId, {limit: 50}).then((resp)=>{
      console.log(resp.items)
      this.user_playlists = resp.items.map(function(item) {
          return { item.name : item.id }
      });
      return resp
    });

  handleCortexCommand(command){
    console.log("[Spotify] received message: " + command)

    if(command.startsWith('add')) { 
        let plName = command.substring(3);  //strip the add
        console.log("adding to pl " + plName);
        this.addPlaylist(plName);
    }
    else if (command === "skip"){  // MSB: note added "else" to make it faster
      this.skipSong();
    }
  }

  tellCortex = (command) => {
    console.log("[Spotify] sending: " + command)
    this.cortexCallback(command);
  }

  getPlaying(){
    spotifyApi.getMyCurrentPlaybackState()
    .then((resp)=>{
      var str = resp.item.uri
      var song = resp.item.uri
      this.nowPlaying = {
          name: resp.item.name,
          albumArt: resp.item.album.images[0].url,
          userId: resp.device.id,
          uri: song};
      this.currentPlaylist = str.substring(str.indexOf("playlist:") + 9)
      this.timeRemaining = resp.item.duration_ms - resp.progress_ms + 2000

      console.log(resp);
    })
    .catch((error)=> {this.error = error})
  }

  setPlaylist(metric_name){
    console.log("setting playlist for ", metric_name);
    console.log("existing playlist = " + this.playlists[metric_name]);
      
    /* Still only handles exact matches :( */
    let target_pl = this.user_playlists[this.search];

    this.playlists[plName].id = target_pl;
    this.playlists[plName].name = this.search;
                    
    console.log(fullPlaylist.id)
    console.log(songNames)
    console.log(playlistNames)
    console.log(this.search)
  }

  skipSong(){
    spotifyApi.skipToNext();
    this.tellCortex("reset");
    return this.getPlaying();
  }

  prevSong(){ 
    spotifyApi.skipToPrevious();
    this.tellCortex("reset");
      return this.getPlaying();
  }

  addSongToPlaylist(){
    // console.log("current playlist = " + this.state.playlistID)
    // if (this.state.playlistId === ""){ //no current playlist, make a new one
    //   spotifyApi.getMe().then(function(data) {
    //     console.log(data.id)
    //     return data.id;
    //   })
    //   console.log("user id = " + this.state.userId)
    //   console.log(this.createNewPlaylist(this.state.userId, "music_genius"))
    // }

    // return spotifyApi.addTracksToPlaylist("5TOheLold9VEiIUcljAQlK",  [this.state.nowPlaying.uri])
    console.log("doing some spotify playlist add stuff...")
  }

  addPlaylist(metric_name) {
      console.log("Adding to ", metric_name, "playlist: ",
                  this.playlists[metric_name].name);
      return spotifyApi.addTracksToPlaylist(this.playlists[metric_name].id,
                                            [this.nowPlaying.uri]);
  }

  createNewPlaylist(userId=this.userId, playListName=this.search){
    spotifyApi.createPlaylist(userId, { name: playListName})
    .then((resp)=>{
      console.log(resp)
    })
    .catch((error)=> {this.error=error})
  }
  
  getUserId(){
    spotifyApi.getMe()
    .then((resp)=>{
      console.log(resp.display_name);
      this.userId = resp.display_name;
    })
    .catch((error) => { this.error = error})
  }

  playlistTracks(){
    spotifyApi.getPlaylistTracks("5TOheLold9VEiIUcljAQlK")
    .then((resp)=>{
      resp.items.map((song)=>{
        return this.playlistSongs.push(song.track.name)
      })
    })
    .catch((error) => {this.error = error})
  }
}
