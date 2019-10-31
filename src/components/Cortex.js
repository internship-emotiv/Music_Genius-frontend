import React from "react";
import Websocket from "react-websocket";
import { Button } from "reactstrap"
import Spotify from './Spotify'

export default class Cortex extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            token: "", //storing cortext token for authentication
            method: "", //storing the last request method so we know how to handle the response
            headset: "", //storing the headset id
            connected: false,
            id_sequence: 1,  // sequence for websocket calls
            callbacks: {},  // keys are id_sequence, values are callbacks
            session_id: "",
            session_connected: false,
            all_streams: ["eeg", "mot", "dev", "pow", "met", "com",  "fac", "sys"],
            eng: "",
            exc: "",
            str: "",
            rel: "",
            int: "",
            foc: ""
          };

        this.handleData = this.handleData.bind(this);
    }

    handleOpen() {
        console.log("[DEBUG] connected");
    }

    sendMessage(msg, callback){

        let id = this.state.id_sequence;
        this.state.id_sequence += 1;
        this.state.callbacks[id] = callback;
        //console.log(msg);
        this.refWebSocket.sendMessage(JSON.stringify(msg));
    }

    sendHello(){
           // Grab the current id_sequence and increment
        //    let id = this.state.id_sequence;
        //    this.state.id_sequence += 1;
        //    this.state.callbacks[id] = this.hello_callback;  // set up our callback
        let msg = {
            "jsonrpc": "2.0",
            "method": "getCortexInfo",
            "id":this.state.id_sequence
            }
        // this.refWebSocket.sendMessage(JSON.stringify(msg));
            this.sendMessage(msg, this.hello_callback);
    }

    hello_callback = (data) => {
        console.log("Running callback for sendHello()");
        console.log(data);

        // remove callback from callbacks object
        delete this.state.callbacks[data.id];

    }


    getUserLogin(){
       let msg = {
            "jsonrpc": "2.0",
            "method": "getUserLogin",
            "id":this.state.id_sequence
            }
        this.sendMessage(msg, this.userLogin_callback);
    }

    userLogin_callback = (data) => {
        console.log("Running callback for userLogin()");
        console.log(data);

        // remove callback from callbacks object
        delete this.state.callbacks[data.id];
        this.getRequestAccess();
    }

    getRequestAccess(){
         let msg = {
            "id":this.state.id_sequence,
            "jsonrpc": "2.0",
            "method": "requestAccess",
            "params": {
                "clientId": "zrTtgE4m4XN2z74UC5wRXOMEfqqtT20glr0rJf08",
                "clientSecret": "UyNffuiGrWOIUJfrUrqJeiAbVAsgNm7Tyw58AVbYkKEGI4l5MPzKo56K0vvuoWOjgujx5YNoc6CcJvZxOxgICsAjwsy63AF4gfvq9a68fdvY4YgOzafRXeqjWwAbYymK"
            }
        }

        this.sendMessage(msg, this.requestAccess_callback);
    }

    requestAccess_callback = (data) => {
        console.log("[DEBUG] Requesting access... please check your cortext app!");
        console.log(data);

        // remove callback from callbacks object
        delete this.state.callbacks[data.id];
        this.getAuthentication();
    }

    getAuthentication(){
        let msg = {
            "id":this.state.id_sequence,
            "jsonrpc": "2.0",
            "method": "authorize",
            "params": {
                "clientId": "zrTtgE4m4XN2z74UC5wRXOMEfqqtT20glr0rJf08",
                "clientSecret": "UyNffuiGrWOIUJfrUrqJeiAbVAsgNm7Tyw58AVbYkKEGI4l5MPzKo56K0vvuoWOjgujx5YNoc6CcJvZxOxgICsAjwsy63AF4gfvq9a68fdvY4YgOzafRXeqjWwAbYymK"
            }
        }

        this.sendMessage(msg, this.authentication_callback);
    }

    authentication_callback = (data) => {
        console.log("Running callback for authentication()");
        console.log(data);
        this.state.token = data.result.cortexToken;
        console.log("[DEBUG] received token = " + this.state.token)


        // remove callback from callbacks object
        delete this.state.callbacks[data.id];
        this.queryHeadsets();
    }

    queryHeadsets(){
        let msg = {
            "id": this.state.id_sequence,
            "jsonrpc": "2.0",
            "method": "queryHeadsets",
            "params": {
                "id": "EPOC-*"
            }
        };
        this.sendMessage(msg, this.queryHeadsets_callback);
    }

    queryHeadsets_callback = (data) => {
        console.log("Running callback for queryHeadset()");
        console.log(data);
        if (data.result.length > 0){
            this.state.headset = data.result[0].id;
            console.log("[DEBUG] headset id is: " + this.state.headset);
        } else{
            this.state.headset = "";
            console.log("[DEBUG] no headsets found");
        }
        // remove callback from callbacks object
        delete this.state.callbacks[data.id];
        this.connectHeadset();


    }

    connectHeadset(){

        if (this.state.headset !== "")
        {
            let msg = {

                    "id": this.state.id_sequence,
                    "jsonrpc": "2.0",
                    "method": "controlDevice",
                    "params": {
                        "command": "connect",
                        "headset": this.state.headset
                    }
                };
            this.sendMessage(msg, this.controlDevice_callback);
        }
    }

    disconnectHeadset(){
        if (this.state.connected === true){ //check if app is actually connected

            if (this.state.headset !== "")
            {
                let msg = {

                        "id": this.state.id_sequence,
                        "jsonrpc": "2.0",
                        "method": "controlDevice",
                        "params": {
                            "command": "disconnect",
                            "headset": this.state.headset
                        }
                    };
                this.sendMessage(msg, this.controlDevice_callback);
            }
        } else {
            console.log("Already disconnected, please connect first!")
        }
    }

    controlDevice_callback = (data) => {
        console.log("Running callback for connest and disconnet()");
        console.log(data);
        if (data.result.command === "connect"){
            console.log("connected!!!");
            this.state.connected = true;
        } else if (data.result.command === "disconnect"){
            console.log("disconnected. :(");
            this.state.connected = false;
        } else { //refresh
            console.log("refresh request was called, not sure what we do with that.")
        }

        // remove callback from callbacks object
        delete this.state.callbacks[data.id];
    }
    startSession(){
        let msg = {
            "id":this.state.id_sequence,
            "jsonrpc": "2.0",
            "method": "createSession",
            "params": {
                "cortexToken": this.state.token,
                "headset": this.state.headset,
                "status": "active"
            }
        };

        this.sendMessage(msg, this.startSession_callback); 


    }

    startSession_callback = (data) => {

        console.log("Running callback for startSession()");
        console.log(data);
        if (data.error){
            console.log("error starting session: " + data.error.message);
        } else {
            this.state.session_id = data.result.id;
            this.state.session_connected = true;
            console.log(`Session id is ${this.state.session_id}`);
            this.subscribe();
        }
        delete this.state.callbacks[data.id];
    }

    // querySession(){
    //     let id = this.state.id_sequence;
    //         this.state.id_sequence += 1;
    //         this.state.callbacks[id] = this.querySession_callback;
    //     let msg = {
    //         "id":this.state.id_sequence,
    //         "jsonrpc": "2.0",
    //         "method": "querySessions",
    //         "params": {
    //             "cortexToken": this.state.token
    //         }
    //     };
    //     this.refWebSocket.sendMessage(JSON.stringify(msg));
    // }

    // querySession_callback = (data) => {

    //     console.log("Running callback for querySession()");
    //     console.log(data);
    // delete this.state.callbacks[data.id];
    // }

    closeSession(){
        if (this.state.session_connected === true){
        let msg = {
            "id":this.state.id_sequence,
            "jsonrpc": "2.0",
            "method": "updateSession",
            "params": {
                "cortexToken": this.state.token,
                "session": this.state.session_id,
                "status": "close"
    }

         };
        this.sendMessage(msg, this.closeSession_callback);


   
      

    } else {
        console.log("There is currently no active session");
    }
}

    closeSession_callback = (data) => {
        console.log("Running callback for closeSession()");
        console.log(data);

        this.state.session_connected = false;
        delete this.state.callbacks[data.id];
    }
