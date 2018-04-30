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




// var blefruitAddress = "EC:22:E4:36:2E:92";
// var blefruitAddress = "F2:28:46:DC:4F:9E"; //custom brace;
var blefruitAddress = "E4:B5:55:89:9A:A8"; //sensor team
var uartServiceUuid;
var uartCharacteristicUuid;
var readParams;
var postureGood = true;

var connectParams = {
    "address": blefruitAddress
};
// The function is used for standard SQL database datetime format (subject to change)
// "2018-04-25T15:03:51"
function getDateTime() {
    var now     = new Date();
    var year    = now.getFullYear();
    var month   = now.getMonth()+1;
    var day     = now.getDate();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds();
    if(month.toString().length == 1) {
        var month = '0'+month;
    }
    if(day.toString().length == 1) {
        var day = '0'+day;
    }
    if(hour.toString().length == 1) {
        var hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
        var minute = '0'+minute;
    }
    if(second.toString().length == 1) {
        var second = '0'+second;
    }
    var dateTime = year+'/'+month+'/'+day+' '+hour+':'+minute+':'+second;
    return dateTime;
}

function disconnect(){
    bluetoothle.unsubscribe(function(s){
        aler("unsubscribe success " + s);
    }, function(e){
        aler("unsubscribe failed " + e);
    }, readParams);
    bluetoothle.close(function (s){
        alert("close success " + s);
    }, function (e){
        alert("close failed " + e);
    }, connectParams);
}

function checkPosture(checkPoint){
    if ((checkPoint >= 40 || checkPoint <= -40) && postureGood){
        postureGood = false;
        cordova.plugins.notification.local.schedule({
          title: 'RPCS',
          text: 'Posture Shoud Be Adjusted!!',
          foreground: true
        })
        // alert("Posture Shoud Be Adjusted!!");
    }else if (!(checkPoint >= 40 || checkPoint <= -40) && !postureGood){
        postureGood = true;
        cordova.plugins.notification.local.schedule({
          title: 'RPCS',
          text: 'Posture corrected!!',
          foreground: true
        })
    }
}


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
        // postRequest();
        var params = {
          "request": true,
          "statusReceiver": false,
          "restoreKey" : "bluetoothleplugin"
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
                                readParams = {
                                  "address": blefruitAddress,
                                  "service": uartServiceUuid,
                                  "characteristic": uartCharacteristicUuid
                                };
                                var buffer = "";
                                var result = "";
                                var firstJson = true;
                                bluetoothle.subscribe(function(s){
                                    if (s.status  == "subscribed"){
                                        alert("subscribe success " + s.status);
                                    }else {
                                        var bytes = bluetoothle.encodedStringToBytes(s.value);
                                        var stringResult = bluetoothle.bytesToString(bytes); //This should equal Write Hello World
                                        if (stringResult.includes("*")){
                                            var stringResultSplit = stringResult.split("*");
                                            result = buffer + stringResultSplit[0];
                                            buffer = stringResultSplit[1];
                                            console.log("subscribe success " + s.status + " : " + result);
                                            if (!firstJson){
                                                resultJson = JSON.parse(result);
                                                var pressureString = resultJson.p;
                                                var pressureString_converted = "";
                                                for (var i = 0; i < pressureString.length; i++){
                                                    if (i != 0){
                                                        pressureString_converted += ",";
                                                    }
                                                    pressureString_converted += (pressureString[i].charCodeAt(0) - 65)*2;
                                                }
                                                resultJson.p = pressureString_converted;
                                                console.log("subscribe success " + s.status + " in json: " + resultJson.p);
                                                checkPosture(resultJson.a);
                                                insertDataMysql(resultJson.t, resultJson.h, resultJson.a, 1, resultJson.p);
                                            }
                                            firstJson = false;
                                            result = "";

                                        }else {
                                            buffer += stringResult;
                                        }


                                        // insertDataMysql();

                                    }
                                }, function(e){
                                    alert("subscribe failed ");
                                }, readParams);
                            }
                        }


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
