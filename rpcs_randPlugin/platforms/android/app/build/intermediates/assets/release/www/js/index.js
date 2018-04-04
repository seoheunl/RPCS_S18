/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */




var blefruitAddress = "EC:22:E4:36:2E:92";
var uartServiceUuid;
var uartCharacteristicUuid;
var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');
        var params = {
          "request": true,
          "statusReceiver": false,
          "restoreKey" : "bluetoothleplugin"
        }

        function startScanning (){
             var params2 = {
              "services": [
                
              ],
              "allowDuplicates": false,
              "scanMode": bluetoothle.SCAN_MODE_LOW_LATENCY,
              "matchMode": bluetoothle.MATCH_MODE_AGGRESSIVE,
              "matchNum": bluetoothle.MATCH_NUM_MAX_ADVERTISEMENT,
              "callbackType": bluetoothle.CALLBACK_TYPE_ALL_MATCHES,
            }
            bluetoothle.startScan(function(s){
                if (s.status === "scanStarted"){
                    alert("scanStarted");
                }else if (s.status === "scanResult"){
                    if (s.address == blefruitAddress){
                        alert("got blefruit " + s.name);
                    }
                }
            }, function(e){
                alert("error " + e);
            }, params2);
        }

        bluetoothle.initialize(function(status){
            console.log(status);
            bluetoothle.isLocationEnabled(function(s){
                console.log("location " + s.isLocationEnabled);
            }, function (s){
                console.log("location " + s.isLocationEnabled);
            });
            bluetoothle.hasPermission(function(s){
                alert("hasPermission " + s.hasPermission);
                // startScanning();
                var connectParams = {
                  "address": blefruitAddress
                };
                bluetoothle.connect(function(s){
                    alert("connect success");
                    var servicesParams = {
                      "address": blefruitAddress,
                      "services": [

                      ]
                    };

                    var discoverParams = {
                      "address": blefruitAddress,
                      "clearCache": true
                    };

                    bluetoothle.discover(function(s){
                        alert("discovered");
                        for (var i = 0; i < s.services.length; i++){
                            if (s.services[i]["uuid"].charAt(0) == "6"){
                                uartServiceUuid = s.services[i]["uuid"];
                                uartCharacteristicUuid = s.services[i]["characteristics"][0]["uuid"];

                                var readParams = {
                                  "address": blefruitAddress,
                                  "service": uartServiceUuid,
                                  "characteristic": uartCharacteristicUuid
                                };

                                bluetoothle.subscribe(function(s){
                                    if (s.status  == "subscribed"){
                                        alert("subscribe success " + s.status);
                                    }else {
                                        var bytes = bluetoothle.encodedStringToBytes(s.value);
                                        var stringResult = bluetoothle.bytesToString(bytes); //This should equal Write Hello World
                                        alert("subscribe success " + s.status + " " + stringResult);
                                    }
                                }, function(e){
                                    alert("subscribe failed ");
                                }, readParams);

                                // bluetoothle.read(function(s){
                                //     alert("read success ");
                                // }, function(e){
                                //     alert("read failed " + e.error + " " + e.message);
                                // }, readParams);
                            }
                        }

                        // bluetoothle.services(function(s){
                        //     alert(s.services.toString());
                        // }, function(e){
                        //     alert("service failed " + e.error + " " + e.message);
                        // }, servicesParams);

                        // bluetoothle.read(function(s){
                        //     alert("read success ");
                        // }, function(e){
                        //     alert("read failed " + e.error + " " + e.message);
                        // }, readParams);

                    }, function(e){
                        alert("discover failed")
                    }, discoverParams);

                }, function(e){
                    alert("connect failed " + e.error + " " + e.message);
                }, connectParams);
            });
            bluetoothle.requestPermission(function(s){
                alert("request permission success " + s.requestPermission);
                
            }, function(e){
                console.log("request permission failed " + e.requestPermission);
            });
        }, params);
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

app.initialize();