// streams has default value of all streams; if user does not specify streams, all_streams will be subscribed
    subscribe(streams = this.state.all_streams){
        if (this.state.connected === true && this.state.session_connected === true){
        let msg = {
                "id":this.state.id_sequence,
                "jsonrpc": "2.0",
                "method": "subscribe",
                "params": {
                    "cortexToken": this.state.token,
                    "session": this.state.session_id,
                    "streams": streams
                }
            };
            this.sendMessage(msg, this.subscribe_callback);
    }

}
subscribe_callback = (data) => {
    console.log("Running callback for subscribe()");
    console.log(data);
    delete this.state.callbacks[data.id];
}

unsubscribe(){
    if (this.state.connected === true && this.state.session_connected === true){
    let msg = {
            "id":this.state.id_sequence,
            "jsonrpc": "2.0",
            "method": "unsubscribe",
            "params": {
                "cortexToken": this.state.token,
                "session": this.state.session_id,
                "streams": this.state.all_streams
            }
        };
        this.sendMessage(msg, this.unsubscribe_callback);
}

}
unsubscribe_callback = (data) => {
console.log("Running callback for unsubscribe()");
console.log(data);
delete this.state.callbacks[data.id];
}

    handleData(data) {
        // console.log(this.state.method);
        let result = JSON.parse(data);
        console.log(result);
        if (result.id){
            // call the registered callback
            console.log("executing callback for id = " + result.id);
            this.state.callbacks[result.id](result);
        }
        if (this.state.connected === true && this.state.session_connected === true && result.met !== undefined){
          return this.state.eng.push(result.met[1])
        }
    }

    render() {
        return (
            <div>

                <Websocket
            url="wss://localhost:6868"
            onMessage={this.handleData}
            onOpen={this.handleOpen}
            debug={true}
            ref={Websocket => {
                this.refWebSocket = Websocket;
            }}
            />
             {/* this is just for test connecting to api
             <Button onClick={() => this.sendHello()}>Get Info</Button> */}
             <Button onClick={() => this.getUserLogin()}>Connect Headset</Button>
             {/* <Button onClick={() => this.getRequestAccess()}>Request Access</Button>
             <Button onClick={() => this.getAuthentication()}>Authorize</Button>
             <br>
             </br>

             <Button onClick={() => this.queryHeadsets()}>Find Headset</Button>
             <br>
             </br> */}

             {/* <Button onClick={() => this.connectHeadset()}>Connect Headset</Button> */}
             <Button onClick={() => this.disconnectHeadset()}>Disconnect Headset</Button>
            <br>
            </br>
            <Button onClick={() => this.startSession()}>Start Session</Button>
            <Button onClick={() => this.closeSession()}>End Session</Button>
             <h2>Set your sensitivity level</h2>

             <Button>Sensitivity Nob</Button>
             <Spotify eng={this.state.eng} exc={this.state.exc} str={this.state.str} rel={this.state.rel} int={this.state.int} foc={this.state.foc}/>
            </div>
        )
    };
}
